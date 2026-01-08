package dto

import (
	"mime/multipart"
	"time"
)

type CreateTrackDTO struct {
	ID string `form:"id" validate:"required"`
	Name string `form:"name" validate:"required"`
	Size uint `form:"size" validate:"required"`
	Duration uint `form:"duration" validate:"required"`
	Type string `from:"type" validate:"required"`
	File *multipart.FileHeader `form:"file" validate:"required"`
	CreatedAt time.Time `form:"name" validate:"required"`
}
