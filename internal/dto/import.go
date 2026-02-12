package dto

type ImportPlaylistDTO struct {
	URL string `json:"url" validate:"required,url"`
}
