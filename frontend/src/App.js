import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CVUploader from './components/CVUploader';
import JobScraper from './components/JobScraper';
import Applications from './components/Applications';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cvData, setCvData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCV();
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchCV = async () => {
    try {
      const response = await fetch(`${API_BASE}/cv`);
      const data = await response.json();
      if (data.name) {
        setCvData(data);
      }
    } catch (error) {
      console.log('No CV uploaded yet');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/jobs`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_BASE}/applications`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleScrape = async (query, location) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scrape/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location })
      });
      const data = await response.json();
      if (data.jobs) {
        setJobs(prev => [...prev, ...data.jobs]);
      }
      alert(data.message);
    } catch (error) {
      alert('Error scraping jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    try {
      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          url: job.url,
          status: 'applied'
        })
      });
      const data = await response.json();
      setApplications(prev => [...prev, data]);
      alert('Application submitted!');
    } catch (error) {
      alert('Error applying: ' + error.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            jobs={jobs} 
            applications={applications} 
            cvData={cvData}
          />
        );
      case 'jobs':
        return (
          <JobList 
            jobs={jobs} 
            cvData={cvData}
            onApply={handleApply}
          />
        );
      case 'cv':
        return (
          <CVUploader 
            cvData={cvData} 
            onCVUpload={fetchCV}
          />
        );
      case 'scrape':
        return (
          <JobScraper 
            onScrape={handleScrape}
            loading={loading}
          />
        );
      case 'applications':
        return (
          <Applications 
            applications={applications}
            onUpdateStatus={(id, status) => {
              fetchApplications();
            }}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard jobs={jobs} applications={applications} cvData={cvData} />;
    }
  };

  return (
    <div className="app">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;