import { useState } from 'react';
import { getCookie } from '../../utils/csrf';
import { DEFAULT_RESUME_VERSION, DEFAULT_SOURCE, DEFAULT_STATUS } from '../../constants';

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobAdded: () => void;
    statusChoices: string[];
}

const DEFAULT_NEW_JOB = {
    job_title: '',
    company_name: '',
    company_url: '',
    job_description: '',
    resume_version: '',
    salary: '',
    status: DEFAULT_STATUS,
    source: DEFAULT_SOURCE
};

export const AddJobModal = ({ isOpen, onClose, onJobAdded, statusChoices }: AddJobModalProps) => {
    const [newJob, setNewJob] = useState(DEFAULT_NEW_JOB);

    const handleClose = () => {
        setNewJob(DEFAULT_NEW_JOB);
        onClose();
    };

    if (!isOpen) return null;

    const handleAddJob = () => {
        const csrftoken = getCookie('csrftoken');
        fetch('/add_job/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify(newJob)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    onJobAdded();
                    onClose();
                    setNewJob(DEFAULT_NEW_JOB);
                } else {
                    alert("Failed to add job: " + data.error);
                }
            });
    };

    return (
        <div className="modal" style={{ display: 'block' }} onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={handleClose}>&times;</span>
                <h3>Add New Job Application</h3>
                {/* Form fields */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Job Title:</label>
                    <input type="text" value={newJob.job_title} onChange={e => setNewJob({ ...newJob, job_title: e.target.value })} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Company Name:</label>
                    <input type="text" value={newJob.company_name} onChange={e => setNewJob({ ...newJob, company_name: e.target.value })} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Company URL:</label>
                    <input type="url" value={newJob.company_url} onChange={e => setNewJob({ ...newJob, company_url: e.target.value })} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Job Description:</label>
                    <textarea value={newJob.job_description} onChange={e => setNewJob({ ...newJob, job_description: e.target.value })} rows={4}></textarea>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Resume Version (Optional):</label>
                    <input type="text" value={newJob.resume_version} onChange={e => setNewJob({ ...newJob, resume_version: e.target.value })} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Salary (Optional):</label>
                    <input type="text" value={newJob.salary} onChange={e => setNewJob({ ...newJob, salary: e.target.value })} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
                    <select value={newJob.status} onChange={e => {
                        const newStatus = e.target.value;
                        const updates: Partial<typeof newJob> = { status: newStatus };
                        // Auto-fill resume version when changing from Preparing Application to Applied
                        if (newJob.status === DEFAULT_STATUS && newStatus === 'Applied' && !newJob.resume_version) {
                            updates.resume_version = DEFAULT_RESUME_VERSION;
                        }
                        setNewJob({ ...newJob, ...updates });
                    }}>
                        {statusChoices.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Source:</label>
                    <select value={newJob.source} onChange={e => setNewJob({ ...newJob, source: e.target.value })}>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value={DEFAULT_SOURCE}>{DEFAULT_SOURCE}</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <button className="save-btn" onClick={handleAddJob} style={{ marginTop: '20px' }}>Save Job Application</button>
            </div>
        </div>
    );
};
