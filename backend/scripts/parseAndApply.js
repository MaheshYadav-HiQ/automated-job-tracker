// Script to parse CV and apply for jobs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from the project
import { parseCV } from '../utils/cvParser.js';
import { saveCV, getCV, saveJob, getJobs, createApplication, getApplications } from '../utils/database.js';
import { shouldAutoApply, autoApply } from '../services/autoApplier.js';

const CV_PATH = '/Users/maheshyadav/Downloads/danush_CV_salesforce_developer.pdf';

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function main() {
  console.log('🚀 Starting automated job application...\n');
  
  // Step 1: Parse the CV
  console.log('📄 Step 1: Parsing CV...');
  const cvText = await parsePDF(CV_PATH);
  console.log('CV text extracted successfully!\n');
  
  // Step 2: Extract CV data
  console.log('🔍 Step 2: Extracting CV data...');
  const cvData = parseCV(cvText);
  console.log('Parsed CV data:');
  console.log(`  - Name: ${cvData.name}`);
  console.log(`  - Email: ${cvData.email}`);
  console.log(`  - Phone: ${cvData.phone}`);
  console.log(`  - Skills: ${cvData.skills.join(', ')}`);
  console.log(`  - Domains: ${cvData.domains.join(', ')}\n`);
  
  // Step 3: Save CV to database
  console.log('💾 Step 3: Saving CV to database...');
  saveCV(cvData);
  console.log('CV saved successfully!\n');
  
  // Step 4: Show existing jobs or instructions
  const jobs = getJobs();
  console.log(`📋 Current jobs in database: ${jobs.length}\n`);
  
  // Step 5: Get suggestions
  console.log('🎯 Step 4: Checking for matching jobs...');
  const suggestions = jobs
    .map(job => {
      const result = shouldAutoApply(job, cvData);
      return {
        ...job,
        shouldApply: result.shouldApply,
        matchScore: result.matchScore || 0,
        reason: result.reason
      };
    })
    .filter(job => job.shouldApply)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  if (suggestions.length > 0) {
    console.log(`Found ${suggestions.length} matching jobs:\n`);
    suggestions.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} at ${job.company}`);
      console.log(`   Match Score: ${job.matchScore}%`);
      console.log(`   URL: ${job.url}\n`);
    });
    
    // Step 6: Auto-apply to top jobs
    console.log('🤖 Step 5: Attempting to apply to top matching jobs...\n');
    
    for (const job of suggestions.slice(0, 3)) {
      console.log(`Applying to: ${job.title} at ${job.company}`);
      try {
        const result = await autoApply(job, cvData);
        console.log(`Result: ${result.message}\n`);
        
        // Create application record
        createApplication({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          url: job.url,
          status: result.applied ? 'applied' : 'pending_review',
          appliedDate: new Date().toISOString(),
          notes: result.message
        });
      } catch (error) {
        console.log(`Error: ${error.message}\n`);
      }
    }
  } else {
    console.log('❌ No matching jobs found in database.');
    console.log('\nTo add jobs, run the scraper first or use the API:');
    console.log('curl "http://localhost:3000/api/scrape?query=Salesforce%20Developer&location=Remote"');
  }
  
  console.log('\n✅ Process complete!');
}

main().catch(console.error);