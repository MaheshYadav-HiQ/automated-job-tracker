import React, { useState } from 'react';
import './JobScraper.css';

function JobScraper({ onScrape, loading }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [domains, setDomains] = useState({
    linkedin: true,
    indeed: true,
    glassdoor: false,
    naukri: false,
    monster: false
  });
  const [scrapeStatus, setScrapeStatus] = useState(null);

  const handleDomainChange = (domain) => {
    setDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('Please enter a job search query');
      return;
    }

    const activeDomains = Object.entries(domains)
      .filter(([_, active]) => active)
      .map(([domain, _]) => domain);

    if (activeDomains.length === 0) {
      alert('Please select at least one job source');
      return;
    }

    setScrapeStatus('scraping');
    await onScrape(query, location);
    setScrapeStatus('complete');
    
    setTimeout(() => setScrapeStatus(null), 3000);
  };

  const presetQueries = [
    { label: 'Software Engineer', query: 'Software Engineer', location: 'Remote' },
    { label: 'Full Stack Developer', query: 'Full Stack Developer', location: 'Remote' },
    { label: 'Data Scientist', query: 'Data Scientist', location: 'Remote' },
    { label: 'Product Manager', query: 'Product Manager', location: 'Remote' },
    { label: 'DevOps Engineer', query: 'DevOps Engineer', location: 'Remote' }
  ];

  return (
    <div className="job-scraper">
      <h2>🔍 Scrape Jobs</h2>
      
      <form onSubmit={handleSubmit} className="scrape-form">
        <div className="form-group">
          <label>Job Search Query *</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Software Engineer, Product Manager"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Remote, New York, London"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Job Sources</label>
          <div className="domain-checkboxes">
            {Object.entries(domains).map(([domain, active]) => (
              <label key={domain} className="domain-checkbox">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleDomainChange(domain)}
                />
                <span className="domain-name">{domain.charAt(0).toUpperCase() + domain.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary scrape-btn"
          disabled={loading}
        >
          {loading ? '⏳ Scraping...' : '🚀 Start Scraping'}
        </button>

        {scrapeStatus === 'complete' && (
          <p className="scrape-success">✅ Jobs scraped successfully!</p>
        )}
      </form>

      <div className="preset-queries">
        <h3>Quick Searches</h3>
        <div className="preset-buttons">
          {presetQueries.map((preset, i) => (
            <button
              key={i}
              className="preset-btn"
              onClick={() => {
                setQuery(preset.query);
                setLocation(preset.location);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scraper-info">
        <h3>ℹ️ About Scraping</h3>
        <ul>
          <li>Scrapes job listings from selected job boards</li>
          <li>Automatically calculates match score based on your CV</li>
          <li>Saves jobs to your local database for tracking</li>
          <li>Results may vary based on job board availability</li>
        </ul>
      </div>
    </div>
  );
}

export default JobScraper;