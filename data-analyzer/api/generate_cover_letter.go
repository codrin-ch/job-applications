package api

import (
	"context"
	"encoding/json"
	"net/http"
	"slices"

	"data-analyzer/agent"
	agentWorkflows "data-analyzer/agent/workflows"
	"data-analyzer/db"
	"data-analyzer/models"
)

// GenerateCoverLetterRequest represents the request body for the generate cover letter endpoint
type GenerateCoverLetterRequest struct {
	JobApplicationIDs []int                     `json:"job_application_ids"`
	CoverLetterInputs []models.CoverLetterInput `json:"cover_letter_inputs"`
}

// GenerateCoverLetterResponse represents the response body for the generate cover letter endpoint
type GenerateCoverLetterResponse struct {
	Message           string   `json:"message"`
	JobApplicationIDs []int    `json:"job_application_ids"`
	CoverLetters      []string `json:"cover_letters"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

type GenerateCoverLetterHandler struct {
	db           *db.DB
	geminiClient *agent.Client
}

func NewGenerateCoverLetterHandler(db *db.DB, geminiClient *agent.Client) *GenerateCoverLetterHandler {
	return &GenerateCoverLetterHandler{
		db:           db,
		geminiClient: geminiClient,
	}
}

// HandleGenerateCoverLetter handles POST requests to generate cover letters
func (h *GenerateCoverLetterHandler) HandleGenerateCoverLetter(w http.ResponseWriter, r *http.Request) {
	// Set JSON content type for all responses
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST requests
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed. Use POST."})
		return
	}

	// Parse the JSON request body
	var req GenerateCoverLetterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON payload: " + err.Error()})
		return
	}

	// Validate that job_application_ids is not empty
	if len(req.JobApplicationIDs) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "job_application_ids cannot be empty"})
		return
	}

	jobApplications, err := h.db.GetJobApplicationsById(req.JobApplicationIDs)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to get job applications: " + err.Error()})
		return
	}

	workflows, err := h.db.GetAllWorkflows()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to get workflows: " + err.Error()})
		return
	}

	jobApplicationsWithoutExistingWorkflows := make([]models.JobApplication, 0)

	// Check if any of the job applications already have a workflow of type generate_cover_letter
	for _, jobApplication := range jobApplications {
		workflowExists := false
		for _, workflow := range workflows {
			if workflow.WorkflowName == "generate_cover_letter" {
				var workflowParameters models.WorkflowParameters
				if err := json.Unmarshal([]byte(workflow.Parameters), &workflowParameters); err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to unmarshal job_ids: " + err.Error()})
					return
				}
				if slices.Contains(workflowParameters.JobIds, jobApplication.ID) {
					workflowExists = true
				}
			}
		}
		if !workflowExists {
			jobApplicationsWithoutExistingWorkflows = append(jobApplicationsWithoutExistingWorkflows, jobApplication)
		}
	}

	response := GenerateCoverLetterResponse{
		Message:      "No new workflows to execute",
		CoverLetters: nil,
	}

	if len(jobApplicationsWithoutExistingWorkflows) > 0 {
		coverLetters := make([]string, 0)
		for i, jobApplication := range jobApplicationsWithoutExistingWorkflows {
			generateCoverLetterWorkflow := agentWorkflows.NewGenerateCoverLetterWorkflow(h.geminiClient, h.db)
			coverLetter, err := generateCoverLetterWorkflow.Execute(context.TODO(), jobApplication, req.CoverLetterInputs[i])
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate cover letter: " + err.Error()})
				return
			}
			coverLetters = append(coverLetters, coverLetter)
		}
		response = GenerateCoverLetterResponse{
			Message:      "New workflows to execute",
			CoverLetters: coverLetters,
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
