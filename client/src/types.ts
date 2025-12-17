export interface Step {
    title: string;
    description: string;
    created_at: string;
}

// Research Data types
export const ResearchDataCategory = {
    RESPONSIBILITY: 1,
    REQUIREMENT: 2,
    COMPANY_RESEARCH: 3,
    ROLE_RESEARCH: 4,
} as const;

export type ResearchDataCategoryType = typeof ResearchDataCategory[keyof typeof ResearchDataCategory];

export interface ResearchData {
    id: number;
    category: ResearchDataCategoryType;
    info: string;
}

// Workflow types
export interface ExtractRoleDetailsWorkflow {
    workflow_name: 'extract_role_details';
    responsibilities: string[];
    requirements: string[];
}

// Union type for all workflow types - extend as new workflow types are added
export type Workflow = ExtractRoleDetailsWorkflow;

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
    workflows: Workflow[];
    research_data: ResearchData[];
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
