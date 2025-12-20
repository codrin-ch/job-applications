import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Job, type ResearchDataCategoryType, type ResearchData } from '../../types';
import { ResearchDataCategory } from '../../types';
import type { WorkExperience as WorkExperienceType, WorkAchievement } from '../work-experience/types';
import './CoverLetter.css';
import { getCookie } from '../../utils/csrf';

const CATEGORY_LABELS: Record<ResearchDataCategoryType, string> = {
    [ResearchDataCategory.RESPONSIBILITY]: 'Responsibilities',
    [ResearchDataCategory.REQUIREMENT]: 'Requirements',
    [ResearchDataCategory.COMPANY_RESEARCH]: 'Company Research',
    [ResearchDataCategory.ROLE_RESEARCH]: 'Role Research',
};

const CATEGORY_ORDER: ResearchDataCategoryType[] = [
    ResearchDataCategory.RESPONSIBILITY,
    ResearchDataCategory.REQUIREMENT,
    ResearchDataCategory.COMPANY_RESEARCH,
    ResearchDataCategory.ROLE_RESEARCH,
];

const INSIGHT_LABELS = {
    responsibilities: 'Responsibilities',
    requirements: 'Requirements',
} as const;

type InsightItem = { key: string; text: string; field: 'responsibilities' | 'requirements' };

