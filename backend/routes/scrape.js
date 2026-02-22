import express from 'express';
import { scrapeAllSources, getJobDetails, fetchFromFreeAPIs, scrapeRemotive, scrapeJobicy, scrapeAdzuna, scrapeUSAJobs, scrapeTheMuse } from '../services/scraper.js';
import { createJob, getCV, saveCV, getJobs, createApplication } from '../utils/database.js';
import { parseCV, calculateMatchScore } from '../utils/cvParser.js';
import { autoApply, batchApply, loginToLinkedIn, loginToIndeed, saveCredentials, shouldAutoApply, generateCoverLetter } from '../services/autoApplier.js';

const router = express.Router();

// Fetch jobs from FREE APIs only (no scraping)
router.post('/scrape/free', async (req, res) => {
  try {
    const { query, location, sources } = req.body;
    
    console.log(`Fetching from free APIs: query="${query}", location="${location}"`);
    
    let jobs = [];
    
    // Fetch from specific sources or all
    if (!sources || sources.length === 0) {
      // Fetch from all free APIs
      jobs = await fetchFromFreeAPIs(query, location);
    } else {
      // Fetch from selected sources only
      const promises = [];
      
      if (sources.includes('remotive')) {
        promises.push(scrapeRemotive('', query));
      }
      if (sources.includes('jobicy')) {
        promises.push(scrapeJobicy(query));
      }
      if (sources.includes('adzuna')) {
        promises.push(scrapeAdzuna(query, location));
      }
      if (sources.includes('usajobs')) {
        promises.push(scrapeUSAJobs(query, location));
      }
      if (sources.includes('themuse')) {
        promises.push(scrapeTheMuse(query));
      }
      
      const results = await Promise.allSettled(promises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          jobs.push(...result.value);
        }
      }
    }
    
    // Remove duplicates
    const uniqueJobs = [];
    const seen = new Set();
    for (const job of jobs) {
      const key = `${job.title.toLowerCase()}-${job.company?.toLowerCase() || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }
    
    // Calculate match scores if CV is available
    const cv = getCV();
    const jobsWithScores = uniqueJobs.map(job => {
      let matchScore = 0;
      if (cv && cv.skills) {
        matchScore = calculateMatchScore(cv.skills, job.requirements || []);
      }
      return { ...job, match_score: matchScore };
    });
    
    // Save jobs to database
    const savedJobs = jobsWithScores.map(job => createJob(job));
    
    res.json({
      message: `Successfully fetched ${savedJobs.length} jobs from free APIs`,
      count: savedJobs.length,
      jobs: savedJobs,
      sources: sources || ['remotive', 'jobicy', 'adzuna', 'usajobs', 'themuse']
    });
  } catch (error) {
    console.error('Free API scrape error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scrape jobs from all sources (APIs + web scraping)
router.post('/scrape', async (req, res) => {
  try {
    const { query, location, domains } = req.body;
    
    console.log(`Starting scrape: query="${query}", location="${location}"`);
    
    const jobs = await scrapeAllSources(query, location, domains || []);
    
    // Calculate match scores if CV is available
    const cv = getCV();
    const jobsWithScores = jobs.map(job => {
      let matchScore = 0;
      if (cv && cv.skills) {
        matchScore = calculateMatchScore(cv.skills, job.requirements || []);
      }
      return { ...job, match_score: matchScore };
    });
    
    // Save jobs to database
    const savedJobs = jobsWithScores.map(job => createJob(job));
    
    res.json({
      message: `Successfully scraped ${savedJobs.length} jobs`,
      count: savedJobs.length,
      jobs: savedJobs
    });
  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available free API sources
router.get('/sources', async (req, res) => {
  res.json({
    sources: [
      {
        id: 'remotive',
        name: 'Remotive',
        type: 'API',
        description: 'Free remote jobs API',
        url: 'https://remotive.com/api/remote-jobs',
        jobsCount: '~20-50 per request'
      },
      {
        id: 'jobicy',
        name: 'Jobicy',
        type: 'API',
        description: 'Remote jobs focused on USA',
        url: 'https://jobicy.com/api/v2/remote-jobs',
        jobsCount: '~100 per request'
      },
      {
        id: 'adzuna',
        name: 'Adzuna',
        type: 'API',
        description: 'USA jobs search (free tier available)',
        url: 'https://developer.adzuna.com/',
        jobsCount: 'Depends on API key'
      },
      {
        id: 'usajobs',
        name: 'USAJobs',
        type: 'API',
        description: 'Official US Government jobs',
        url: 'https://www.usajobs.gov/',
        jobsCount: 'Varies'
      },
      {
        id: 'themuse',
        name: 'The Muse',
        type: 'API',
        description: 'Company and job listings',
        url: 'https://www.themuse.com/developers',
        jobsCount: '~20 per page'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        type: 'Scraping',
        description: 'Web scraping (may be blocked)',
        url: 'linkedin.com/jobs',
        jobsCount: 'Varies'
      },
      {
        id: 'indeed',
        name: 'Indeed',
        type: 'Scraping',
        description: 'Web scraping (may be blocked)',
        url: 'indeed.com',
        jobsCount: 'Varies'
      }
    ]
  });
});

// Get job details
router.get('/details', async (req, res) => {
  try {
    const { url, source } = req.query;
    
    if (!url || !source) {
      return res.status(400).json({ error: 'URL and source are required' });
    }
    
    const details = await getJobDetails(url, source);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parse CV from text and calculate match with jobs
router.post('/match', async (req, res) => {
  try {
    const { cvText } = req.body;
    
    if (!cvText) {
      return res.status(400).json({ error: 'No CV text provided' });
    }
    
    const parsedCV = parseCV(cvText);
    
    // Save the CV
    saveCV(parsedCV);
    
    // Get existing jobs
    const jobs = getJobs();
    
    // Calculate match scores
    const matchedJobs = jobs.map(job => {
      const matchScore = calculateMatchScore(parsedCV.skills, job.requirements || []);
      return {
        ...job,
        match_score: matchScore,
        cvSkills: parsedCV.skills,
        cvDomains: parsedCV.domains
      };
    }).sort((a, b) => b.match_score - a.match_score);
    
    res.json({
      cv: parsedCV,
      matchedJobs,
      stats: {
        totalJobs: jobs.length,
        matchedJobs: matchedJobs.filter(j => j.match_score >= 30).length,
        topDomains: parsedCV.domains
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTO-APPLY ROUTES
// ============================================

// Login to LinkedIn
router.post('/login/linkedin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Save credentials
    saveCredentials('linkedin', email, password);
    
    const result = await loginToLinkedIn(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login to Indeed
router.post('/login/indeed', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Save credentials
    saveCredentials('indeed', email, password);
    
    const result = await loginToIndeed(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply to a single job
router.post('/apply', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID required' });
    }
    
    // Get job from database
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get CV
    const cv = getCV();
    if (!cv) {
      return res.status(400).json({ error: 'No CV found. Please upload CV first.' });
    }
    
    // Check if should apply
    const shouldApplyResult = shouldAutoApply(job, cv);
    if (!shouldApplyResult.shouldApply) {
      return res.status(400).json({ error: shouldApplyResult.reason });
    }
    
    // Apply
    console.log(`🎯 Applying to: ${job.title} at ${job.company}`);
    const result = await autoApply(job, cv);
    
    // Save application to database
    if (result.applied) {
      createApplication({
        job_id: job.id,
        status: 'applied',
        applied_at: new Date().toISOString(),
        notes: result.message
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch apply to multiple jobs
router.post('/apply/batch', async (req, res) => {
  try {
    const { jobIds, maxApplications = 10, delayBetween = 5000, sources } = req.body;
    
    // Get CV
    const cv = getCV();
    if (!cv) {
      return res.status(400).json({ error: 'No CV found. Please upload CV first.' });
    }
    
    // Get jobs
    const allJobs = getJobs();
    let jobs = jobIds 
      ? allJobs.filter(j => jobIds.includes(j.id))
      : allJobs;
    
    // Filter by match score and domain
    jobs = jobs.filter(job => {
      const result = shouldAutoApply(job, cv);
      return result.shouldApply;
    });
    
    console.log(`📋 Starting batch apply for ${jobs.length} jobs...`);
    
    const result = await batchApply(jobs, cv, {
      maxApplications,
      delayBetween,
      sources: sources || ['LinkedIn', 'Indeed']
    });
    
    // Save applications
    for (const app of result.applications) {
      if (app.applied) {
        const job = jobs.find(j => j.url === app.job.url);
        if (job) {
          createApplication({
            job_id: job.id,
            status: 'applied',
            applied_at: new Date().toISOString(),
            notes: app.message
          });
        }
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if should auto-apply to a job
router.post('/check-apply', async (req, res) => {
  try {
    const { jobId, targetDomains, minMatchScore } = req.body;
    
    const cv = getCV();
    if (!cv) {
      return res.status(400).json({ error: 'No CV found' });
    }
    
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const result = shouldAutoApply(job, cv, targetDomains || [], minMatchScore || 30);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate cover letter
router.post('/cover-letter', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const cv = getCV();
    if (!cv) {
      return res.status(400).json({ error: 'No CV found' });
    }
    
    const jobs = getJobs();
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const coverLetter = generateCoverLetter(job, cv);
    res.json({ coverLetter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;