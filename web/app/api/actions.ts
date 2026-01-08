import { apiFetch } from './fetch'
import type {
  CreatePlaylistPayload,
  CreateTrackPayload,
  PlaylistResponse,
  TrackResponse,
} from './types'

export const apiGetTracks = () => {
  return apiFetch<TrackResponse[]>('/track', { method: 'GET' })
}

export const apiCreateTrack = ({
  id,
  name,
  file,
  type,
  size,
  duration,
  createdAt,
}: CreateTrackPayload) => {
  const formData = new FormData()
  formData.set('id', id)
  formData.set('name', name)
  formData.set('type', type)
  formData.set('file', file)
  formData.set('size', String(size))
  formData.set('createdAt', createdAt.toISOString())
  formData.set('duration', String(duration))
  return apiFetch<TrackResponse>('/track', { method: 'POST', body: formData })
}

export const apiDeleteTrack = (id: string) => {
  return apiFetch(`/track/${id}`, { method: 'DELETE' })
}

export const apiGetPlaylists = () => {
  return apiFetch<PlaylistResponse[]>('/playlist', { method: 'GET' })
}

export const apiCreatePlaylist = (payload: CreatePlaylistPayload) => {
  return apiFetch<PlaylistResponse[]>('/playlist', {
    method: 'POST',
    body: payload,
  })
}

export const apiDeletePlaylist = (id: string) => {
  return apiFetch(`/playlist/${id}`, { method: 'DELETE' })
}

export const getFileUrl = (filename: string) => `/api/file/${filename}`
