package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/locwid/mscx/internal/config"
	"github.com/locwid/mscx/internal/database/models"
	gonanoid "github.com/matoous/go-nanoid/v2"
	"gorm.io/gorm"
)

type YoutubeService interface {
	CheckDependencies() error
	ImportPlaylist(url string) error
}

type ImportJob struct {
	URL string
}

type youtubeService struct {
	db      *gorm.DB
	jobChan chan ImportJob
}

func MakeYoutubeService(db *gorm.DB) YoutubeService {
	service := &youtubeService{
		db:      db,
		jobChan: make(chan ImportJob, 10), // buffered channel
	}
	go service.startWorker()
	return service
}

func (s *youtubeService) startWorker() {
	for job := range s.jobChan {
		if err := s.processJob(job); err != nil {
			fmt.Printf("Error processing job for URL %s: %v\n", job.URL, err)
		}
	}
}

func (s *youtubeService) CheckDependencies() error {
	deps := []string{"yt-dlp", "ffmpeg", "bun"}
	for _, dep := range deps {
		if err := exec.Command("which", dep).Run(); err != nil {
			return fmt.Errorf("dependency %s not found", dep)
		}
	}
	return nil
}

func (s *youtubeService) ImportPlaylist(url string) error {
	job := ImportJob{URL: url}
	select {
	case s.jobChan <- job:
		return nil
	default:
		return fmt.Errorf("queue full")
	}
}

func (s *youtubeService) processJob(job ImportJob) error {
	fmt.Printf("Starting import for URL: %s\n", job.URL)
	// First, get all video IDs from playlist
	playlistIDs, err := s.getPlaylistVideoIDs(job.URL)
	if err != nil {
		return fmt.Errorf("failed to get playlist IDs: %v", err)
	}

	// Find existing IDs in DB
	var existingTracks []models.Track
	if len(playlistIDs) > 0 {
		s.db.Where("youtube_id IN ?", playlistIDs).Find(&existingTracks)
	}
	existingIDMap := make(map[string]bool)
	for _, track := range existingTracks {
		existingIDMap[track.YoutubeID] = true
	}

	// If all videos already exist, skip download
	if len(playlistIDs) == len(existingIDMap) {
		fmt.Printf("All %d videos already exist, skipping download\n", len(playlistIDs))
		return nil
	}

	// Build match filter to exclude existing
	var filters []string
	for _, id := range playlistIDs {
		if existingIDMap[id] {
			filters = append(filters, fmt.Sprintf("id!='%s'", id))
		}
	}
	matchFilter := ""
	if len(filters) > 0 {
		matchFilter = strings.Join(filters, " & ")
	}

	// Change to temp dir
	tempDir := config.GetTempDir()
	args := []string{"--extract-audio", "--audio-format", "mp3", "--embed-thumbnail", "--audio-quality", "0", "--js-runtimes", "bun", "--output", "%(title)s___%(duration)s___%(id)s.%(ext)s"}
	if matchFilter != "" {
		args = append(args, "--match-filter", matchFilter)
	}
	args = append(args, job.URL)
	cmd := exec.Command("yt-dlp", args...)
	cmd.Dir = tempDir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("yt-dlp failed: %v, output: %s", err, string(output))
	}

	// Scan temp dir for mp3 files
	files, err := os.ReadDir(tempDir)
	if err != nil {
		return err
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".mp3") {
			// Parse filename: title___duration___id.mp3
			baseName := strings.TrimSuffix(file.Name(), ".mp3")
			parts := strings.Split(baseName, "___")
			if len(parts) != 3 {
				continue
			}
			title := parts[0]
			durationStr := parts[1]
			youtubeID := parts[2]

			duration, err := strconv.Atoi(durationStr)
			if err != nil {
				continue
			}

			// Check if track already exists
			var existing models.Track
			if err := s.db.Where("youtube_id = ?", youtubeID).First(&existing).Error; err == nil {
				// Already exists, skip
				continue
			}

			filePath := filepath.Join(tempDir, file.Name())
			info, err := os.Stat(filePath)
			if err != nil {
				continue
			}

			id, err := gonanoid.New()
			if err != nil {
				continue
			}

			track := models.Track{
				ID:        id,
				Name:      title + ".mp3",
				Size:      uint(info.Size()),
				Duration:  uint(duration),
				Type:      "audio/mpeg",
				YoutubeID: youtubeID,
				CreatedAt: info.ModTime(),
			}

			// Save to DB
			err = s.db.Create(&track).Error
			if err != nil {
				continue
			}

			// Move file to files dir
			destPath := config.GetFilePath(track.GetFilename())
			err = os.Rename(filePath, destPath)
			if err != nil {
				// Rollback DB
				s.db.Delete(&track)
			}
		}
	}

	fmt.Printf("Import completed for URL: %s\n", job.URL)
	return nil
}

func (s *youtubeService) getPlaylistVideoIDs(url string) ([]string, error) {
	cmd := exec.Command("yt-dlp", "--flat-playlist", "--print", "id", url)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var ids []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			ids = append(ids, line)
		}
	}
	return ids, nil
}
