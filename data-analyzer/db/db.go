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
		SELECT id, job_title, job_description
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
			&app.ID, &app.JobTitle, &app.JobDescription,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		applications = append(applications, app)
	}

	return applications, nil
}
