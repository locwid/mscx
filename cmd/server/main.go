package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/locwid/mscx/internal/controller"
	"github.com/locwid/mscx/internal/database"
)

func main() {
	db := database.InitDatabase()
	e := echo.New()
	e.Use(middleware.Recover())
	api := e.Group("/api")

	trackController := controller.MakeTrackController(db)
	track := api.Group("/track")
	track.GET("/", trackController.GetList)
	track.POST("/", trackController.Create)
	track.DELETE("/", trackController.Delete)

	playlistController := controller.MakePlaylistContoller(db)
	playlist := api.Group("/playlist")
	playlist.GET("/", playlistController.GetList)
	playlist.POST("/", playlistController.Create)
	playlist.DELETE("/:id", playlistController.Delete)

	e.Logger.Fatal(e.Start(":1323"))
}
