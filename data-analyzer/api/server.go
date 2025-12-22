package api

import (
	"data-analyzer/agent"
	"data-analyzer/config"
	"data-analyzer/db"
	"fmt"
	"log"
	"net/http"
)

type Server struct {
	cfg          *config.Config
	db           *db.DB
	geminiClient *agent.Client
}

func NewServer(cfg *config.Config, db *db.DB, geminiClient *agent.Client) *Server {
	return &Server{
		cfg:          cfg,
		db:           db,
		geminiClient: geminiClient,
	}
}

func (s *Server) Run() {
	coverLetterHandler := NewGenerateCoverLetterHandler(s.db, s.geminiClient)
	insightHandler := NewGenerateInsightHandler(s.db, s.geminiClient)
	researchCompanyHandler := NewResearchCompanyHandler(s.db, s.geminiClient)

	http.HandleFunc("/job_application/generate_cover_letter", coverLetterHandler.HandleGenerateCoverLetter)
	http.HandleFunc("/job_application/generate_insight", insightHandler.HandleGenerateInsight)
	http.HandleFunc("/job_application/research_company", researchCompanyHandler.HandleResearchCompany)

	fmt.Printf("🚀 Starting HTTP server on port %s\n", s.cfg.ServerPort)
	log.Fatal(http.ListenAndServe(s.cfg.ServerPort, nil))
}
