// Note: Scraping requires Playwright/browser automation which cannot run on Vercel serverless
// This endpoint is a placeholder - scraping should be done locally or on a separate service

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
    try {
      const { query, location, domains } = req.body;
      
      // Return a message indicating scraping is not available on Vercel
      res.json({
        message: 'Scraping cannot be performed on Vercel serverless. Please run the scraper locally.',
        suggestion: 'Use "node backend/index.js" to run the local server with scraping capabilities.',
        params: { query, location, domains }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}