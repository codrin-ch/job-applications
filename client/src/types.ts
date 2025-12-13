export interface Step {
    title: string;
    description: string;
    created_at: string;
}

export interface Job {
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

export interface StatusSummary {
    label: string;
    count: number;
}

export interface DailyStat {
    date: string;
    count: number;
}

export interface JobsData {
    jobs: Job[];
    today_jobs_count: number;
    daily_goal: number;
    goal_reached: boolean;
    status_summary: StatusSummary[];
    daily_stats: DailyStat[];
    status_choices: string[];
}

export interface JobApplicationsStats {
    today_jobs_count: number;
    daily_goal: number;
    goal_reached: boolean;
    status_summary: StatusSummary[];
    daily_stats: DailyStat[];
}
