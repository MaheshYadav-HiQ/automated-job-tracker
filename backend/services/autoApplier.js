// Auto Apply Service - Complete implementation for live job applications
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCV, getSetting, setSetting } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebTime/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Session storage path
const SESSION_DIR = path.join(__dirname, '../sessions');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// ============================================
// LINKEDIN AUTO-APPLY
// ============================================

export async function loginToLinkedIn(email, password) {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({ 
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🔐 Logging into LinkedIn...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Enter email
    await page.fill('#username', email);
    await page.fill('#password', password);
    await page.click('.login__form_action_container button');
    
    // Wait for verification (may need 2FA)
    await page.waitForURL('**/feed/**', { timeout: 30000 }).catch(() => {});
    
    // Check if login successful
    const isLoggedIn = page.url().includes('feed') || page.url().includes('jobs');
    
    if (isLoggedIn) {
      console.log('✅ LinkedIn login successful!');
      
      // Save session cookies
      const cookies = await context.cookies();
      fs.writeFileSync(
        path.join(SESSION_DIR, 'linkedin.json'), 
        JSON.stringify(cookies)
      );
      
      await browser.close();
      return { success: true, message: 'Logged in to LinkedIn successfully!' };
    } else {
      await browser.close();
      return { success: false, message: 'Login failed. May need 2FA verification.' };
    }
    
  } catch (error) {
    await browser.close();
    return { success: false, message: error.message };
  }
}

export async function applyToLinkedInJob(page, job, cvData) {
  const results = {
    success: false,
    applied: false,
    message: '',
    steps: []
  };
  
  try {
    // Navigate to job
    results.steps.push('Navigating to job...');
    await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check for Easy Apply button
    results.steps.push('Checking for Easy Apply button...');
    const easyApplyBtn = await page.$('button[aria-label*="Easy Apply"]');
    
    if (!easyApplyBtn) {
      // Try alternative selectors
      const altBtn = await page.$('button:has-text("Easy Apply"), .jobs-apply-button');
      if (!altBtn) {
        results.message = 'No Easy Apply available. External application required.';
        return results;
      }
    }
    
    // Click Easy Apply
    results.steps.push('Clicking Easy Apply...');
    await (easyApplyBtn || await page.$('button:has-text("Easy Apply")')).click();
    await page.waitForTimeout(2000);
    
    // Step 1: Phone number (if required)
    results.steps.push('Checking phone step...');
    const phoneInput = await page.$('input[name*="phone"], input[aria-label*="Phone"]');
    if (phoneInput) {
      if (cvData.phone) {
        await phoneInput.fill(cvData.phone);
        results.steps.push('Phone filled');
      } else {
        results.message = 'Phone number required but not in CV';
        return results;
      }
    }
    
    // Click Next
    const nextBtn1 = await page.$('button[aria-label="Continue"], button:has-text("Continue")');
    if (nextBtn1) {
      await nextBtn1.click();
      await page.waitForTimeout(1500);
    }
    
    // Step 2: Resume upload (if not already uploaded)
    results.steps.push('Checking resume upload...');
    const resumeInput = await page.$('input[type="file"]');
    if (resumeInput && cvData.file_path && fs.existsSync(cvData.file_path)) {
      await resumeInput.setInputFiles(cvData.file_path);
      results.steps.push('Resume uploaded');
      await page.waitForTimeout(1000);
    }
    
    // Step 3: Additional questions (simplified)
    results.steps.push('Handling additional questions...');
    
    // Skip if "Review" button exists
    const reviewBtn = await page.$('button[aria-label="Review"], button:has-text("Review")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(1500);
    }
    
    // Submit
    results.steps.push('Submitting application...');
    const submitBtn = await page.$('button[aria-label="Submit application"], button:has-text("Submit")');
    
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      
      // Check for success
      const successMsg = await page.$('.artdeco-modal__content, .feedback-alert--success');
      if (successMsg) {
        results.success = true;
        results.applied = true;
        results.message = 'Application submitted successfully!';
        results.steps.push('✅ Application submitted!');
      } else {
        results.message = 'Application may have been submitted';
        results.applied = true;
      }
    } else {
      results.message = 'Could not find submit button';
    }
    
  } catch (error) {
    results.message = `Error: ${error.message}`;
    results.steps.push(`❌ Error: ${error.message}`);
  }
  
  return results;
}

// ============================================
// INDEED AUTO-APPLY
// ============================================

