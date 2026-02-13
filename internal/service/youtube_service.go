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

const (
	filenameSeparator = "___"
	mp3Extension      = ".mp3"
	audioFormat       = "audio/mpeg"
	filenamePattern   = "%(title)s___%(duration)s___%(id)s.%(ext)s"
	queueSize         = 1000
)

type YoutubeService interface {
	CheckDependencies() error
	ImportPlaylist(url string) error
}

type ImportJob struct {
	VideoID  string
	VideoURL string
}

type youtubeService struct {
	db      *gorm.DB
	jobChan chan ImportJob
}

func MakeYoutubeService(db *gorm.DB) YoutubeService {
	service := &youtubeService{
		db:      db,
		jobChan: make(chan ImportJob, queueSize),
	}
	go service.startWorker()
	return service
}

func (s *youtubeService) startWorker() {
	for job := range s.jobChan {
		if err := s.processJob(job); err != nil {
			fmt.Printf("Error processing job for video %s: %v\n", job.VideoID, err)
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
	fmt.Printf("Starting import for playlist: %s\n", url)
	// Get all video IDs from playlist
	videoIDs, err := s.getPlaylistVideoIDs(url)
	if err != nil {
		return fmt.Errorf("failed to get playlist IDs: %v", err)
	}

	if len(videoIDs) == 0 {
		return fmt.Errorf("no videos found in playlist")
	}

	fmt.Printf("Found %d videos in playlist\n", len(videoIDs))

	// Queue a separate job for each video
	for _, videoID := range videoIDs {
		job := ImportJob{
			VideoID:  videoID,
			VideoURL: fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID),
		}
		select {
		case s.jobChan <- job:
			fmt.Printf("Queued job for video %s\n", videoID)
		default:
			return fmt.Errorf("queue full after queueing %d videos", len(videoIDs))
		}
	}

	return nil
}

func (s *youtubeService) processJob(job ImportJob) error {
	fmt.Printf("Starting download for video %s: %s\n", job.VideoID, job.VideoURL)

	if s.trackExists(job.VideoID) {
		fmt.Printf("Video %s already exists, skipping\n", job.VideoID)
		return nil
	}

	filePath, err := s.downloadVideo(job)
	if err != nil {
		return err
	}

	track, err := s.saveTrackFromFile(job.VideoID, filePath)
	if err != nil {
		return err
	}

	// Extract and move thumbnail
	tempDir := config.GetTempDir()
	thumbnailPath, err := s.findThumbnail(tempDir, job.VideoID)
	if err == nil {
		if err := s.moveThumbnail(thumbnailPath, track.ID); err != nil {
			fmt.Printf("Warning: failed to move thumbnail for video %s: %v\n", job.VideoID, err)
			// Don't fail the whole import if thumbnail move fails
		}
	} else {
		fmt.Printf("Info: no thumbnail found for video %s\n", job.VideoID)
	}

	fmt.Printf("Successfully imported video %s\n", job.VideoID)
	return nil
}

func (s *youtubeService) trackExists(youtubeID string) bool {
	var existing models.Track
	return s.db.Where("youtube_id = ?", youtubeID).First(&existing).Error == nil
}

func (s *youtubeService) downloadVideo(job ImportJob) (string, error) {
	tempDir := config.GetTempDir()
	args := []string{
		"--extract-audio",
		"--audio-format", "mp3",
		"--write-thumbnail",
		"--convert-thumbnails", "webp",
		"--audio-quality", "0",
		"--js-runtimes", "bun",
		"--output", filenamePattern,
		job.VideoURL,
	}

	cmd := exec.Command("yt-dlp", args...)
	cmd.Dir = tempDir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("yt-dlp failed for video %s: %v, output: %s", job.VideoID, err, string(output))
	}

	filePath, err := s.findDownloadedFile(tempDir, job.VideoID)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

func (s *youtubeService) findDownloadedFile(tempDir, videoID string) (string, error) {
	files, err := os.ReadDir(tempDir)
	if err != nil {
		return "", err
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), mp3Extension) {
			if youtubeID := s.extractYoutubeID(file.Name()); youtubeID == videoID {
				return filepath.Join(tempDir, file.Name()), nil
			}
		}
	}

	return "", fmt.Errorf("no mp3 file found for video %s", videoID)
}

func (s *youtubeService) extractYoutubeID(filename string) string {
	baseName := strings.TrimSuffix(filename, mp3Extension)
	parts := strings.Split(baseName, filenameSeparator)
	if len(parts) != 3 {
		return ""
	}
	return parts[2]
}

func (s *youtubeService) extractYoutubeIDFromAnyFile(filename string) string {
	// Remove any file extension
	baseName := filename
	if idx := strings.LastIndex(baseName, "."); idx >= 0 {
		baseName = baseName[:idx]
	}

	parts := strings.Split(baseName, filenameSeparator)
	if len(parts) != 3 {
		return ""
	}
	return parts[2]
}

func (s *youtubeService) parseFilename(filename string) (title string, duration uint, youtubeID string, err error) {
	baseName := strings.TrimSuffix(filename, mp3Extension)
	parts := strings.Split(baseName, filenameSeparator)
	if len(parts) != 3 {
		return "", 0, "", fmt.Errorf("invalid filename format")
	}

	durationInt, err := strconv.Atoi(parts[1])
	if err != nil {
		return "", 0, "", fmt.Errorf("invalid duration: %v", err)
	}

	return parts[0], uint(durationInt), parts[2], nil
}

func (s *youtubeService) saveTrackFromFile(videoID, filePath string) (*models.Track, error) {
	title, duration, youtubeID, err := s.parseFilename(filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("failed to parse filename: %v", err)
	}

	if youtubeID != videoID {
		return nil, fmt.Errorf("youtube ID mismatch: expected %s, got %s", videoID, youtubeID)
	}

	info, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %v", err)
	}

	id, err := gonanoid.New()
	if err != nil {
		return nil, fmt.Errorf("failed to generate ID: %v", err)
	}

	track := models.Track{
		ID:        id,
		Name:      title + mp3Extension,
		Size:      uint(info.Size()),
		Duration:  duration,
		Type:      audioFormat,
		YoutubeID: youtubeID,
		CreatedAt: info.ModTime(),
	}

	if err := s.db.Create(&track).Error; err != nil {
		return nil, fmt.Errorf("failed to save track to DB: %v", err)
	}

	destPath := config.GetFilePath(track.GetFilename())
	if err := os.Rename(filePath, destPath); err != nil {
		s.db.Delete(&track)
		return nil, fmt.Errorf("failed to move file: %v", err)
	}

	return &track, nil
}

func (s *youtubeService) findThumbnail(tempDir, videoID string) (string, error) {
	files, err := os.ReadDir(tempDir)
	if err != nil {
		return "", err
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".webp") {
			if youtubeID := s.extractYoutubeIDFromAnyFile(file.Name()); youtubeID == videoID {
				return filepath.Join(tempDir, file.Name()), nil
			}
		}
	}

	return "", fmt.Errorf("no webp thumbnail found for video %s", videoID)
}

func (s *youtubeService) moveThumbnail(thumbnailPath, trackID string) error {
	destPath := config.GetFilePath(trackID + ".webp")
	if err := os.Rename(thumbnailPath, destPath); err != nil {
		return fmt.Errorf("failed to move thumbnail: %v", err)
	}
	return nil
}

func (s *youtubeService) getPlaylistVideoIDs(url string) ([]string, error) {
	cmd := exec.Command("yt-dlp", "--flat-playlist", "--print", "id", url)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch playlist: %v", err)
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
