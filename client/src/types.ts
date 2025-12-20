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

export interface GenerateCoverLetterWorkflow {
    workflow_name: 'generate_cover_letter';
    cover_letter: string;
}

// Union type for all workflow types - extend as new workflow types are added
export type Workflow = ExtractRoleDetailsWorkflow | GenerateCoverLetterWorkflow;

// Job data interface (for raw API responses)
export interface JobData {
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
    cover_letter: string;
}

// Job class with methods
export class Job implements JobData {
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
    cover_letter: string;

    constructor(data: JobData) {
        this.id = data.id;
        this.job_title = data.job_title;
        this.company_name = data.company_name;
        this.company_url = data.company_url;
        this.job_description = data.job_description;
        this.resume_version = data.resume_version;
        this.salary = data.salary;
        this.status = data.status;
        this.source = data.source;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.steps = data.steps;
        this.workflows = data.workflows;
        this.research_data = data.research_data;
        this.cover_letter = data.cover_letter;
    }

    /**
     * Returns the cover letter for this job.
     * First checks if the cover_letter field is set.
     * If not, looks for it in the workflows (generate_cover_letter workflow).
     * Returns empty string if neither exists.
     */
    getCoverLetter(): string {
        // First priority: direct cover_letter field
        if (this.cover_letter) {
            return this.cover_letter;
        }

        // Second priority: workflow-based cover letter
        const coverLetterWorkflow = this.workflows?.find(
            w => w.workflow_name === 'generate_cover_letter'
        );

        if (coverLetterWorkflow && 'cover_letter' in coverLetterWorkflow) {
            return (coverLetterWorkflow as GenerateCoverLetterWorkflow).cover_letter;
        }

        return '';
    }

    getGenerateCoverLetter(): string {
        const coverLetterWorkflow = this.workflows?.find(
            w => w.workflow_name === 'generate_cover_letter'
        );

        if (coverLetterWorkflow && 'cover_letter' in coverLetterWorkflow) {
            return (coverLetterWorkflow as GenerateCoverLetterWorkflow).cover_letter;
        }

        return '';
    }
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
    jobs: JobData[];
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
