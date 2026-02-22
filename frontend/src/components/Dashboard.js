import React from 'react';
import './Dashboard.css';

function Dashboard({ jobs, applications, cvData }) {
  const totalJobs = jobs.length;
  const appliedJobs = applications.filter(a => a.status === 'applied').length;
  const interviewJobs = applications.filter(a => a.status === 'interview').length;
  const rejectedJobs = applications.filter(a => a.status === 'rejected').length;
  const successRate = appliedJobs > 0 ? Math.round((interviewJobs / appliedJobs) * 100) : 0;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date))
    .slice(0, 5);

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date))
    .slice(0, 5);

  const topDomains = jobs.reduce((acc, job) => {
    const domain = job.domain || 'Other';
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  const sortedDomains = Object.entries(topDomains)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p className="stat-value">{totalJobs}</p>
        </div>
        <div className="stat-card">
          <h3>Applied</h3>
          <p className="stat-value">{appliedJobs}</p>
        </div>
        <div className="stat-card">
          <h3>Interviews</h3>
          <p className="stat-value">{interviewJobs}</p>
        </div>
        <div className="stat-card">
          <h3>Success Rate</h3>
          <p className="stat-value">{successRate}%</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Recent Jobs</h3>
          {recentJobs.length > 0 ? (
            <ul className="recent-list">
              {recentJobs.map(job => (
                <li key={job.id} className="recent-item">
                  <span className="job-title">{job.title}</span>
                  <span className="company-name">{job.company}</span>
                  <span className="job-domain">{job.domain}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No jobs scraped yet</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Recent Applications</h3>
          {recentApplications.length > 0 ? (
            <ul className="recent-list">
              {recentApplications.map(app => (
                <li key={app.id} className="recent-item">
                  <span className="job-title">{app.job_title}</span>
                  <span className="company-name">{app.company}</span>
                  <span className={`status-badge status-${app.status}`}>{app.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No applications yet</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Top Job Domains</h3>
          {sortedDomains.length > 0 ? (
            <ul className="domain-list">
              {sortedDomains.map(([domain, count]) => (
                <li key={domain} className="domain-item">
                  <span className="domain-name">{domain}</span>
                  <span className="domain-count">{count} jobs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No data yet</p>
          )}
        </div>

        <div className="dashboard-section cv-section">
          <h3>CV Status</h3>
          {cvData ? (
            <div className="cv-info">
              <p><strong>Name:</strong> {cvData.name || 'Not specified'}</p>
              <p><strong>Skills:</strong> {cvData.skills?.length || 0} skills detected</p>
              <p><strong>Domains:</strong> {cvData.domains?.join(', ') || 'Not detected'}</p>
              <p><strong>Experience:</strong> {cvData.experience?.length || 0} entries</p>
            </div>
          ) : (
            <p className="empty-message">No CV uploaded. Go to CV tab to add your resume.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;