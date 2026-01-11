import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import { trySyncWithServer } from '~/api/sync-with-server'
import { dexieStorage } from '~/dexie.storage'

export const usePlaylists = defineStore('playlists', () => {
  const playlists = useObservable(
    from(
      liveQuery(() =>
        dexieStorage.playlists
          .where('sync')
          .notEqual('deleted')
          .sortBy('createdAt'),
      ),
    ),
  )

  async function addPlaylist(name: string) {
    try {
      await dexieStorage.playlists.add({
        id: nanoid(),
        name,
        sync: 'created',
        createdAt: new Date(),
      })
      trySyncWithServer()
    } catch (e) {
      console.error(e)
    }
  }

  async function deletePlaylist(id: string) {
    await dexieStorage.transaction(
      'rw',
      ['playlists', 'playlistTracks'],
      async ({ playlists, playlistTracks }) => {
        await playlists.update(id, { sync: 'deleted' })
        await playlistTracks
          .where('playlistId')
          .equals(id)
          .modify((obj) => {
            obj.sync = 'deleted'
          })
      },
    )
    trySyncWithServer()
  }

  async function addTrackToPlaylist(playlistId: string, trackId: string) {
    await dexieStorage.playlistTracks.add({
      id: nanoid(),
      playlistId,
      trackId,
      createdAt: new Date(),
      sync: 'created',
    })
    trySyncWithServer()
  }

  async function deleteTrackFromPlaylist(playlistId: string, trackId: string) {
    await dexieStorage.playlistTracks
      .where('[playlistId+trackId]')
      .equals([playlistId, trackId])
      .modify((obj) => {
        obj.sync = 'deleted'
      })
    trySyncWithServer()
  }

  return {
    playlists,
    addPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    deleteTrackFromPlaylist,
  }
})
