package scenarios

import (
	"data-analyzer/config"
	"data-analyzer/db"
	"data-analyzer/models"
	"fmt"
)

type GetAllJobApplicationsScenario struct {
	cfg             *config.Config
	db              *db.DB
	JobApplications []models.JobApplication
}

func NewGetAllJobApplicationsScenario(cfg *config.Config, db *db.DB) *GetAllJobApplicationsScenario {
	return &GetAllJobApplicationsScenario{
		cfg:             cfg,
		db:              db,
		JobApplications: []models.JobApplication{},
	}
}

func (s *GetAllJobApplicationsScenario) Execute() error {
	jobApplications, err := s.db.GetAllJobApplications()
	if err != nil {
		return err
	}

	s.JobApplications = jobApplications
	return nil
}

// Implement a public method to print all the job applications based on an n parameter
func (s *GetAllJobApplicationsScenario) PrintJobApplications(n int) {
	if len(s.JobApplications) < n {
		n = len(s.JobApplications)
	}
	for i, app := range s.JobApplications[:n] {
		// select only first 5000 chars of job description for display
		jobDescription := app.JobDescription
		if len(jobDescription) > 5000 {
			jobDescription = jobDescription[:5000] + "..."
		}
		fmt.Printf("%d. %s\n%s\n", i+1, app.JobTitle, jobDescription)
	}
	if len(s.JobApplications) > n {
		fmt.Printf("   ... and %d more applications\n", len(s.JobApplications)-n)
	}
}
