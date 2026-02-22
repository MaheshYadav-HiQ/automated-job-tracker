// Job Scraper - Scrapes jobs from various sources including free APIs
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getBrowser() {
  return await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

// ============= FREE APIs (No API Key Required) =============

// Remotive API - Free remote jobs
export async function scrapeRemotive(category = '', search = '') {
  const jobs = [];
  try {
    const url = search 
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`
      : 'https://remotive.com/api/remote-jobs';
    
    if (category) {
      const catUrl = `https://remotive.com/api/remote-jobs?category=${encodeURIComponent(category)}`;
      const response = await fetch(catUrl);
      const data = await response.json();
      
      if (data.jobs) {
        for (const job of data.jobs) {
          jobs.push({
            id: `remotive-${job.id}`,
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || 'Remote',
            salary: job.salary || '',
            type: job.job_type || 'Full-time',
            remote: true,
            description: job.description || '',
            requirements: extractRequirements(job.description),
            source: 'Remotive',
            url: job.url,
            posted_date: job.publication_date,
            domain: detectDomain(job.title),
            category: job.category
          });
        }
      }
    } else {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.jobs) {
        for (const job of data.jobs) {
          jobs.push({
            id: `remotive-${job.id}`,
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || 'Remote',
            salary: job.salary || '',
            type: job.job_type || 'Full-time',
            remote: true,
            description: job.description || '',
            requirements: extractRequirements(job.description),
            source: 'Remotive',
            url: job.url,
            posted_date: job.publication_date,
            domain: detectDomain(job.title),
            category: job.category
          });
        }
      }
    }
    console.log(`✅ Remotive: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('Remotive API error:', error.message);
  }
  return jobs;
}

// Jobicy API - Free remote jobs (USA focused)
export async function scrapeJobicy(keyword = '', limit = 50) {
  const jobs = [];
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=${limit}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.jobs) {
      for (const job of data.jobs) {
        // Filter by keyword if provided
        if (keyword && !job.jobTitle.toLowerCase().includes(keyword.toLowerCase())) {
          continue;
        }
        
        const isUSA = job.jobGeo && job.jobGeo.toLowerCase().includes('usa');
        
        jobs.push({
          id: `jobicy-${job.id}`,
          title: job.jobTitle,
          company: job.companyName,
          location: job.jobGeo || 'Remote',
          salary: '',
          type: job.jobType ? job.jobType.join(', ') : 'Full-time',
          remote: true,
          description: job.jobExcerpt || '',
          requirements: [],
          source: 'Jobicy',
          url: job.url,
          posted_date: '',
          domain: detectDomain(job.jobTitle),
          jobLevel: job.jobLevel,
          isUSA: isUSA
        });
      }
    }
    console.log(`✅ Jobicy: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('Jobicy API error:', error.message);
  }
  return jobs;
}

