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
      const items = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file)
          const duration = await getAudioDuration(url)
          URL.revokeObjectURL(url)
          return {
            id: nanoid(),
            name: file.name,
            file,
            createdAt: now,
            metadata: {
              originalName: file.name,
              size: file.size,
              duration,
              mimeType: file.type,
            },
            syncStatus: 'created' as const,
          }
        }),
      )
      await localDb.tracks.bulkAdd(items)
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
