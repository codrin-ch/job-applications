package models

// CoverLetterInput represents the cover letter input for a job application
type CoverLetterInput struct {
	CandidateExperience []string `json:"candidate_experience"`
	CompanyResearch     []string `json:"company_research"`
	JobResponsibilities []string `json:"job_responsibilities"`
	JobRequirements     []string `json:"job_requirements"`
}
