import Dexie, { type Table } from 'dexie'

export interface Track {
  id: string
  name: string
  file?: File
  keepFile?: boolean
  size: number
  duration: number
  type: string
  createdAt: Date
}

export interface Playlist {
  id: string
  name: string
  createdAt: Date
}

export interface PlaylistTracks {
  id: string
  playlistId: string
  trackId: string
}

type Entity = 'track' | 'playlist' | 'playlistTrack'
type ChangeType = 'created' | 'deleted'

export interface Change {
  id: string
  entity: Entity
  type: ChangeType
}

class DexieStorage extends Dexie {
  tracks!: Table<Track>
  playlists!: Table<Playlist>
  playlistTracks!: Table<PlaylistTracks>
  changes!: Table<Change>

  constructor() {
    super('mscx-db')
    this.version(1).stores({
      tracks: 'id, name, file, keepFile, size, duration, type, createdAt',
      playlists: 'id, name, createdAt',
      playlistTracks: 'id, [playlistId+trackId]',
      changes: 'id, entity, type',
    })
  }
}

export const dexieStorage = new DexieStorage()
