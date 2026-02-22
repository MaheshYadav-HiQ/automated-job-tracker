// CV Parser - Extracts information from resumes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common skills database for matching
const SKILL_KEYWORDS = {
  // Programming Languages
  'javascript': ['javascript', 'js', 'ecmascript'],
  'python': ['python', 'py'],
  'java': ['java'],
  'csharp': ['c#', 'csharp', 'c sharp'],
  'cpp': ['c++', 'cpp'],
  'typescript': ['typescript', 'ts'],
  'go': ['golang', 'go'],
  'rust': ['rust'],
  'ruby': ['ruby'],
  'php': ['php'],
  'swift': ['swift'],
  'kotlin': ['kotlin'],
  
  // Frontend
  'react': ['react', 'reactjs', 'react.js'],
  'vue': ['vue', 'vuejs', 'vue.js'],
  'angular': ['angular', 'angularjs'],
  'nextjs': ['nextjs', 'next.js', 'next'],
  'html': ['html', 'html5'],
  'css': ['css', 'css3', 'scss', 'sass'],
  'tailwind': ['tailwind', 'tailwindcss'],
  
  // Backend
  'nodejs': ['node', 'nodejs', 'node.js'],
  'express': ['express', 'expressjs'],
  'django': ['django'],
  'flask': ['flask'],
  'fastapi': ['fastapi'],
  'spring': ['spring', 'springboot'],
  'rails': ['rails', 'ruby on rails'],
  
  // Databases
  'mysql': ['mysql'],
  'postgresql': ['postgresql', 'postgres'],
  'mongodb': ['mongodb', 'mongo'],
  'redis': ['redis'],
  'sqlite': ['sqlite'],
  'elasticsearch': ['elasticsearch', 'elastic'],
  
  // Cloud & DevOps
  'aws': ['aws', 'amazon web services'],
  'gcp': ['gcp', 'google cloud'],
  'azure': ['azure'],
  'docker': ['docker'],
  'kubernetes': ['kubernetes', 'k8s'],
  'terraform': ['terraform'],
  'jenkins': ['jenkins'],
  'github': ['github', 'git'],
  
  // Data & ML
  'python': ['python', 'pandas', 'numpy'],
  'tensorflow': ['tensorflow'],
  'pytorch': ['pytorch'],
  'machine learning': ['machine learning', 'ml'],
  'data analysis': ['data analysis', 'data analyst'],
  'sql': ['sql', 'mysql', 'postgresql'],
  
  // Other
  'rest api': ['rest', 'rest api', 'restful'],
  'graphql': ['graphql', 'gql'],
  'agile': ['agile', 'scrum'],
  'git': ['git', 'github', 'gitlab'],
  'linux': ['linux', 'unix'],
};

// Common job domains
const DOMAINS = [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'data science',
  'machine learning',
  'mobile',
  'QA',
  'security',
  'cloud',
  'blockchain'
];

export function parseCV(text) {
  const lowerText = text.toLowerCase();
  
  // Extract skills
  const skills = extractSkills(lowerText);
  
  // Extract email
  const email = extractEmail(text);
  
  // Extract phone
  const phone = extractPhone(text);
  
  // Extract name (usually at the top)
  const name = extractName(text);
  
  // Extract experience
  const experience = extractExperience(text);
  
  // Extract education
  const education = extractEducation(text);
  
  // Extract summary
  const summary = extractSummary(text);
  
  // Determine domains based on skills
  const detectedDomains = detectDomains(skills);
  
  return {
    name,
    email,
    phone,
    skills,
    experience,
    education,
    summary,
    domains: detectedDomains
  };
}

function extractSkills(text) {
  const foundSkills = new Set();
  
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      if (regex.test(text)) {
        foundSkills.add(skill);
        break;
      }
    }
  }
  
  return Array.from(foundSkills);
}

