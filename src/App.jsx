import { useState, useEffect } from 'react'
import { 
  Search, Briefcase, MapPin, DollarSign, Globe, Building2, 
  Clock, CheckCircle, XCircle, Star, Filter, RefreshCw,
  TrendingUp, AlertCircle, Send, Eye, Trash2, Edit3,
  Plus, ChevronDown, ChevronUp, Zap, Target, FileText,
  Linkedin, Github, ExternalLink, Loader2, Upload
} from 'lucide-react'

// Sample job data for initial display
const SAMPLE_JOBS = [
  {
    id: 1,
    title: "Senior React Developer",
    company: "TechCorp",
    location: "Remote",
    salary: "$120k - $150k",
    type: "Full-time",
    remote: true,
    posted: "2 hours ago",
    description: "We are looking for an experienced React developer to join our team...",
    requirements: ["5+ years React", "TypeScript", "Node.js", "AWS"],
    applied: false,
    source: "LinkedIn"
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "San Francisco, CA",
    salary: "$130k - $160k",
    type: "Full-time",
    remote: false,
    posted: "5 hours ago",
    description: "Join our fast-growing startup as a Full Stack Engineer...",
    requirements: ["React", "Node.js", "PostgreSQL", "Docker"],
    applied: false,
    source: "Indeed"
  },
  {
    id: 3,
    title: "Python Backend Developer",
    company: "DataTech Inc",
    location: "Remote",
    salary: "$100k - $130k",
    type: "Full-time",
    remote: true,
    posted: "1 day ago",
    description: "Build scalable backend services with Python...",
    requirements: ["Python", "Django", "Redis", "Kubernetes"],
    applied: false,
    source: "Glassdoor"
  },
  {
    id: 4,
    title: "DevOps Engineer",
    company: "CloudFirst",
    location: "Austin, TX",
    salary: "$115k - $145k",
    type: "Full-time",
    remote: true,
    posted: "3 hours ago",
    description: "Manage cloud infrastructure and CI/CD pipelines...",
    requirements: ["AWS", "Terraform", "Jenkins", "Linux"],
    applied: false,
    source: "LinkedIn"
  },
  {
    id: 5,
    title: "Frontend Developer",
    company: "WebAgency",
    location: "New York, NY",
    salary: "$80k - $100k",
    type: "Contract",
    remote: false,
    posted: "6 hours ago",
    description: "Create beautiful web experiences for clients...",
    requirements: ["React", "CSS", "JavaScript", "Figma"],
    applied: false,
    source: "Indeed"
  },
  {
    id: 6,
    title: "Machine Learning Engineer",
    company: "AI Labs",
    location: "Seattle, WA",
    salary: "$150k - $200k",
    type: "Full-time",
    remote: true,
    posted: "12 hours ago",
    description: "Work on cutting-edge ML models and AI systems...",
    requirements: ["Python", "TensorFlow", "PyTorch", "ML"],
    applied: false,
    source: "Glassdoor"
  },
  {
    id: 7,
    title: "JavaScript Developer",
    company: "Digital Agency",
    location: "Remote",
    salary: "$70k - $90k",
    type: "Part-time",
    remote: true,
    posted: "1 day ago",
    description: "Build interactive web applications...",
    requirements: ["JavaScript", "React", "Vue.js"],
    applied: false,
    source: "LinkedIn"
  },
  {
    id: 8,
    title: "Data Analyst",
    company: "Analytics Co",
    location: "Chicago, IL",
    salary: "$65k - $85k",
    type: "Full-time",
    remote: false,
    posted: "2 days ago",
    description: "Analyze data and create reports...",
    requirements: ["SQL", "Python", "Tableau", "Excel"],
    applied: false,
    source: "Indeed"
  }
]

const STATUS_COLORS = {
  "Applied": "bg-blue-500",
  "Interview": "bg-yellow-500",
  "Offer": "bg-green-500",
  "Rejected": "bg-red-500",
  "Pending": "bg-gray-500"
}

// API base URL
const API_URL = '/api'

