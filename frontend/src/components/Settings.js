import React from 'react';
import './Settings.css';

function Settings() {
  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>
      
      <div className="settings-section">
        <h3>Application Settings</h3>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            <span>Auto-save scraped jobs</span>
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" defaultChecked />
            <span>Calculate match scores automatically</span>
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" />
            <span>Send notifications for new matching jobs</span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Scraping Preferences</h3>
        <div className="setting-item">
          <label>Default job sources:</label>
          <div className="checkbox-group">
            <label><input type="checkbox" defaultChecked /> LinkedIn</label>
            <label><input type="checkbox" defaultChecked /> Indeed</label>
            <label><input type="checkbox" /> Glassdoor</label>
            <label><input type="checkbox" /> Naukri</label>
          </div>
        </div>
        <div className="setting-item">
          <label>Max jobs per scrape:</label>
          <select className="setting-select">
            <option value="25">25</option>
            <option value="50" selected>50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Management</h3>
        <div className="setting-item">
          <button className="btn btn-secondary">Export Data (JSON)</button>
          <button className="btn btn-secondary">Import Data</button>
          <button className="btn btn-danger">Clear All Data</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Description:</strong> Automated Job Tracker - Track and apply to jobs efficiently</p>
      </div>
    </div>
  );
}

export default Settings;