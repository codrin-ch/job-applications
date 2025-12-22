package models

type Step struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type StepInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
