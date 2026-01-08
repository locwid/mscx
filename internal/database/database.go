package database

import (
	"github.com/locwid/mscx/internal/database/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func InitDatabase() *gorm.DB {
	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
    panic("failed to connect database")
  }
	db.AutoMigrate(&models.Track{}, &models.Playlist{})
	return db
}
