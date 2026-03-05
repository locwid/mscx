import { apiFetch } from './fetch'
import type {
  CreateTagPayload,
  CreateTrackPayload,
  HealthResponse,
  ImportYouTubePayload,
  TagResponse,
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

export const apiGetTags = () => {
  return apiFetch<TagResponse[]>('/tag', { method: 'GET' })
}

export const apiCreateTag = (payload: CreateTagPayload) => {
  return apiFetch<TagResponse[]>('/tag', {
    method: 'POST',
    body: payload,
  })
}

export const apiDeleteTag = (id: string) => {
  return apiFetch(`/tag/${id}`, { method: 'DELETE' })
}

export const apiImportYouTube = (payload: ImportYouTubePayload) => {
  return apiFetch('/import/youtube', {
    method: 'POST',
    body: payload,
  })
}

export const apiAddTagToTrack = (tagId: string, trackId: string) => {
  return apiFetch(`/tag/${tagId}/track/${trackId}`, {
    method: 'POST',
  })
}

export const apiDeleteTagFromTrack = (tagId: string, trackId: string) => {
  return apiFetch(`/tag/${tagId}/track/${trackId}`, {
    method: 'DELETE',
  })
}

export const getFileUrl = (id: string) => `/api/track/${id}/file`
export const getFileUrlWithAuthKey = (id: string, authKey: string) =>
  `${getFileUrl(id)}?authKey=${authKey}`

export const getThumbnailUrl = (id: string) => `/api/track/${id}/thumbnail`
export const getThumbnailUrlWithAuthKey = (id: string, authKey: string) =>
  `${getThumbnailUrl(id)}?authKey=${authKey}`

export const apiGetFile = async (filename: string) => {
  const response = await apiFetch.raw<ReadableStream>(getFileUrl(filename), {
    method: 'GET',
    responseType: 'stream',
  })
  const blob = await response.blob()
  return new File([blob], filename, {
    type: response.headers.get('Content-Type') ?? '',
  })
}

export const apiGetThumbnail = async (id: string) => {
  const response = await apiFetch.raw<ReadableStream>(getThumbnailUrl(id), {
    method: 'GET',
    responseType: 'stream',
  })
  return response.blob()
}
export const apiHealth = () => {
  return apiFetch<HealthResponse>('/health', { method: 'GET' })
}
