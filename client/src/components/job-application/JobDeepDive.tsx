import { useState, useRef, useEffect } from 'react';
import type { ResearchData, ResearchDataCategoryType } from '../../types';
import { ResearchDataCategory } from '../../types';
import { getCookie } from '../../utils/csrf';

interface Props {
    jobId: number;
    researchData: ResearchData[];
    onResearchDataAdd: (researchData: ResearchData) => void;
    onResearchDataUpdate: (researchData: ResearchData) => void;
}

const CATEGORY_LABELS: Record<ResearchDataCategoryType, string> = {
    [ResearchDataCategory.RESPONSIBILITY]: 'Responsibilities',
    [ResearchDataCategory.REQUIREMENT]: 'Requirements',
    [ResearchDataCategory.COMPANY_RESEARCH]: 'Company Research',
    [ResearchDataCategory.ROLE_RESEARCH]: 'Role Research',
};

export const JobDeepDive = ({ jobId, researchData, onResearchDataAdd, onResearchDataUpdate }: Props) => {
    const [items, setItems] = useState<ResearchData[]>(researchData);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingCategory, setAddingCategory] = useState<ResearchDataCategoryType | null>(null);
    const [newInfo, setNewInfo] = useState('');
    const saveTimeoutRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});

    // Update local state when props change
    useEffect(() => {
        setItems(researchData);
    }, [researchData]);

    const handleItemChange = (id: number, newInfo: string) => {
        setItems(prev =>
            prev.map(item => item.id === id ? { ...item, info: newInfo } : item)
        );

        // Clear existing timeout
        if (saveTimeoutRef.current[id]) {
            clearTimeout(saveTimeoutRef.current[id]);
        }

        // Debounce: save after 1 second of no typing
        saveTimeoutRef.current[id] = setTimeout(() => {
            saveItem(id, newInfo);
        }, 1000);
    };

    const saveItem = async (id: number, info: string) => {
        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch(`/update_research_data/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify({ info })
            });

            const data = await response.json();
            if (data.success) {
                onResearchDataUpdate(data.research_data);
            } else {
                console.error('Failed to update research data:', data.error);
            }
        } catch (error) {
            console.error('Error updating research data:', error);
        }
    };

    const handleAddItem = async (category: ResearchDataCategoryType) => {
        if (!newInfo.trim()) return;

        const csrftoken = getCookie('csrftoken');

        try {
            const response = await fetch(`/add_research_data/${jobId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify({ category, info: newInfo })
            });

            const data = await response.json();
            if (data.success) {
                setItems(prev => [...prev, data.research_data]);
                onResearchDataAdd(data.research_data);
                setNewInfo('');
                setAddingCategory(null);
            } else {
                alert('Failed to add research data: ' + data.error);
            }
        } catch (error) {
            console.error('Error adding research data:', error);
            alert('An error occurred while adding research data');
        }
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        const timeouts = saveTimeoutRef.current;
        return () => {
            Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    const getItemsByCategory = (category: ResearchDataCategoryType) => {
        return items.filter(item => item.category === category);
    };

    const categories = [
        ResearchDataCategory.RESPONSIBILITY,
        ResearchDataCategory.REQUIREMENT,
        ResearchDataCategory.COMPANY_RESEARCH,
        ResearchDataCategory.ROLE_RESEARCH,
    ] as const;

    return (
        <div className="deep-dive-section">
            <div className="detail-label">Deep Dive</div>
            {categories.map(category => (
                <div key={category} className="deep-dive-category">
                    <div className="deep-dive-category-header">{CATEGORY_LABELS[category]}</div>

                    {getItemsByCategory(category).map(item => (
                        <div key={item.id} className="deep-dive-item">
                            <span className="deep-dive-bullet">•</span>
                            <input
                                type="text"
                                className={`deep-dive-input ${editingId === item.id ? 'saving' : ''}`}
                                value={item.info}
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                                onFocus={() => setEditingId(item.id)}
                                onBlur={() => setEditingId(null)}
                            />
                        </div>
                    ))}

                    {addingCategory === category ? (
                        <div className="deep-dive-item">
                            <span className="deep-dive-bullet">•</span>
                            <input
                                type="text"
                                className="deep-dive-input"
                                value={newInfo}
                                onChange={(e) => setNewInfo(e.target.value)}
                                placeholder={`Enter ${CATEGORY_LABELS[category].toLowerCase()}...`}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddItem(category);
                                    if (e.key === 'Escape') {
                                        setAddingCategory(null);
                                        setNewInfo('');
                                    }
                                }}
                                onBlur={() => {
                                    if (!newInfo.trim()) {
                                        setAddingCategory(null);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <button
                            className="add-deep-dive-btn"
                            onClick={() => {
                                setAddingCategory(category);
                                setNewInfo('');
                            }}
                        >
                            + Add {CATEGORY_LABELS[category]}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
