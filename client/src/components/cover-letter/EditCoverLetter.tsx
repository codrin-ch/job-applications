import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Job } from '../../types';
import { getCookie } from '../../utils/csrf';
import './CoverLetter.css';
import './EditCoverLetter.css';


export const EditCoverLetter: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Convert plain object back to Job instance (location.state serializes objects)
    const jobData = location.state?.job;
    const job = jobData ? new Job(jobData) : null;

    // Use the getCoverLetter method
    const initialCoverLetter = job?.getCoverLetter() || '';

    const [coverLetterText, setCoverLetterText] = useState(initialCoverLetter);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
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

    if (!job) {
        return (
            <div className="container">
                <div style={{ padding: '20px' }}>
                    <p>Error: Job data not found</p>
                    <button onClick={() => navigate('/')}>Back to Jobs</button>
                </div>
            </div>
        );
    }

    if (!initialCoverLetter) {
        return (
            <div className="container">
                <Link to="/" className="back-link">← Back to Job Applications</Link>
                <div className="cover-letter-content-wrapper">
                    <h3>Edit Cover Letter - {job.job_title} at {job.company_name}</h3>
                    <p className="no-items-msg">No cover letter available to edit. Please generate one first.</p>
                    <button
                        className="generate-btn mt-20"
                        onClick={() => navigate(`/${job.id}/cover-letter`, { state: { job } })}
                    >
                        Generate Cover Letter
                    </button>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`/update_job_field/${job.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || '',
                },
                body: JSON.stringify({ cover_letter: coverLetterText }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save cover letter: ${errorText}`);
            }

            setSaveSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    // Check if we have both generated and edited versions
    const generatedCoverLetter = job?.getGenerateCoverLetter() || '';
    const hasBothVersions = generatedCoverLetter && initialCoverLetter && generatedCoverLetter !== initialCoverLetter;

    return (
        <div className="container">
            <Link to="/" className="back-link">← Back to Job Applications</Link>
            <div className="cover-letter-content-wrapper">
                <h3>Edit Cover Letter - {job.job_title} at {job.company_name}</h3>

                {hasBothVersions ? (
                    // Split-screen view
                    <div className="split-screen-container">
                        <div className="split-screen-panel">
                            <div className="input-selection-section">
                                <h4>Generated Version (Read-Only)</h4>
                                <p className="section-description">Original AI-generated cover letter:</p>

                                <textarea
                                    className="cover-letter-textarea"
                                    value={generatedCoverLetter}
                                    readOnly
                                    rows={20}
                                />
                            </div>
                        </div>

                        <div className="split-screen-panel">
                            <div className="input-selection-section">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4 style={{ margin: 0 }}>Your Edited Version</h4>
                                    <button
                                        className="copy-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyCoverLetter(coverLetterText);
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
                                </div>
                                <p className="section-description">Edit your cover letter below:</p>

                                <textarea
                                    className="cover-letter-textarea"
                                    value={coverLetterText}
                                    onChange={(e) => setCoverLetterText(e.target.value)}
                                    rows={20}
                                />
                            </div>

                            <div className="generate-cover-letter-section edit-actions-group">
                                <button
                                    className="generate-btn"
                                    onClick={handleSave}
                                    disabled={isSaving || !coverLetterText.trim()}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    className="generate-btn cancel-btn"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>

                                {saveError && (
                                    <p className="error-text">{saveError}</p>
                                )}
                                {saveSuccess && (
                                    <p className="success-text">Cover letter saved successfully! Redirecting...</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Single version view (original layout)
                    <>
                        <div className="input-selection-section">
                            <h4>Cover Letter Content</h4>
                            <p className="section-description">Edit your cover letter below:</p>

                            <textarea
                                className="cover-letter-textarea"
                                value={coverLetterText}
                                onChange={(e) => setCoverLetterText(e.target.value)}
                                rows={20}
                            />
                        </div>

                        <div className="generate-cover-letter-section edit-actions-group">
                            <button
                                className="generate-btn"
                                onClick={handleSave}
                                disabled={isSaving || !coverLetterText.trim()}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                className="generate-btn cancel-btn"
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>

                            {saveError && (
                                <p className="error-text">{saveError}</p>
                            )}
                            {saveSuccess && (
                                <p className="success-text">Cover letter saved successfully! Redirecting...</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
