import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { JobBoards } from './components/JobBoards';
import { JobApplications } from './components/job-application/JobApplications';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<JobApplications />} />
          <Route path="/job-boards" element={<JobBoards />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
