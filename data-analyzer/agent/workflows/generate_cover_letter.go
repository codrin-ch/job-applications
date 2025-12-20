package workflows

import (
	"context"
	"data-analyzer/agent"
	"data-analyzer/db"
	"data-analyzer/models"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
)

// Need extra information about the user who applies to match various experinces, stories or skills from previous points

// Need as input the requirements and responsibilites of the job obtained from previous workflow

// Need the company research to find out about the culture, important points, values, etc. from previous workflow (optional at this point)

// Generate cover letter (some guidance is neeed, maximum 250 words, focus on the top 3 responsibilites and requirements of the job that are also found in the user experience)
const GENERATE_COVER_LETTER_PROMPT = `
	You are an expert at writing cover letters for Senior Backend Engineers.
	Create a cover letter based on the following information.

	Job Title:
	%s

	Company Research:
	%s

	Role Responsibilities:
	%s

	Role Requirements:
	%s

	Candidate experience:
	%s
	
	Guidelines for writing the content of the cover letter:
	0. The cover letter must be 300 words or less. 
	1. It must be written in active voice.
	2. It must thoughtfully connect candidate experience to the role description, resonsibilities and requirements.
	3. It must focus on what candidate can contribute to the company in this specific position.
	4. The cover letter should have: Introduction, Body Paragraph 1 (Technical Mastery), Body Paragraph 2 (Fit) and Closing."
	5. The Introduction paragraph must function as a concise executive summary, immediately capturing the reviewer's interest and establishing the applicant's relevance. Connect job description to candidate experience.
	6. The body paragraph 1 must transition from a general statement of interest to a focused, persuasive argument detailing technical impact. For Senior Backend roles, the content must emphasize deep technical mastery, individual accountability for complex problems, and optimization results. Connect job requirements and requirements to candidate experience.
	7. The body paragraph 2 must explicitly deploy relevant technical vocabulary that validates deep architectural understanding and problem-solving skills. Connect job requirements and requirements to candidate experience.
	8. The closing section must move beyond technical competency and address the candidate’s specific motivation for joining the organization. Reviewers seek candidates who are genuinely excited about the company's trajectory and mission. The candidate must persuasively explain why this particular job at this specific company is the ideal next step.
	9. The output must contain only the content of the letter without headers or any other additional information.
`

type GenerateCoverLetterWorkflow struct {
	client *agent.Client
	db     *db.DB
}

func NewGenerateCoverLetterWorkflow(client *agent.Client, db *db.DB) *GenerateCoverLetterWorkflow {
	return &GenerateCoverLetterWorkflow{
		client: client,
		db:     db,
	}
}

func (w *GenerateCoverLetterWorkflow) Execute(ctx context.Context, jobApplication models.JobApplication, coverLetterInput models.CoverLetterInput) (string, error) {
	companyResearchString := ""
	for _, research := range coverLetterInput.CompanyResearch {
		companyResearchString += fmt.Sprintf("- %s\n", research)
	}

	roleResponsibilitiesString := ""
	for _, responsibility := range coverLetterInput.JobResponsibilities {
		roleResponsibilitiesString += fmt.Sprintf("- %s\n", responsibility)
	}

	roleRequirementsString := ""
	for _, requirement := range coverLetterInput.JobRequirements {
		roleRequirementsString += fmt.Sprintf("- %s\n", requirement)
	}

	candidateExperienceString := ""
	for _, experience := range coverLetterInput.CandidateExperience {
		candidateExperienceString += fmt.Sprintf("- %s\n", experience)
	}

	prompt := fmt.Sprintf(GENERATE_COVER_LETTER_PROMPT, jobApplication.JobTitle, companyResearchString, roleResponsibilitiesString, roleRequirementsString, candidateExperienceString)

	fmt.Println(prompt)

	// TODO: experiment with different temperatures
	w.client.Model().SetTemperature(0.9)
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

	parametersJSON, err := json.Marshal(map[string]interface{}{
		"job_ids": []int{jobApplication.ID},
		"fields":  []string{"job_title"},
	})
	if err != nil {
		log.Printf("Failed to marshal parameters: %v", err)
	}

	// store the result in database
	workflowRecord := models.Workflow{
		WorkflowName: "generate_cover_letter",
		Prompt:       prompt,
		AgentModel:   w.client.ModelName,
		Output:       resultText,
		Parameters:   string(parametersJSON),
	}

	fmt.Println("\nGenerated Cover Letter:")
	fmt.Println(resultText)

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

	return resultText, nil
}

var COVER_LETTER_GUIDELINES = []string{
	// top level structure
	"The cover letter should have: Introduction, Body Paragraph 1 (Technical Mastery), Body Paragraph 2 (Fit) and Closing.",
	// Introduction pragraph
	"The Introduction paragraph must function as a concise executive summary, immediately capturing the reviewer's interest and establishing the applicant's relevance. Example (Senior Backend Engineer): As a seasoned Senior Backend Engineer with over eight years of focused experience designing high-traffic, resilient systems, I was immediately drawn to the challenge outlined in your job posting for enhancing asynchronous processing across your payment pipeline. My proven track record, including successfully leading a database optimization project that reduced system latency by 40% at [Previous Company], directly aligns with your current performance goals.",
	// body paragraph 1 (Technical Mastery)
	"The body paragraphs 1 must transition from a general statement of interest to a focused, persuasive argument detailing technical impact. For Senior Backend roles, the content must emphasize deep technical mastery, individual accountability for complex problems, and optimization results.",
	// body paragraph 2 (Fit)
	"The body paragraph 2 must explicitly deploy relevant technical vocabulary that validates deep architectural understanding and problem-solving skills.",
	// closing paragraph
	"The closing section must move beyond technical competency and address the candidate’s specific motivation for joining the organization. Reviewers seek candidates who are genuinely excited about the company's trajectory and mission. The candidate must persuasively explain why this particular job at this specific company is the ideal next step.",
}

var COVER_LETTER_FORMAT_CHECKLIST = []string{
	"Is it 300 words of less?",
	"Are you using an appropriate font size (10-12pt font)?",
	"Is it grammatically correct and free from spelling errors?",
	"Are the margins even on all four sides of the page (0.5- 1)?",
	"Is it organized in a way that's easy to read and follow along?",
	"Has it been addressed to the appropriate recipient?",
	"Is it written in the active voice?",
}

var COVER_LETTER_CONTENT_CHECKLIST = []string{
	"Did you research the company?",
	"Is your research reflected in your cover letter?",
	"Did you use keywords from the job requirements and responsibilities?",
	"Have you thoughtfully connected your previous experience to the role?",
	"Have you differentiated your experiences from the way they are listed in your resume?",
	"Does it include specific experiences to highlight your skills?",
	"Is it focused on what you can contribute to the company (not what they can do for you)?",
}
