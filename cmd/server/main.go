package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/locwid/mscx/internal/config"
	"github.com/locwid/mscx/internal/controller"
	"github.com/locwid/mscx/internal/database"
	"github.com/locwid/mscx/internal/service"
	"github.com/locwid/mscx/internal/utils"
)

func main() {
	config.InitConfig()
	db := database.InitDatabase(config.GetDbPath())

	e := echo.New()
	e.Validator = &utils.CustomValidator{
		Validator: validator.New(),
	}
	e.Use(middleware.Recover())
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:  "web",
		HTML5: true,
	}))

	api := e.Group("/api")
	api.Use(middleware.KeyAuthWithConfig(middleware.KeyAuthConfig{
		KeyLookup: "header:Authorization,query:authKey",
		Validator: func(c *echo.Context, key string, source middleware.ExtractorSource) (bool, error) {
			return key == config.GetAuthKey(), nil
		},
	}))

	trackService := service.MakeTrackService(db)
	trackController := controller.MakeTrackController(trackService)
	track := api.Group("/track")
	track.GET("", trackController.GetList)
	track.POST("", trackController.Create)
	track.DELETE("/:id", trackController.Delete)
	track.GET("/:id/file", trackController.GetFile)
	track.GET("/:id/thumbnail", trackController.GetThumbnail)

	youtubeService := service.MakeYoutubeService(db)
	importController := controller.MakeImportController(youtubeService)
	importGroup := api.Group("/import")
	importGroup.POST("/youtube", importController.ImportFromYoutube)

	playlistService := service.MakePlaylistService(db)
	playlistController := controller.MakePlaylistContoller(playlistService)
	playlist := api.Group("/playlist")
	playlist.GET("", playlistController.GetList)
	playlist.POST("", playlistController.Create)
	playlist.DELETE("/:id", playlistController.Delete)
	playlist.POST("/:id/track/:trackId", playlistController.AddTrack)
	playlist.DELETE("/:id/track/:trackId", playlistController.DeleteTrack)

	healthService := service.MakeHealthService(db, youtubeService)
	healthController := controller.MakeHealthController(healthService)
	api.GET("/health", healthController.Check)

	// Gracefull shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	sc := echo.StartConfig{
		Address:         fmt.Sprintf(":%s", config.GetPort()),
		GracefulTimeout: 2 * time.Second,
	}
	if err := sc.Start(ctx, e); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
