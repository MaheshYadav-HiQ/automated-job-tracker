import express from 'express';
import { scrapeAllSources, getJobDetails } from '../services/scraper.js';
import { createJob, getCV, saveCV, getJobs } from '../utils/database.js';
import { parseCV, calculateMatchScore } from '../utils/cvParser.js';

const router = express.Router();

// Scrape jobs from all sources
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

export default router;