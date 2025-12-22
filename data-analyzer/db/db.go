package db

import (
	"database/sql"
	"fmt"

	"data-analyzer/models"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps the database connection
type DB struct {
	conn *sql.DB
}

// New creates a new database connection
func New(dbPath string) (*DB, error) {
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{conn: conn}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// GetAllJobApplications retrieves all job applications from the database
func (db *DB) GetAllJobApplications() ([]models.JobApplication, error) {
	rows, err := db.conn.Query(`
		SELECT id, job_title, job_description, company_name, company_url
		FROM jobs_jobapplication
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query job applications: %w", err)
	}
	defer rows.Close()

	var applications []models.JobApplication
	for rows.Next() {
		var app models.JobApplication
		err := rows.Scan(
			&app.ID, &app.JobTitle, &app.JobDescription, &app.CompanyName, &app.CompanyURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		applications = append(applications, app)
	}

	return applications, nil
}

func (db *DB) GetJobApplicationsById(jobapplicationIds []int) ([]models.JobApplication, error) {
	// split the job applications ids array into individual ids to fit the IN sql statements
	var jobapplicationIdsString string
	for _, jobapplicationId := range jobapplicationIds {
		jobapplicationIdsString += fmt.Sprintf(`%d,`, jobapplicationId)
	}
	jobapplicationIdsString = jobapplicationIdsString[:len(jobapplicationIdsString)-1]
	queryString := fmt.Sprintf(`
		SELECT id, job_title, job_description, company_name, company_url
		FROM jobs_jobapplication
		WHERE id IN (%s)
	`, jobapplicationIdsString)
	rows, err := db.conn.Query(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to query job applications: %w", err)
	}
	defer rows.Close()

	var applications []models.JobApplication
	for rows.Next() {
		var app models.JobApplication
		err := rows.Scan(
			&app.ID, &app.JobTitle, &app.JobDescription, &app.CompanyName, &app.CompanyURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		applications = append(applications, app)
	}

	return applications, nil
}

// InsertWorkflow inserts a new workflow record into the database
func (db *DB) InsertWorkflow(workflow models.Workflow) (int64, error) {
	result, err := db.conn.Exec(`
		INSERT INTO jobs_workflow (workflow_name, prompt, agent_model, output, parameters, created_at)
		VALUES (?, ?, ?, ?, ?, datetime('now'))
	`, workflow.WorkflowName, workflow.Prompt, workflow.AgentModel, workflow.Output, workflow.Parameters)
	if err != nil {
		return 0, fmt.Errorf("failed to insert workflow: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}

	return id, nil
}

func (db *DB) InsertJobApplicationsWorkflow(jobApplicationIDs []int, workflowID int64) error {
	for _, jobApplicationID := range jobApplicationIDs {
		_, err := db.conn.Exec(`
			INSERT INTO jobs_jobapplication_workflows (jobapplication_id, workflow_id)
			VALUES (?, ?)
		`, jobApplicationID, workflowID)
		if err != nil {
			return fmt.Errorf("failed to insert job application workflow: %w", err)
		}
	}
	return nil
}

// GetAllWorkflows retrieves all workflow records from the database
func (db *DB) GetAllWorkflows() ([]models.Workflow, error) {
	rows, err := db.conn.Query(`
		SELECT workflow_id, workflow_name, created_at, prompt, agent_model, output, parameters
		FROM jobs_workflow
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query workflows: %w", err)
	}
	defer rows.Close()

	var workflows []models.Workflow
	for rows.Next() {
		var w models.Workflow
		err := rows.Scan(
			&w.ID, &w.WorkflowName, &w.CreatedAt, &w.Prompt, &w.AgentModel, &w.Output, &w.Parameters,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan workflow row: %w", err)
		}
		workflows = append(workflows, w)
	}

	return workflows, nil
}

func (db *DB) AddStepToJobApplication(jobApplicationID int, step models.StepInput) error {
	_, err := db.conn.Exec(`
		INSERT INTO jobs_jobapplication_step (job_application_id, title, description)
		VALUES (?, ?, ?)
	`, jobApplicationID, step.Title, step.Description)
	if err != nil {
		return fmt.Errorf("failed to insert job application step: %w", err)
	}
	return nil
}