export async function loginToIndeed(email, password) {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({ 
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🔐 Logging into Indeed...');
    await page.goto('https://secure.indeed.com/auth', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Enter email
    await page.fill('#email', email);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Enter password
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    
    // Wait for home page
    await page.waitForURL('**/mysearches**', { timeout: 30000 }).catch(() => {});
    
    const isLoggedIn = page.url().includes('mysearches') || page.url().includes('home');
    
    if (isLoggedIn) {
      console.log('✅ Indeed login successful!');
      
      const cookies = await context.cookies();
      fs.writeFileSync(
        path.join(SESSION_DIR, 'indeed.json'), 
        JSON.stringify(cookies)
      );
      
      await browser.close();
      return { success: true, message: 'Logged in to Indeed successfully!' };
    } else {
      await browser.close();
      return { success: false, message: 'Login failed' };
    }
    
  } catch (error) {
    await browser.close();
    return { success: false, message: error.message };
  }
}

export async function applyToIndeedJob(page, job, cvData) {
  const results = {
    success: false,
    applied: false,
    message: '',
    steps: []
  };
  
  try {
    // Navigate to job
    results.steps.push('Navigating to job...');
    await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click Apply button
    results.steps.push('Looking for Apply button...');
    let applyButton = await page.$('button[data-testid="apply-button"]');
    
    if (!applyButton) {
      applyButton = await page.$('button:has-text("Apply Now"), a:has-text("Apply Now"), .icl-Button');
    }
    
    if (!applyButton) {
      // External apply
      const extLink = await page.$('a[href*="apply"], a[data-test="apply-button"]');
      if (extLink) {
        results.message = 'External application - redirecting to company site';
        results.steps.push('External apply - manual completion needed');
        return results;
      }
      results.message = 'No Apply button found';
      return results;
    }
    
    // Click apply
    results.steps.push('Clicking Apply...');
    await applyButton.click();
    await page.waitForTimeout(2000);
    
    // Check if we're still on Indeed
    const currentUrl = page.url();
    
    if (currentUrl.includes('indeed.com')) {
      // Fill Indeed application form
      results.steps.push('Filling application form...');
      
      // Email
      if (cvData.email) {
        const emailInput = await page.$('input[name="email"], input[type="email"]');
        if (emailInput) {
          await emailInput.fill(cvData.email);
          results.steps.push('Email filled');
        }
      }
      
      // Phone
      if (cvData.phone) {
        const phoneInput = await page.$('input[name="phoneNumber"], input[name="phone"]');
        if (phoneInput) {
          await phoneInput.fill(cvData.phone);
          results.steps.push('Phone filled');
        }
      }
      
      // Name (if separate fields)
      if (cvData.name) {
        const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
        if (nameInput) {
          await nameInput.fill(cvData.name);
          results.steps.push('Name filled');
        }
      }
      
      // Upload resume if available
      const resumeInput = await page.$('input[type="file"]');
      if (resumeInput && cvData.file_path && fs.existsSync(cvData.file_path)) {
        await resumeInput.setInputFiles(cvData.file_path);
        results.steps.push('Resume uploaded');
        await page.waitForTimeout(1000);
      }
      
      // Submit
      const submitBtn = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Send")');
      if (submitBtn) {
        results.steps.push('Submitting...');
        await submitBtn.click();
        await page.waitForTimeout(2000);
        
        results.success = true;
        results.applied = true;
        results.message = 'Application submitted successfully!';
        results.steps.push('✅ Application submitted!');
      } else {
        results.message = 'Form filled but no submit button found';
      }
    } else {
      // Redirected to company site
      results.message = 'Redirected to company website - manual completion required';
      results.steps.push('External apply');
    }
    
  } catch (error) {
    results.message = `Error: ${error.message}`;
    results.steps.push(`❌ Error: ${error.message}`);
  }
  
  return results;
}

// ============================================
// MAIN AUTO-APPLY FUNCTION
// ============================================

export async function autoApply(job, cvData) {
  const results = {
    success: false,
    applied: false,
    message: '',
    url: job.url,
    source: job.source
  };
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  try {
    const context = await browser.newContext({ 
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Load saved session if available
    const sessionFile = path.join(SESSION_DIR, `${job.source.toLowerCase()}.json`);
    if (fs.existsSync(sessionFile)) {
      const cookies = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      await context.addCookies(cookies);
      console.log('✅ Loaded saved session');
    }
    
    if (job.source === 'LinkedIn') {
      const applyResult = await applyToLinkedInJob(page, job, cvData);
      Object.assign(results, applyResult);
    } else if (job.source === 'Indeed') {
      const applyResult = await applyToIndeedJob(page, job, cvData);
      Object.assign(results, applyResult);
    } else {
      results.message = `Auto-apply not supported for ${job.source}`;
    }
    
  } catch (error) {
    results.message = `Error: ${error.message}`;
  } finally {
    await browser.close();
  }
  
  return results;
}

// ============================================
// BATCH AUTO-APPLY
// ============================================

export async function batchApply(jobs, cvData, options = {}) {
  const { 
    maxApplications = 10, 
    delayBetween = 5000,
    sources = ['LinkedIn', 'Indeed']
  } = options;
  
  const results = {
    total: jobs.length,
    attempted: 0,
    successful: 0,
    failed: 0,
    applications: []
  };
  
  // Load session
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  try {
    const context = await browser.newContext({ 
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    for (let i = 0; i < Math.min(jobs.length, maxApplications); i++) {
      const job = jobs[i];
      
      if (!sources.includes(job.source)) {
        continue;
      }
      
      console.log(`\n📋 Applying to ${i + 1}/${maxApplications}: ${job.title} at ${job.company}`);
      
      let applyResult;
      
      if (job.source === 'LinkedIn') {
        applyResult = await applyToLinkedInJob(page, job, cvData);
      } else if (job.source === 'Indeed') {
        applyResult = await applyToIndeedJob(page, job, cvData);
      }
      
      results.attempted++;
      results.applications.push({
        job: { title: job.title, company: job.company, url: job.url },
        ...applyResult
      });
      
      if (applyResult.applied) {
        results.successful++;
      } else {
        results.failed++;
      }
      
      // Wait between applications
      if (i < maxApplications - 1) {
        console.log(`⏳ Waiting ${delayBetween / 1000}s before next application...`);
        await new Promise(r => setTimeout(r, delayBetween));
      }
    }
    
  } catch (error) {
    console.error('Batch apply error:', error);
  } finally {
    await browser.close();
  }
  
  return results;
}

// ============================================
// CREDENTIAL MANAGEMENT
// ============================================

export function saveCredentials(platform, email, password) {
  // In production, encrypt this!
  const creds = { email, password: Buffer.from(password).toString('base64') };
  const credPath = path.join(SESSION_DIR, `${platform}_creds.json`);
  fs.writeFileSync(credPath, JSON.stringify(creds));
  return { success: true, message: `${platform} credentials saved` };
}

export function getCredentials(platform) {
  const credPath = path.join(SESSION_DIR, `${platform}_creds.json`);
  if (fs.existsSync(credPath)) {
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    return {
      email: creds.email,
      password: Buffer.from(creds.password, 'base64').toString('utf8')
    };
  }
  return null;
}

// ============================================
// COVER LETTER GENERATOR
// ============================================

export function generateCoverLetter(job, cvData) {
  const skills = cvData.skills?.join(', ') || 'various technologies';
  const name = cvData.name || 'Applicant';
  
  return `
Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. 

With my background in ${skills}, I am confident that I would be a valuable addition to your team. ${cvData.summary ? `As a professional with experience in ${cvData.summary.substring(0, 150)}, ` : ''}I have developed strong problem-solving skills and the ability to work effectively in team environments.

I am particularly excited about this opportunity because ${job.description ? job.description.substring(0, 100).replace(/<[^>]*>/g, '') : 'your company\'s innovative approach to technology'}. 

I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.

Best regards,
${name}
  `.trim();
}

// ============================================
// CHECK IF SHOULD AUTO-APPLY
// ============================================

export function shouldAutoApply(job, cvData, targetDomains = [], minMatchScore = 30) {
  if (!cvData || !cvData.skills || cvData.skills.length === 0) {
    return { shouldApply: false, reason: 'No CV uploaded' };
  }
  
  // Check domain
  const jobDomain = job.domain?.toLowerCase() || '';
  const cvDomains = cvData.domains?.map(d => d.toLowerCase()) || [];
  
  if (targetDomains.length > 0) {
    const domainMatch = targetDomains.some(d => 
      jobDomain.includes(d) || cvDomains.includes(d.toLowerCase())
    );
    
    if (!domainMatch) {
      return { shouldApply: false, reason: 'Job domain does not match target domains' };
    }
  }
  
  // Check skill match
  const jobRequirements = job.requirements || [];
  const matchingSkills = cvData.skills.filter(skill => 
    jobRequirements.some(req => 
      req.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(req.toLowerCase())
    )
  );
  
  const matchScore = jobRequirements.length > 0 
    ? Math.round((matchingSkills.length / jobRequirements.length) * 100)
    : 50;
  
  if (matchScore < minMatchScore) {
    return { 
      shouldApply: false, 
      reason: `Low match score (${matchScore}%). Need at least ${minMatchScore}%` 
    };
  }
  
  return { 
    shouldApply: true, 
    matchScore,
    matchingSkills,
    reason: `Good match! ${matchingSkills.length} skills matched (${matchScore}%)`
  };
}