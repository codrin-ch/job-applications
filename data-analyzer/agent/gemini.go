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
	client *genai.Client
	model  *genai.GenerativeModel
}

// NewClient creates a new Gemini client with the provided API key
func NewClient(ctx context.Context, cfg *config.Config) (*Client, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.GeminiAPIKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	// Use Gemini 2.5 Flash for fast, cost-effective responses
	model := client.GenerativeModel(cfg.GeminiModel)

	// Configure the model for structured extraction
	model.SetTemperature(0.1) // Low temperature for consistent, factual responses

	return &Client{
		client: client,
		model:  model,
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
