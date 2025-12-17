import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { WorkExperience as WorkExperienceType, WorkAchievement } from './types';
import { WorkExperienceSection } from './WorkExperienceSection';
import { AddWorkExperienceModal } from './AddWorkExperienceModal';
import './WorkExperience.css';

export const WorkExperience = () => {
    const [experiences, setExperiences] = useState<WorkExperienceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('/api/work-experiences/')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch work experiences');
                return res.json();
            })
            .then(data => {
                setExperiences(data.work_experiences);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleExperienceAdded = (newExperience: WorkExperienceType) => {
        setExperiences([newExperience, ...experiences]);
        setIsModalOpen(false);
    };

    const handleAchievementUpdate = (experienceId: number, updatedAchievement: WorkAchievement) => {
        setExperiences(prev =>
            prev.map(exp => {
                if (exp.id === experienceId) {
                    return {
                        ...exp,
                        work_achievements: exp.work_achievements.map(a =>
                            a.id === updatedAchievement.id ? updatedAchievement : a
                        )
                    };
                }
                return exp;
            })
        );
    };

    const handleAchievementAdd = (experienceId: number, newAchievement: WorkAchievement) => {
        setExperiences(prev =>
            prev.map(exp => {
                if (exp.id === experienceId) {
                    return {
                        ...exp,
                        work_achievements: [...exp.work_achievements, newAchievement]
                    };
                }
                return exp;
            })
        );
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="work-experience-container">
            <div className="container">
                <div className="header-row">
                    <h1>Work Experience</h1>
                    <button className="add-experience-btn" onClick={() => setIsModalOpen(true)}>
                        + Add Experience
                    </button>
                </div>

                <div className="nav-links">
                    <Link to="/" className="nav-link">Job Applications</Link>
                    <Link to="/job-boards" className="nav-link">Job Boards</Link>
                    <Link to="/work-experience" className="nav-link active">Work Experience</Link>
                </div>

                {experiences.length > 0 ? (
                    experiences.map(experience => (
                        <WorkExperienceSection
                            key={experience.id}
                            experience={experience}
                            onAchievementUpdate={handleAchievementUpdate}
                            onAchievementAdd={handleAchievementAdd}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <h3>No work experience yet</h3>
                        <p>Click the button above to add your first work experience</p>
                    </div>
                )}
            </div>

            <AddWorkExperienceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onExperienceAdded={handleExperienceAdded}
            />
        </div>
    );
};
