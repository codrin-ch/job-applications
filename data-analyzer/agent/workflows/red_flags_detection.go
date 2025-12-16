package workflows

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"data-analyzer/agent"
	"data-analyzer/models"

	"github.com/google/generative-ai-go/genai"
)

// RedFlag represents a single red flag identified in a job description
type RedFlag struct {
	Category    string `json:"category"`
	Description string `json:"description"`
}

// JobRedFlags holds the red flags for a single job in the batch response
type JobRedFlags struct {
	JobID    int       `json:"job_id"`
	RedFlags []RedFlag `json:"red_flags"`
}

// RedFlagsResult holds the result of red flags detection for a single job
type RedFlagsResult struct {
	JobID    int
	JobTitle string
	RedFlags []RedFlag
	Error    error
}

// RedFlagsDetectionResult is the result of the red flags detection workflow
type RedFlagsDetectionResult struct {
	Results []RedFlagsResult
}

// RedFlagsDetectionWorkflow detects red flags in job descriptions
type RedFlagsDetectionWorkflow struct {
	client *agent.Client
	jobs   []models.JobApplication
}

// NewRedFlagsDetectionWorkflow creates a new red flags detection workflow
func NewRedFlagsDetectionWorkflow(client *agent.Client, jobs []models.JobApplication) *RedFlagsDetectionWorkflow {
	return &RedFlagsDetectionWorkflow{
		client: client,
		jobs:   jobs,
	}
}

// Execute runs the red flags detection workflow - sends all jobs in a single batch request
func (w *RedFlagsDetectionWorkflow) Execute(ctx context.Context) (RedFlagsDetectionResult, error) {
	if len(w.jobs) == 0 {
		return RedFlagsDetectionResult{Results: []RedFlagsResult{}}, nil
	}

	// Build batch prompt with all job descriptions
	var jobsBuilder strings.Builder
	for _, job := range w.jobs {
		sanitized := agent.SanitizeText(job.JobDescription)
		// Truncate very long descriptions to avoid token limits
		if len(sanitized) > 3000 {
			sanitized = sanitized[:3000] + "..."
		}
		jobsBuilder.WriteString(fmt.Sprintf("\n--- JOB ID: %d ---\nTitle: %s\n\n%s\n", job.ID, job.JobTitle, sanitized))
	}

	prompt := fmt.Sprintf(`%s %s`, w.PROMT(), jobsBuilder.String())

	resp, err := w.client.Model().GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return w.errorResult(fmt.Errorf("failed to generate content: %w", err)), nil
	}

	if len(resp.Candidates) == 0 {
		return w.errorResult(fmt.Errorf("no response from Gemini")), nil
	}

	// Extract text from the response
	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			resultText += string(text)
		}
	}

	// Parse the JSON response
	jobRedFlags, err := parseBatchRedFlags(resultText)
	if err != nil {
		return w.errorResult(fmt.Errorf("failed to parse red flags: %w", err)), nil
	}

	// Map results back to jobs
	return w.mapResults(jobRedFlags), nil
}

// errorResult creates a result with the same error for all jobs
func (w *RedFlagsDetectionWorkflow) errorResult(err error) RedFlagsDetectionResult {
	results := make([]RedFlagsResult, len(w.jobs))
	for i, job := range w.jobs {
		results[i] = RedFlagsResult{
			JobID:    job.ID,
			JobTitle: job.JobTitle,
			RedFlags: nil,
			Error:    err,
		}
	}
	return RedFlagsDetectionResult{Results: results}
}

// mapResults maps the parsed response back to job results
func (w *RedFlagsDetectionWorkflow) mapResults(jobRedFlags []JobRedFlags) RedFlagsDetectionResult {
	// Create a map for quick lookup
	flagsMap := make(map[int][]RedFlag)
	for _, jrf := range jobRedFlags {
		flagsMap[jrf.JobID] = jrf.RedFlags
	}

	results := make([]RedFlagsResult, len(w.jobs))
	for i, job := range w.jobs {
		results[i] = RedFlagsResult{
			JobID:    job.ID,
			JobTitle: job.JobTitle,
			RedFlags: flagsMap[job.ID],
			Error:    nil,
		}
	}
	return RedFlagsDetectionResult{Results: results}
}

func (w *RedFlagsDetectionWorkflow) PROMT() string {
	return `Analyze the following job descriptions and identify any red flags that might indicate potential issues with each position or company.

	Look for red flags in these categories:
	- UNREALISTIC_EXPECTATIONS: Requiring excessive years of experience for entry/mid-level roles, expecting expertise in too many technologies
	- POOR_WORK_LIFE_BALANCE: Phrases like "fast-paced environment", "wear many hats", "startup mentality", "flexible hours" (often meaning long hours)
	- COMPENSATION_ISSUES: Vague or missing salary information, "competitive salary" without details, unpaid overtime expectations
	- HIGH_TURNOVER: Frequently hiring for same role, "immediate start" urgency
	- TOXIC_CULTURE: Emphasis on "family" culture, "drama-free", "thick skin required"
	- UNREASONABLE_REQUIREMENTS: Expecting senior skills at junior pay, requiring unpaid trial work

	Return your response as a JSON array where each element contains the job_id and its red_flags.
	If a job has no red flags, include an empty red_flags array for that job.

	Example response format:
	[
		{"job_id": 1, "red_flags": [{"category": "UNREALISTIC_EXPECTATIONS", "description": "Requires 10+ years experience"}]},
		{"job_id": 2, "red_flags": []}
	]

	Job Descriptions:`
}

// parseBatchRedFlags parses the batch JSON response
func parseBatchRedFlags(text string) ([]JobRedFlags, error) {
	text = strings.TrimSpace(text)

	// Remove markdown code blocks if present
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var jobRedFlags []JobRedFlags
	if err := json.Unmarshal([]byte(text), &jobRedFlags); err != nil {
		return nil, err
	}

	return jobRedFlags, nil
}
