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

export interface TagResponse {
  id: string
  name: string
  createdAt: string
  tracks: TrackResponse[]
}

export interface CreateTagPayload {
  id: string
  name: string
}

export interface ImportYouTubePayload {
  url: string
}
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: boolean
  dependencies: Record<string, boolean>
  timestamp: string
}
