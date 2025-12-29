package scenarios

import (
	"context"
	"data-analyzer/agent"
	"data-analyzer/agent/workflows"
	"data-analyzer/db"
	"data-analyzer/models"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

type ExtractRoleDetailsScenario struct {
	geminiClient    *agent.Client
	db              *db.DB
	jobApplications []models.JobApplication
}

func NewExtractRoleDetailsScenario(geminiClient *agent.Client, db *db.DB, jobApplications []models.JobApplication) *ExtractRoleDetailsScenario {
	return &ExtractRoleDetailsScenario{
		geminiClient:    geminiClient,
		db:              db,
		jobApplications: jobApplications,
	}
}

func (s *ExtractRoleDetailsScenario) Execute(ctx context.Context) ([]workflows.RoleDetails, error) {
	extractJobResponsibilitiesWorkflow := workflows.NewExtractRoleDetailsWorkflow(s.geminiClient, s.jobApplications)

	if result, err := extractJobResponsibilitiesWorkflow.Execute(ctx); err != nil {
		log.Printf("Failed to execute extract job responsibilities workflow: %v", err)
	} else {
		fmt.Println("\nExtracted Job Responsibilities:")
		fmt.Println(strings.Repeat("-", 40))
		for _, role := range result.RoleDetails {
			fmt.Printf("Job ID: %d\n", role.JobId)
			fmt.Println(strings.Repeat("-", 40))
			fmt.Printf("Responsibilities: %s\n", role.Responsibilities)
			fmt.Printf("Requirements: %s\n", role.Requirements)
			fmt.Println(strings.Repeat("-", 40))
		}

		jobIDs := make([]int, len(s.jobApplications))
		for i, job := range s.jobApplications {
			jobIDs[i] = job.ID
		}
		parametersJSON, err := json.Marshal(map[string]interface{}{
			"job_ids": jobIDs,
			"fields":  []string{"job_description"},
		})
		if err != nil {
			log.Printf("Failed to marshal parameters: %v", err)
		}

		// store the result in database
		workflowRecord := models.Workflow{
			WorkflowName: "extract_role_details",
			Prompt:       result.Prompt,
			AgentModel:   s.geminiClient.ModelName,
			Output:       result.Result,
			Parameters:   string(parametersJSON),
		}

		workflowID, err := s.db.InsertWorkflow(workflowRecord)
		if err != nil {
			log.Printf("Failed to store workflow: %v", err)
		} else {
			fmt.Printf("📝 Workflow stored with ID: %d\n", workflowID)
		}
		err = s.db.InsertJobApplicationsWorkflow(jobIDs, workflowID)
		if err != nil {
			log.Printf("Failed to store job application workflow: %v", err)
		}
		for jobID := range jobIDs {
			err = s.db.AddStepToJobApplication(jobID, models.StepInput{
				Title:       "Extract Role Details",
				Description: fmt.Sprintf("Extracted role details successfully via workflow %d", workflowID),
			})
			if err != nil {
				log.Printf("Failed to store job application step: %v", err)
			}
		}

		return result.RoleDetails, nil
	}

	return nil, nil
}
