package dto

type CreateTagDTO struct {
	ID   string `json:"id" validate:"required"`
	Name string `json:"name" validate:"required"`
}
