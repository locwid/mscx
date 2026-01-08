package database

import (
	"github.com/locwid/mscx/internal/database/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func InitDatabase(dbName string) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&models.Track{}, &models.Playlist{})
	return db
}