// Remote OK API - Free remote jobs
export async function scrapeRemoteOK(keyword = '', limit = 50) {
  const jobs = [];
  try {
    const url = keyword 
      ? `https://remoteok.com/api?tag=${encodeURIComponent(keyword.toLowerCase().replace(/\s+/g, ''))}`
      : 'https://remoteok.com/api';
    
    const response = await fetch(url);
    const data = await response.json();
    
    for (const job of data.slice(1, limit + 1)) {
      if (job.id && job.position) {
        jobs.push({
          id: `remoteok-${job.id}`,
          title: job.position,
          company: job.company,
          location: job.location || 'Remote',
          salary: job.salary_range || '',
          type: job.type || 'Full-time',
          remote: true,
          description: stripHtml(job.description || ''),
          requirements: job.tags || [],
          source: 'Remote OK',
          url: job.url,
          posted_date: job.date,
          domain: detectDomain(job.position),
          tags: job.tags
        });
      }
    }
    console.log(`✅ Remote OK: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('Remote OK API error:', error.message);
  }
  return jobs;
}

// We Work Remotely - Uses RSS feed
export async function scrapeWeWorkRemotely(keyword = '', category = '') {
  const jobs = [];
  try {
    const categoryMap = {
      'developer': 'programming',
      'design': 'design',
      'marketing': 'marketing',
      'sales': 'sales',
      'customer-service': 'customer-support',
      'finance': 'business',
      'writing': 'writing',
      'hr': 'human-resources'
    };
    
    const wwrCategory = categoryMap[keyword.toLowerCase()] || category || 'programming';
    const url = `https://weworkremotely.com/categories/remote-${wwrCategory}-jobs.rss`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;
    
    while ((match = itemRegex.exec(xmlText)) !== null && count < 30) {
      const item = match[1];
      
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      
      if (!title || title.includes('We Work Remotely:')) {
        continue;
      }
      
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const link = linkMatch ? linkMatch[1] : '';
      
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
      const description = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
      
      const regionMatch = item.match(/<region>(.*?)<\/region>/);
      const region = regionMatch ? regionMatch[1] : 'Remote';
      
      const catMatch = item.match(/<category>(.*?)<\/category>/);
      const jobCategory = catMatch ? catMatch[1] : '';
      
      if (keyword && !title.toLowerCase().includes(keyword.toLowerCase())) {
        continue;
      }
      
      jobs.push({
        id: `wwr-${count}-${Date.now()}`,
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        company: extractCompanyFromTitle(title),
        location: region,
        salary: '',
        type: jobCategory || 'Full-time',
        remote: true,
        description: stripHtml(description.replace(/<!\[CDATA\[|\]\]>/g, '')),
        requirements: [],
        source: 'We Work Remotely',
        url: link,
        posted_date: '',
        domain: detectDomain(title),
        category: jobCategory
      });
      
      count++;
    }
    console.log(`✅ We Work Remotely: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('We Work Remotely error:', error.message);
  }
  return jobs;
}

function extractCompanyFromTitle(title) {
  const parts = title.split(':');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  return 'Unknown';
}

// The Muse API - Free tier for company/job listings
export async function scrapeTheMuse(keyword = '', page = 1) {
  const jobs = [];
  try {
    const url = keyword 
      ? `https://www.themuse.com/api/public/jobs?page=${page}&descending=false&on_site=false&search=${encodeURIComponent(keyword)}`
      : `https://www.themuse.com/api/public/jobs?page=${page}&descending=false&on_site=false`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results) {
      for (const job of data.results) {
        jobs.push({
          id: `themuse-${job.id}`,
          title: job.name,
          company: job.company && job.company.name,
          location: job.locations && job.locations.map(l => l.name).join(', ') || 'Remote',
          salary: '',
          type: job.type || 'Full-time',
          remote: job.remote_available || false,
          description: stripHtml(job.contents || ''),
          requirements: [],
          source: 'The Muse',
          url: job.refs && job.refs.landing_page,
          posted_date: job.published_at,
          domain: detectDomain(job.name)
        });
      }
    }
    console.log(`✅ The Muse: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('The Muse API error:', error.message);
  }
  return jobs;
}

// WorkGiant - Government jobs aggregator
export async function scrapeWorkGiant(keyword = '', location = '') {
  const jobs = [];
  try {
    const url = keyword 
      ? `https://workgiant.com/api/jobs?search=${encodeURIComponent(keyword)}`
      : 'https://workgiant.com/api/jobs';
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (Array.isArray(data)) {
      for (const job of data.slice(0, 20)) {
        jobs.push({
          id: `workgiant-${job.id}`,
          title: job.title,
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          salary: job.salary || '',
          type: job.type || 'Full-time',
          remote: false,
          description: job.description || '',
          requirements: [],
          source: 'WorkGiant',
          url: job.url,
          posted_date: job.posted,
          domain: detectDomain(job.title)
        });
      }
    }
    console.log(`✅ WorkGiant: Found ${jobs.length} jobs`);
  } catch (error) {
    console.error('WorkGiant API error:', error.message);
  }
  return jobs;
}

// APIs that require API keys (documented for users to add)
export async function scrapeJooble(query = 'developer', location = 'USA') {
  const jobs = [];
  const API_KEY = process.env.JOOBLE_API_KEY || '';
  
  if (!API_KEY) {
    console.log('ℹ️  Jooble: Requires API key (set JOOBLE_API_KEY env variable)');
    return jobs;
  }
  // ... implementation
  return jobs;
}

export async function scrapeAdzuna(query = 'developer', location = 'USA', resultsPerPage = 20) {
  const jobs = [];
  const APP_ID = process.env.ADZUNA_APP_ID;
  const APP_KEY = process.env.ADZUNA_APP_KEY;
  
  if (!APP_ID || !APP_KEY) {
    console.log('ℹ️  Adzuna: Requires API key (set ADZUNA_APP_ID and ADZUNA_APP_KEY env variables)');
    return jobs;
  }
  // ... implementation
  return jobs;
}

export async function scrapeUSAJobs(keyword = '', location = '') {
  const jobs = [];
  const API_KEY = process.env.USAJOBS_API_KEY;
  
  if (!API_KEY) {
    console.log('ℹ️  USAJobs: Requires API key (set USAJOBS_API_KEY env variable)');
    return jobs;
  }
  // ... implementation
  return jobs;
}

// ============= SCRAPING (Playwright) =============

export async function scrapeLinkedIn(query = 'developer', location = 'Remote', domains = []) {
  const jobs = [];
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  
  try {
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_TPR=r86400&sortBy=DD`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.job-card-container', { timeout: 10000 });
    
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1000);
    }
    
    const jobCards = await page.$$('.job-card-container');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('.job-card-list__title', el => el.textContent.trim()).catch(() => '');
        const company = await card.$eval('.job-card-container__company-name', el => el.textContent.trim()).catch(() => '');
        const location = await card.$eval('.job-card-container__metadata-item', el => el.textContent.trim()).catch(() => '');
        const link = await card.$eval('a', el => el.href).catch(() => '');
        const posted = await card.$eval('time', el => el.textContent.trim()).catch(() => '');
        
        if (title) {
          jobs.push({
            id: `linkedin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title.replace(/\n/g, '').trim(),
            company: company.replace(/\n/g, '').trim(),
            location: location.replace(/\n/g, '').trim(),
            salary: '',
            type: 'Full-time',
            remote: location.toLowerCase().includes('remote') || location.toLowerCase().includes('anywhere'),
            description: '',
            requirements: [],
            source: 'LinkedIn',
            url: link,
            posted_date: posted,
            domain: detectDomain(title)
          });
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('LinkedIn scrape error:', error.message);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

export async function scrapeIndeed(query = 'developer', location = '', domains = []) {
  const jobs = [];
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  
  try {
    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    const jobCards = await page.$$('.jobcard');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('.jobTitle', el => el.textContent.trim()).catch(() => '');
        const company = await card.$eval('.companyName', el => el.textContent.trim()).catch(() => '');
        const location = await card.$eval('.companyLocation', el => el.textContent.trim()).catch(() => '');
        const salary = await card.$eval('.salary-snippet', el => el.textContent.trim()).catch(() => '');
        const link = await card.$eval('a', el => 'https://www.indeed.com' + el.getAttribute('href')).catch(() => '');
        
        if (title && !title.includes('new')) {
          jobs.push({
            id: `indeed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title.replace(/\n/g, '').trim(),
            company: company.replace(/\n/g, '').trim(),
            location: location.replace(/\n/g, '').trim(),
            salary: salary.replace(/\n/g, '').trim(),
            type: salary.toLowerCase().includes('part') ? 'Part-time' : 'Full-time',
            remote: location.toLowerCase().includes('remote'),
            description: '',
            requirements: [],
            source: 'Indeed',
            url: link,
            posted_date: '',
            domain: detectDomain(title)
          });
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('Indeed scrape error:', error.message);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

export async function scrapeGlassdoor(query = 'developer', location = '', domains = []) {
  const jobs = [];
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  
  try {
    const searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}&locT=C&locId=${encodeURIComponent(location)}`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    const jobCards = await page.$$('[data-test="job-card"]');
    
    for (const card of jobCards.slice(0, 15)) {
      try {
        const title = await card.$eval('[data-test="job-title"]', el => el.textContent.trim()).catch(() => '');
        const company = await card.$eval('[data-test="employer-name"]', el => el.textContent.trim()).catch(() => '');
        const location = await card.$eval('[data-test="job-location"]', el => el.textContent.trim()).catch(() => '');
        const link = await card.$eval('a', el => el.href).catch(() => '');
        
        if (title) {
          jobs.push({
            id: `glassdoor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title.replace(/\n/g, '').trim(),
            company: company.replace(/\n/g, '').trim(),
            location: location.replace(/\n/g, '').trim(),
            salary: '',
            type: 'Full-time',
            remote: location.toLowerCase().includes('remote'),
            description: '',
            requirements: [],
            source: 'Glassdoor',
            url: link,
            posted_date: '',
            domain: detectDomain(title)
          });
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('Glassdoor scrape error:', error.message);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

// ============= AGGREGATOR =============

// Fetch from all FREE APIs (no key required)
export async function fetchFromFreeAPIs(keyword = '', location = 'USA') {
  console.log('🚀 Fetching jobs from free APIs...\n');
  
  const results = await Promise.allSettled([
    scrapeRemotive('', keyword),
    scrapeJobicy(keyword),
    scrapeRemoteOK(keyword),
    scrapeWeWorkRemotely(keyword),
    scrapeTheMuse(keyword),
    scrapeWorkGiant(keyword, location)
  ]);
  
  const allJobs = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allJobs.push(...result.value);
    }
  }
  
  // Remove duplicates
  const uniqueJobs = [];
  const seen = new Set();
  
  for (const job of allJobs) {
    const key = `${job.title.toLowerCase()}-${job.company?.toLowerCase() || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(job);
    }
  }
  
  console.log(`\n✅ Total unique jobs from free APIs: ${uniqueJobs.length}`);
  return uniqueJobs;
}

// Fetch from APIs that need keys (will only work if keys are set)
export async function fetchFromAPIsWithKeys(keyword = '', location = 'USA') {
  const results = await Promise.allSettled([
    scrapeAdzuna(keyword, location),
    scrapeUSAJobs(keyword, location),
    scrapeJooble(keyword, location)
  ]);
  
  const allJobs = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allJobs.push(...result.value);
    }
  }
  
  return allJobs;
}

// Scrape from multiple sources
export async function scrapeAllSources(query, location, domains = []) {
  const allJobs = [];
  
  console.log('🔍 Scraping jobs from multiple sources...\n');
  
  // First: Free APIs
  const apiJobs = await fetchFromFreeAPIs(query, location);
  allJobs.push(...apiJobs);
  
  // Second: APIs with keys (if configured)
  const keyJobs = await fetchFromAPIsWithKeys(query, location);
  allJobs.push(...keyJobs);
  
  // Third: Web scraping (may be blocked)
  try {
    const [linkedinJobs, indeedJobs] = await Promise.allSettled([
      scrapeLinkedIn(query, location, domains),
      scrapeIndeed(query, location, domains)
    ]);
    
    if (linkedinJobs.status === 'fulfilled') {
      allJobs.push(...linkedinJobs.value);
    }
    
    if (indeedJobs.status === 'fulfilled') {
      allJobs.push(...indeedJobs.value);
    }
  } catch (e) {
    console.log('⚠️  Web scraping limited due to anti-bot measures');
  }
  
  // Remove duplicates
  const uniqueJobs = [];
  const seen = new Set();
  
  for (const job of allJobs) {
    const key = `${job.title.toLowerCase()}-${job.company?.toLowerCase() || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(job);
    }
  }
  
  console.log(`\n✅ Found ${uniqueJobs.length} unique jobs total`);
  
  return uniqueJobs;
}

// ============= HELPERS =============

function detectDomain(title) {
  const titleLower = title.toLowerCase();
  
  const domainPatterns = {
    'frontend': ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui developer', 'ui engineer'],
    'backend': ['backend', 'back-end', 'api', 'server', 'python', 'java', 'node'],
    'fullstack': ['fullstack', 'full-stack', 'full stack'],
    'devops': ['devops', 'sre', 'site reliability', 'cloud', 'infrastructure'],
    'data science': ['data scientist', 'data analyst', 'data engineer', 'analytics'],
    'machine learning': ['machine learning', 'ml engineer', 'ai', 'deep learning'],
    'mobile': ['mobile', 'ios', 'android', 'flutter', 'react native'],
    'qa': ['qa', 'quality', 'tester', 'automation', 'selenium'],
    'security': ['security', 'cybersecurity', 'infosec', 'penetration'],
  };
  
  for (const [domain, patterns] of Object.entries(domainPatterns)) {
    for (const pattern of patterns) {
      if (titleLower.includes(pattern)) {
        return domain;
      }
    }
  }
  
  return 'general';
}

function extractRequirements(description) {
  if (!description) return [];
  
  const requirements = [];
  const text = stripHtml(description);
  
  const patterns = [
    /(\d+\+?\s*years?\s*(of\s*)?experience)/gi,
    /(experience\s*with|proficient\s*in|knowledge\s*of)\s*([^.]{3,50})/gi,
    /(must\s*have|required|needed)\s*([^.]{3,50})/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      requirements.push(...matches.slice(0, 5));
    }
  }
  
  return [...new Set(requirements)].slice(0, 10);
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function getJobDetails(url, source) {
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    let description = '';
    let requirements = [];
    
    if (source === 'LinkedIn') {
      description = await page.$eval('.job-description', el => el.textContent).catch(() => '');
      const reqElements = await page.$$('.job-details-skill-match-status-list__item');
      requirements = await Promise.all(reqElements.map(el => el.textContent()));
    } else if (source === 'Indeed') {
      description = await page.$eval('#jobDescriptionText', el => el.textContent).catch(() => '');
    }
    
    return { description, requirements: requirements.slice(0, 10) };
  } catch (error) {
    console.error('Error getting job details:', error.message);
    return { description: '', requirements: [] };
  } finally {
    await browser.close();
  }
}