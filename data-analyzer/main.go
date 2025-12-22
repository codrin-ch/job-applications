package main

import (
	"context"
	"log"

	"data-analyzer/agent"
	"data-analyzer/api"
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

	geminiClient := &agent.Client{}
	if cfg.ShouldRunAgent {
		geminiClient, err = agent.NewClient(context.TODO(), cfg)
		if err != nil {
			log.Fatalf("Failed to create Gemini client: %v", err)
		}
	}

	if cfg.ShouldRunServer {
		server := api.NewServer(cfg, database, geminiClient)
		server.Run()
	}

	// generate a unique and sortable timestamp to be concatenated with the file path
	// timestamp := time.Now().Format("20060102_150405")
	// usedModel := cfg.GeminiModel
	// usedTemperature := 0.5
	// filePath := "analysis_" + usedModel + "_" + fmt.Sprintf("%.1f", usedTemperature) + "_" + timestamp + ".txt"
	// analyzeRoleDetailsWorkflow := workflows.NewAnalyzeRoleDetailsWorkflow(geminiClient, database)
	// resultText, err := analyzeRoleDetailsWorkflow.Execute(context.TODO())
	// if err != nil {
	// 	log.Fatalf("Failed to execute workflow: %v", err)
	// }
	// // write the resultText in a file as well
	// err = os.WriteFile(filePath, []byte(resultText), 0644)
	// if err != nil {
	// 	log.Fatalf("Failed to write file: %v", err)
	// }
}
