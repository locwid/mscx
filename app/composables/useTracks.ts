import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import { localDb, type Track } from '~/local-db'

const tracksSource = from(
  liveQuery(() =>
    localDb.tracks.where('syncStatus').notEqual('deleted').sortBy('createdAt'),
  ),
)

export function useTracks() {
  const tracks = useObservable<Track[]>(tracksSource)
  const { trySync } = useSyncTracks()

  async function addTrack(files: File[]) {
    const now = new Date()
    try {
      await localDb.tracks.bulkAdd(
        files.map((file) => ({
          id: nanoid(),
          name: file.name,
          file,
          createdAt: now,
          syncStatus: 'created',
        })),
      )
      trySync()
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteTrack(id: string) {
    await localDb.tracks.update(id, { syncStatus: 'deleted' })
    trySync()
  }

  return {
    tracks,
    addTrack,
    deleteTrack,
  }
}
