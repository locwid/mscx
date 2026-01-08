import Dexie, { type Table } from 'dexie'

export interface Track {
  id: string
  name: string
  filename?: string
  file?: File
  size: number
  duration: number
  type: string
  createdAt: Date
  syncStatus: 'synced' | 'created' | 'deleted'
}

export interface Playlist {
  id: string
  name: string
  createdAt: Date
  syncStatus: 'synced' | 'created' | 'deleted'
}

class DexieStorage extends Dexie {
  tracks!: Table<Track>
  playlists!: Table<Playlist>

  constructor() {
    super('mscx-db')
    this.version(1).stores({
      tracks: 'id, name, file, filename, size, duration, type, createdAt, syncStatus',
      playlists: 'id, name, createdAt, syncStatus',
    })
  }
}

export const dexieStorage = new DexieStorage()
