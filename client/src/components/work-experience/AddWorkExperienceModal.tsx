import { useState } from 'react';
import type { WorkExperience } from './types';
import { getCookie } from '../../utils/csrf';

interface AddWorkExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExperienceAdded: (experience: WorkExperience) => void;
}

const DEFAULT_NEW_EXPERIENCE = {
    job_title: '',
    company_name: '',
    company_url: '',
    start_date: '',
    end_date: ''
};

export const AddWorkExperienceModal = ({ isOpen, onClose, onExperienceAdded }: AddWorkExperienceModalProps) => {
    const [newExperience, setNewExperience] = useState(DEFAULT_NEW_EXPERIENCE);

    if (!isOpen) return null;

    const handleAddExperience = async () => {
        if (!newExperience.job_title || !newExperience.company_name || !newExperience.company_url ||
            !newExperience.start_date || !newExperience.end_date) {
            alert('Please fill in all fields.');
            return;
        }

        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch('/add_work_experience/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify(newExperience)
            });

            const data = await response.json();
            if (data.success) {
                onExperienceAdded(data.work_experience);
                onClose();
                setNewExperience(DEFAULT_NEW_EXPERIENCE);
            } else {
                alert('Failed to add experience: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the experience');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h3>Add New Work Experience</h3>
                <div>
                    <label>Job Title:</label>
                    <input
                        type="text"
                        placeholder="e.g., Software Engineer"
                        value={newExperience.job_title}
                        onChange={(e) => setNewExperience({ ...newExperience, job_title: e.target.value })}
                    />
                </div>
                <div>
                    <label>Company Name:</label>
                    <input
                        type="text"
                        placeholder="e.g., Acme Corp"
                        value={newExperience.company_name}
                        onChange={(e) => setNewExperience({ ...newExperience, company_name: e.target.value })}
                    />
                </div>
                <div>
                    <label>Company URL:</label>
                    <input
                        type="url"
                        placeholder="https://company.com"
                        value={newExperience.company_url}
                        onChange={(e) => setNewExperience({ ...newExperience, company_url: e.target.value })}
                    />
                </div>
                <div>
                    <label>Start Date:</label>
                    <input
                        type="date"
                        value={newExperience.start_date}
                        onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                    />
                </div>
                <div>
                    <label>End Date:</label>
                    <input
                        type="date"
                        value={newExperience.end_date}
                        onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                    />
                </div>
                <button className="save-btn" onClick={handleAddExperience}>Save Experience</button>
            </div>
        </div>
    );
};
