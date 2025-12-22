// Go through all extracted job responsibilities and job requirements and analyze them

// Ask the agent to identify patterns and most commonly used sentences
package workflows

import (
	"context"
	"data-analyzer/agent"
	"data-analyzer/db"
	"encoding/json"
	"fmt"

	"github.com/google/generative-ai-go/genai"
)

const ANALYZE_ROLE_DETAILS_PROMPT = `
	You are an expert in extracting insight about patterns and most commonly used sentences in software engineering job requirements and responsibilities.
	You are given a list of job requirements and responsibilities extracted from job descriptions.
	Your task is to group the job requirements and responsibilities into categories.
	The inputs should be altered as little as possible whene generating the result.
	The output should contain all matching inputs from a category, only the duplicates should be dropped, but if the matching is weak, it should be kept.
	The output should be a JSON object with the following structure:
	{
		"categories": [
			{
				"name": "Category Name",
				"requirements": [
					"Requirement 1",
					"Requirement 2"
				],
				"responsibilities": [
					"Responsibility 1",
					"Responsibility 2"
				]
			}
		]
	}

	Jobs Requirements:
	%s

	Jobs Responsibilities:
	%s
`

type AnalyzeRoleDetailsWorkflow struct {
	client *agent.Client
	db     *db.DB
}

func NewAnalyzeRoleDetailsWorkflow(client *agent.Client, db *db.DB) *AnalyzeRoleDetailsWorkflow {
	return &AnalyzeRoleDetailsWorkflow{
		client: client,
		db:     db,
	}
}

func (w *AnalyzeRoleDetailsWorkflow) Execute(ctx context.Context) (string, error) {
	// get all workflows
	existingWorkflows, err := w.db.GetAllWorkflows()
	if err != nil {
		return "", err
	}
	// keep only those worklows of type extract_role_details
	var collectedRoleDetails []RoleDetails
	for _, workflow := range existingWorkflows {
		if workflow.WorkflowName == "extract_role_details" {
			roleDetails := []RoleDetails{}
			json.Unmarshal([]byte(workflow.Output), &roleDetails)
			collectedRoleDetails = append(collectedRoleDetails, roleDetails...)
		}
	}

	// prepare two strings, one with all job requirements and another one with all job responsibilities based on the collectedRoleDetails
	jobRequirements := "["
	jobResponsibilities := "["
	for _, roleDetail := range collectedRoleDetails {
		for _, jobRequirement := range roleDetail.Requirements {
			jobRequirements += fmt.Sprintf("%s\n", jobRequirement)
		}
		for _, jobResponsibility := range roleDetail.Responsibilities {
			jobResponsibilities += fmt.Sprintf("%s\n", jobResponsibility)
		}
	}
	jobRequirements += "]"
	jobResponsibilities += "]"

	prompt := fmt.Sprintf(ANALYZE_ROLE_DETAILS_PROMPT, jobRequirements, jobResponsibilities)

	fmt.Println(prompt)

	// try goroutines to start more queries in parallel with various temperatures and writing to different files

	w.client.Model().SetTemperature(0.5)
	resp, err := w.client.Model().GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			resultText += string(text)
		}
	}

	fmt.Println(resultText)

	return resultText, nil
}
