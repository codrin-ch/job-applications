import { useState, useRef, useEffect } from 'react';
import type { WorkExperience, WorkAchievement } from './types';
import { getCookie } from '../../utils/csrf';

interface Props {
    experience: WorkExperience;
    onAchievementUpdate: (experienceId: number, achievement: WorkAchievement) => void;
    onAchievementAdd: (experienceId: number, achievement: WorkAchievement) => void;
}

export const WorkExperienceSection = ({ experience, onAchievementUpdate, onAchievementAdd }: Props) => {
    const [achievements, setAchievements] = useState<WorkAchievement[]>(experience.work_achievements);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const saveTimeoutRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Calculate duration
    const calculateDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (years > 0 && remainingMonths > 0) {
            return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
        } else if (years > 0) {
            return `${years} yr${years > 1 ? 's' : ''}`;
        } else {
            return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
        }
    };

    const handleAchievementChange = (id: number, newDescription: string) => {
        setAchievements(prev =>
            prev.map(a => a.id === id ? { ...a, description: newDescription } : a)
        );

        // Clear existing timeout for this achievement
        if (saveTimeoutRef.current[id]) {
            clearTimeout(saveTimeoutRef.current[id]);
        }

        // Debounce: save after 1 second of no typing
        saveTimeoutRef.current[id] = setTimeout(() => {
            saveAchievement(id, newDescription);
        }, 1000);
    };

    const saveAchievement = async (id: number, description: string) => {
        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch(`/update_work_achievement/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify({ description })
            });

            const data = await response.json();
            if (data.success) {
                onAchievementUpdate(experience.id, data.work_achievement);
            } else {
                console.error('Failed to update achievement:', data.error);
            }
        } catch (error) {
            console.error('Error updating achievement:', error);
        }
    };

    const handleAddAchievement = async () => {
        if (!newDescription.trim()) return;

        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch(`/add_work_achievement/${experience.id}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify({ description: newDescription })
            });

            const data = await response.json();
            if (data.success) {
                setAchievements(prev => [...prev, data.work_achievement]);
                onAchievementAdd(experience.id, data.work_achievement);
                setNewDescription('');
                setIsAddingNew(false);
            } else {
                alert('Failed to add achievement: ' + data.error);
            }
        } catch (error) {
            console.error('Error adding achievement:', error);
            alert('An error occurred while adding the achievement');
        }
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        const timeouts = saveTimeoutRef.current;
        return () => {
            Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    return (
        <div className="experience-section">
            <div className="experience-header">
                <h3>{experience.job_title}</h3>
                <div className="experience-company">
                    <span>{experience.company_name}</span>
                    <span>·</span>
                    <a href={experience.company_url} target="_blank" rel="noopener noreferrer">
                        Website
                    </a>
                </div>
                <div className="experience-dates">
                    {formatDate(experience.start_date)} - {formatDate(experience.end_date)} · {calculateDuration(experience.start_date, experience.end_date)}
                </div>
            </div>

            <div className="achievements-section">
                <h4>Achievements</h4>
                {achievements.map(achievement => (
                    <div key={achievement.id} className="achievement-item">
                        <span className="achievement-bullet">•</span>
                        <input
                            type="text"
                            className={`achievement-input ${editingId === achievement.id ? 'saving' : ''}`}
                            value={achievement.description}
                            onChange={(e) => handleAchievementChange(achievement.id, e.target.value)}
                            onFocus={() => setEditingId(achievement.id)}
                            onBlur={() => setEditingId(null)}
                        />
                    </div>
                ))}

                {isAddingNew ? (
                    <div className="achievement-item">
                        <span className="achievement-bullet">•</span>
                        <input
                            type="text"
                            className="achievement-input"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Enter achievement description..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddAchievement();
                                if (e.key === 'Escape') {
                                    setIsAddingNew(false);
                                    setNewDescription('');
                                }
                            }}
                            onBlur={() => {
                                if (!newDescription.trim()) {
                                    setIsAddingNew(false);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <button className="add-achievement-btn" onClick={() => setIsAddingNew(true)}>
                        + Add Achievement
                    </button>
                )}
            </div>
        </div>
    );
};
