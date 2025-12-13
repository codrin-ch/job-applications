import { useState, useEffect, useRef } from 'react';

interface StatusFilterProps {
    statusChoices: string[];
    filterStatus: string[];
    onFilterChange: (status: string[]) => void;
    onSortClick: () => void;
}

export const StatusFilter = ({
    statusChoices,
    filterStatus,
    onFilterChange,
    onSortClick,
}: StatusFilterProps) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterWrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };

        if (isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterOpen]);

    const handleCheckboxChange = (status: string, checked: boolean) => {
        if (checked) {
            onFilterChange([...filterStatus, status]);
        } else {
            onFilterChange(filterStatus.filter(s => s !== status));
        }
    };

    const handleReset = () => {
        onFilterChange(statusChoices);
        setIsFilterOpen(false);
    };

    return (
        <div className="status-header-wrapper">
            <span onClick={onSortClick} style={{ cursor: 'pointer' }}>Status</span>
            <div className="filter-wrapper" ref={filterWrapperRef}>
                <span className="filter-icon" onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}>🔽</span>
                {isFilterOpen && (
                    <div className="filter-dropdown show" onClick={(e) => e.stopPropagation()}>
                        <h4>Filter by Status</h4>
                        {statusChoices.map(status => (
                            <div className="filter-option" key={status}>
                                <input
                                    type="checkbox"
                                    id={`filter-${status}`}
                                    checked={filterStatus.includes(status)}
                                    onChange={(e) => handleCheckboxChange(status, e.target.checked)}
                                />
                                <label htmlFor={`filter-${status}`}>{status}</label>
                            </div>
                        ))}
                        <div className="filter-actions">
                            <button className="filter-btn filter-btn-reset" onClick={handleReset}>Reset</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
