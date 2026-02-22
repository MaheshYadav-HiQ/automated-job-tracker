// Auto Apply Service - Applies to jobs automatically
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function autoApply(job, cvData, settings = {}) {
  const results = {
    success: false,
    applied: false,
    message: '',
    url: job.url,
    source: job.source
  };
  
  const browser = await chromium.launch({ 
    headless: false, // Need visible for manual login if needed
    args: ['--no-sandbox']
  });
  
  try {
    const context = await browser.newContext({ 
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    console.log(`🎯 Attempting to apply to: ${job.title} at ${job.company}`);
    
    // Navigate to job posting
    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check if it's an Easy Apply job (LinkedIn)
    const easyApplyBtn = await page.$('button[aria-label*="Easy Apply"]');
    
    if (easyApplyBtn) {
      results.message = 'Found Easy Apply button';
      // In a real implementation, this would:
      // 1. Click the Easy Apply button
      // 2. Fill out the application form
      // 3. Upload CV if needed
      // 4. Submit the application
      
      // For now, we mark it as "ready to apply"
      results.success = true;
      results.applied = false; // Needs user confirmation for safety
      results.message = 'Easy Apply job found. Manual review required for first application.';
    } else {
      // External apply - open in new tab
      const applyButton = await page.$('a[href*="apply"], a[data-test="apply-button"], a[class*="apply"]');
      
      if (applyButton) {
        const applyUrl = await applyButton.getAttribute('href');
        results.success = true;
        results.message = `External application. Apply at: ${applyUrl}`;
      } else {
        results.message = 'Could not find application button. Job posting may require manual application.';
      }
    }
    
  } catch (error) {
    results.message = `Error: ${error.message}`;
  } finally {
    await browser.close();
  }
  
  return results;
}

// Apply to LinkedIn Easy Apply jobs
export async function applyToLinkedInEasyApply(page, cvData) {
  try {
    // Click Easy Apply button
    const easyApplyBtn = await page.$('button[aria-label*="Easy Apply"]');
    if (easyApplyBtn) {
      await easyApplyBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for phone number step
    const phoneInput = await page.$('input[name*="phone"]');
    if (phoneInput && cvData.phone) {
      await phoneInput.fill(cvData.phone);
    }
    
    // Check for resume upload
    const resumeInput = await page.$('input[type="file"][accept*="pdf"]');
    if (resumeInput) {
      // Would upload resume here
    }
    
    // Click submit or next
    const submitBtn = await page.$('button[aria-label="Submit application"], button:has-text("Submit")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      return { success: true, message: 'Application submitted successfully!' };
    }
    
    return { success: false, message: 'Could not complete application' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Apply to Indeed
export async function applyToIndeed(page, job, cvData) {
  try {
    // Check for "Apply Now" button
    const applyButton = await page.$('button[data-testid="apply-button"], button:has-text("Apply Now")');
    
    if (applyButton) {
      await applyButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Indeed often redirects to company site or has its own form
    // Check if we're still on Indeed
    const currentUrl = page.url();
    
    if (currentUrl.includes('indeed.com')) {
      // Fill Indeed application form
      if (cvData.email) {
        const emailInput = await page.$('input[name="email"], input[type="email"]');
        if (emailInput) await emailInput.fill(cvData.email);
      }
      
      if (cvData.phone) {
        const phoneInput = await page.$('input[name="phone"]');
        if (phoneInput) await phoneInput.fill(cvData.phone);
      }
    }
    
    return { success: true, message: 'Application form detected' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Generate cover letter based on job and CV
export function generateCoverLetter(job, cvData) {
  const skills = cvData.skills?.join(', ') || 'various technologies';
  const experience = cvData.experience?.slice(0, 2) || [];
  
  return `
Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${skills}, I am confident that I would be a valuable addition to your team.

${cvData.summary ? `As a professional with experience in ${cvData.summary.substring(0, 100)}...` : ''}

I am particularly excited about this opportunity because ${job.description ? job.description.substring(0, 100) : 'your company\'s innovative approach'}.

I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.

Best regards,
${cvData.name || 'Applicant'}
  `.trim();
}

// Check if job matches CV based on domains and skills
export function shouldAutoApply(job, cvData, targetDomains = []) {
  // If no CV, don't auto-apply
  if (!cvData || !cvData.skills || cvData.skills.length === 0) {
    return { shouldApply: false, reason: 'No CV uploaded' };
  }
  
  // Check if job domain matches target domains
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
  
  // Check skill match score
  const jobRequirements = job.requirements || [];
  const matchingSkills = cvData.skills.filter(skill => 
    jobRequirements.some(req => 
      req.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(req.toLowerCase())
    )
  );
  
  const matchRatio = matchingSkills.length / Math.max(jobRequirements.length, 1);
  
  if (matchRatio < 0.3) {
    return { 
      shouldApply: false, 
      reason: `Low skill match (${Math.round(matchRatio * 100)}%). Need at least 30% match.` 
    };
  }
  
  return { 
    shouldApply: true, 
    matchScore: Math.round(matchRatio * 100),
    matchingSkills,
    reason: `Good match! ${matchingSkills.length} skills matched.`
  };
}