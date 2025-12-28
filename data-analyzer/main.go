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
}
