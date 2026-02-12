package service

import (
	"os/exec"
	"time"

	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
)

type HealthService interface {
	Check() (*dto.HealthResponse, error)
}

type healthService struct {
	db             *gorm.DB
	youtubeService YoutubeService
}

func MakeHealthService(db *gorm.DB, youtubeService YoutubeService) HealthService {
	return &healthService{
		db:             db,
		youtubeService: youtubeService,
	}
}

func (s *healthService) Check() (*dto.HealthResponse, error) {
	response := &dto.HealthResponse{
		Timestamp:    time.Now(),
		Dependencies: make(map[string]bool),
	}

	// Check database
	sqlDB, err := s.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		response.Status = "unhealthy"
		response.Database = false
	} else {
		response.Database = true
	}

	// Check dependencies
	deps := []string{"yt-dlp", "ffmpeg", "bun"}
	for _, dep := range deps {
		if err := exec.Command("which", dep).Run(); err != nil {
			response.Dependencies[dep] = false
		} else {
			response.Dependencies[dep] = true
		}
	}

	// Determine overall status
	if response.Database {
		allDepsOk := true
		for _, ok := range response.Dependencies {
			if !ok {
				allDepsOk = false
				break
			}
		}
		if allDepsOk {
			response.Status = "healthy"
		} else {
			response.Status = "degraded"
		}
	}

	return response, nil
}
