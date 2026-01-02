import { localDb } from '~/local-db'

export function useSyncTracks() {
  const debouncedSync = useDebounceFn(syncWithServer, 1000)

  async function trySync(immediate = false) {
    if (navigator.onLine) {
      if (immediate) {
        syncWithServer()
      } else {
        debouncedSync()
      }
    }
  }

  async function setup() {
    trySync(true)
    window.addEventListener('online', () => trySync())
  }

  async function syncWithServer() {
    const tracks = await localDb.tracks
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
    await localDb.transaction('readwrite', ['tracks'], async ({ tracks }) => {
      await tracks.clear()
      await tracks.bulkPut(
        actualTracks.map((track) => ({
          ...track,
          createdAt: new Date(track.createdAt),
          syncStatus: 'synced',
        })),
      )
    })
  }

  return {
    trySync,
    setup,
  }
}
