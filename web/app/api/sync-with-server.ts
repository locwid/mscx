import { dexieStorage } from '~/dexie.storage'
import {
  apiAddTrackToPlaylist,
  apiCreatePlaylist,
  apiCreateTrack,
  apiDeletePlaylist,
  apiDeleteTrack,
  apiDeleteTrackFromPlaylist,
  apiGetPlaylists,
  apiGetTracks,
} from './actions'
import { nanoid } from 'nanoid'

export async function trySyncWithServer() {
  if (navigator.onLine) {
    syncWithServer()
  }
}

async function syncWithServer() {
  await syncPlaylistTracks()
  await syncTracks()
  await syncPlaylists()
  await Promise.all([freshTracks(), freshPlaylists()])
}

async function syncTracks() {
  const created = await dexieStorage.tracks
    .where('sync')
    .equals('created')
    .toArray()
  for (const track of created) {
    if (track.file) {
      await apiCreateTrack({
        id: track.id,
        name: track.name,
        size: track.size,
        duration: track.duration,
        type: track.type,
        createdAt: track.createdAt,
        file: track.file,
      })
    }
  }

  const deleted = await dexieStorage.tracks
    .where('sync')
    .equals('deleted')
    .toArray()
  for (const track of deleted) {
    await apiDeleteTrack(track.id)
  }
}

async function syncPlaylists() {
  const created = await dexieStorage.playlists
    .where('sync')
    .equals('created')
    .toArray()
  for (const playlist of created) {
    await apiCreatePlaylist({
      id: playlist.id,
      name: playlist.name,
      createdAt: playlist.createdAt.toISOString(),
    })
  }

  const deleted = await dexieStorage.playlists
    .where('sync')
    .equals('deleted')
    .toArray()
  for (const playlist of deleted) {
    await apiDeletePlaylist(playlist.id)
  }
}

async function syncPlaylistTracks() {
  const created = await dexieStorage.playlistTracks
    .where('sync')
    .equals('created')
    .toArray()
  for (const pair of created) {
    await apiAddTrackToPlaylist(pair.playlistId, pair.trackId)
  }

  const deleted = await dexieStorage.playlistTracks
    .where('sync')
    .equals('deleted')
    .toArray()
  for (const pair of deleted) {
    await apiDeleteTrackFromPlaylist(pair.playlistId, pair.trackId)
  }
}

async function freshTracks() {
  const items = await apiGetTracks()
  await dexieStorage.transaction('rw', ['tracks'], async ({ tracks }) => {
    const withFiles = await tracks.filter((obj) => !!obj.keepFile).toArray()
    await tracks.clear()
    await tracks.bulkAdd(
      items.map((track) => {
        const prev = withFiles.find((item) => item.id === track.id)
        return {
          id: track.id,
          name: track.name,
          keepFile: prev?.keepFile,
          file: prev?.file,
          size: track.size,
          type: track.type,
          duration: track.duration,
          sync: 'none',
          createdAt: new Date(track.createdAt),
        }
      }),
    )
  })
}

async function freshPlaylists() {
  const items = await apiGetPlaylists()
  const rels = items.flatMap((item) =>
    item.tracks.map((t) => ({ playlistId: item.id, trackId: t.id })),
  )
  await dexieStorage.transaction(
    'rw',
    ['playlists', 'playlistTracks'],
    async ({ playlists, playlistTracks }) => {
      await playlists.clear()
      await playlistTracks.clear()
      await playlists.bulkAdd(
        items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          sync: 'none',
          createdAt: new Date(playlist.createdAt),
        })),
      )
      await playlistTracks.bulkAdd(
        rels.map((rel) => ({
          id: nanoid(),
          playlistId: rel.playlistId,
          trackId: rel.trackId,
          createdAt: new Date(),
          sync: 'none',
        })),
      )
    },
  )
}
