package service

import (
	"io"
	"os"

	"github.com/locwid/mscx/internal/config"
	"github.com/locwid/mscx/internal/database/models"
	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TrackService interface {
	CreateTrack(dto.CreateTrackDTO) (*models.Track, error)
	GetTrack(id string) (*models.Track, error)
	GetTracks() ([]*models.Track, error)
	DeleteTrack(id string) error
	GetTrackFilePath(id string) (string, error)
}

type trackService struct {
	db *gorm.DB
}

func MakeTrackService(db *gorm.DB) TrackService {
	return &trackService{db: db}
}

func (s *trackService) CreateTrack(payload dto.CreateTrackDTO) (*models.Track, error) {
	track := models.Track{
		ID:        payload.ID,
		Name:      payload.Name,
		Size:      payload.Size,
		Duration:  payload.Duration,
		Type:      payload.Type,
		YoutubeID: payload.YoutubeID,
		CreatedAt: payload.CreatedAt,
	}

	err := s.db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&track).Error
	if err != nil {
		return nil, err
	}

	src, err := payload.File.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	dst, err := os.Create(config.GetFilePath(track.GetFilename()))
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return nil, err
	}

	return &track, nil
}

func (s *trackService) GetTrack(id string) (*models.Track, error) {
	var track models.Track
	err := s.db.Where("id = ?", id).First(&track).Error
	if err != nil {
		return nil, err
	}
	return &track, nil
}

func (s *trackService) GetTracks() ([]*models.Track, error) {
	var tracks []*models.Track
	err := s.db.Find(&tracks).Error
	if err != nil {
		return nil, err
	}
	return tracks, nil
}

func (s *trackService) DeleteTrack(id string) error {
	track, err := s.GetTrack(id)
	if err != nil {
		return err
	}

	err = s.db.Where("id = ?", id).Delete(&models.Track{}).Error
	if err != nil {
		return err
	}

	err = os.Remove(config.GetFilePath(track.GetFilename()))
	if err != nil {
		return err
	}

	return nil
}

func (s *trackService) GetTrackFilePath(id string) (string, error) {
	track, err := s.GetTrack(id)
	if err != nil {
		return "", err
	}
	return config.GetFilePath(track.GetFilename()), nil
}
