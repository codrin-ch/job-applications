import { useState } from 'react';
import { getCookie } from '../../utils/csrf';
import type { Step } from '../../types';

interface AddStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: number | undefined;
    onStepAdded: (step: Step) => void;
}

const DEFAULT_NEW_STEP = {
    title: '',
    description: ''
};

export const AddStepModal = ({ isOpen, onClose, jobId, onStepAdded }: AddStepModalProps) => {
    const [newStep, setNewStep] = useState(DEFAULT_NEW_STEP);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!jobId) return;
        if (!newStep.title || !newStep.description) {
            alert("Please fill in both title and description.");
            return;
        }

        const csrftoken = getCookie('csrftoken');
        fetch(`/add_step/${jobId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify(newStep)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    onStepAdded(data.step);
                    onClose();
                    setNewStep(DEFAULT_NEW_STEP);
                } else {
                    alert('Failed to add step: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while adding the step');
            });
    };

    return (
        <div className="modal" style={{ display: 'block', zIndex: 1010 }} onClick={onClose}>
            <div className="modal-content" style={{ width: '50%' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Add New Step</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
                    <input
                        type="text"
                        value={newStep.title}
                        onChange={e => setNewStep({ ...newStep, title: e.target.value })}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                    <textarea
                        value={newStep.description}
                        onChange={e => setNewStep({ ...newStep, description: e.target.value })}
                        style={{ width: '100%', height: '100px', padding: '8px', boxSizing: 'border-box' }}
                    ></textarea>
                </div>
                <button className="steps-btn" onClick={handleSubmit} style={{ marginTop: '15px' }}>Save</button>
            </div>
        </div>
    );
};
