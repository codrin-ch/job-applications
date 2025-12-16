package agent

import (
	"regexp"
	"strings"
)

// SanitizeText removes sensitive information like emails and phone numbers from text
func SanitizeText(text string) string {
	// Regex to remove emails
	emailRe := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	text = emailRe.ReplaceAllString(text, "[EMAIL_REDACTED]")

	// Regex to remove phone numbers
	phoneRe := regexp.MustCompile(`(?:\+?\d{1,3}[-.●\s]?)?\(?\d{2,4}\)?[-\.●\s]?\d{3,4}[-\.●\s]?\d{4}(?:[-\.●\s]?x\d{1,5})?`)
	text = phoneRe.ReplaceAllString(text, "[PHONE_REDACTED]")

	// Another idea here is to remove noisy things such as disclaimers for diversity, etc.

	return text
}

func SanitizeAgentJSONResponse(agentResponse string) string {
	agentResponse = strings.TrimSpace(agentResponse)

	// Remove markdown code blocks if present
	agentResponse = strings.TrimPrefix(agentResponse, "```json")
	agentResponse = strings.TrimPrefix(agentResponse, "```")
	agentResponse = strings.TrimSuffix(agentResponse, "```")
	agentResponse = strings.TrimSpace(agentResponse)

	return agentResponse
}
