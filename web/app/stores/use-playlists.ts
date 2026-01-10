import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import {
  apiCreatePlaylist,
  apiDeletePlaylist,
  apiGetPlaylists,
} from '~/api/actions'
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
        createdAt: new Date(),
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

  async function addTrackToPlaylist(playlistId: string, trackId: string) {
    await dexieStorage.playlistTracks.add({ playlistId, trackId })
  }

  return {
    playlists,
    addPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    setupPlaylistsSync: sync.setupSync,
  }
})

async function syncWithServer() {
  const created = await dexieStorage.playlists
    .where('syncStatus')
    .equals('created')
    .toArray()
  if (created.length) {
    await Promise.all(
      created.map((item) =>
        apiCreatePlaylist({
          id: item.id,
          name: item.name,
          createdAt: item.createdAt.toISOString(),
        }),
      ),
    )
  }

  const deleted = await dexieStorage.playlists
    .where('syncStatus')
    .equals('deleted')
    .toArray()
  if (deleted.length) {
    await Promise.all(deleted.map((item) => apiDeletePlaylist(item.id)))
  }

  const actualPlaylists = await apiGetPlaylists()
  await dexieStorage.transaction(
    'readwrite',
    ['playlists'],
    async ({ playlists }) => {
      await playlists.clear()
      await playlists.bulkPut(
        actualPlaylists.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          createdAt: new Date(playlist.createdAt),
          syncStatus: 'synced',
        })),
      )
    },
  )
}
