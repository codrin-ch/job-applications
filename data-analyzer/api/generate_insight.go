package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"

	"data-analyzer/agent"
	"data-analyzer/agent/workflows"
	"data-analyzer/db"
	"data-analyzer/models"
	"data-analyzer/scenarios"
)

// GenerateInsightRequest represents the request body for the generate insight endpoint
type GenerateInsightRequest struct {
	JobApplicationIDs []int `json:"job_application_ids"`
}

// GenerateInsightResponse represents the response body for the generate insight endpoint
type GenerateInsightResponse struct {
	Message     string                  `json:"message"`
	RoleDetails []workflows.RoleDetails `json:"role_details"`
}

type GenerateInsightHandler struct {
	db           *db.DB
	geminiClient *agent.Client
}

func NewGenerateInsightHandler(db *db.DB, geminiClient *agent.Client) *GenerateInsightHandler {
	return &GenerateInsightHandler{
		db:           db,
		geminiClient: geminiClient,
	}
}

// HandleGenerateInsight handles POST requests to generate insights
func (h *GenerateInsightHandler) HandleGenerateInsight(w http.ResponseWriter, r *http.Request) {
	// Set JSON content type for all responses
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST requests
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed. Use POST."})
		return
	}

	// Parse the JSON request body
	var req GenerateInsightRequest
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

	// Check if any of the job applications already have a workflow of type role_details
	for _, jobApplication := range jobApplications {
		workflowExists := false
		for _, workflow := range workflows {
			if workflow.WorkflowName == "extract_role_details" {
				// check if after unmarshaling job_ids (an object contains job_ids as array of strings) from workflow paramaters, it contains the job_id
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

	response := GenerateInsightResponse{
		Message:     "No new workflows to execute",
		RoleDetails: nil,
	}

	// run extract_role_details
	if len(jobApplicationsWithoutExistingWorkflows) > 0 {
		extractRoleDetailsScenario := scenarios.NewExtractRoleDetailsScenario(h.geminiClient, h.db, jobApplicationsWithoutExistingWorkflows)
		roleDetails, err := extractRoleDetailsScenario.Execute(context.TODO())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to extract role details: " + err.Error()})
			return
		}
		// For now, return a success response with the received IDs
		response = GenerateInsightResponse{
			Message:     "Success",
			RoleDetails: roleDetails,
		}
	} else {
		fmt.Println("No new workflows to execute")
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
