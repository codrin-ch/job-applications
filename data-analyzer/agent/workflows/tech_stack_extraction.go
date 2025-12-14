package workflows

import (
	"context"
	"fmt"
	"strings"

	"data-analyzer/agent"
	"data-analyzer/models"

	"github.com/google/generative-ai-go/genai"
)

// TechStackResult holds the result of tech stack extraction for a job
type TechStackResult struct {
	JobID     int
	JobTitle  string
	TechStack []string
	Error     error
}

// TechStackExtractionResult is the result of the tech stack extraction workflow
type TechStackExtractionResult struct {
	Results []TechStackResult
}

// TechStackExtractionWorkflow extracts tech stacks from job applications
type TechStackExtractionWorkflow struct {
	client *agent.Client
	jobs   []models.JobApplication
}

// NewTechStackExtractionWorkflow creates a new tech stack extraction workflow
func NewTechStackExtractionWorkflow(client *agent.Client, jobs []models.JobApplication) *TechStackExtractionWorkflow {
	return &TechStackExtractionWorkflow{
		client: client,
		jobs:   jobs,
	}
}

// Execute runs the tech stack extraction workflow
func (w *TechStackExtractionWorkflow) Execute(ctx context.Context) (TechStackExtractionResult, error) {
	results := make([]TechStackResult, len(w.jobs))

	for i, job := range w.jobs {
		techStack, err := w.extractTechStack(ctx, job.JobDescription)
		results[i] = TechStackResult{
			JobID:     job.ID,
			JobTitle:  job.JobTitle,
			TechStack: techStack,
			Error:     err,
		}
	}

	return TechStackExtractionResult{Results: results}, nil
}

// extractTechStack sends the job description to Gemini and extracts the tech stack
func (w *TechStackExtractionWorkflow) extractTechStack(ctx context.Context, jobDescription string) ([]string, error) {
	// Sanitize the job description to remove sensitive information
	jobDescription = agent.SanitizeText(jobDescription)

	prompt := fmt.Sprintf(`Analyze the following job description and extract all technologies, programming languages, frameworks, tools, and platforms mentioned.

Return ONLY a comma-separated list of technologies, nothing else. Do not include explanations or categories.

Example output: Go, Python, PostgreSQL, Docker, Kubernetes, AWS, React

Job Description:
%s`, jobDescription)

	resp, err := w.client.Model().GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return nil, fmt.Errorf("no response from Gemini")
	}

	// Extract text from the response
	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			resultText += string(text)
		}
	}

	// Parse the comma-separated list
	techStack := parseTechStack(resultText)

	return techStack, nil
}

// parseTechStack parses a comma-separated string of technologies into a slice
func parseTechStack(text string) []string {
	text = strings.TrimSpace(text)
	parts := strings.Split(text, ",")

	var techStack []string
	for _, part := range parts {
		tech := strings.TrimSpace(part)
		if tech != "" {
			techStack = append(techStack, tech)
		}
	}

	return techStack
}
