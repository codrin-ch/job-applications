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

// ResearchCompanyRequest represents the request body for the research company endpoint
type ResearchCompanyRequest struct {
	JobApplicationIDs []int `json:"job_application_ids"`
}

// ResearchCompanyResponse represents the response body for the research company endpoint
type ResearchCompanyResponse struct {
	Message         string                           `json:"message"`
	CompanyResearch []agentWorkflows.ResearchCompany `json:"company_research"`
}

type ResearchCompanyHandler struct {
	db           *db.DB
	geminiClient *agent.Client
}

func NewResearchCompanyHandler(db *db.DB, geminiClient *agent.Client) *ResearchCompanyHandler {
	return &ResearchCompanyHandler{
		db:           db,
		geminiClient: geminiClient,
	}
}

// HandleResearchCompany handles POST requests to research companies
func (h *ResearchCompanyHandler) HandleResearchCompany(w http.ResponseWriter, r *http.Request) {
	// Set JSON content type for all responses
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST requests
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed. Use POST."})
		return
	}

	// Parse the JSON request body
	var req ResearchCompanyRequest
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

	// Check if any of the job applications already have a workflow of type research_company
	for _, jobApplication := range jobApplications {
		workflowExists := false
		for _, workflow := range workflows {
			if workflow.WorkflowName == "research_company" {
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

	response := ResearchCompanyResponse{
		Message:         "No new workflows to execute",
		CompanyResearch: nil,
	}

	if len(jobApplicationsWithoutExistingWorkflows) > 0 {
		companyResearch := make([]agentWorkflows.ResearchCompany, 0)
		for _, jobApplication := range jobApplicationsWithoutExistingWorkflows {
			researchCompanyWorkflow := agentWorkflows.NewResearchCompanyWorkflow(h.geminiClient, h.db)
			research, err := researchCompanyWorkflow.Execute(context.TODO(), jobApplication)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to research company: " + err.Error()})
				return
			}
			companyResearch = append(companyResearch, research)
		}
		response = ResearchCompanyResponse{
			Message:         "Company research completed",
			CompanyResearch: companyResearch,
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
