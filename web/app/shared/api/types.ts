export interface TrackResponse {
  id: string
  name: string
  file: string
  size: number
  duration: number
  type: string
  createdAt: string
}

export interface CreateTrackPayload {
  id: string
  name: string
  size: number
  duration: number
  type: string
  createdAt: Date
  file: File
}

export interface PlaylistResponse {
  id: string
  name: string
  createdAt: string
  tracks: TrackResponse[]
}

export interface CreatePlaylistPayload {
  id: string
  name: string
  createdAt: string
}
