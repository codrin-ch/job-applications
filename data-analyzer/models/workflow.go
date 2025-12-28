package models

import "time"

// Workflow represents a workflow execution record
type Workflow struct {
	ID           int
	WorkflowName string
	CreatedAt    time.Time
	Prompt       string
	AgentModel   string
	Output       string
	Parameters   string
}

type WorkflowParameters struct {
	JobIds []int    `json:"job_ids"`
	Fields []string `json:"fields"`
}
