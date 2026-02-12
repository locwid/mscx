package dto

import "time"

type HealthResponse struct {
	Status       string          `json:"status"`
	Database     bool            `json:"database"`
	Dependencies map[string]bool `json:"dependencies"`
	Timestamp    time.Time       `json:"timestamp"`
}
