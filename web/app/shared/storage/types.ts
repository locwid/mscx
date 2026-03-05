export type Sync = 'none' | 'created' | 'deleted'

interface BaseEntity {
  id: string
  sync: Sync
  createdAt: Date
}

export interface Track extends BaseEntity {
  name: string
  file?: File
  keepFile?: boolean
  thumbnail?: Blob
  size: number
  duration: number
  type: string
}

export interface Playlist extends BaseEntity {
  name: string
}

export interface PlaylistTracks extends BaseEntity {
  playlistId: string
  trackId: string
}
