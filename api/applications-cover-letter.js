import { getCV, getJobs, generateCoverLetter } from '../backend/utils/databaseVercel.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}