import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
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
      const formData = new FormData()
      if (!track.file) continue
      formData.append(
        'payload',
        JSON.stringify({
          id: track.id,
          name: track.name,
          createdAt: track.createdAt.toISOString(),
          metadata: track.metadata,
        }),
      )
      formData.append('file', track.file)
      await $fetch('/api/track', { method: 'POST', body: formData })
    }
  }

  if (tracksToDelete.length) {
    await $fetch('/api/track', {
      method: 'DELETE',
      body: { ids: tracksToDelete.map((track) => track.id) },
    })
  }

  const actualTracks = await $fetch('/api/track', { method: 'GET' })
  await dexieStorage.transaction(
    'readwrite',
    ['tracks'],
    async ({ tracks }) => {
      await tracks.clear()
      await tracks.bulkPut(
        actualTracks.map((track) => ({
          ...track,
          createdAt: new Date(track.createdAt),
          syncStatus: 'synced',
        })),
      )
    },
  )
}
