import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import { pushChange } from '~/api/sync-with-server'
import { dexieStorage, type Playlist } from '~/dexie.storage'

export const usePlaylists = defineStore('playlists', () => {
  const playlists = useObservable(
    from(
      liveQuery(() =>
        dexieStorage.playlists
          .toCollection()
          .sortBy('createdAt'),
      ),
    ),
  )

  async function addPlaylist(name: string) {
    try {
      const payload: Playlist = {
        id: nanoid(),
        name,
        createdAt: new Date(),
      }
      await dexieStorage.playlists.add(payload)
      await pushChange({
        id: payload.id,
        entity: 'playlist',
        type: 'created'
      })
    } catch (e) {
      console.error(e)
    }
  }

  async function deletePlaylist(id: string) {
    await dexieStorage.playlists.delete(id)
    await pushChange({
      id,
      entity: 'playlist',
      type: 'deleted'
    })
  }

  async function addTrackToPlaylist(playlistId: string, trackId: string) {
    const id = nanoid()
    await dexieStorage.playlistTracks.add({ id, playlistId, trackId })
    await pushChange({
      id,
      entity: 'playlistTrack',
      type: 'created'
    })
  }

  return {
    playlists,
    addPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
  }
})
