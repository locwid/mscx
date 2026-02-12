package controller

import (
	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/dto"
	"github.com/locwid/mscx/internal/service"
)

type ImportController interface {
	ImportFromYoutube(c *echo.Context) error
}

type importController struct {
	youtubeService service.YoutubeService
}

func MakeImportController(youtubeService service.YoutubeService) ImportController {
	return importController{youtubeService}
}

func (i importController) ImportFromYoutube(c *echo.Context) error {
	payload := new(dto.ImportPlaylistDTO)
	if err := c.Bind(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	if err := c.Validate(payload); err != nil {
		return echo.ErrBadRequest.Wrap(err)
	}

	// Check dependencies
	if err := i.youtubeService.CheckDependencies(); err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	// Enqueue import
	if err := i.youtubeService.ImportPlaylist(payload.URL); err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	return c.JSON(200, map[string]string{"status": "queued"})
}
