import { useState, useMemo } from 'react';
import { Job } from '../../types';
import './GenerateInsightModal.css';
import { getCookie } from '../../utils/csrf';

interface GenerateInsightModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobs: Job[];
    onSuccess?: () => void;
}

export const GenerateInsightModal = ({ isOpen, onClose, jobs, onSuccess }: GenerateInsightModalProps) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Filter jobs that don't have extract_role_details workflow AND have status "Preparing Application"
    const eligibleJobs = useMemo(() => {
        return jobs.filter(job => {
            const hasExtractRoleDetails = job.workflows?.some(
                w => w.workflow_name === 'extract_role_details'
            );
            return !hasExtractRoleDetails && job.status === 'Preparing Application';
        });
    }, [jobs]);

    const handleClose = () => {
        setSelectedIds(new Set());
        setSuccessMessage(null);
        setErrorMessage(null);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    const handleToggleSelection = (jobId: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedIds(new Set(eligibleJobs.map(j => j.id)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleGenerateInsight = async () => {
        if (selectedIds.size === 0) return;

        setIsLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const response = await fetch('/job_application/generate_insight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') || '',
                },
                body: JSON.stringify({
                    job_application_ids: Array.from(selectedIds)
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'Insights generated successfully!');
                setSelectedIds(new Set());
                onSuccess?.();
            } else {
                setErrorMessage(data.error || 'Failed to generate insights');
            }
        } catch (error) {
            setErrorMessage('Network error: Failed to connect to the server');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusClass = (status: string) => {
        return `status-${status.toLowerCase().replace(' ', '-')}`;
    };

    return (
        <div className="modal generate-insight-modal" style={{ display: 'block' }} onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={handleClose}>&times;</span>
                <h3>Generate Insights</h3>

                {successMessage && (
                    <div className="success-message">{successMessage}</div>
                )}

                {errorMessage && (
                    <div className="error-message">{errorMessage}</div>
                )}

                {eligibleJobs.length === 0 ? (
                    <div className="no-jobs-message">
                        All job applications already have insights generated.
                    </div>
                ) : (
                    <>
                        <div className="generate-insight-actions">
                            <button className="select-all-btn" onClick={handleSelectAll}>
                                Select All
                            </button>
                            <button className="deselect-all-btn" onClick={handleDeselectAll}>
                                Deselect All
                            </button>
                        </div>

                        <div className="job-list-container">
                            <table className="job-list-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Job Title</th>
                                        <th>Company</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eligibleJobs.map(job => (
                                        <tr
                                            key={job.id}
                                            className={selectedIds.has(job.id) ? 'selected' : ''}
                                            onClick={() => handleToggleSelection(job.id)}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(job.id)}
                                                    onChange={() => handleToggleSelection(job.id)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </td>
                                            <td>{job.job_title}</td>
                                            <td>{job.company_name}</td>
                                            <td>
                                                <span className={`job-status-badge ${getStatusClass(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="generate-insight-footer">
                            <span className="selection-count">
                                {selectedIds.size} of {eligibleJobs.length} selected
                            </span>
                            <button
                                className="generate-btn"
                                onClick={handleGenerateInsight}
                                disabled={selectedIds.size === 0 || isLoading}
                            >
                                {isLoading ? 'Generating...' : 'Generate Insight'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
