package main

import (
	"fmt"
	"log"
	"strings"

	"data-analyzer/config"
	"data-analyzer/db"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to the database
	database, err := db.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	fmt.Println("✅ Successfully connected to the SQLite database!")
	fmt.Println(strings.Repeat("=", 60))

	// ctx := context.Background()
	// geminiClient, err := agent.NewClient(ctx, cfg)
	// if err != nil {
	// 	log.Fatalf("Failed to create Gemini client: %v", err)
	// }
	// defer geminiClient.Close()
	// // execute extract role details scenario
	// extractRoleDetailsScenario := scenarios.NewExtractRoleDetailsScenario(geminiClient, database, filteredJobApplications)
	// if err := extractRoleDetailsScenario.Execute(ctx); err != nil {
	// 	log.Printf("Failed to execute extract role details scenario: %v", err)
	// }

	// Create a new runner for the specific task which would get only the client, db connection and job applications

	// Run the task which would store all the relevant workflow data in database and also run the task

	// If error, log it and return

	// If success, return workflowId and get it from database and display it

	// if len(jobApplicationsScenario.JobApplications) > 0 {
	// 	jobApplications := jobApplicationsScenario.JobApplications[:5]

	// 	// Create workflow runner with database persistence
	// 	runner := workflows.NewWorkflowRunnerV2(workflows.NewRedFlagsDetectionWorkflow(geminiClient, jobApplications), geminiClient, database)
	// 	runResult, err := runner.Run(ctx)
	// 	if err != nil {
	// 		log.Printf("Failed to execute workflow: %v", err)
	// 	} else {
	// 		fmt.Printf("📝 Workflow stored with ID: %d\n", runResult.WorkflowID)

	// 		// Go through all results and display them
	// 		for i, r := range runResult.Result.Results {
	// 			if r.Error != nil {
	// 				log.Printf("Failed to detect red flags: %v", r.Error)
	// 			} else {
	// 				// display the red flags with category and description
	// 				fmt.Printf("%d. %s\n", i+1, jobApplications[i].JobTitle)
	// 				if len(r.RedFlags) == 0 {
	// 					fmt.Println("🚩 Red Flags: None detected")
	// 				} else {
	// 					fmt.Println("🚩 Red Flags:")
	// 					for _, flag := range r.RedFlags {
	// 						fmt.Printf("   - [%s] %s\n", flag.Category, flag.Description)
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	// fmt.Println(strings.Repeat("=", 60))
	// fmt.Println("✅ Test completed successfully!")

	// // Get all workflows
	// workflowsScenario := scenarios.NewGetAllWorkflowsScenario(cfg, database)
	// if err := workflowsScenario.Execute(); err != nil {
	// 	log.Printf("Failed to get workflows: %v", err)
	// } else {
	// 	workflowsScenario.PrintWorkflows(5)
	// }
}
