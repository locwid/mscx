package controller

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/locwid/mscx/internal/database/models"
	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
)

type PlaylistController interface {
	Create(c echo.Context) error
	GetList(c echo.Context) error
	Delete(c echo.Context) error
	AddTrack(c echo.Context) error
	DeleteTrack(c echo.Context) error
}

type playlistController struct {
	db *gorm.DB
}

func MakePlaylistContoller(db *gorm.DB) PlaylistController {
	return playlistController{db}
}

// AddTrack implements [PlaylistController].
func (p playlistController) AddTrack(c echo.Context) error {
	var id, trackId string
	err := echo.PathParamsBinder(c).String("id", &id).String("trackId", &trackId).BindError()
	if err != nil {
		return echo.ErrBadRequest
	}
	err = p.db.Model(&models.Playlist{ID: id}).Association("Tracks").Append(&models.Track{ID: trackId})
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.NoContent(http.StatusOK)
}

// DeleteTrack implements [PlaylistController].
func (p playlistController) DeleteTrack(c echo.Context) error {
	var id, trackId string
	err := echo.PathParamsBinder(c).String("id", &id).String("trackId", &trackId).BindError()
	if err != nil {
		return echo.ErrBadRequest
	}
	err = p.db.Model(&models.Playlist{ID: id}).Association("Tracks").Delete(&models.Track{ID: trackId})
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.NoContent(http.StatusOK)
}

// Create implements [PlaylistController].
func (p playlistController) Create(c echo.Context) error {
	payload := new(dto.CreatePlaylistDTO)
	if err := c.Bind(payload); err != nil {
		return echo.ErrBadRequest
	}

	playlist := models.Playlist{
		ID:   payload.ID,
		Name: payload.Name,
	}
	err := gorm.G[models.Playlist](p.db).Create(c.Request().Context(), &playlist)
	if err != nil {
		return echo.ErrInternalServerError
	}

	return c.JSON(http.StatusOK, playlist)
}

// Delete implements [PlaylistController].
func (p playlistController) Delete(c echo.Context) error {
	var id string
	err := echo.PathParamsBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest
	}

	_, err = gorm.G[models.Playlist](p.db).Where("id = ?", id).Delete(c.Request().Context())
	if err != nil {
		return echo.ErrInternalServerError
	}

	return c.NoContent(http.StatusOK)
}

// GetList implements [PlaylistController].
func (p playlistController) GetList(c echo.Context) error {
	playlists, err := gorm.G[models.Playlist](p.db).Preload("Tracks", nil).Find(c.Request().Context())
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusOK, playlists)
}
