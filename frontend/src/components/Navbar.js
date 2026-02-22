import React from 'react';
import './Navbar.css';

function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'jobs', label: '💼 Jobs', icon: '💼' },
    { id: 'cv', label: '📄 CV', icon: '📄' },
    { id: 'scrape', label: '🔍 Scrape Jobs', icon: '🔍' },
    { id: 'applications', label: '📝 Applications', icon: '📝' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>JobTracker</h1>
      </div>
      <ul className="navbar-tabs">
        {tabs.map(tab => (
          <li key={tab.id}>
            <button
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;