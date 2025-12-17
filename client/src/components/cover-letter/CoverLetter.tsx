import { useParams, Link, useLocation } from 'react-router-dom';
import type { Job } from '../../types';
import './CoverLetter.css';

export const CoverLetter = () => {
    const { job_id } = useParams<{ job_id: string }>();
    const location = useLocation();
    const job = location.state?.job as Job | undefined;

    return (
        <div className="container">
            <Link to="/" className="back-link">← Back to Job Applications</Link>
            <h2>Prepare Cover Letter</h2>
            {job ? (
                <div className="cover-letter-placeholder">
                    <h3>{job.job_title} at {job.company_name}</h3>
                    <p>Cover letter generation feature coming soon...</p>
                </div>
            ) : (
                <div className="cover-letter-placeholder">
                    <p>Preparing cover letter for job application #{job_id}</p>
                    <p>Cover letter generation feature coming soon...</p>
                </div>
            )}
        </div>
    );
};
