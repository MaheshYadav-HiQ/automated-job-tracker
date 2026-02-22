import { scrapeAllSources, getJobDetails } from '../backend/services/scraper.js';
import { createJob, getCV, saveCV, getJobs } from '../backend/utils/database.js';
import { parseCV, calculateMatchScore } from '../backend/utils/cvParser.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}