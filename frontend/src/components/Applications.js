import React, { useState } from 'react';
import './Applications.css';

const API_BASE = 'http://localhost:3000/api';

function Applications({ applications, onUpdateStatus }) {
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const filteredApps = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      onUpdateStatus(id, newStatus);
      setEditingId(null);
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await fetch(`${API_BASE}/applications/${id}`, {
        method: 'DELETE'
      });
      onUpdateStatus(id, null);
    } catch (error) {
      alert('Error deleting application: ' + error.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      applied: 'status-applied',
      interview: 'status-interview',
      offer: 'status-offer',
      rejected: 'status-rejected',
      withdrawn: 'status-withdrawn'
    };
    return statusClasses[status] || 'status-applied';
  };

  return (
    <div className="applications">
      <div className="applications-header">
        <h2>📝 Job Applications</h2>
        <div className="filter-tabs">
          {['all', 'applied', 'interview', 'offer', 'rejected'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredApps.length > 0 ? (
        <div className="applications-list">
          {filteredApps.map(app => (
            <div key={app.id} className="application-card">
              <div className="app-header">
                <h3>{app.job_title}</h3>
                {editingId === app.id ? (
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    className="status-select"
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                ) : (
                  <span 
                    className={`status-badge ${getStatusBadgeClass(app.status)}`}
                    onClick={() => setEditingId(app.id)}
                  >
                    {app.status}
                  </span>
                )}
              </div>
              <p className="company">{app.company}</p>
              <div className="app-meta">
                <span>📅 Applied: {new Date(app.applied_date).toLocaleDateString()}</span>
                {app.notes && <span>📝 Notes: {app.notes}</span>}
              </div>
              <div className="app-actions">
                {app.url && (
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    View Job
                  </a>
                )}
                <button 
                  onClick={() => handleDelete(app.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No applications found. Apply to jobs from the Jobs tab!</p>
        </div>
      )}

      <div className="applications-stats">
        <h3>Application Statistics</h3>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Total Applied:</span>
            <span className="stat-value">{applications.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Interviews:</span>
            <span className="stat-value">
              {applications.filter(a => a.status === 'interview').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Offers:</span>
            <span className="stat-value">
              {applications.filter(a => a.status === 'offer').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Response Rate:</span>
            <span className="stat-value">
              {applications.length > 0 
                ? Math.round(((applications.filter(a => a.status === 'interview').length + 
                    applications.filter(a => a.status === 'offer').length) / 
                   applications.length) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Applications;