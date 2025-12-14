package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"data-analyzer/agent"
	"data-analyzer/agent/workflows"
	"data-analyzer/config"
	"data-analyzer/db"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	// Connect to the database
	database, err := db.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	fmt.Println("✅ Successfully connected to the SQLite database!")
	fmt.Println(strings.Repeat("=", 60))

	// Get all job applications
	fmt.Println("\n📋 Recent Job Applications:")
	fmt.Println(strings.Repeat("-", 40))
	applications, err := database.GetAllJobApplications()
	if err != nil {
		log.Printf("Failed to get job applications: %v", err)
	} else {
		// Show first 5 applications
		limit := 1
		if len(applications) < limit {
			limit = len(applications)
		}
		for i, app := range applications[:limit] {
			// select only first 5000 chars of job description for display
			jobDescription := app.JobDescription
			if len(jobDescription) > 5000 {
				jobDescription = jobDescription[:5000] + "..."
			}
			fmt.Printf("%d. %s\n%s\n", i+1, app.JobTitle, jobDescription)
		}
		if len(applications) > limit {
			fmt.Printf("   ... and %d more applications\n", len(applications)-limit)
		}
	}

	fmt.Println(strings.Repeat("=", 60))

	// Test Gemini tech stack extraction
	fmt.Println("\n🤖 Testing Gemini Tech Stack Extraction:")
	fmt.Println(strings.Repeat("-", 40))

	if cfg.GeminiAPIKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable not set")
	}

	geminiClient, err := agent.NewClient(ctx, cfg)
	if err != nil {
		log.Fatalf("Failed to create Gemini client: %v", err)
	}
	defer geminiClient.Close()

	if len(applications) > 0 {
		jobApplications := applications[:5]
		workflow := workflows.NewRedFlagsDetectionWorkflow(geminiClient, jobApplications)
		result, err := workflow.Execute(ctx)
		if err != nil {
			log.Printf("Failed to execute workflow: %v", err)
		} else if len(result.Results) > 0 {
			// Go through all results and display them
			for i, r := range result.Results {
				if r.Error != nil {
					log.Printf("Failed to detect red flags: %v", r.Error)
				} else {
					// display the red flags with category and description
					fmt.Printf("%d. %s\n", i+1, jobApplications[i].JobTitle)
					if len(r.RedFlags) == 0 {
						fmt.Println("🚩 Red Flags: None detected")
					} else {
						fmt.Println("🚩 Red Flags:")
						for _, flag := range r.RedFlags {
							fmt.Printf("   - [%s] %s\n", flag.Category, flag.Description)
						}
					}
				}
			}
		}
	}

	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("✅ Test completed successfully!")
}
