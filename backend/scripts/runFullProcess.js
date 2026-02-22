// Complete script - Uses sample jobs (web scraping requires more setup)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CV_PATH = '/Users/maheshyadav/Downloads/danush_CV_salesforce_developer.pdf';
const DB_PATH = '/Users/maheshyadav/Desktop/automated-job-tracker/backend/data/jobs.db';

// Default CV data
const DEFAULT_CV = {
  name: 'Danush',
  email: 'danush.salesforce@email.com',
  phone: '+1 234 567 8900',
  skills: ['salesforce', 'apex', 'visualforce', 'lightning', 'lwc', 'soql', 'sql', 'rest api', 'crm', 'javascript']
};

// Sample jobs for Salesforce Developer
const SAMPLE_JOBS = [
  {
    title: 'Senior Salesforce Developer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    salary: '$120,000 - $150,000',
    type: 'Full-time',
    remote: true,
    description: 'Looking for experienced Salesforce developer with Apex, LWC, and REST API experience.',
    requirements: ['Salesforce', 'Apex', 'LWC', 'REST API', '5+ years experience'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/123456',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Salesforce Lightning Developer',
    company: 'Cloud Solutions Ltd.',
    location: 'Remote',
    salary: '$100,000 - $130,000',
    type: 'Full-time',
    remote: true,
    description: 'Join our team to build custom Lightning components and integrations.',
    requirements: ['Salesforce', 'Lightning', 'Aura', 'LWC', 'JavaScript'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/234567',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Salesforce Administrator & Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$90,000 - $120,000',
    type: 'Full-time',
    remote: true,
    description: 'Hybrid role managing Salesforce org and developing custom solutions.',
    requirements: ['Salesforce', 'Admin', 'Apex', 'SOQL', 'CRM'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/345678',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Full Stack Salesforce Developer',
    company: 'Enterprise Tech',
    location: 'New York, NY',
    salary: '$130,000 - $160,000',
    type: 'Full-time',
    remote: false,
    description: 'Build enterprise applications using Salesforce platform and modern web technologies.',
    requirements: ['Salesforce', 'Apex', 'Visualforce', 'JavaScript', 'React'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/456789',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Salesforce Integration Specialist',
    company: 'DataFlow Systems',
    location: 'Remote',
    salary: '$110,000 - $140,000',
    type: 'Full-time',
    remote: true,
    description: 'Design and implement integrations between Salesforce and external systems.',
    requirements: ['Salesforce', 'REST API', 'MuleSoft', 'SOAP', 'Middleware'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/567890',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Salesforce Technical Architect',
    company: 'Global Solutions',
    location: 'San Francisco, CA',
    salary: '$150,000 - $180,000',
    type: 'Full-time',
    remote: true,
    description: 'Lead technical design and implementation of large-scale Salesforce projects.',
    requirements: ['Salesforce', 'Architecture', 'Apex', 'Lightning', '10+ years'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/678901',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Junior Salesforce Developer',
    company: 'SmallBiz Tech',
    location: 'Remote',
    salary: '$60,000 - $80,000',
    type: 'Full-time',
    remote: true,
    description: 'Great entry-level opportunity for someone with Salesforce fundamentals.',
    requirements: ['Salesforce', 'Basic Apex', 'SOQL', 'Admin certified'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/789012',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  },
  {
    title: 'Salesforce Marketing Cloud Developer',
    company: 'AdTech Agency',
    location: 'Austin, TX',
    salary: '$100,000 - $125,000',
    type: 'Full-time',
    remote: false,
    description: 'Build and maintain Marketing Cloud implementations and integrations.',
    requirements: ['Salesforce', 'Marketing Cloud', 'AMPscript', 'SQL', 'ETL'],
    source: 'Sample Data',
    url: 'https://www.linkedin.com/jobs/view/890123',
    posted_date: new Date().toISOString(),
    domain: 'salesforce'
  }
];

async function main() {
  console.log('\n🚀 Automated Job Application System\n');
  console.log('='.repeat(50));
  
  // Step 1: Initialize database
  console.log('\n📂 Step 1: Initializing database...');
  const SQL = await initSqlJs();
  let db;
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    
    db.run(`
      CREATE TABLE IF NOT EXISTS cv (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        skills TEXT,
        experience TEXT,
        education TEXT,
        summary TEXT,
        domains TEXT,
        updated_at TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT,
        company TEXT,
        location TEXT,
        salary TEXT,
        type TEXT,
        remote INTEGER,
        description TEXT,
        requirements TEXT,
        source TEXT,
        url TEXT,
        posted_date TEXT,
        domain TEXT,
        scraped_at TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        job_title TEXT,
        company TEXT,
        url TEXT,
        status TEXT,
        applied_date TEXT,
        notes TEXT
      )
    `);
    
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  console.log('✅ Database ready\n');
  
  // Step 2: Save CV data
  console.log('📄 Step 2: Processing CV...');
  const cvData = DEFAULT_CV;
  console.log(`   Name: ${cvData.name}`);
  console.log(`   Email: ${cvData.email}`);
  console.log(`   Skills: ${cvData.skills.join(', ')}`);
  
  const cvStmt = db.prepare(`
    INSERT OR REPLACE INTO cv (id, name, email, phone, skills, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  cvStmt.run(['default', cvData.name, cvData.email, cvData.phone, JSON.stringify(cvData.skills), new Date().toISOString()]);
  cvStmt.free();
  console.log('✅ CV saved to database\n');
  
  // Step 3: Save sample jobs
  console.log('🔍 Step 3: Loading jobs...');
  for (const job of SAMPLE_JOBS) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO jobs (id, title, company, location, salary, type, remote, description, requirements, source, url, posted_date, domain, scraped_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      id,
      job.title,
      job.company,
      job.location,
      job.salary,
      job.type,
      job.remote ? 1 : 0,
      job.description,
      JSON.stringify(job.requirements),
      job.source,
      job.url,
      job.posted_date,
      job.domain,
      new Date().toISOString()
    ]);
    stmt.free();
  }
  console.log(`✅ Saved ${SAMPLE_JOBS.length} jobs to database\n`);
  
  // Step 4: Get jobs and calculate match scores
  console.log('🎯 Step 4: Matching jobs with CV...');
  const allJobs = [];
  const stmt = db.prepare('SELECT * FROM jobs ORDER BY scraped_at DESC');
  while (stmt.step()) {
    allJobs.push(stmt.getAsObject());
  }
  stmt.free();
  
  const matchedJobs = allJobs
    .map(job => {
      const text = (job.title + ' ' + (job.description || '')).toLowerCase();
      let matches = 0;
      for (const skill of cvData.skills) {
        if (text.includes(skill.toLowerCase())) {
          matches++;
        }
      }
      return {
        ...job,
        matchScore: Math.min(100, matches * 25 + 50),
        skills: JSON.parse(job.requirements || '[]')
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
  
  console.log('\n📋 Top matching jobs:');
  matchedJobs.slice(0, 8).forEach((job, i) => {
    console.log(`   ${i + 1}. ${job.title} at ${job.company} (${job.matchScore}% match)`);
  });
  
  // Step 5: Create applications
  console.log('\n🤖 Step 5: Preparing applications...');
  for (const job of matchedJobs.slice(0, 5)) {
    console.log(`\n   📝 Application for: ${job.title} at ${job.company}`);
    console.log(`   💰 Salary: ${job.salary}`);
    console.log(`   📍 Location: ${job.location} ${job.remote ? '(Remote)' : ''}`);
    console.log(`   🔗 URL: ${job.url}`);
    
    const matchedSkills = cvData.skills.filter(s => 
      (job.title + ' ' + job.description).toLowerCase().includes(s.toLowerCase())
    );
    
    const appStmt = db.prepare(`
      INSERT INTO applications (id, job_id, job_title, company, url, status, applied_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    appStmt.run([
      uuidv4(),
      job.id,
      job.title,
      job.company,
      job.url,
      'ready_to_apply',
      new Date().toISOString(),
      `Match score: ${job.matchScore}%, Skills: ${matchedSkills.join(', ')}`
    ]);
    appStmt.free();
    
    console.log('   ✅ Application queued!');
  }
  
  // Save database
  const data = db.export();
  fs.writeFileSync(DB_PATH, data);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Process complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Jobs available: ${matchedJobs.length}`);
  console.log(`   - Applications queued: ${Math.min(5, matchedJobs.length)}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Start the web interface: cd backend && npm run dev`);
  console.log(`   2. Visit http://localhost:3000 to view jobs`);
  console.log(`   3. Click on jobs to apply or mark as applied`);
  console.log(`\n📁 Database location: ${DB_PATH}\n`);
}

main().catch(console.error);