import express from 'express';
import { 
  createApplication, 
  getApplications, 
  updateApplicationStatus,
  getCV,
  getJobs
} from '../utils/database.js';
import { shouldAutoApply, generateCoverLetter } from '../services/autoApplier.js';

const router = express.Router();

// Get all applications
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;
    
    const applications = getApplications(filters);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new application
router.post('/', (req, res) => {
  try {
    const application = createApplication(req.body);
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    updateApplicationStatus(req.params.id, status);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get suggested applications based on CV
router.get('/suggestions', (req, res) => {
  try {
    const cv = getCV();
    const jobs = getJobs();
    
    if (!cv) {
      return res.status(400).json({ error: 'No CV uploaded yet' });
    }
    
    const suggestions = jobs
      .map(job => {
        const result = shouldAutoApply(job, cv);
        return {
          ...job,
          shouldApply: result.shouldApply,
          reason: result.reason,
          matchScore: result.matchScore || 0,
          matchingSkills: result.matchingSkills || []
        };
      })
      .filter(job => job.shouldApply)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate cover letter for a job
router.post('/cover-letter', (req, res) => {
  try {
    const { jobId } = req.body;
    const cv = getCV();
    const job = getJobs().find(j => j.id === jobId);
    
    if (!cv) {
      return res.status(400).json({ error: 'No CV uploaded' });
    }
    
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