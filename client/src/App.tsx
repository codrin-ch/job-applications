import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { JobBoards } from './components/JobBoards';
import { JobApplications } from './components/job-application/JobApplications';
import { WorkExperience } from './components/work-experience/WorkExperience';
import { CoverLetter } from './components/cover-letter/CoverLetter';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<JobApplications />} />
          <Route path="/job-boards" element={<JobBoards />} />
          <Route path="/work-experience" element={<WorkExperience />} />
          <Route path="/:job_id/cover-letter" element={<CoverLetter />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

