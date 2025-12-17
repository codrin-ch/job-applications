export interface WorkAchievement {
    id: number;
    description: string;
}

export interface WorkExperience {
    id: number;
    job_title: string;
    company_name: string;
    company_url: string;
    start_date: string;
    end_date: string;
    work_achievements: WorkAchievement[];
}