function extractEmail(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

function extractPhone(text) {
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

function extractName(text) {
  const lines = text.split('\n').filter(line => line.trim());
  // First non-empty line is often the name
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // If it looks like a name (no special characters, reasonable length)
    if (firstLine.length < 50 && !firstLine.includes('@') && !firstLine.includes('http')) {
      return firstLine;
    }
  }
  return '';
}

function extractExperience(text) {
  const experience = [];
  const lines = text.split('\n');
  
  // Look for experience section
  let inExperienceSection = false;
  let currentExperience = null;
  
  const experienceKeywords = ['experience', 'employment', 'work history', 'professional experience'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    // Check if we're entering experience section
    if (experienceKeywords.some(kw => line.includes(kw))) {
      inExperienceSection = true;
      continue;
    }
    
    // Check if we're leaving experience section (new section header)
    if (inExperienceSection && (line.match(/^[A-Z][A-Z\s]+$/) || line.includes('education') || line.includes('skills'))) {
      inExperienceSection = false;
    }
    
    // Extract job entries (look for patterns like "Company - Title" or "Title at Company")
    if (inExperienceSection) {
      // Simple pattern matching for job entries
      const jobPatterns = [
        /^(.+?)\s*[-|]\s*(.+)$/,  // Company - Title
        /^(\w+)\s*(\d{4})\s*[-–]\s*(\w+)?\s*(\d{4})?$/, // Date ranges
      ];
      
      for (const pattern of jobPatterns) {
        const match = line.match(pattern);
        if (match && line.length > 10) {
          experience.push({
            description: line,
            raw: line
          });
          break;
        }
      }
    }
  }
  
  return experience.slice(0, 10); // Limit to 10 entries
}

function extractEducation(text) {
  const education = [];
  const lines = text.split('\n');
  
  let inEducationSection = false;
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    if (educationKeywords.some(kw => lowerLine.includes(kw))) {
      inEducationSection = true;
      continue;
    }
    
    if (inEducationSection) {
      if (lowerLine.match(/^[A-Z][A-Z\s]+$/) || lowerLine.includes('experience') || lowerLine.includes('skills')) {
        inEducationSection = false;
      } else if (line.trim().length > 5) {
        education.push({
          description: line.trim(),
          raw: line.trim()
        });
      }
    }
  }
  
  return education.slice(0, 5);
}

function extractSummary(text) {
  const lines = text.split('\n').filter(l => l.trim());
  
  // Look for summary/objective section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (line.includes('summary') || line.includes('objective') || line.includes('profile')) {
      // Get the next few lines as summary
      const summaryLines = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.toLowerCase().includes('experience')) {
          summaryLines.push(nextLine);
        } else {
          break;
        }
      }
      
      if (summaryLines.length > 0) {
        return summaryLines.join(' ').substring(0, 500);
      }
    }
  }
  
  // If no summary section, use first few lines after name
  return lines.slice(1, 3).join(' ').substring(0, 500);
}

function detectDomains(skills) {
  const domainSkills = {
    'frontend': ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'nextjs'],
    'backend': ['nodejs', 'python', 'java', 'csharp', 'go', 'ruby', 'php', 'express', 'django', 'flask', 'spring'],
    'fullstack': ['react', 'nodejs', 'javascript', 'typescript', 'express', 'mongodb', 'postgresql'],
    'devops': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'github', 'linux'],
    'data science': ['python', 'machine learning', 'tensorflow', 'pytorch', 'data analysis', 'sql'],
    'machine learning': ['python', 'machine learning', 'tensorflow', 'pytorch', 'data analysis'],
    'mobile': ['swift', 'kotlin', 'react', 'java'],
    'QA': ['testing', 'selenium', 'cypress', 'jest'],
    'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
    'security': ['security', 'encryption', 'authentication', 'oauth']
  };
  
  const detected = [];
  
  for (const [domain, domainSkillList] of Object.entries(domainSkills)) {
    const matchCount = skills.filter(skill => domainSkillList.includes(skill)).length;
    if (matchCount >= 2) {
      detected.push(domain);
    }
  }
  
  return detected.length > 0 ? detected : ['general'];
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Calculate match score between CV skills and job requirements
export function calculateMatchScore(cvSkills, jobRequirements) {
  if (!cvSkills || cvSkills.length === 0) return 0;
  if (!jobRequirements || jobRequirements.length === 0) return 50; // Neutral if no requirements
  
  const cvSkillsLower = cvSkills.map(s => s.toLowerCase());
  const requirementsLower = jobRequirements.map(r => r.toLowerCase());
  
  let matches = 0;
  for (const req of requirementsLower) {
    for (const skill of cvSkillsLower) {
      if (skill.includes(req) || req.includes(skill)) {
        matches++;
        break;
      }
    }
  }
  
  return Math.round((matches / requirementsLower.length) * 100);
}