package agent

import (
	"context"
	"data-analyzer/config"
	"fmt"

	"google.golang.org/genai"
)

// Client wraps the Google Gemini generative AI client
type Client struct {
	client    *genai.Client
	ModelName string
}

// NewClient creates a new Gemini client with the provided API key
func NewClient(ctx context.Context, cfg *config.Config) (*Client, error) {
	if cfg.GeminiAPIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY environment variable not set")
	}

	if cfg.GeminiModel == "" {
		return nil, fmt.Errorf("GEMINI_MODEL environment variable not set")
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  cfg.GeminiAPIKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &Client{
		client:    client,
		ModelName: cfg.GeminiModel,
	}, nil
}

// Close closes the Gemini client connection
func (g *Client) Close() error {
	// The new genai client doesn't require explicit closing
	return nil
}

// GenerateContent generates content using the Gemini model
func (g *Client) GenerateContent(ctx context.Context, prompt string, temperature float32, useGoogleSearch bool) (*genai.GenerateContentResponse, error) {
	content := []*genai.Content{
		{
			Parts: []*genai.Part{
				{Text: prompt},
			},
		},
	}
	contentConfig := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(temperature),
		Tools:       []*genai.Tool{},
	}
	if useGoogleSearch {
		contentConfig.Tools = append(contentConfig.Tools, &genai.Tool{GoogleSearch: &genai.GoogleSearch{}})
	}
	result, err := g.client.Models.GenerateContent(ctx, g.ModelName, content, contentConfig)
	if err != nil {
		return nil, err
	}
	return result, nil
}
