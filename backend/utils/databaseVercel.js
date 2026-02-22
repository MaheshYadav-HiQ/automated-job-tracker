import { scrapeAllSources, getJobDetails } from '../services/scraper.js';
import { createJob, getCV, saveCV, getJobs as getJobsFromDb, createApplication, getApplications, updateApplicationStatus } from './database.js';
import { parseCV, calculateMatchScore } from './cvParser.js';
import { shouldAutoApply, generateCoverLetter as generateCL } from '../services/autoApplier.js';

// In-memory storage for Vercel serverless
let jobs = [];
let cv = null;
let applications = [];

// Initialize from database on cold start
function initialize() {
  if (jobs.length === 0) {
    try {
      const dbJobs = getJobsFromDb();
      if (dbJobs && dbJobs.length > 0) {
        jobs = dbJobs;
      }
    } catch (e) {
      console.log('Initializing fresh jobs array');
    }
  }
}

// Get all jobs
export function getJobs() {
  initialize();
  return jobs;
}

// Get CV
export function getCV() {
  return cv;
}

// Save CV
export function saveCVData(parsedCV) {
  cv = parsedCV;
  return cv;
}

// Get applications
export function getApplicationsList() {
  return applications;
}

// Create application
export function createApplicationData(appData) {
  const application = {
    id: `app_${Date.now()}`,
    ...appData,
    status: appData.status || 'pending',
    applied_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  applications.push(application);
  return application;
}

// Update application status
export function updateApplicationStatusData(id, status) {
  const app = applications.find(a => a.id === id);
  if (app) {
    app.status = status;
    app.updated_at = new Date().toISOString();
  }
  return app;
}

// Scrape jobs from multiple sources
export async function scrapeJobs(query, location, domains = []) {
  const scrapedJobs = await scrapeAllSources(query, location, domains);
  
  // Save jobs to in-memory storage
  for (const job of scrapedJobs) {
    const jobWithId = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...job,
      scraped_at: new Date().toISOString(),
      requirements: [],
      match_score: 0
    };
    
    // Check for duplicates
    const exists = jobs.some(j => 
      j.title.toLowerCase() === job.title.toLowerCase() && 
      j.company.toLowerCase() === job.company.toLowerCase()
    );
    
    if (!exists) {
      jobs.push(jobWithId);
    }
  }
  
  return jobs;
}

// Get job details from URL
export async function getJobDetailsFromUrl(url, source) {
  return await getJobDetails(url, source);
}

// Parse CV text
export function parseCVText(cvText) {
  return parseCV(cvText);
}

// Calculate match score
export function calculateJobMatchScore(job, cvSkills) {
  return calculateMatchScore(cvSkills, job.requirements || []);
}

// Auto-apply check
export function checkShouldAutoApply(job, cvData, targetDomains = []) {
  return shouldAutoApply(job, cvData, targetDomains);
}

// Generate cover letter
export function generateCoverLetter(job, cvData) {
  return generateCL(job, cvData);
}

// Re-export from database for compatibility
export { createJob, getCV as getCVFromDb, saveCV, getJobsFromDb };