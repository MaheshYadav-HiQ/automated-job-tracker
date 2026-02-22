// Job Scraper - Scrapes jobs from various sources
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getBrowser() {
  return await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

export async function scrapeLinkedIn(query = 'developer', location = 'Remote', domains = []) {
  const jobs = [];
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  
  try {
    // LinkedIn job search URL
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_TPR=r86400&sortBy=DD`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for job cards to load
    await page.waitForSelector('.job-card-container', { timeout: 10000 });
    
    // Scroll to load more jobs
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
      } catch (e) {
        // Skip individual card errors
      }
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
      } catch (e) {
        // Skip individual card errors
      }
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
      } catch (e) {
        // Skip individual card errors
      }
    }
  } catch (error) {
    console.error('Glassdoor scrape error:', error.message);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

// Scrape from multiple sources
export async function scrapeAllSources(query, location, domains = []) {
  const allJobs = [];
  
  console.log('🔍 Scraping jobs from multiple sources...');
  
  // Scrape from different sources in parallel
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
  
  // Remove duplicates based on title and company
  const uniqueJobs = [];
  const seen = new Set();
  
  for (const job of allJobs) {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(job);
    }
  }
  
  console.log(`✅ Found ${uniqueJobs.length} unique jobs`);
  
  return uniqueJobs;
}

// Detect job domain from title
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

// Get job details from URL
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
      // Try to extract requirements
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