import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getCookie } from '../utils/csrf';
import './JobApplications.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

interface Step {
    title: string;
    description: string;
    created_at: string;
}

interface Job {
    id: number;
    job_title: string;
    company_name: string;
    company_url: string;
    job_description: string;
    resume_version: string;
    salary: string;
    status: string;
    source: string;
    created_at: string;
    updated_at: string;
    steps: Step[];
}

const ReadMore = ({ text, maxLength = 100 }: { text: string, maxLength?: number }) => {
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

interface StatusSummary {
    label: string;
    count: number;
}

interface DailyStat {
    date: string;
    count: number;
}

interface JobsData {
    jobs: Job[];
    today_jobs_count: number;
    daily_goal: number;
    goal_reached: boolean;
    status_summary: StatusSummary[];
    daily_stats: DailyStat[];
    status_choices: string[];
}

interface JobApplicationsStats {
    today_jobs_count: number,
    daily_goal: number,
    goal_reached: boolean,
    status_summary: StatusSummary[],
    daily_stats: DailyStat[],
}

const DEFAULT_JOB_APPLICATION_STATS = {
    today_jobs_count: 0,
    daily_goal: 5,
    goal_reached: false,
    status_summary: [],
    daily_stats: [],
}

const DEFAULT_NEW_JOB = {
    job_title: '',
    company_name: '',
    company_url: '',
    job_description: '',
    resume_version: '',
    salary: '',
    status: 'Applied',
    source: 'Careers Website'
};

const DEFAULT_NEW_STEP = {
    title: '',
    description: ''
};

export const JobApplications = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<JobApplicationsStats>(DEFAULT_JOB_APPLICATION_STATS);
    const [loading, setLoading] = useState(true);
    const [statusChoices, setStatusChoices] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [filterStatus, setFilterStatus] = useState<string[]>([]); // To be populated from status choices
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Modals state
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null); // For job details modal

    // Salary edit state
    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [salaryValue, setSalaryValue] = useState('');

    useEffect(() => {
        if (selectedJob) {
            setSalaryValue(selectedJob.salary || '');
            setIsEditingSalary(false);
        }
    }, [selectedJob]);

    // Form states
    const [newJob, setNewJob] = useState(DEFAULT_NEW_JOB);

    const [newStep, setNewStep] = useState(DEFAULT_NEW_STEP);

    const fetchJobs = () => {
        fetch('/api/jobs/')
            .then(res => res.json())
            .then((data: JobsData) => {
                setJobs(data.jobs);
                setStats({
                    today_jobs_count: data.today_jobs_count,
                    daily_goal: data.daily_goal,
                    goal_reached: data.goal_reached,
                    status_summary: data.status_summary,
                    daily_stats: data.daily_stats
                });
                setStatusChoices(data.status_choices);
                // Initialize filter with all statuses except negative ones by default if needed, 
                // but for now let's just default to all or handle logic similar to html
                const defaultExcluded = ['Rejected', 'Ghosted', 'Avoid'];
                setFilterStatus(data.status_choices.filter(s => !defaultExcluded.includes(s)));
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching jobs:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredJobs = useMemo(() => {
        let result = jobs;

        // Filter
        if (filterStatus.length > 0) {
            result = result.filter(job => filterStatus.includes(job.status));
        }

        // Sort
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                // @ts-ignore
                const aVal = a[sortConfig.key] || '';
                // @ts-ignore
                const bVal = b[sortConfig.key] || '';

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [jobs, sortConfig, filterStatus]);

    const handleStatusUpdate = (jobId: number, newStatus: string) => {
        const csrftoken = getCookie('csrftoken');
        fetch(`/update_job_field/${jobId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify({ status: newStatus })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
                } else {
                    alert("Failed to update status");
                }
            });
    };

    const handleSalarySave = () => {
        if (!selectedJob) return;
        const csrftoken = getCookie('csrftoken');
        fetch(`/update_job_field/${selectedJob.id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify({ salary: salaryValue })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const updatedJob = { ...selectedJob, salary: salaryValue };
                    setSelectedJob(updatedJob);
                    setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));
                    setIsEditingSalary(false);
                } else {
                    alert("Failed to update salary");
                }
            });
    };

    const handleAddStep = () => {
        if (!selectedJob) return;
        if (!newStep.title || !newStep.description) {
            alert("Please fill in both title and description.");
            return;
        }

        const csrftoken = getCookie('csrftoken');
        fetch(`/add_step/${selectedJob.id}/`, {
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
                    // Update the selected job with the new step
                    const updatedSteps = [...selectedJob.steps, data.step];
                    const updatedJob = { ...selectedJob, steps: updatedSteps };
                    setSelectedJob(updatedJob);

                    // Update the main jobs list as well
                    setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));

                    setIsAddStepModalOpen(false);
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

    const handleAddJob = () => {
        const csrftoken = getCookie('csrftoken');
        fetch('/add_job/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify(newJob)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Ideally reload or add to list. Reloading gets fresh stats too.
                    fetchJobs();
                    setIsAddJobModalOpen(false);
                    setNewJob(DEFAULT_NEW_JOB);
                } else {
                    alert("Failed to add job: " + data.error);
                }
            });
    };

    const getStatusClass = (status: string) => {
        return `status-${status.toLowerCase().replace(' ', '-')}`;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="job-applications-container">
            <div className="container">
                <div className="header-row">
                    <h1>Job Applications</h1>
                    <div className={`goal-indicator ${stats.goal_reached ? 'goal-reached' : 'goal-not-reached'}`}>
                        <span className="goal-icon">{stats.goal_reached ? '✓' : '✗'}</span>
                        <span>Daily Goal: {stats.today_jobs_count}/{stats.daily_goal}{stats.goal_reached ? ' ✨' : ''}</span>
                    </div>
                </div>

                <div className="nav-links">
                    <Link to="/" className="nav-link active">Job Applications</Link>
                    <Link to="/job-boards" className="nav-link">Job Boards</Link>
                </div>

                <div className="button-row">
                    <button className="add-job-btn summary-btn" onClick={() => setIsSummaryModalOpen(true)}>Summary</button>
                    <button className="add-job-btn" onClick={() => setIsAddJobModalOpen(true)}>+ Add Job Application</button>
                </div>

                <div className="table-wrapper">
                    <table id="jobsTable">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('job_title')}>Job Title</th>
                                <th onClick={() => handleSort('company_name')}>Company</th>
                                <th>
                                    <div className="status-header-wrapper">
                                        <span onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</span>
                                        <div className="filter-wrapper">
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
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFilterStatus([...filterStatus, status]);
                                                                    } else {
                                                                        setFilterStatus(filterStatus.filter(s => s !== status));
                                                                    }
                                                                }}
                                                            />
                                                            <label htmlFor={`filter-${status}`}>{status}</label>
                                                        </div>
                                                    ))}
                                                    <div className="filter-actions">
                                                        <button className="filter-btn filter-btn-apply" onClick={() => setIsFilterOpen(false)}>Apply Filter</button>
                                                        <button className="filter-btn filter-btn-reset" onClick={() => setFilterStatus(statusChoices)}>Reset</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('created_at')}>Applied At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id} onClick={() => setSelectedJob(job)}>
                                    <td>{job.job_title}</td>
                                    <td>
                                        <a href={job.company_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{job.company_name}</a>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={job.status}
                                            onChange={(e) => handleStatusUpdate(job.id, e.target.value)}
                                            className={`status-select ${getStatusClass(job.status)}`}
                                        >
                                            {statusChoices.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{job.created_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Job Modal */}
            {isAddJobModalOpen && (
                <div className="modal" style={{ display: 'block' }} onClick={() => setIsAddJobModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="close" onClick={() => setIsAddJobModalOpen(false)}>&times;</span>
                        <h3>Add New Job Application</h3>
                        {/* Form fields */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Job Title:</label>
                            <input type="text" value={newJob.job_title} onChange={e => setNewJob({ ...newJob, job_title: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Company Name:</label>
                            <input type="text" value={newJob.company_name} onChange={e => setNewJob({ ...newJob, company_name: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Company URL:</label>
                            <input type="url" value={newJob.company_url} onChange={e => setNewJob({ ...newJob, company_url: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Job Description:</label>
                            <textarea value={newJob.job_description} onChange={e => setNewJob({ ...newJob, job_description: e.target.value })} rows={4}></textarea>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Resume Version:</label>
                            <input type="text" value={newJob.resume_version} onChange={e => setNewJob({ ...newJob, resume_version: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Salary (Optional):</label>
                            <input type="text" value={newJob.salary} onChange={e => setNewJob({ ...newJob, salary: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
                            <select value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value })}>
                                {statusChoices.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Source:</label>
                            <select value={newJob.source} onChange={e => setNewJob({ ...newJob, source: e.target.value })}>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Careers Website">Careers Website</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <button className="save-btn" onClick={handleAddJob} style={{ marginTop: '20px' }}>Save Job Application</button>
                    </div>
                </div>
            )}

            {/* Summary Modal */}
            {isSummaryModalOpen && (
                <div className="modal" style={{ display: 'block' }} onClick={() => setIsSummaryModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <span className="close" onClick={() => setIsSummaryModalOpen(false)}>&times;</span>
                        <h3>Applications Summary</h3>
                        <p className="summary-subtitle">Applications grouped by current status</p>

                        <div className="summary-chart-wrapper">
                            {/* <h4 className="summary-subtitle">Status Distribution</h4> REMOVED to match server */}
                            <div style={{ height: '320px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                                <Pie
                                    data={{
                                        labels: stats.status_summary.map(s => `${s.label} (${s.count})`),
                                        datasets: [{
                                            data: stats.status_summary.map(s => s.count),
                                            backgroundColor: stats.status_summary.map(s => {
                                                const colors: Record<string, string> = {
                                                    'Applied': '#6c757d',
                                                    'In Progress': '#2196F3',
                                                    'Negative': '#dc3545',
                                                    'Offer': '#28a745'
                                                };
                                                return colors[s.label] || '#95a5a6';
                                            }),
                                            borderWidth: 1,
                                            borderColor: '#fff'
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom'
                                            },
                                            title: {
                                                display: true,
                                                text: `Total Applications: ${stats.status_summary.reduce((acc, curr) => acc + curr.count, 0)}`,
                                                font: {
                                                    size: 16
                                                },
                                                padding: {
                                                    top: 10,
                                                    bottom: 20
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context: any) {
                                                        const value = context.parsed;
                                                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                                        const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                                                        // Extract original label from the combined string "Label (Count)"
                                                        // Actually, we can just use the label from the data point since we updated labels above
                                                        // But to be cleaner, let's just use what chart.js gives us or access the raw data if needed.
                                                        // The label in context is already "Label (Count)".
                                                        // Let's strip the count for the tooltip if we want "Label: Count (N%)"
                                                        const labelStr = context.label || '';
                                                        const cleanLabel = labelStr.split(' (')[0];
                                                        return `${cleanLabel}: ${value} (${percentage}%)`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="summary-chart-wrapper" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            {/* <h4 className="summary-subtitle">Daily Applications Growth</h4> REMOVED to match server */}
                            <div style={{ height: '250px' }}>
                                <Bar
                                    data={{
                                        labels: stats.daily_stats.map(s => s.date),
                                        datasets: [
                                            {
                                                label: 'Previous Total',
                                                data: stats.daily_stats.map((_, index, array) => {
                                                    // Calculate sum of all counts up to this index (exclusive)
                                                    let sum = 0;
                                                    for (let i = 0; i < index; i++) {
                                                        sum += array[i].count;
                                                    }
                                                    return sum;
                                                }),
                                                backgroundColor: '#cfd8dc',
                                                barPercentage: 0.6,
                                                stack: 'combined'
                                            },
                                            {
                                                label: 'New Applications',
                                                data: stats.daily_stats.map(s => s.count),
                                                backgroundColor: '#667eea',
                                                borderRadius: { topLeft: 4, topRight: 4 },
                                                barPercentage: 0.6,
                                                stack: 'combined'
                                            }
                                        ]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        scales: {
                                            y: {
                                                stacked: true,
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 1,
                                                    // precision: 0 // Not directly supported in Typescript types sometimes, but stepSize helps
                                                },
                                                grid: {
                                                    color: '#f0f0f0'
                                                }
                                            },
                                            x: {
                                                stacked: true,
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        },
                                        plugins: {
                                            legend: {
                                                display: true,
                                                position: 'bottom',
                                                labels: {
                                                    boxWidth: 12,
                                                    usePointStyle: true
                                                }
                                            },
                                            title: {
                                                display: true,
                                                text: 'Applications Growth',
                                                padding: {
                                                    bottom: 15
                                                },
                                                font: {
                                                    size: 14,
                                                    weight: 'bold'
                                                }
                                            },
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                                backgroundColor: '#2c3e50',
                                                padding: 10,
                                                callbacks: {
                                                    footer: function (tooltipItems: any[]) {
                                                        let total = 0;
                                                        tooltipItems.forEach(function (tooltipItem) {
                                                            total += tooltipItem.parsed.y;
                                                        });
                                                        return 'Total: ' + total;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Step Modal */}
            {isAddStepModalOpen && (
                <div className="modal" style={{ display: 'block', zIndex: 1010 }} onClick={() => setIsAddStepModalOpen(false)}>
                    <div className="modal-content" style={{ width: '50%' }} onClick={e => e.stopPropagation()}>
                        <span className="close" onClick={() => setIsAddStepModalOpen(false)}>&times;</span>
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
                        <button className="steps-btn" onClick={handleAddStep} style={{ marginTop: '15px' }}>Save</button>
                    </div>
                </div>
            )}

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="modal" style={{ display: 'block' }} onClick={() => setSelectedJob(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <span className="close" onClick={() => setSelectedJob(null)}>&times;</span>
                        <h3>{selectedJob.job_title} at {selectedJob.company_name}</h3>

                        <div className="details-grid">
                            <div className="detail-item">
                                <div className="detail-label">Job Title</div>
                                <div className="detail-value">{selectedJob.job_title}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Company</div>
                                <div className="detail-value">
                                    <a href={selectedJob.company_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{selectedJob.company_name}</a>
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Resume Version</div>
                                <div className="detail-value">{selectedJob.resume_version}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Salary</div>
                                <div className="detail-value editable-field">
                                    {isEditingSalary ? (
                                        <div className="edit-actions" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                className="salary-input"
                                                value={salaryValue}
                                                onChange={(e) => setSalaryValue(e.target.value)}
                                                autoFocus
                                            />
                                            <button className="edit-btn save-btn" onClick={handleSalarySave}>✓</button>
                                            <button className="edit-btn cancel-btn" onClick={() => { setIsEditingSalary(false); setSalaryValue(selectedJob.salary || ''); }}>✗</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{selectedJob.salary || '-'}</span>
                                            <span
                                                className="edit-icon"
                                                onClick={(e) => { e.stopPropagation(); setIsEditingSalary(true); }}
                                                title="Edit salary"
                                                style={{ marginLeft: '10px' }}
                                            >✏️</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Status</div>
                                <div className="detail-value">
                                    <span className={`status-badge ${getStatusClass(selectedJob.status)}`}>{selectedJob.status}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Source</div>
                                <div className="detail-value">
                                    <span className={`source-badge source-${selectedJob.source.toLowerCase().replace(' ', '-')}`}>{selectedJob.source}</span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Created At</div>
                                <div className="detail-value">{selectedJob.created_at}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Last Updated</div>
                                <div className="detail-value">{selectedJob.updated_at}</div>
                            </div>

                            <div className="detail-item full-width">
                                <div className="detail-label">Description</div>
                                <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                    <ReadMore text={selectedJob.job_description} maxLength={200} />
                                </div>
                            </div>

                            <div className="detail-item full-width">
                                <div className="detail-label">Steps History</div>
                                <div className="steps-actions" style={{ marginBottom: '10px' }}>
                                    <button className="steps-btn" onClick={() => setIsAddStepModalOpen(true)}>Add New Step</button>
                                </div>
                                {selectedJob.steps.length > 0 ? (
                                    <table className="steps-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Description</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedJob.steps.map((step, idx) => (
                                                <tr key={idx}>
                                                    <td>{step.title}</td>
                                                    <td><ReadMore text={step.description} maxLength={100} /></td>
                                                    <td>{step.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="no-steps-msg">No steps recorded for this application.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
