package config

import (
	"os"

	// this will automatically load your .env file:
	_ "github.com/joho/godotenv/autoload"
)

type Config struct {
	GeminiAPIKey   string
	GeminiModel    string
	ShouldRunAgent bool
	DBPath         string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		GeminiAPIKey:   os.Getenv("GEMINI_API_KEY"),
		GeminiModel:    os.Getenv("GEMINI_MODEL"),
		ShouldRunAgent: os.Getenv("SHOULD_RUN_AGENT") == "true",
		DBPath:         getEnvOrDefault("DB_PATH", "../server/db.sqlite3"),
	}

	return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
