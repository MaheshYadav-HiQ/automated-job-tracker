import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/jobs.js';
import cvRoutes from './routes/cv.js';
import applicationRoutes from './routes/applications.js';
import scrapeRoutes from './routes/scrape.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/scrape', scrapeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Job Tracker API is running' });
});

// Export for Vercel serverless
export default app;

// Only start server locally (not on Vercel)
if (process.env.VERCEL !== 'true') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}