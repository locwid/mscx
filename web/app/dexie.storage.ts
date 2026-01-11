import Dexie, { type Table } from 'dexie'

type Sync = 'none' | 'created' | 'deleted'

interface BaseEntity {
  id: string
  sync: Sync
  createdAt: Date
}

export interface Track extends BaseEntity {
  name: string
  file?: File
  keepFile?: boolean
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

class DexieStorage extends Dexie {
  tracks!: Table<Track>
  playlists!: Table<Playlist>
  playlistTracks!: Table<PlaylistTracks>

  constructor() {
    super('mscx-db')
    const baseColumns = 'id, sync, createdAt'
    this.version(1).stores({
      tracks: `${baseColumns}, name, file, keepFile, size, duration, type`,
      playlists: `${baseColumns}, name`,
      playlistTracks: `${baseColumns}, [playlistId+trackId], trackId`,
    })
  }
}

export const dexieStorage = new DexieStorage()