export const CoverLetter = () => {
    const { job_id } = useParams<{ job_id: string }>();
    const location = useLocation();
    // Convert plain object back to Job instance (location.state serializes objects)
    const jobData = location.state?.job;
    const job = jobData ? new Job(jobData) : undefined;

    // Ordered research data per category (maintains user ordering)
    const [researchOrder, setResearchOrder] = useState<Record<ResearchDataCategoryType, number[]>>({
        [ResearchDataCategory.RESPONSIBILITY]: [],
        [ResearchDataCategory.REQUIREMENT]: [],
        [ResearchDataCategory.COMPANY_RESEARCH]: [],
        [ResearchDataCategory.ROLE_RESEARCH]: [],
    });

    // Ordered insight items per field
    const [insightOrder, setInsightOrder] = useState<Record<'responsibilities' | 'requirements', string[]>>({
        responsibilities: [],
        requirements: [],
    });

    // Selected items
    const [selectedResearchIds, setSelectedResearchIds] = useState<Set<number>>(new Set());
    const [selectedInsightKeys, setSelectedInsightKeys] = useState<Set<string>>(new Set());
    const [selectedAchievementIds, setSelectedAchievementIds] = useState<Set<number>>(new Set());

    // Collapsed state for sections
    const [collapsedCategories, setCollapsedCategories] = useState<Set<ResearchDataCategoryType>>(new Set());
    const [collapsedInsights, setCollapsedInsights] = useState<Set<'responsibilities' | 'requirements'>>(new Set());
    const [collapsedExperiences, setCollapsedExperiences] = useState<Set<number>>(new Set());

    // Work experience data
    const [workExperiences, setWorkExperiences] = useState<WorkExperienceType[]>([]);
    const [workExpOrder, setWorkExpOrder] = useState<Record<number, number[]>>({});  // experienceId -> achievementIds order
    const [loadingWorkExp, setLoadingWorkExp] = useState(true);

    // Cover letter generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationSuccess, setGenerationSuccess] = useState(false);

    // Initialize when job loads
    useEffect(() => {
        if (job) {
            // Initialize research order (but don't select any)
            const newResearchOrder: Record<ResearchDataCategoryType, number[]> = {
                [ResearchDataCategory.RESPONSIBILITY]: [],
                [ResearchDataCategory.REQUIREMENT]: [],
                [ResearchDataCategory.COMPANY_RESEARCH]: [],
                [ResearchDataCategory.ROLE_RESEARCH]: [],
            };

            if (job.research_data) {
                job.research_data.forEach(rd => {
                    newResearchOrder[rd.category].push(rd.id);
                });
            }
            setResearchOrder(newResearchOrder);

            // Initialize insight order (but don't select any)
            const newInsightOrder: Record<'responsibilities' | 'requirements', string[]> = {
                responsibilities: [],
                requirements: [],
            };

            const workflow = job.workflows?.find(w => w.workflow_name === 'extract_role_details');
            if (workflow && workflow.workflow_name === 'extract_role_details') {
                workflow.responsibilities?.forEach((_, idx) => {
                    newInsightOrder.responsibilities.push(`responsibilities-${idx}`);
                });
                workflow.requirements?.forEach((_, idx) => {
                    newInsightOrder.requirements.push(`requirements-${idx}`);
                });
            }
            setInsightOrder(newInsightOrder);
        }
    }, [job]);

    // Fetch work experiences
    useEffect(() => {
        fetch('/api/work-experiences/')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch work experiences');
                return res.json();
            })
            .then(data => {
                const experiences: WorkExperienceType[] = data.work_experiences || [];
                setWorkExperiences(experiences);

                // Initialize order for each experience (but don't select any)
                const newOrder: Record<number, number[]> = {};
                experiences.forEach(exp => {
                    newOrder[exp.id] = exp.work_achievements.map(a => a.id);
                });
                setWorkExpOrder(newOrder);
                setLoadingWorkExp(false);
            })
            .catch(() => {
                setLoadingWorkExp(false);
            });
    }, []);

    const toggleResearchId = (id: number) => {
        setSelectedResearchIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleInsightKey = (key: string) => {
        setSelectedInsightKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleCategoryCollapse = (category: ResearchDataCategoryType) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const toggleInsightCollapse = (field: 'responsibilities' | 'requirements') => {
        setCollapsedInsights(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }
            return next;
        });
    };

    const toggleExperienceCollapse = (expId: number) => {
        setCollapsedExperiences(prev => {
            const next = new Set(prev);
            if (next.has(expId)) {
                next.delete(expId);
            } else {
                next.add(expId);
            }
            return next;
        });
    };

    const toggleAchievementId = (id: number) => {
        setSelectedAchievementIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Move research item up/down within its category
    const moveResearchItem = (category: ResearchDataCategoryType, id: number, direction: 'up' | 'down') => {
        setResearchOrder(prev => {
            const order = [...prev[category]];
            const idx = order.indexOf(id);
            if (idx === -1) return prev;

            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= order.length) return prev;

            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            return { ...prev, [category]: order };
        });
    };

    // Move insight item up/down within its field
    const moveInsightItem = (field: 'responsibilities' | 'requirements', key: string, direction: 'up' | 'down') => {
        setInsightOrder(prev => {
            const order = [...prev[field]];
            const idx = order.indexOf(key);
            if (idx === -1) return prev;

            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= order.length) return prev;

            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            return { ...prev, [field]: order };
        });
    };

    // Move achievement within its experience
    const moveAchievementItem = (expId: number, achId: number, direction: 'up' | 'down') => {
        setWorkExpOrder(prev => {
            const order = [...(prev[expId] || [])];
            const idx = order.indexOf(achId);
            if (idx === -1) return prev;

            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= order.length) return prev;

            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            return { ...prev, [expId]: order };
        });
    };

    // Get sorted items: selected first (in order), then unselected
    const getSortedResearchItems = (category: ResearchDataCategoryType): ResearchData[] => {
        if (!job?.research_data) return [];
        const itemsMap = new Map(job.research_data.filter(rd => rd.category === category).map(rd => [rd.id, rd]));
        const order = researchOrder[category];

        const selected: ResearchData[] = [];
        const unselected: ResearchData[] = [];

        order.forEach(id => {
            const item = itemsMap.get(id);
            if (item) {
                if (selectedResearchIds.has(id)) {
                    selected.push(item);
                } else {
                    unselected.push(item);
                }
            }
        });

        return [...selected, ...unselected];
    };

    // Get sorted insight items
    const getSortedInsightItems = (field: 'responsibilities' | 'requirements'): InsightItem[] => {
        const workflow = job?.workflows?.find(w => w.workflow_name === 'extract_role_details');
        if (!workflow || workflow.workflow_name !== 'extract_role_details') return [];

        const items = workflow[field] || [];
        const order = insightOrder[field];

        const selected: InsightItem[] = [];
        const unselected: InsightItem[] = [];

        order.forEach(key => {
            const idx = parseInt(key.split('-')[1], 10);
            if (idx < items.length) {
                const item: InsightItem = { key, text: items[idx], field };
                if (selectedInsightKeys.has(key)) {
                    selected.push(item);
                } else {
                    unselected.push(item);
                }
            }
        });

        return [...selected, ...unselected];
    };

    // Get sorted achievements for an experience
    const getSortedAchievements = (experience: WorkExperienceType): WorkAchievement[] => {
        const achievementsMap = new Map(experience.work_achievements.map(a => [a.id, a]));
        const order = workExpOrder[experience.id] || [];

        const selected: WorkAchievement[] = [];
        const unselected: WorkAchievement[] = [];

        order.forEach(id => {
            const item = achievementsMap.get(id);
            if (item) {
                if (selectedAchievementIds.has(id)) {
                    selected.push(item);
                } else {
                    unselected.push(item);
                }
            }
        });

        return [...selected, ...unselected];
    };

    const getExtractedWorkflow = () => {
        if (!job?.workflows) return null;
        const workflow = job.workflows.find(w => w.workflow_name === 'extract_role_details');
        if (workflow && workflow.workflow_name === 'extract_role_details') {
            return workflow;
        }
        return null;
    };

    const generateCoverLetter = async () => {
        if (!job) return;

        setIsGenerating(true);
        setGenerationError(null);
        setGenerationSuccess(false);

        try {
            // Build candidate_experience from selected achievements
            const candidateExperience: string[] = [];
            workExperiences.forEach(exp => {
                const orderedAchievements = getSortedAchievements(exp);
                orderedAchievements.forEach(ach => {
                    if (selectedAchievementIds.has(ach.id)) {
                        candidateExperience.push(`${exp.job_title} at ${exp.company_name}: ${ach.description}`);
                    }
                });
            });

            // Build company_research from selected COMPANY_RESEARCH and ROLE_RESEARCH items
            const companyResearch: string[] = [];
            const companyItems = getSortedResearchItems(ResearchDataCategory.COMPANY_RESEARCH);
            const roleItems = getSortedResearchItems(ResearchDataCategory.ROLE_RESEARCH);
            [...companyItems, ...roleItems].forEach(item => {
                if (selectedResearchIds.has(item.id)) {
                    companyResearch.push(item.info);
                }
            });

            // Build job_responsibilities from selected RESPONSIBILITY items and insight responsibilities
            const jobResponsibilities: string[] = [];
            const responsibilityItems = getSortedResearchItems(ResearchDataCategory.RESPONSIBILITY);
            responsibilityItems.forEach(item => {
                if (selectedResearchIds.has(item.id)) {
                    jobResponsibilities.push(item.info);
                }
            });
            const insightResponsibilities = getSortedInsightItems('responsibilities');
            insightResponsibilities.forEach(item => {
                if (selectedInsightKeys.has(item.key)) {
                    jobResponsibilities.push(item.text);
                }
            });

            // Build job_requirements from selected REQUIREMENT items and insight requirements
            const jobRequirements: string[] = [];
            const requirementItems = getSortedResearchItems(ResearchDataCategory.REQUIREMENT);
            requirementItems.forEach(item => {
                if (selectedResearchIds.has(item.id)) {
                    jobRequirements.push(item.info);
                }
            });
            const insightRequirements = getSortedInsightItems('requirements');
            insightRequirements.forEach(item => {
                if (selectedInsightKeys.has(item.key)) {
                    jobRequirements.push(item.text);
                }
            });

            const requestBody = {
                job_application_ids: [job.id],
                cover_letter_inputs: [
                    {
                        candidate_experience: candidateExperience,
                        company_research: companyResearch,
                        job_responsibilities: jobResponsibilities,
                        job_requirements: jobRequirements,
                    }
                ]
            };

            const csrftoken = getCookie('csrftoken');
            const response = await fetch('/job_application/generate_cover_letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || '',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate cover letter: ${errorText}`);
            }

            setGenerationSuccess(true);
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const hasSelectedItems = () => {
        return selectedResearchIds.size > 0 || selectedInsightKeys.size > 0 || selectedAchievementIds.size > 0;
    };

    return (
        <div className="container">
            <Link to="/" className="back-link">← Back to Job Applications</Link>
            <h2>Prepare Cover Letter</h2>
            {job ? (
                <div className="cover-letter-content-wrapper">
                    <h3>{job.job_title} at {job.company_name}</h3>

                    {/* Deep Dive - Individual Items Selection */}
                    <div className="input-selection-section">
                        <h4>Deep Dive Research</h4>
                        <p className="section-description">Select and reorder research items to include:</p>

                        {CATEGORY_ORDER.map(category => {
                            const items = getSortedResearchItems(category);
                            if (items.length === 0) return null;
                            const isCollapsed = collapsedCategories.has(category);

                            return (
                                <div key={category} className="category-group">
                                    <div
                                        className="category-header collapsible"
                                        onClick={() => toggleCategoryCollapse(category)}
                                    >
                                        <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                                        {CATEGORY_LABELS[category]}
                                        <span className="item-count">({items.filter(i => selectedResearchIds.has(i.id)).length}/{items.length})</span>
                                    </div>
                                    {!isCollapsed && (
                                        <div className="checkbox-group">
                                            {items.map((item) => {
                                                const isSelected = selectedResearchIds.has(item.id);
                                                const selectedItems = items.filter(i => selectedResearchIds.has(i.id));
                                                const selectedIdx = selectedItems.findIndex(i => i.id === item.id);
                                                const canMoveUp = isSelected && selectedIdx > 0;
                                                const canMoveDown = isSelected && selectedIdx < selectedItems.length - 1;

                                                return (
                                                    <div key={item.id} className={`reorderable-item ${!isSelected ? 'unselected' : ''}`}>
                                                        <div className="reorder-buttons">
                                                            <button
                                                                className="reorder-btn"
                                                                onClick={() => moveResearchItem(category, item.id, 'up')}
                                                                disabled={!canMoveUp}
                                                                title="Move up"
                                                            >↑</button>
                                                            <button
                                                                className="reorder-btn"
                                                                onClick={() => moveResearchItem(category, item.id, 'down')}
                                                                disabled={!canMoveDown}
                                                                title="Move down"
                                                            >↓</button>
                                                        </div>
                                                        <label className="checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleResearchId(item.id)}
                                                            />
                                                            <span className="checkbox-label item-text">{item.info}</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(!job.research_data || job.research_data.length === 0) && (
                            <p className="no-items-msg">No research data available.</p>
                        )}
                    </div>

                    {/* Insights - Individual Items Selection */}
                    <div className="input-selection-section">
                        <h4>Extracted Insights</h4>
                        <p className="section-description">Select and reorder extracted insights to include:</p>

                        {(() => {
                            const workflow = getExtractedWorkflow();
                            if (!workflow) {
                                return <p className="no-items-msg">No insights available.</p>;
                            }

                            return (
                                <>
                                    {(['responsibilities', 'requirements'] as const).map(field => {
                                        const items = getSortedInsightItems(field);
                                        if (items.length === 0) return null;
                                        const isCollapsed = collapsedInsights.has(field);

                                        return (
                                            <div key={field} className="category-group">
                                                <div
                                                    className="category-header collapsible"
                                                    onClick={() => toggleInsightCollapse(field)}
                                                >
                                                    <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                                                    {INSIGHT_LABELS[field]}
                                                    <span className="item-count">({items.filter(i => selectedInsightKeys.has(i.key)).length}/{items.length})</span>
                                                </div>
                                                {!isCollapsed && (
                                                    <div className="checkbox-group">
                                                        {items.map((item) => {
                                                            const isSelected = selectedInsightKeys.has(item.key);
                                                            const selectedItems = items.filter(i => selectedInsightKeys.has(i.key));
                                                            const selectedIdx = selectedItems.findIndex(i => i.key === item.key);
                                                            const canMoveUp = isSelected && selectedIdx > 0;
                                                            const canMoveDown = isSelected && selectedIdx < selectedItems.length - 1;

                                                            return (
                                                                <div key={item.key} className={`reorderable-item ${!isSelected ? 'unselected' : ''}`}>
                                                                    <div className="reorder-buttons">
                                                                        <button
                                                                            className="reorder-btn"
                                                                            onClick={() => moveInsightItem(field, item.key, 'up')}
                                                                            disabled={!canMoveUp}
                                                                            title="Move up"
                                                                        >↑</button>
                                                                        <button
                                                                            className="reorder-btn"
                                                                            onClick={() => moveInsightItem(field, item.key, 'down')}
                                                                            disabled={!canMoveDown}
                                                                            title="Move down"
                                                                        >↓</button>
                                                                    </div>
                                                                    <label className="checkbox-item">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleInsightKey(item.key)}
                                                                        />
                                                                        <span className="checkbox-label item-text">{item.text}</span>
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </div>

                    {/* Work Experience - Individual Items Selection */}
                    <div className="input-selection-section">
                        <h4>Work Experience</h4>
                        <p className="section-description">Select and reorder achievements to include:</p>

                        {loadingWorkExp ? (
                            <p className="no-items-msg">Loading work experiences...</p>
                        ) : workExperiences.length === 0 ? (
                            <p className="no-items-msg">No work experience available.</p>
                        ) : (
                            workExperiences.map(experience => {
                                const achievements = getSortedAchievements(experience);
                                const isCollapsed = collapsedExperiences.has(experience.id);
                                const selectedCount = achievements.filter(a => selectedAchievementIds.has(a.id)).length;

                                return (
                                    <div key={experience.id} className="category-group">
                                        <div
                                            className="category-header collapsible"
                                            onClick={() => toggleExperienceCollapse(experience.id)}
                                        >
                                            <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                                            {experience.job_title} @ {experience.company_name}
                                            <span className="item-count">({selectedCount}/{achievements.length})</span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className="checkbox-group">
                                                {achievements.map((achievement) => {
                                                    const isSelected = selectedAchievementIds.has(achievement.id);
                                                    const selectedItems = achievements.filter(a => selectedAchievementIds.has(a.id));
                                                    const selectedIdx = selectedItems.findIndex(a => a.id === achievement.id);
                                                    const canMoveUp = isSelected && selectedIdx > 0;
                                                    const canMoveDown = isSelected && selectedIdx < selectedItems.length - 1;

                                                    return (
                                                        <div key={achievement.id} className={`reorderable-item ${!isSelected ? 'unselected' : ''}`}>
                                                            <div className="reorder-buttons">
                                                                <button
                                                                    className="reorder-btn"
                                                                    onClick={() => moveAchievementItem(experience.id, achievement.id, 'up')}
                                                                    disabled={!canMoveUp}
                                                                    title="Move up"
                                                                >↑</button>
                                                                <button
                                                                    className="reorder-btn"
                                                                    onClick={() => moveAchievementItem(experience.id, achievement.id, 'down')}
                                                                    disabled={!canMoveDown}
                                                                    title="Move down"
                                                                >↓</button>
                                                            </div>
                                                            <label className="checkbox-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleAchievementId(achievement.id)}
                                                                />
                                                                <span className="checkbox-label item-text">{achievement.description}</span>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Generate Button and Status */}
                    <div className="generate-cover-letter-section">
                        <button
                            className="generate-btn"
                            onClick={generateCoverLetter}
                            disabled={isGenerating || !hasSelectedItems()}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                        </button>
                        {!hasSelectedItems() && (
                            <p className="helper-text">Select at least one item to generate a cover letter.</p>
                        )}
                        {generationError && (
                            <p className="error-text">{generationError}</p>
                        )}
                        {generationSuccess && (
                            <p className="success-text">Cover letter generation request sent successfully!</p>
                        )}
                    </div>
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
