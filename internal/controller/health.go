package controller

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/locwid/mscx/internal/service"
)

type HealthController interface {
	Check(c *echo.Context) error
}

type healthController struct {
	healthService service.HealthService
}

func MakeHealthController(healthService service.HealthService) HealthController {
	return &healthController{healthService}
}

func (h *healthController) Check(c *echo.Context) error {
	response, err := h.healthService.Check()
	if err != nil {
		return echo.ErrInternalServerError.Wrap(err)
	}

	// Return 503 if not healthy, 200 if healthy or degraded
	if response.Status == "unhealthy" {
		return c.JSON(http.StatusServiceUnavailable, response)
	}

	return c.JSON(http.StatusOK, response)
}
