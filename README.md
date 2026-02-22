# Automated Job Tracker

A powerful web application to track, manage, and automate your job search process. Scrape jobs from multiple platforms, calculate match scores based on your CV, and manage all your applications in one place.

## Features

- **Dashboard**: Overview of your job search statistics and recent activities
- **Job Scraper**: Scrape jobs from LinkedIn, Indeed, Glassdoor, and Naukri
- **CV Management**: Upload and manage your CV/resume with automatic parsing
- **Job List**: Browse scraped jobs with match scores
- **Applications**: Track all your job applications with status updates
- **Settings**: Customize your preferences

## Tech Stack

### Frontend
- React.js
- CSS3

### Backend
- Python
- Flask

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.py
python app.py
```

## Project Structure

```
automated-job-tracker/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── JobList.js
│   │   │   ├── JobScraper.js
│   │   │   ├── Applications.js
│   │   │   ├── CVUploader.js
│   │   │   ├── Settings.js
│   │   │   └── Navbar.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── backend/
│   ├── app.py
│   ├── scraper/
│   └── requirements.py
└── README.md
```

## Usage

1. **Upload your CV**: Go to CV section and paste your resume text
2. **Scrape Jobs**: Use the Job Scraper to find jobs from different platforms
3. **View Matches**: Check the Job List to see match scores for each position
4. **Track Applications**: Apply to jobs and track their status in Applications

## License

MIT