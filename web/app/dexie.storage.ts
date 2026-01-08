import Dexie, { type Table } from 'dexie'

export interface Track {
  id: string
  name: string
  file?: File
  metadata: TrackMetadata
  createdAt: Date
  syncStatus: 'synced' | 'created' | 'deleted'
}

export interface Playlist {
  id: string
  name: string
  syncStatus: 'synced' | 'created' | 'deleted'
}

class DexieStorage extends Dexie {
  tracks!: Table<Track>
  playlists!: Table<Playlist>

  constructor() {
    super('mscx-db')
    this.version(1).stores({
      tracks: 'id, name, file, metadata, createdAt, syncStatus',
      playlists: 'id, name, syncStatus',
    })
  }
}

export const dexieStorage = new DexieStorage()
