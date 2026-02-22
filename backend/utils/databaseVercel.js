// Vercel-compatible database utility using in-memory storage
// For production, use Vercel KV (Redis) or Vercel Postgres

// In-memory storage (persists while server is running)
let applications = [];
let jobs = [];
let cv = null;

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Applications
export function getApplications(filters = {}) {
  let result = [...applications];
  
  if (filters.status) {
    result = result.filter(app => app.status === filters.status);
  }
  
  return result.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
}

export function createApplication(data) {
  const application = {
    id: generateId(),
    ...data,
    status: data.status || 'Pending',
    appliedDate: data.appliedDate || new Date().toISOString().split('T')[0],
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
  applications.push(application);
  return application;
}

export function updateApplicationStatus(id, status) {
  const index = applications.findIndex(app => app.id === id);
  if (index !== -1) {
    applications[index].status = status;
    return applications[index];
  }
  return null;
}

export function deleteApplication(id) {
  const index = applications.findIndex(app => app.id === id);
  if (index !== -1) {
    return applications.splice(index, 1)[0];
  }
  return null;
}

// Jobs
export function getJobs(filters = {}) {
  let result = [...jobs];
  
  if (filters.domain) {
    result = result.filter(job => job.domain === filters.domain);
  }
  
  if (filters.remote !== undefined) {
    result = result.filter(job => job.remote === filters.remote);
  }
  
  if (filters.minMatchScore) {
    result = result.filter(job => (job.match_score || 0) >= filters.minMatchScore);
  }
  
  return result.sort((a, b) => new Date(b.posted) - new Date(a.posted));
}

export function createJob(data) {
  const job = {
    id: generateId(),
    ...data,
    posted: data.posted || new Date().toISOString(),
    match_score: data.match_score || 0,
    applied: false
  };
  
  // Avoid duplicates
  const existing = jobs.find(j => j.url === job.url);
  if (existing) {
    return existing;
  }
  
  jobs.push(job);
  return job;
}

export function getJobById(id) {
  return jobs.find(job => job.id === id);
}

// CV
export function getCV() {
  return cv;
}

export function saveCV(data) {
  cv = {
    ...data,
    savedAt: new Date().toISOString()
  };
  return cv;
}

// Auto-apply logic
export function shouldAutoApply(job, cv) {
  if (!cv || !cv.skills || !job.requirements) {
    return { shouldApply: false, reason: 'No CV or job requirements' };
  }
  
  const jobRequirements = job.requirements.map(r => r.toLowerCase());
  const cvSkills = cv.skills.map(s => s.toLowerCase());
  
  // Find matching skills
  const matchingSkills = cvSkills.filter(skill => 
    jobRequirements.some(req => req.includes(skill) || skill.includes(req))
  );
  
  // Calculate match score
  const matchScore = Math.round((matchingSkills.length / jobRequirements.length) * 100);
  
  // Determine if should apply
  const shouldApply = matchScore >= 30 && matchingSkills.length >= 1;
  
  return {
    shouldApply,
    matchScore,
    matchingSkills,
    reason: shouldApply 
      ? `Matches ${matchingSkills.length} of ${jobRequirements.length} requirements (${matchScore}%)`
      : matchScore < 30 ? 'Match score too low' : 'No matching skills found'
  };
}

// Generate cover letter
export function generateCoverLetter(job, cv) {
  const skillsList = cv.skills?.slice(0, 5).join(', ') || 'various technologies';
  
  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${skillsList}, I believe I would be a valuable addition to your team.

${cv.summary || 'I am a dedicated professional with experience in my field and a passion for continuous learning.'}

I am excited about the opportunity to contribute to ${job.company} and would welcome the chance to discuss how my skills align with your needs.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${cv.name || 'Applicant'}`;
}