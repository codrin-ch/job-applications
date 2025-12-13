import { useState } from 'react';

interface ReadMoreProps {
    text: string;
    maxLength?: number;
}

export const ReadMore = ({ text, maxLength = 100 }: ReadMoreProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text || text.length <= maxLength) return <span>{text}</span>;
    return (
        <span>
            {isExpanded ? text : text.slice(0, maxLength) + '...'}
            <span
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="read-more"
                style={{ marginLeft: '5px' }}
            >
                {isExpanded ? 'Read less' : 'Read more'}
            </span>
        </span>
    );
};
