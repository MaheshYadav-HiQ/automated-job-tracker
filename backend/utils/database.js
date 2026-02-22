import initSqlJs from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Initialize SQL.js
const SQL = await initSqlJs();

// Load existing database or create new one
let db;
if (fs.existsSync(DB_PATH)) {
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

// Save database to file
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Initialize database tables
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
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
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
    match_score INTEGER,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME,
    notes TEXT,
    cover_letter TEXT,
    resume_sent INTEGER DEFAULT 0,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

saveDatabase();

export default db;

export function createJob(job) {
  const id = uuidv4();
  db.run(`
    INSERT INTO jobs (id, title, company, location, salary, type, remote, description, requirements, source, url, posted_date, domain, match_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    job.title,
    job.company,
    job.location,
    job.salary,
    job.type,
    job.remote ? 1 : 0,
    job.description,
    JSON.stringify(job.requirements || []),
    job.source,
    job.url,
    job.posted_date,
    job.domain,
    job.match_score || 0
  ]);
  
  saveDatabase();
  return { ...job, id };
}

export function getJobs(filters = {}) {
  let query = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];
  
  if (filters.domain) {
    query += ' AND domain = ?';
    params.push(filters.domain);
  }
  
  if (filters.remote !== undefined) {
    query += ' AND remote = ?';
    params.push(filters.remote ? 1 : 0);
  }
  
  if (filters.minMatchScore) {
    query += ' AND match_score >= ?';
    params.push(filters.minMatchScore);
  }
  
  query += ' ORDER BY scraped_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  const jobs = [];
  while (stmt.step()) {
    jobs.push(stmt.getAsObject());
  }
  stmt.free();
  
  return jobs.map(job => ({
    ...job,
    requirements: JSON.parse(job.requirements || '[]'),
    remote: job.remote === 1
  }));
}

export function getJobById(id) {
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
  stmt.bind([id]);
  
  let job = null;
  if (stmt.step()) {
    job = stmt.getAsObject();
    job.requirements = JSON.parse(job.requirements || '[]');
    job.remote = job.remote === 1;
  }
  stmt.free();
  return job;
}

export function saveCV(cvData) {
  const id = uuidv4();
  db.run(`
    INSERT OR REPLACE INTO cv (id, name, email, phone, skills, experience, education, summary, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    cvData.name,
    cvData.email,
    cvData.phone,
    JSON.stringify(cvData.skills || []),
    JSON.stringify(cvData.experience || []),
    JSON.stringify(cvData.education || []),
    cvData.summary,
    cvData.file_path || null
  ]);
  
  saveDatabase();
  return { ...cvData, id };
}

export function getCV() {
  const stmt = db.prepare('SELECT * FROM cv ORDER BY created_at DESC LIMIT 1');
  
  let cv = null;
  if (stmt.step()) {
    cv = stmt.getAsObject();
    cv.skills = JSON.parse(cv.skills || '[]');
    cv.experience = JSON.parse(cv.experience || '[]');
    cv.education = JSON.parse(cv.education || '[]');
  }
  stmt.free();
  return cv;
}

export function createApplication(application) {
  const id = uuidv4();
  db.run(`
    INSERT INTO applications (id, job_id, status, applied_at, notes, cover_letter, resume_sent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    application.job_id,
    application.status || 'pending',
    application.applied_at || new Date().toISOString(),
    application.notes || '',
    application.cover_letter || '',
    application.resume_sent ? 1 : 0
  ]);
  
  saveDatabase();
  return { ...application, id };
}

export function getApplications(filters = {}) {
  let query = `
    SELECT a.*, j.title, j.company, j.location, j.salary, j.url, j.source
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }
  
  query += ' ORDER BY a.applied_at DESC';
  
  const stmt = db.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  const applications = [];
  while (stmt.step()) {
    applications.push(stmt.getAsObject());
  }
  stmt.free();
  return applications;
}

export function updateApplicationStatus(id, status) {
  db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
  saveDatabase();
}

export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  
  let value = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    value = row.value;
  }
  stmt.free();
  return value;
}

export function setSetting(key, value) {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  saveDatabase();
}