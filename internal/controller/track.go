package controller

import (
	"errors"
	"io"
	"net/http"
	"os"

	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/config"
	"github.com/locwid/mscx/internal/database/models"
	"github.com/locwid/mscx/internal/dto"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TrackController interface {
	Create(c *echo.Context) error
	GetList(c *echo.Context) error
	Delete(c *echo.Context) error
	GetFile(c *echo.Context) error
}

type trackController struct {
	db *gorm.DB
}

func MakeTrackController(db *gorm.DB) TrackController {
	return trackController{db}
}

// GetFile implements [TrackController].
func (t trackController) GetFile(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	track, err := gorm.G[models.Track](t.db).Where("id = ?", id).First(c.Request().Context())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return echo.ErrNotFound
		}
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.File(config.GetFilePath(track.GetFilename()))
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

	track := models.Track{
		ID:        payload.ID,
		Name:      payload.Name,
		Size:      payload.Size,
		Duration:  payload.Duration,
		Type:      payload.Type,
		CreatedAt: payload.CreatedAt,
	}

	t.db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&track)

	src, err := payload.File.Open()
	if err != nil {
		return echo.ErrInternalServerError
	}
	defer src.Close()

	dst, err := os.Create(config.GetFilePath(track.GetFilename()))
	if err != nil {
		return echo.ErrInternalServerError
	}

	if _, err = io.Copy(dst, src); err != nil {
		return echo.ErrInternalServerError
	}

	return c.JSON(http.StatusOK, track)
}

// Delete implements [TrackController].
func (t trackController) Delete(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest
	}
	ctx := c.Request().Context()
	track, err := gorm.G[models.Track](t.db).Where("id = ?", id).First(ctx)
	if err != nil {
		return c.NoContent(http.StatusOK)
	}

	_, err = gorm.G[models.Track](t.db).Where("id = ?", id).Delete(ctx)
	if err != nil {
		return echo.ErrInternalServerError
	}

	err = os.Remove(config.GetFilePath(track.GetFilename()))
	if err != nil {
		return echo.ErrInternalServerError
	}

	return c.NoContent(http.StatusOK)
}

// GetList implements [TrackController].
func (t trackController) GetList(c *echo.Context) error {
	tracks, err := gorm.G[models.Track](t.db).Find(c.Request().Context())
	if err != nil {
		return echo.ErrInternalServerError
	}
	return c.JSON(http.StatusOK, tracks)
}
