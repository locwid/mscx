import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import { apiCreateTrack, apiDeleteTrack, apiGetTracks } from '~/api/actions'
import { dexieStorage, type Track } from '~/dexie.storage'

export const useTracks = defineStore('tracks', () => {
  const tracks = useObservable<Track[]>(
    from(
      liveQuery(() =>
        dexieStorage.tracks
          .where('syncStatus')
          .notEqual('deleted')
          .sortBy('createdAt'),
      ),
    ),
  )

  const sync = useServerSync(syncWithServer)

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
            duration: Math.round(duration),
            size: file.size,
            type: file.type,
            file,
            createdAt: now,
            syncStatus: 'created' as const,
          } satisfies Track
        }),
      )
      await dexieStorage.tracks.bulkAdd(items)
      sync.trySync()
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteTrack(id: string) {
    await dexieStorage.tracks.update(id, { syncStatus: 'deleted' })
    sync.trySync()
  }

  return {
    tracks,
    setupTracksSync: sync.setupSync,
    addTrack,
    deleteTrack,
  }
})

async function syncWithServer() {
  const tracks = await dexieStorage.tracks
    .where('syncStatus')
    .notEqual('synced')
    .toArray()
  const tracksToCreate = tracks.filter(
    (track) => track.syncStatus === 'created',
  )
  const tracksToDelete = tracks.filter(
    (track) => track.syncStatus === 'deleted',
  )

  if (tracksToCreate.length) {
    for (const track of tracksToCreate) {
      if (!track.file) continue
      await apiCreateTrack({
        id: track.id,
        name: track.name,
        size: track.size,
        duration: track.duration,
        type: track.type,
        createdAt: track.createdAt,
        file: track.file
      })
    }
  }

  if (tracksToDelete.length) {
    await Promise.all([...tracksToDelete.map((track) => apiDeleteTrack(track.id))])
  }

  const actualTracks = await apiGetTracks()
  await dexieStorage.transaction(
    'readwrite',
    ['tracks'],
    async ({ tracks }) => {
      await tracks.clear()
      await tracks.bulkPut(
        actualTracks.map((track) => ({
          id: track.id,
          name: track.name,
          size: track.size,
          type: track.type,
          duration: track.duration,
          filename: track.file,
          createdAt: new Date(track.createdAt),
          syncStatus: 'synced',
        })),
      )
    },
  )
}
