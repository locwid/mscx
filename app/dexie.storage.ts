import Dexie, { type Table } from 'dexie'

export interface Track {
  id: string
  name: string
  file?: File
  metadata: TrackMetadata
  createdAt: Date
  syncStatus: 'synced' | 'created' | 'deleted'
}

class DexieStorage extends Dexie {
  tracks!: Table<Track>

  constructor() {
    super('mscx-db')
    this.version(1).stores({
      tracks: 'id, name, file, metadata, createdAt, syncStatus',
    })
  }
}

export const dexieStorage = new DexieStorage()
