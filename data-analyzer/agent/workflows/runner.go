package workflows

import (
	"context"
	"encoding/json"
	"fmt"

	"data-analyzer/agent"
	"data-analyzer/db"
	"data-analyzer/models"
)

// WorkflowRunner wraps workflow execution with database persistence
type WorkflowRunner struct {
	db     *db.DB
	client *agent.Client
}

// NewWorkflowRunner creates a new workflow runner with database connection
func NewWorkflowRunner(database *db.DB, client *agent.Client) *WorkflowRunner {
	return &WorkflowRunner{
		db:     database,
		client: client,
	}
}

// RedFlagsRunResult contains both the workflow result and the stored workflow ID
type RedFlagsRunResult struct {
	Result     RedFlagsDetectionResult
	WorkflowID int64
}

// RunRedFlagsDetection executes the red flags detection workflow and stores the result
func (r *WorkflowRunner) RunRedFlagsDetection(ctx context.Context, jobs []models.JobApplication) (RedFlagsRunResult, error) {
	// Prepare parameters - store job IDs and fields used
	jobIDs := make([]int, len(jobs))
	for i, job := range jobs {
		jobIDs[i] = job.ID
	}
	parametersJSON, err := json.Marshal(map[string]interface{}{
		"job_ids": jobIDs,
		"fields":  []string{"job_description"},
	})
	if err != nil {
		return RedFlagsRunResult{}, fmt.Errorf("failed to marshal parameters: %w", err)
	}

	// Execute the workflow
	workflow := NewRedFlagsDetectionWorkflow(r.client, jobs)
	prompt := workflow.PROMT()
	result, err := workflow.Execute(ctx)
	if err != nil {
		return RedFlagsRunResult{}, fmt.Errorf("failed to execute workflow: %w", err)
	}

	// Serialize result to JSON for storage
	outputJSON, err := json.Marshal(result)
	if err != nil {
		return RedFlagsRunResult{}, fmt.Errorf("failed to marshal output: %w", err)
	}

	// Store in database
	workflowRecord := models.Workflow{
		WorkflowName: "red_flags_detection",
		Prompt:       prompt,
		AgentModel:   r.client.ModelName,
		Output:       string(outputJSON),
		Parameters:   string(parametersJSON),
	}

	workflowID, err := r.db.InsertWorkflow(workflowRecord)
	if err != nil {
		return RedFlagsRunResult{}, fmt.Errorf("failed to store workflow: %w", err)
	}

	return RedFlagsRunResult{
		Result:     result,
		WorkflowID: workflowID,
	}, nil
}
