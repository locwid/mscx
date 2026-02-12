package service

import (
	"github.com/locwid/mscx/internal/database/models"
	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
)

type PlaylistService interface {
	CreatePlaylist(dto.CreatePlaylistDTO) (*models.Playlist, error)
	GetPlaylists() ([]*models.Playlist, error)
	DeletePlaylist(id string) error
	AddTrackToPlaylist(playlistID, trackID string) error
	RemoveTrackFromPlaylist(playlistID, trackID string) error
}

type playlistService struct {
	db *gorm.DB
}

func MakePlaylistService(db *gorm.DB) PlaylistService {
	return &playlistService{db: db}
}

func (s *playlistService) CreatePlaylist(payload dto.CreatePlaylistDTO) (*models.Playlist, error) {
	playlist := models.Playlist{
		ID:   payload.ID,
		Name: payload.Name,
	}
	err := s.db.Create(&playlist).Error
	if err != nil {
		return nil, err
	}
	return &playlist, nil
}

func (s *playlistService) GetPlaylists() ([]*models.Playlist, error) {
	var playlists []*models.Playlist
	err := s.db.Preload("Tracks").Find(&playlists).Error
	if err != nil {
		return nil, err
	}
	return playlists, nil
}

func (s *playlistService) DeletePlaylist(id string) error {
	err := s.db.Where("id = ?", id).Delete(&models.Playlist{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (s *playlistService) AddTrackToPlaylist(playlistID, trackID string) error {
	err := s.db.Model(&models.Playlist{ID: playlistID}).Association("Tracks").Append(&models.Track{ID: trackID})
	if err != nil {
		return err
	}
	return nil
}

func (s *playlistService) RemoveTrackFromPlaylist(playlistID, trackID string) error {
	err := s.db.Model(&models.Playlist{ID: playlistID}).Association("Tracks").Delete(&models.Track{ID: trackID})
	if err != nil {
		return err
	}
	return nil
}
