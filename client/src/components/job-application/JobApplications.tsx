import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCookie } from '../../utils/csrf';
import './JobApplications.css';
import { Job, type JobsData, type JobApplicationsStats } from '../../types';
import { JobSummaryModal } from './JobSummaryModal';
import { JobDetailsModal } from './JobDetailsModal';
import { AddStepModal } from './AddStepModal';
import { AddJobModal } from './AddJobModal';
import { StatusFilter } from './StatusFilter';

const DEFAULT_JOB_APPLICATION_STATS: JobApplicationsStats = {
    today_jobs_count: 0,
    daily_goal: 5,
    goal_reached: false,
    status_summary: [],
    daily_stats: [],
}

interface SortConfig {
    key: 'job_title' | 'company_name' | 'created_at' | 'status';
    direction: 'asc' | 'desc';
}

export const JobApplications = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<JobApplicationsStats>(DEFAULT_JOB_APPLICATION_STATS);
    const [loading, setLoading] = useState(true);
    const [statusChoices, setStatusChoices] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [filterStatus, setFilterStatus] = useState<string[]>([]); // To be populated from status choices

    // Modals state
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null); // For job details modal

    const fetchJobs = () => {
        fetch('/api/jobs/')
            .then(res => res.json())
            .then((data: JobsData) => {
                // Convert JobData to Job class instances
                const jobInstances = data.jobs.map(jobData => new Job(jobData));
                setJobs(jobInstances);
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

    const handleSort = (key: SortConfig['key']) => {
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
                const aVal = a[sortConfig.key] || '';
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
                    setJobs(jobs.map(j => {
                        if (j.id === jobId) {
                            // Create new Job instance with updated status
                            return new Job({ ...j, status: newStatus });
                        }
                        return j;
                    }));
                } else {
                    alert("Failed to update status");
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
                    <Link to="/work-experience" className="nav-link">Work Experience</Link>
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
                                    <StatusFilter
                                        statusChoices={statusChoices}
                                        filterStatus={filterStatus}
                                        onFilterChange={setFilterStatus}
                                        onSortClick={() => handleSort('status')}
                                    />
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
            <AddJobModal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                onJobAdded={fetchJobs}
                statusChoices={statusChoices}
            />

            {/* Summary Modal */}
            <JobSummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                stats={stats}
            />

            <AddStepModal
                isOpen={isAddStepModalOpen}
                onClose={() => setIsAddStepModalOpen(false)}
                jobId={selectedJob?.id}
                onStepAdded={(step) => {
                    if (selectedJob) {
                        const updatedSteps = [...selectedJob.steps, step];
                        const updatedJob = new Job({ ...selectedJob, steps: updatedSteps });
                        setSelectedJob(updatedJob);
                        setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j));
                    }
                }}
            />

            {/* Job Details Modal */}
            <JobDetailsModal
                isOpen={!!selectedJob}
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                onJobUpdate={(updatedJob) => {
                    setSelectedJob(updatedJob);
                    setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
                }}
                onAddStep={() => setIsAddStepModalOpen(true)}
            />
        </div>
    );
};
