import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCookie } from '../utils/csrf';
import './JobBoards.css';

interface JobBoard {
    id: number;
    name: string;
    url: string;
    last_visited: string | null;
    visited_today: boolean;
}

export const JobBoards = () => {
    const [boards, setBoards] = useState<JobBoard[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardUrl, setNewBoardUrl] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof JobBoard; direction: 'asc' | 'desc' } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/job-boards/')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch job boards');
                return res.json();
            })
            .then(data => {
                setBoards(data.job_boards);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const stats = useMemo(() => {
        const total = boards.length;
        const visited = boards.filter(b => b.visited_today).length;
        const allVisited = total > 0 && visited === total;
        return { total, visited, allVisited };
    }, [boards]);

    const handleUpdateVisited = (id: number) => {
        const csrftoken = getCookie('csrftoken');

        fetch(`/update_last_visited/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setBoards(boards.map(board =>
                        board.id === id
                            ? { ...board, last_visited: data.last_visited, visited_today: true }
                            : board
                    ));
                } else {
                    console.error('Failed to update last visited:', data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    const handleLinkClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        handleUpdateVisited(id);
    };

    const handleAddBoard = () => {
        if (!newBoardName || !newBoardUrl) {
            alert("Please fill in all fields.");
            return;
        }


        const csrftoken = getCookie('csrftoken');

        fetch('/add_job_board/', { // Proxy handles /add_job_board
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify({
                name: newBoardName,
                url: newBoardUrl
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const newBoardData = data.job_board;

                    const newBoard: JobBoard = {
                        id: newBoardData.id,
                        name: newBoardData.name,
                        url: newBoardData.url,
                        last_visited: newBoardData.last_visited,
                        visited_today: newBoardData.visited_today
                    };

                    setBoards([...boards, newBoard]);
                    setNewBoardName('');
                    setNewBoardUrl('');
                    setIsModalOpen(false);
                } else {
                    alert('Failed to add job board: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while adding the job board');
            });
    };

    const handleSort = (key: keyof JobBoard) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBoards = useMemo(() => {
        if (!sortConfig) return boards;
        return [...boards].sort((a, b) => {
            const aVal = a[sortConfig.key] ?? '';
            const bVal = b[sortConfig.key] ?? '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [boards, sortConfig]);

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;


    return (
        <div className="job-boards-container">
            <div className="container">
                <div className="header-row">
                    <h1>Job Boards</h1>
                    <div className={`goal-indicator ${stats.allVisited ? 'goal-reached' : 'goal-not-reached'}`}>
                        <span className="goal-icon">{stats.allVisited ? '✓' : '✗'}</span>
                        <span>Daily Goal: {stats.visited}/{stats.total}{stats.allVisited ? ' ✨' : ''}</span>
                    </div>
                </div>

                <div className="nav-links">
                    <Link to="/" className="nav-link">Job Applications</Link>
                    <Link to="/job-boards" className="nav-link active">Job Boards</Link>
                </div>

                <button className="add-board-btn" onClick={() => setIsModalOpen(true)}>+ Add Job Board</button>

                <div className="table-wrapper">
                    <table id="jobBoardsTable">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')}>Name</th>
                                <th onClick={() => handleSort('url')}>Link</th>
                                <th onClick={() => handleSort('last_visited')}>Last Visited</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBoards.length > 0 ? (
                                sortedBoards.map(board => (
                                    <tr key={board.id}>
                                        <td>{board.name}</td>
                                        <td>
                                            <a href={board.url} target="_blank" rel="noopener noreferrer" onClick={(e) => handleLinkClick(board.id, e)}>
                                                {board.url.length > 50 ? `${board.url.substring(0, 50)}...` : board.url}
                                            </a>
                                        </td>
                                        <td>
                                            <div className="last-visited-cell">
                                                <span className="last-visited-time">
                                                    {board.last_visited || '-'}
                                                </span>
                                                {!board.visited_today && (
                                                    <button
                                                        className="update-visited-btn"
                                                        onClick={() => handleUpdateVisited(board.id)}
                                                        title="Mark as visited now"
                                                    >
                                                        ✓ Mark Visited
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="empty-state">
                                        <h3>No job boards yet</h3>
                                        <p>Click the button above to add your first job board</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        <h3>Add New Job Board</h3>
                        <div>
                            <label>Name:</label>
                            <input
                                type="text"
                                placeholder="e.g., Indeed"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>URL:</label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={newBoardUrl}
                                onChange={(e) => setNewBoardUrl(e.target.value)}
                            />
                        </div>
                        <button className="save-btn" onClick={handleAddBoard}>Save Job Board</button>
                    </div>
                </div>
            )}
        </div>
    );
};
