package scenarios

import (
	"data-analyzer/agent/workflows"
	"data-analyzer/config"
	"data-analyzer/db"
	"data-analyzer/models"
	"encoding/json"
	"fmt"
)

type GetAllWorkflowsScenario struct {
	cfg       *config.Config
	db        *db.DB
	Workflows []models.Workflow
}

func NewGetAllWorkflowsScenario(cfg *config.Config, db *db.DB) *GetAllWorkflowsScenario {
	return &GetAllWorkflowsScenario{
		cfg:       cfg,
		db:        db,
		Workflows: []models.Workflow{},
	}
}

func (s *GetAllWorkflowsScenario) Execute() error {
	workflows, err := s.db.GetAllWorkflows()
	if err != nil {
		return err
	}

	s.Workflows = workflows
	return nil
}

// PrintWorkflows prints workflow details based on an n parameter
func (s *GetAllWorkflowsScenario) PrintWorkflows(n int) {
	if len(s.Workflows) < n {
		n = len(s.Workflows)
	}
	for i, workflow := range s.Workflows[:n] {
		fmt.Printf("%d. %s\n", i+1, workflow.WorkflowName)
		if workflow.WorkflowName == "extract_role_details" {
			var result []workflows.RoleDetails
			if err := json.Unmarshal([]byte(workflow.Output), &result); err != nil {
				fmt.Printf("   Failed to unmarshal result: %v\n", err)
			} else {
				for _, role := range result {
					fmt.Printf("   Job ID: %d\n", role.JobId)
					for _, responsibility := range role.Responsibilities {
						fmt.Printf("      %s\n", responsibility)
					}
					for _, requirement := range role.Requirements {
						fmt.Printf("      %s\n", requirement)
					}
				}
			}
		}
	}
	if len(s.Workflows) > n {
		fmt.Printf("   ... and %d more workflows\n", len(s.Workflows)-n)
	}
}
