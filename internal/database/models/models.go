package models

import (
	"path/filepath"
	"strings"
	"time"
)

type Track struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	Size      uint      `json:"size"`
	Duration  uint      `json:"duration"`
	Type      string    `json:"type"`
	YoutubeID string    `json:"youtubeId" gorm:"uniqueIndex"`
	CreatedAt time.Time `json:"createdAt"`
}

func (t Track) GetFilename() string {
	ext := filepath.Ext(t.Name)
	return strings.Join([]string{t.ID, ext}, "")
}

type Playlist struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Tracks    []*Track  `json:"tracks" gorm:"many2many:playlist_tracks;"`
}
