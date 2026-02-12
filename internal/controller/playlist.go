package controller

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/dto"
	"github.com/locwid/mscx/internal/service"
)

type PlaylistController interface {
	Create(c *echo.Context) error
	GetList(c *echo.Context) error
	Delete(c *echo.Context) error
	AddTrack(c *echo.Context) error
	DeleteTrack(c *echo.Context) error
}

type playlistController struct {
	playlistService service.PlaylistService
}

func MakePlaylistContoller(playlistService service.PlaylistService) PlaylistController {
	return playlistController{playlistService}
}

// AddTrack implements [PlaylistController].
func (p playlistController) AddTrack(c *echo.Context) error {
	var id, trackId string
	err := echo.PathValuesBinder(c).String("id", &id).String("trackId", &trackId).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}
	err = p.playlistService.AddTrackToPlaylist(id, trackId)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.NoContent(http.StatusOK)
}

// DeleteTrack implements [PlaylistController].
func (p playlistController) DeleteTrack(c *echo.Context) error {
	var id, trackId string
	err := echo.PathValuesBinder(c).String("id", &id).String("trackId", &trackId).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}
	err = p.playlistService.RemoveTrackFromPlaylist(id, trackId)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.NoContent(http.StatusOK)
}

// Create implements [PlaylistController].
func (p playlistController) Create(c *echo.Context) error {
	payload := new(dto.CreatePlaylistDTO)
	if err := c.Bind(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	playlist, err := p.playlistService.CreatePlaylist(*payload)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.JSON(http.StatusOK, playlist)
}

// Delete implements [PlaylistController].
func (p playlistController) Delete(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	err = p.playlistService.DeletePlaylist(id)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.NoContent(http.StatusOK)
}

// GetList implements [PlaylistController].
func (p playlistController) GetList(c *echo.Context) error {
	playlists, err := p.playlistService.GetPlaylists()
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.JSON(http.StatusOK, playlists)
}
