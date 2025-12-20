import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, type ResearchData } from '../../types';
import { ReadMore } from './ReadMore';
import { JobDeepDive } from './JobDeepDive';
import { getCookie } from '../../utils/csrf';
import '../cover-letter/CoverLetter.css';
import './JobDetailsModal.css';


interface JobDetailsModalProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onJobUpdate: (updatedJob: Job) => void;
    onAddStep: () => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, isOpen, onClose, onJobUpdate, onAddStep }) => {
    const navigate = useNavigate();
    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [salaryValue, setSalaryValue] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyCoverLetter = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (!isOpen || !job) return null;

    const handleSalarySave = () => {
        const csrftoken = getCookie('csrftoken');
        fetch(`/update_job_field/${job.id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify({ salary: salaryValue })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const updatedJob = new Job({ ...job, salary: salaryValue });
                    onJobUpdate(updatedJob);
                    setIsEditingSalary(false);
                } else {
                    alert("Failed to update salary");
                }
            });
    };

    const getStatusClass = (status: string) => {
        return `status-${status.toLowerCase().replace(' ', '-')}`;
    };

    return (
        <div className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>{job.job_title} at {job.company_name}</h3>

                <div className="details-grid">
                    <div className="detail-item">
                        <div className="detail-label">Job Title</div>
                        <div className="detail-value">{job.job_title}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Company</div>
                        <div className="detail-value">
                            <a href={job.company_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{job.company_name}</a>
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Resume Version</div>
                        <div className="detail-value">{job.resume_version}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Salary</div>
                        <div className="detail-value editable-field">
                            {isEditingSalary ? (
                                <div className="edit-actions" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        className="salary-input"
                                        value={salaryValue}
                                        onChange={(e) => setSalaryValue(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="edit-btn save-btn" onClick={handleSalarySave}>✓</button>
                                    <button className="edit-btn cancel-btn" onClick={() => { setIsEditingSalary(false); setSalaryValue(job.salary || ''); }}>✗</button>
                                </div>
                            ) : (
                                <>
                                    <span>{job.salary || '-'}</span>
                                    <span
                                        className="edit-icon"
                                        onClick={(e) => { e.stopPropagation(); setIsEditingSalary(true); }}
                                        title="Edit salary"
                                        style={{ marginLeft: '10px' }}
                                    >✏️</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Status</div>
                        <div className="detail-value">
                            <span className={`status-badge ${getStatusClass(job.status)}`}>{job.status}</span>
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Source</div>
                        <div className="detail-value">
                            <span className={`source-badge source-${job.source.toLowerCase().replace(' ', '-')}`}>{job.source}</span>
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Created At</div>
                        <div className="detail-value">{job.created_at}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Last Updated</div>
                        <div className="detail-value">{job.updated_at}</div>
                    </div>

                    <div className="detail-item full-width">
                        <div className="detail-label">Description</div>
                        <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                            <ReadMore text={job.job_description} maxLength={200} />
                        </div>
                    </div>

                    {/* Cover Letter Section */}
                    <div className="detail-item full-width">
                        <div className="detail-label detail-label-with-actions">
                            Cover Letter
                            {job.getCoverLetter() && (
                                <button
                                    className="copy-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const coverLetter = job.getCoverLetter();
                                        if (coverLetter) handleCopyCoverLetter(coverLetter);
                                    }}
                                    title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                                >
                                    {isCopied ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                        {job.getCoverLetter() ? (
                            <>
                                <div className="cover-letter-content" style={{ whiteSpace: 'pre-wrap' }}>
                                    <ReadMore text={job.getCoverLetter()} maxLength={200} />
                                </div>
                                <div className="cover-letter-actions" style={{ marginTop: '12px' }}>
                                    <button
                                        className="prepare-cover-letter-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                            navigate(`/${job.id}/edit-cover-letter`, { state: { job } });
                                        }}
                                    >
                                        Edit Cover Letter
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="cover-letter-actions">
                                <button
                                    className="prepare-cover-letter-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                        navigate(`/${job.id}/cover-letter`, { state: { job } });
                                    }}
                                >
                                    Prepare Cover Letter
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="detail-item full-width">
                        <div className="detail-label">Steps History</div>
                        <div className="steps-actions" style={{ marginBottom: '10px' }}>
                            <button className="steps-btn" onClick={onAddStep}>Add New Step</button>
                        </div>
                        {job.steps.length > 0 ? (
                            <table className="steps-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {job.steps.map((step, idx) => (
                                        <tr key={idx}>
                                            <td>{step.title}</td>
                                            <td><ReadMore text={step.description} maxLength={100} /></td>
                                            <td>{step.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-steps-msg">No steps recorded for this application.</p>
                        )}
                    </div>

                    {/* Deep Dive Section */}
                    <JobDeepDive
                        jobId={job.id}
                        researchData={job.research_data || []}
                        onResearchDataAdd={(rd: ResearchData) => {
                            const updatedJob = new Job({
                                ...job,
                                research_data: [...(job.research_data || []), rd]
                            });
                            onJobUpdate(updatedJob);
                        }}
                        onResearchDataUpdate={(rd: ResearchData) => {
                            const updatedJob = new Job({
                                ...job,
                                research_data: (job.research_data || []).map(item =>
                                    item.id === rd.id ? rd : item
                                )
                            });
                            onJobUpdate(updatedJob);
                        }}
                    />

                    {/* Insights Section */}
                    <div className="detail-item full-width">
                        <div className="detail-label">Insights</div>
                        {job.workflows && job.workflows.length > 0 ? (
                            job.workflows
                                .filter(w => w.workflow_name === 'extract_role_details')
                                .map((workflow, idx) => (
                                    <div key={idx} className="insights-section">
                                        {workflow.responsibilities && workflow.responsibilities.length > 0 && (
                                            <div className="insights-group">
                                                <div className="insights-subtitle">Responsibilities</div>
                                                <ul className="insights-list">
                                                    {workflow.responsibilities.map((item, i) => (
                                                        <li key={i} className="insights-list-item">{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {workflow.requirements && workflow.requirements.length > 0 && (
                                            <div className="insights-group">
                                                <div className="insights-subtitle">Requirements</div>
                                                <ul className="insights-list">
                                                    {workflow.requirements.map((item, i) => (
                                                        <li key={i} className="insights-list-item">{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))
                        ) : (
                            <p className="no-insights-msg">No insights available for this application.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
