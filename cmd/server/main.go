package main

import (
	"fmt"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/locwid/mscx/internal/config"
	"github.com/locwid/mscx/internal/controller"
	"github.com/locwid/mscx/internal/database"
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
	e.Use(middleware.CORS())
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:  "web",
		HTML5: true,
	}))

	api := e.Group("/api")
	api.Static("/file", config.GetFilesDir())

	trackController := controller.MakeTrackController(db)
	track := api.Group("/track")
	track.GET("", trackController.GetList)
	track.POST("", trackController.Create)
	track.DELETE("/:id", trackController.Delete)

	playlistController := controller.MakePlaylistContoller(db)
	playlist := api.Group("/playlist")
	playlist.GET("", playlistController.GetList)
	playlist.POST("", playlistController.Create)
	playlist.DELETE("/:id", playlistController.Delete)

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", config.GetPort())))
}
