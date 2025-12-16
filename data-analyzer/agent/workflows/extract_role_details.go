package workflows

import (
	"context"
	"data-analyzer/agent"
	"data-analyzer/models"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/generative-ai-go/genai"
)

const PROMPT = `
	You are a job description analyzer for software engineer positions.
	Your task is to extract the job responsibilities and job requirements from the job descriptions while keeping the order as they appear in the job description (if something is marked as nice to have, it should appear the last in the resulting list).
	Explanation of the difference between job requirements and job responsibilities:
	Job Requirements (The Input / Pre-conditions): These are the static attributes a candidate must possess before entering the system (the job). They act as a filter. If the input data (the candidate) does not match these parameters, the function (the hiring process) returns False.
	Job Responsibilities (The Process / Runtime): These are the dynamic actions, loops, and functions the candidate will execute after the system is initialized (after being hired). They define the output expected from the agent.

	Example of job responsibilities:
	Design and evolve scalable backend systems and databases, ensuring performance, security, and resilience.
	We are looking for smart programmers who love to code, seek challenging problems, and appreciate recognition for excellent work. 
	
	Example of job requirements:
	5+ years of software engineering experience, including building and maintaining backend systems or developer-facing tools.
	Proficiency in building scalable applications and developer tooling using one of the following: TypeScript, Rust, Go, Python, or Ruby.
	Love working on distributed systems creating scalable, fault-tolerant infrastructure.

	Return the result as a JSON object with the following structure:
	[
		{
			"job_id": 1,
			"responsibilities": ["responsibility1", "responsibility2"],
			"requirements": ["requirement1", "requirement2"]
		},
		{
			"job_id": 2,
			"responsibilities": ["responsibility1", "responsibility2"],
			"requirements": ["requirement1", "requirement2"]
		}
	]

	Job Descriptions:
`

type RoleDetails struct {
	JobId            int      `json:"job_id"`
	Responsibilities []string `json:"responsibilities"`
	Requirements     []string `json:"requirements"`
}

type ExtractRoleDetailsWorkflow struct {
	client *agent.Client
	jobs   []models.JobApplication
}

type Result struct {
	Prompt      string
	Result      string
	RoleDetails []RoleDetails
}

func NewExtractRoleDetailsWorkflow(client *agent.Client, jobs []models.JobApplication) *ExtractRoleDetailsWorkflow {
	return &ExtractRoleDetailsWorkflow{
		client: client,
		jobs:   jobs,
	}
}

func (w *ExtractRoleDetailsWorkflow) Execute(ctx context.Context) (Result, error) {
	// Build batch prompt with all job descriptions
	var jobsBuilder strings.Builder
	for _, job := range w.jobs {
		sanitized := agent.SanitizeText(job.JobDescription)
		jobsBuilder.WriteString(fmt.Sprintf("JOB ID %d: %s\n", job.ID, sanitized))
	}

	prompt := fmt.Sprintf(`%s %s`, PROMPT, jobsBuilder.String())

	resp, err := w.client.Model().GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return Result{}, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return Result{}, fmt.Errorf("no response from Gemini")
	}

	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			resultText += string(text)
		}
	}

	resultText = agent.SanitizeAgentJSONResponse(resultText)

	var result []RoleDetails
	if err := json.Unmarshal([]byte(resultText), &result); err != nil {
		return Result{}, fmt.Errorf("failed to unmarshal result: %w", err)
	}

	return Result{
		Prompt:      PROMPT,
		Result:      resultText,
		RoleDetails: result,
	}, nil
}
