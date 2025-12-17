package agent

import (
	"context"
	"data-analyzer/config"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Client wraps the Google Gemini generative AI client
type Client struct {
	client    *genai.Client
	model     *genai.GenerativeModel
	ModelName string
}

// NewClient creates a new Gemini client with the provided API key
func NewClient(ctx context.Context, cfg *config.Config) (*Client, error) {
	if !cfg.ShouldRunAgent {
		return nil, fmt.Errorf("should_run_agent environment variable not set")
	}

	if cfg.GeminiAPIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY environment variable not set")
	}

	if cfg.GeminiModel == "" {
		return nil, fmt.Errorf("GEMINI_MODEL environment variable not set")
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.GeminiAPIKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	model := client.GenerativeModel(cfg.GeminiModel)

	// Configure the model for structured extraction
	model.SetTemperature(0.1) // Low temperature for consistent, factual responses

	return &Client{
		client:    client,
		model:     model,
		ModelName: cfg.GeminiModel,
	}, nil
}

// Close closes the Gemini client connection
func (g *Client) Close() error {
	return g.client.Close()
}

// Model returns the underlying generative model for use by workflows
func (g *Client) Model() *genai.GenerativeModel {
	return g.model
}