function App() {
  const [jobs, setJobs] = useState(SAMPLE_JOBS)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    remote: false,
    salaryMin: 0,
    jobType: "All"
  })
  const [activeTab, setActiveTab] = useState("search")
  const [applications, setApplications] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cvUploaded, setCvUploaded] = useState(false)

  // Fetch applications from API on mount
  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_URL}/applications`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
        
        // Mark jobs as applied if in applications
        const appliedIds = data.map(app => app.id)
        setJobs(jobs.map(job => ({
          ...job,
          applied: appliedIds.includes(job.id)
        })))
      }
    } catch (error) {
      console.log('Using local data mode')
    } finally {
      setIsLoading(false)
    }
  }

  // Stats
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === "Applied").length,
    interview: applications.filter(a => a.status === "Interview").length,
    offer: applications.filter(a => a.status === "Offer").length,
    rejected: applications.filter(a => a.status === "Rejected").length
  }

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRemote = !filters.remote || job.remote
    const matchesType = filters.jobType === "All" || job.type === filters.jobType
    return matchesSearch && matchesRemote && matchesType
  })

  // Apply to job
  const applyToJob = async (job) => {
    const applicationData = {
      ...job,
      status: "Applied",
      appliedDate: new Date().toISOString().split('T')[0],
      notes: ""
    }

    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })
      
      if (response.ok) {
        const newApp = await response.json()
        setApplications([...applications, newApp])
        setJobs(jobs.map(j => j.id === job.id ? { ...j, applied: true } : j))
      } else {
        // Fallback to local state
        setApplications([...applications, applicationData])
        setJobs(jobs.map(j => j.id === job.id ? { ...j, applied: true } : j))
      }
    } catch (error) {
      // Fallback to local state
      setApplications([...applications, applicationData])
      setJobs(jobs.map(j => j.id === job.id ? { ...j, applied: true } : j))
    }
  }

  // Update application status
  const updateStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status: newStatus })
      })
      
      if (response.ok) {
        const updated = await response.json()
        setApplications(applications.map(app => 
          app.id === jobId ? { ...app, status: newStatus } : app
        ))
      } else {
        setApplications(applications.map(app => 
          app.id === jobId ? { ...app, status: newStatus } : app
        ))
      }
    } catch (error) {
      setApplications(applications.map(app => 
        app.id === jobId ? { ...app, status: newStatus } : app
      ))
    }
  }

  // Delete application
  const deleteApplication = async (jobId) => {
    try {
      await fetch(`${API_URL}/applications?id=${jobId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      // Continue with local delete
    }
    
    setApplications(applications.filter(app => app.id !== jobId))
    setJobs(jobs.map(j => j.id === jobId ? { ...j, applied: false } : j))
  }

  // Simulate job search
  const searchJobs = () => {
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
    }, 1500)
  }

  // Upload CV (simulated)
  const handleUploadCV = () => {
    setCvUploaded(true)
    alert("CV uploaded successfully! Your profile is ready for auto-matching.")
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Zap size={32} className="logo-icon" />
            <span className="logo-text">JobBot <span className="logo-accent">Pro</span></span>
          </div>
          <nav className="nav">
            <button 
              className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab("search")}
            >
              <Search size={18} />
              <span>Search Jobs</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab("applications")}
            >
              <Briefcase size={18} />
              <span>Applications</span>
              {applications.length > 0 && (
                <span className="badge">{applications.length}</span>
              )}
            </button>
            <button 
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab("profile")}
            >
              <FileText size={18} />
              <span>Profile</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="search-section fade-in">
            {/* Hero */}
            <div className="hero">
              <h1>Find Your Dream Job <span className="gradient-text">Automatically</span></h1>
              <p>Search thousands of jobs, filter by your preferences, and track all your applications in one place.</p>
              
              {/* Search Bar */}
              <div className="search-bar">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search jobs by title, company, or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={20} />
                  Filters
                </button>
                <button className="search-btn" onClick={searchJobs} disabled={isSearching}>
                  {isSearching ? <Loader2 className="spin" size={20} /> : <Zap size={20} />}
                  {isSearching ? "Searching..." : "Auto Search"}
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="filters-panel slide-in">
                  <div className="filter-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.remote}
                        onChange={(e) => setFilters({...filters, remote: e.target.checked})}
                      />
                      <Globe size={18} />
                      Remote Only
                    </label>
                  </div>
                  <div className="filter-group">
                    <label>Job Type</label>
                    <select 
                      value={filters.jobType}
                      onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                      className="filter-select"
                    >
                      <option value="All">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <Target size={20} className="stat-icon" />
                <div>
                  <span className="stat-value">{filteredJobs.length}</span>
                  <span className="stat-label">Jobs Found</span>
                </div>
              </div>
              <div className="stat-item">
                <CheckCircle size={20} className="stat-icon success" />
                <div>
                  <span className="stat-value">{stats.applied}</span>
                  <span className="stat-label">Applied</span>
                </div>
              </div>
              <div className="stat-item">
                <Clock size={20} className="stat-icon warning" />
                <div>
                  <span className="stat-value">{stats.interview}</span>
                  <span className="stat-label">Interviews</span>
                </div>
              </div>
              <div className="stat-item">
                <TrendingUp size={20} className="stat-icon primary" />
                <div>
                  <span className="stat-value">{stats.offer}</span>
                  <span className="stat-label">Offers</span>
                </div>
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="jobs-grid">
              {filteredJobs.map((job, index) => (
                <div key={job.id} className="job-card fade-in" style={{animationDelay: `${index * 0.05}s`}}>
                  <div className="job-header">
                    <div className="job-title-row">
                      <h3>{job.title}</h3>
                      {job.remote && <span className="remote-badge">Remote</span>}
                    </div>
                    <div className="company-info">
                      <Building2 size={16} />
                      <span>{job.company}</span>
                    </div>
                  </div>
                  
                  <div className="job-details">
                    <div className="job-detail">
                      <MapPin size={14} />
                      <span>{job.location}</span>
                    </div>
                    <div className="job-detail">
                      <DollarSign size={14} />
                      <span>{job.salary}</span>
                    </div>
                    <div className="job-detail">
                      <Clock size={14} />
                      <span>{job.posted}</span>
                    </div>
                    <div className="job-detail">
                      <Briefcase size={14} />
                      <span>{job.type}</span>
                    </div>
                  </div>

                  <p className="job-description">{job.description}</p>

                  <div className="job-requirements">
                    {job.requirements.map((req, i) => (
                      <span key={i} className="req-tag">{req}</span>
                    ))}
                  </div>

                  <div className="job-source">
                    <span className="source-label">{job.source}</span>
                  </div>

                  <div className="job-actions">
                    {job.applied ? (
                      <button className="applied-btn" disabled>
                        <CheckCircle size={16} />
                        Applied
                      </button>
                    ) : (
                      <button className="apply-btn" onClick={() => applyToJob(job)}>
                        <Send size={16} />
                        Apply Now
                      </button>
                    )}
                    <button className="view-btn">
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="no-results">
                <AlertCircle size={48} />
                <h3>No jobs found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="applications-section fade-in">
            <div className="section-header">
              <h2>Your Applications</h2>
              <p>Track and manage all your job applications</p>
            </div>

            {/* Applications Stats */}
            <div className="app-stats">
              <div className="app-stat-card">
                <div className="app-stat-icon blue"><Briefcase size={24} /></div>
                <div className="app-stat-info">
                  <span className="app-stat-value">{stats.total}</span>
                  <span className="app-stat-label">Total Applications</span>
                </div>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-icon yellow"><Clock size={24} /></div>
                <div className="app-stat-info">
                  <span className="app-stat-value">{stats.interview}</span>
                  <span className="app-stat-label">Interviews</span>
                </div>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-icon green"><Star size={24} /></div>
                <div className="app-stat-info">
                  <span className="app-stat-value">{stats.offer}</span>
                  <span className="app-stat-label">Offers</span>
                </div>
              </div>
              <div className="app-stat-card">
                <div className="app-stat-icon red"><XCircle size={24} /></div>
                <div className="app-stat-info">
                  <span className="app-stat-value">{stats.rejected}</span>
                  <span className="app-stat-label">Rejected</span>
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="applications-list">
              {applications.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={64} />
                  <h3>No applications yet</h3>
                  <p>Start applying to jobs to see them here</p>
                  <button className="primary-btn" onClick={() => setActiveTab("search")}>
                    <Search size={18} />
                    Find Jobs
                  </button>
                </div>
              ) : (
                applications.map((app, index) => (
                  <div key={app.id} className="application-card slide-in" style={{animationDelay: `${index * 0.05}s`}}>
                    <div className="app-main">
                      <div className="app-info">
                        <h3>{app.title}</h3>
                        <div className="app-meta">
                          <span><Building2 size={14} /> {app.company}</span>
                          <span><MapPin size={14} /> {app.location}</span>
                          <span><DollarSign size={14} /> {app.salary}</span>
                        </div>
                      </div>
                      
                      <div className="app-status-section">
                        <select 
                          value={app.status}
                          onChange={(e) => updateStatus(app.id, e.target.value)}
                          className={`status-select ${app.status.toLowerCase()}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Applied">Applied</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <span className="applied-date">Applied: {app.appliedDate}</span>
                      </div>
                    </div>

                    <div className="app-actions">
                      <button className="icon-btn" title="Edit Notes">
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => deleteApplication(app.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="profile-section fade-in">
            <div className="section-header">
              <h2>Your Profile</h2>
              <p>Upload your CV for auto-matching jobs</p>
            </div>

            <div className="profile-content">
              <div className="cv-upload-card">
                <div className="cv-icon">
                  <FileText size={48} />
                </div>
                <h3>Upload Your CV</h3>
                <p>Upload your resume in PDF or TXT format for automatic job matching</p>
                
                {!cvUploaded ? (
                  <button className="upload-btn" onClick={handleUploadCV}>
                    <Upload size={20} />
                    Upload CV
                  </button>
                ) : (
                  <div className="upload-success">
                    <CheckCircle size={24} />
                    <span>CV Uploaded Successfully!</span>
                  </div>
                )}
              </div>

              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-header">
                    <Target size={20} />
                    <span>Match Score</span>
                  </div>
                  <div className="profile-stat-value">85%</div>
                  <p>Based on your skills and job preferences</p>
                </div>
                
                <div className="profile-stat">
                  <div className="profile-stat-header">
                    <Briefcase size={20} />
                    <span>Jobs Matched</span>
                  </div>
                  <div className="profile-stat-value">{filteredJobs.filter(j => j.remote).length}</div>
                  <p>Jobs matching your profile</p>
                </div>
                
                <div className="profile-stat">
                  <div className="profile-stat-header">
                    <Zap size={20} />
                    <span>Auto-Apply</span>
                  </div>
                  <div className="profile-stat-value">{stats.applied}</div>
                  <p>Applications sent automatically</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CSS Styles */}
      <style>{`
        .app {
          min-height: 100vh;
        }

        .header {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          color: var(--primary);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .logo-accent {
          color: var(--primary);
        }

        .nav {
          display: flex;
          gap: 0.5rem;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--gray-300);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .badge {
          background: var(--secondary);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        /* Search Section */
        .search-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hero {
          text-align: center;
          padding: 3rem 1rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .hero h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          color: var(--gray-400);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .search-bar {
          display: flex;
          gap: 0.75rem;
          max-width: 800px;
          margin: 0 auto;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          flex: 1;
          min-width: 300px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: var(--card-dark);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: var(--card-dark);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: var(--gray-300);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-toggle:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .search-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        }

        .search-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .filters-panel {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding: 1.5rem;
          background: var(--card-dark);
          border-radius: 12px;
          margin-top: 1rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--gray-300);
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        .filter-select {
          padding: 0.5rem 1rem;
          background: var(--gray-800);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        /* Stats Bar */
        .stats-bar {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--card-dark);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .stat-icon {
          color: var(--gray-400);
        }

        .stat-icon.success { color: var(--success); }
        .stat-icon.warning { color: var(--warning); }
        .stat-icon.primary { color: var(--primary); }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--gray-400);
        }

        /* Jobs Grid */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .job-card {
          background: var(--card-dark);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s;
        }

        .job-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }

        .job-header {
          margin-bottom: 1rem;
        }

        .job-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .job-title-row h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .remote-badge {
          background: var(--primary-light);
          color: var(--primary-dark);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .company-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-400);
          font-size: 0.9rem;
        }

        .job-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .job-detail {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--gray-400);
          font-size: 0.85rem;
        }

        .job-description {
          color: var(--gray-400);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .job-requirements {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .req-tag {
          background: rgba(99, 102, 241, 0.2);
          color: var(--secondary);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }

        .job-source {
          margin-bottom: 1rem;
        }

        .source-label {
          background: rgba(255,255,255,0.05);
          color: var(--gray-400);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .job-actions {
          display: flex;
          gap: 0.75rem;
        }

        .apply-btn, .applied-btn, .view-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border: none;
          color: white;
        }

        .apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .applied-btn {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid var(--success);
          color: var(--success);
          cursor: not-allowed;
        }

        .view-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--gray-300);
        }

        .view-btn:hover {
          border-color: var(--gray-400);
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 4rem;
          color: var(--gray-400);
        }

        .no-results h3 {
          margin: 1rem 0 0.5rem;
          color: var(--gray-200);
        }

        /* Applications Section */
        .applications-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .section-header p {
          color: var(--gray-400);
        }

        .app-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .app-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--card-dark);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .app-stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .app-stat-icon.blue { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .app-stat-icon.yellow { background: rgba(234, 179, 8, 0.2); color: #eab308; }
        .app-stat-icon.green { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .app-stat-icon.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .app-stat-value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .app-stat-label {
          font-size: 0.85rem;
          color: var(--gray-400);
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .application-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: var(--card-dark);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .app-main {
          display: flex;
          gap: 2rem;
          flex: 1;
          align-items: center;
          flex-wrap: wrap;
        }

        .app-info h3 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .app-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          color: var(--gray-400);
          font-size: 0.85rem;
        }

        .app-meta span {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .app-status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .status-select {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
        }

        .status-select.pending { background: rgba(107, 114, 128, 0.3); color: var(--gray-300); }
        .status-select.applied { background: rgba(59, 130, 246, 0.3); color: #3b82f6; }
        .status-select.interview { background: rgba(234, 179, 8, 0.3); color: #eab308; }
        .status-select.offer { background: rgba(34, 197, 94, 0.3); color: #22c55e; }
        .status-select.rejected { background: rgba(239, 68, 68, 0.3); color: #ef4444; }

        .applied-date {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .app-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          padding: 0.5rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--gray-400);
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .icon-btn.danger:hover {
          border-color: var(--danger);
          color: var(--danger);
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
          color: var(--gray-400);
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem;
          color: var(--gray-200);
        }

        .empty-state p {
          margin-bottom: 1.5rem;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          background: var(--primary-dark);
        }

        /* Profile Section */
        .profile-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .cv-upload-card {
          background: var(--card-dark);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .cv-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }

        .cv-upload-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .cv-upload-card p {
          color: var(--gray-400);
          margin-bottom: 1.5rem;
        }

        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 2rem;
          background: var(--primary);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }

        .upload-success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--success);
          font-weight: 500;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .profile-stat {
          background: var(--card-dark);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .profile-stat-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-400);
          margin-bottom: 0.5rem;
        }

        .profile-stat .profile-stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .profile-stat p {
          color: var(--gray-500);
          font-size: 0.9rem;
        }

        /* Animations */
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .hero h1 {
            font-size: 1.75rem;
          }

          .search-bar {
            flex-direction: column;
          }

          .search-input-wrapper {
            min-width: 100%;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .application-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .app-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .app-status-section {
            align-items: flex-start;
          }

          .app-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  )
}

export default App