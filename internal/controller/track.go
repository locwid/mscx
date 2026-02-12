package controller

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/dto"
	"github.com/locwid/mscx/internal/service"
	"gorm.io/gorm"
)

type TrackController interface {
	Create(c *echo.Context) error
	GetList(c *echo.Context) error
	Delete(c *echo.Context) error
	GetFile(c *echo.Context) error
}

type trackController struct {
	trackService service.TrackService
}

func MakeTrackController(trackService service.TrackService) TrackController {
	return trackController{trackService}
}

// GetFile implements [TrackController].
func (t trackController) GetFile(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	filePath, err := t.trackService.GetTrackFilePath(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.ErrNotFound
		}
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.File(filePath)
}

// Create implements [TrackController].
func (t trackController) Create(c *echo.Context) error {
	payload := new(dto.CreateTrackDTO)
	if err := c.Bind(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}
	if err := c.Validate(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	track, err := t.trackService.CreateTrack(*payload)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.JSON(http.StatusOK, track)
}

// Delete implements [TrackController].
func (t trackController) Delete(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	err = t.trackService.DeleteTrack(id)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.NoContent(http.StatusOK)
}

// GetList implements [TrackController].
func (t trackController) GetList(c *echo.Context) error {
	tracks, err := t.trackService.GetTracks()
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.JSON(http.StatusOK, tracks)
}
