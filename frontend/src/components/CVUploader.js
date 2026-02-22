import React, { useState } from 'react';
import './CVUploader.css';

const API_BASE = 'http://localhost:3000/api';

function CVUploader({ cvData, onCVUpload }) {
  const [cvText, setCvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text'); // 'text' or 'paste'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvText.trim()) {
      alert('Please enter your CV content');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cv/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cvText })
      });
      
      const data = await response.json();
      if (data.parsed) {
        onCVUpload(data.cv);
        alert('CV parsed and saved successfully!');
        setCvText('');
      } else {
        alert('Error parsing CV: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!cvData) return;
    
    try {
      await fetch(`${API_BASE}/cv`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cvData)
      });
      alert('CV updated successfully!');
    } catch (error) {
      alert('Error updating CV: ' + error.message);
    }
  };

  return (
    <div className="cv-uploader">
      <h2>📄 CV Management</h2>
      
      {cvData ? (
        <div className="cv-display">
          <div className="cv-section">
            <h3>Your Profile</h3>
            <div className="cv-field">
              <label>Name:</label>
              <input 
                type="text" 
                value={cvData.name || ''} 
                onChange={(e) => {
                  const newCvData = { ...cvData, name: e.target.value };
                  // Update locally
                  Object.assign(cvData, { name: e.target.value });
                }}
              />
            </div>
            <div className="cv-field">
              <label>Email:</label>
              <input 
                type="email" 
                value={cvData.email || ''} 
                onChange={(e) => Object.assign(cvData, { email: e.target.value })}
              />
            </div>
            <div className="cv-field">
              <label>Phone:</label>
              <input 
                type="text" 
                value={cvData.phone || ''} 
                onChange={(e) => Object.assign(cvData, { phone: e.target.value })}
              />
            </div>
          </div>

          <div className="cv-section">
            <h3>Skills</h3>
            <div className="skills-list">
              {(cvData.skills || []).map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>

          <div className="cv-section">
            <h3>Detected Domains</h3>
            <div className="domains-list">
              {(cvData.domains || []).map((domain, i) => (
                <span key={i} className="domain-tag">{domain}</span>
              ))}
            </div>
          </div>

          <div className="cv-section">
            <h3>Experience</h3>
            {cvData.experience?.length > 0 ? (
              <ul className="experience-list">
                {cvData.experience.map((exp, i) => (
                  <li key={i}>
                    <strong>{exp.title}</strong> at {exp.company}
                    <br />
                    <small>{exp.duration}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No experience entries detected</p>
            )}
          </div>

          <button onClick={handleManualSave} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      ) : (
        <div className="cv-form">
          <div className="mode-tabs">
            <button 
              className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              Paste CV Text
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV text here... (Resume content, skills, experience, etc.)"
              rows="15"
              className="cv-textarea"
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Parsing...' : 'Parse & Save CV'}
            </button>
          </form>

          <div className="cv-tips">
            <h4>💡 Tips for better parsing:</h4>
            <ul>
              <li>Include your full name and contact information</li>
              <li>List your skills clearly (either as bullet points or comma-separated)</li>
              <li>Include work experience with job titles and companies</li>
              <li>Add education details</li>
            </ul>
          </div>
        </div>
      )}

      {!cvData && (
        <div className="no-cv-message">
          <p>No CV uploaded yet. Paste your resume above to get started!</p>
        </div>
      )}
    </div>
  );
}

export default CVUploader;