import express from 'express';
import { getJobs, getJobById, createJob } from '../utils/database.js';

const router = express.Router();

// Get all jobs with optional filters
router.get('/', (req, res) => {
  try {
    const { domain, remote, minMatchScore } = req.query;
    const filters = {};
    
    if (domain) filters.domain = domain;
    if (remote !== undefined) filters.remote = remote === 'true';
    if (minMatchScore) filters.minMatchScore = parseInt(minMatchScore);
    
    const jobs = getJobs(filters);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single job
router.get('/:id', (req, res) => {
  try {
    const job = getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new job manually
router.post('/', (req, res) => {
  try {
    const job = createJob(req.body);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job domains summary
router.get('/stats/domains', (req, res) => {
  try {
    const jobs = getJobs();
    const domainCounts = {};
    
    jobs.forEach(job => {
      const domain = job.domain || 'unknown';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
    
    res.json(domainCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;