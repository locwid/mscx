package controller

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/dto"
	"github.com/locwid/mscx/internal/service"
)

type TagController interface {
	Create(c *echo.Context) error
	GetList(c *echo.Context) error
	Delete(c *echo.Context) error
	AddTrack(c *echo.Context) error
	DeleteTrack(c *echo.Context) error
}

type tagController struct {
	tagService service.TagService
}

func MakeTagController(tagService service.TagService) TagController {
	return tagController{tagService}
}

func (t tagController) AddTrack(c *echo.Context) error {
	var id, trackID string
	err := echo.PathValuesBinder(c).String("id", &id).String("trackId", &trackID).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	err = t.tagService.AddTrackToTag(id, trackID)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.NoContent(http.StatusOK)
}

func (t tagController) DeleteTrack(c *echo.Context) error {
	var id, trackID string
	err := echo.PathValuesBinder(c).String("id", &id).String("trackId", &trackID).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	err = t.tagService.RemoveTrackFromTag(id, trackID)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.NoContent(http.StatusOK)
}

func (t tagController) Create(c *echo.Context) error {
	payload := new(dto.CreateTagDTO)
	if err := c.Bind(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}
	if err := c.Validate(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	tag, err := t.tagService.CreateTag(*payload)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.JSON(http.StatusOK, tag)
}

func (t tagController) Delete(c *echo.Context) error {
	var id string
	err := echo.PathValuesBinder(c).String("id", &id).BindError()
	if err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	err = t.tagService.DeleteTag(id)
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.NoContent(http.StatusOK)
}

func (t tagController) GetList(c *echo.Context) error {
	tags, err := t.tagService.GetTags()
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}
	return c.JSON(http.StatusOK, tags)
}
