package workflows

import (
	"context"
	"data-analyzer/agent"
	"data-analyzer/db"
	"data-analyzer/models"
	"encoding/json"
	"fmt"
	"log"
)

// TODO: improve the prompt as the results are suboptimal at the moment
const RESEACH_COMPANY_PROMPT = `
	You are an expert at researching companies and their values and needs.
	The first priority of the research is the software engineering aspect.
	The second priority of the research is the business aspect.
	The last one is the company overview.
	Focus on data from 2025 and 2024, the most recent data is the most relevant.
	
	Starting from the Company Name and Company Website, you need to research the company based on the previously defined priorities.
	The research should also go by scrapping the web for various information, but all the relevant conclusions must be state their source.
	The facts and information that appears in more places should be first in the output and the ones that are less frequent should be the last.
	The results of this research must be summarised in these categories with examples.
	The ouput should be a JSON object with the following structure in which the source should be the title of the groundingChunks used for that statement.
	{
		"software_engineering": [
			{
				"value": "Value 1",
				"example": "Example 1",
				"source": "test.com"
			}
		]
		"business": [
			{
				"value": "Value 1",
				"example": "Example 1",
				"source": "test.com"
			}
		]
		"company_overview": [
			{
				"value": "Value 1",
				"example": "Example 1",
				"source": "test.com"
			}
		]
	}

	The JSON object must contain the following fields:
	- software_engineering: an array of objects containing the research results for the software engineering aspect
	- business: an array of objects containing the research results for the business aspect
	- company_overview: an array of objects containing the research results for the company overview

	Perform the research on the following company:
	Company Name: %s
	Company Website: %s
`

type ResearchCompany struct {
	SoftwareEngineering []struct {
		Value   string `json:"value"`
		Example string `json:"example"`
		Source  string `json:"source"`
	} `json:"software_engineering"`
	Business []struct {
		Value   string `json:"value"`
		Example string `json:"example"`
		Source  string `json:"source"`
	} `json:"business"`
	CompanyOverview []struct {
		Value   string `json:"value"`
		Example string `json:"example"`
		Source  string `json:"source"`
	} `json:"company_overview"`
}

type ResearchCompanyWorkflow struct {
	client *agent.Client
	db     *db.DB
}

func NewResearchCompanyWorkflow(client *agent.Client, db *db.DB) *ResearchCompanyWorkflow {
	return &ResearchCompanyWorkflow{
		client: client,
		db:     db,
	}
}

func (w *ResearchCompanyWorkflow) Execute(ctx context.Context, jobApplication models.JobApplication) (ResearchCompany, error) {
	var result ResearchCompany
	companyName := jobApplication.CompanyName
	companyWebsite := jobApplication.CompanyURL

	prompt := fmt.Sprintf(RESEACH_COMPANY_PROMPT, companyName, companyWebsite)

	resp, err := w.client.GenerateContent(ctx, prompt, 1.5, true)
	if err != nil {
		return result, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return result, fmt.Errorf("no response from Gemini")
	}

	resultText := resp.Text()

	parametersJSON, err := json.Marshal(map[string]interface{}{
		"job_ids": []int{jobApplication.ID},
		"fields":  []string{"company_name, company_url"},
	})
	if err != nil {
		log.Printf("Failed to marshal parameters: %v", err)
	}

	resultText = agent.SanitizeAgentJSONResponse(resultText)

	// store the result in database
	workflowRecord := models.Workflow{
		WorkflowName: "research_company",
		Prompt:       prompt,
		AgentModel:   w.client.ModelName,
		Output:       resultText,
		Parameters:   string(parametersJSON),
	}

	if err := json.Unmarshal([]byte(resultText), &result); err != nil {
		return result, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	// store the result in database
	workflowID, err := w.db.InsertWorkflow(workflowRecord)
	if err != nil {
		log.Printf("Failed to store workflow: %v", err)
	} else {
		fmt.Printf("📝 Workflow stored with ID: %d\n", workflowID)
	}
	err = w.db.InsertJobApplicationsWorkflow([]int{jobApplication.ID}, workflowID)
	if err != nil {
		log.Printf("Failed to store job application workflow: %v", err)
	}

	err = w.db.AddStepToJobApplication(jobApplication.ID, models.StepInput{
		Title:       "Research Company",
		Description: fmt.Sprintf("Company research generated successfully via workflow %d", workflowID),
	})
	if err != nil {
		log.Printf("Failed to store job application step: %v", err)
	}

	return result, nil
}
