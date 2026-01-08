package models

import "time"

type Track struct {
	ID string `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`
	File string `json:"file"`
	Size uint  `json:"size"`
	Duration uint `json:"duration"`
	Type string `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
}

type Playlist struct {
	ID string `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Tracks []*Track `gorm:"many2many:playlist_tracks;"`
}
