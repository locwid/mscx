package service

import (
	"github.com/locwid/mscx/internal/database/models"
	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
)

type TagService interface {
	CreateTag(dto.CreateTagDTO) (*models.Tag, error)
	GetTags() ([]*models.Tag, error)
	DeleteTag(id string) error
	AddTrackToTag(tagID, trackID string) error
	RemoveTrackFromTag(tagID, trackID string) error
}

type tagService struct {
	db *gorm.DB
}

func MakeTagService(db *gorm.DB) TagService {
	return &tagService{db: db}
}

func (s *tagService) CreateTag(payload dto.CreateTagDTO) (*models.Tag, error) {
	tag := models.Tag{
		ID:   payload.ID,
		Name: payload.Name,
	}

	err := s.db.Create(&tag).Error
	if err != nil {
		return nil, err
	}

	return &tag, nil
}

func (s *tagService) GetTags() ([]*models.Tag, error) {
	var tags []*models.Tag
	err := s.db.Preload("Tracks").Find(&tags).Error
	if err != nil {
		return nil, err
	}
	return tags, nil
}

func (s *tagService) DeleteTag(id string) error {
	return s.db.Where("id = ?", id).Delete(&models.Tag{}).Error
}

func (s *tagService) AddTrackToTag(tagID, trackID string) error {
	return s.db.Model(&models.Tag{ID: tagID}).Association("Tracks").Append(&models.Track{ID: trackID})
}

func (s *tagService) RemoveTrackFromTag(tagID, trackID string) error {
	return s.db.Model(&models.Tag{ID: tagID}).Association("Tracks").Delete(&models.Track{ID: trackID})
}
