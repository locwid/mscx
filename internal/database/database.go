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
	migrator := db.Migrator()
	if migrator.HasTable("playlist_tracks") {
		_ = migrator.DropTable("playlist_tracks")
	}
	if migrator.HasTable("playlists") {
		_ = migrator.DropTable("playlists")
	}
	db.AutoMigrate(&models.Track{}, &models.Tag{})
	return db
}
