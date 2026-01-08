import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import { dexieStorage } from '~/dexie.storage'

export const usePlaylists = defineStore('playlists', () => {
  const playlists = useObservable(
    from(
      liveQuery(() =>
        dexieStorage.playlists
          .where('syncStatus')
          .notEqual('deleted')
          .sortBy('createdAt'),
      ),
    ),
  )

  const sync = useServerSync(syncWithServer)

  async function addPlaylist(name: string) {
    try {
      await dexieStorage.playlists.add({
        id: nanoid(),
        name,
        syncStatus: 'created',
      })
      sync.trySync()
    } catch (e) {
      console.error(e)
    }
  }

  async function deletePlaylist(id: string) {
    await dexieStorage.playlists.update(id, { syncStatus: 'deleted' })
    sync.trySync()
  }

  return {
    playlists,
    addPlaylist,
    deletePlaylist,
    setupPlaylistsSync: sync.setupSync,
  }
})

async function syncWithServer() {
  const created = await dexieStorage.playlists
    .where('syncStatus')
    .equals('created')
    .toArray()
  if (created.length) {
    for (const item of created) {
      await $fetch('/api/playlist', { method: 'POST', body: item })
    }
  }

  const deleted = await dexieStorage.playlists
    .where('syncStatus')
    .equals('deleted')
    .toArray()
  if (deleted.length) {
    await $fetch('/api/playlist', {
      method: 'DELETE',
      body: { ids: deleted.map((d) => d.id) },
    })
  }

  const actualPlaylists = await $fetch('/api/playlist', { method: 'GET' })
  await dexieStorage.transaction(
    'readwrite',
    ['playlists'],
    async ({ playlists }) => {
      await playlists.clear()
      await playlists.bulkPut(
        actualPlaylists.map((playlist) => ({
          ...playlist,
          syncStatus: 'synced',
        })),
      )
    },
  )
}
