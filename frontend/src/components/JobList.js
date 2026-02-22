import React, { useState } from 'react';
import './JobList.css';

function JobList({ jobs, cvData, onApply }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'matched' && cvData) {
      return matchesSearch && (job.match_score >= 30);
    }
    if (filter === 'unmatched') {
      return matchesSearch && (!cvData || job.match_score < 30);
    }
    return matchesSearch;
  });

  const getMatchScoreClass = (score) => {
    if (score >= 70) return 'match-high';
    if (score >= 50) return 'match-medium';
    if (score >= 30) return 'match-low';
    return 'match-none';
  };

  return (
    <div className="job-list">
      <div className="job-list-header">
        <h2>💼 Job Listings</h2>
        <div className="job-filters">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Jobs</option>
            <option value="matched">Matched (30%+)</option>
            <option value="unmatched">Not Matched</option>
          </select>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="jobs-grid">
          {filteredJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <h3>{job.title}</h3>
                {cvData && job.match_score !== undefined && (
                  <span className={`match-score ${getMatchScoreClass(job.match_score)}`}>
                    {job.match_score}% Match
                  </span>
                )}
              </div>
              <p className="company">{job.company}</p>
              <div className="job-details">
                <span className="location">📍 {job.location || 'N/A'}</span>
                <span className="domain">🏢 {job.domain || 'General'}</span>
                {job.salary && <span className="salary">💰 {job.salary}</span>}
              </div>
              <p className="description">{job.description?.substring(0, 150)}...</p>
              <div className="job-requirements">
                {(job.requirements || []).slice(0, 5).map((req, i) => (
                  <span key={i} className="requirement-tag">{req}</span>
                ))}
              </div>
              <div className="job-actions">
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View Job
                </a>
                <button 
                  onClick={() => onApply(job)}
                  className="btn btn-primary"
                >
                  Apply
                </button>
              </div>
              <p className="posted-date">Posted: {job.posted_date || 'Recently'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No jobs found. Try scraping for jobs first!</p>
        </div>
      )}
    </div>
  );
}

export default JobList;