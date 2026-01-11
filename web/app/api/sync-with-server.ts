import { dexieStorage, type Change } from '~/dexie.storage'
import {
  apiCreatePlaylist,
  apiCreateTrack,
  apiDeletePlaylist,
  apiDeleteTrack,
  apiGetPlaylists,
  apiGetTracks,
} from './actions'

export async function pushChange(change: Change) {
  await dexieStorage.changes.where("id").equals(change.id).delete()
  await dexieStorage.changes.add(change)
}

export async function trySyncWithServer() {
  if (navigator.onLine) {
    syncWithServer()
  }
}

dexieStorage.changes.hook('creating', debounce(trySyncWithServer))

async function syncWithServer() {
  const changes = await dexieStorage.changes.toArray()
  for (const change of changes) {
    switch (change.entity) {
      case 'track':
        await syncTrack(change)
        break
      case 'playlist':
        await syncPlaylist(change)
        break
      case 'playlistTrack':
        break
    }
  }
  await Promise.all([freshTracks(), freshPlaylists(), dexieStorage.changes.clear()])
}

async function syncTrack(change: Change) {
  switch (change.type) {
    case 'created':
      const track = await dexieStorage.tracks.get(change.id)
      if (track && track.file) {
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
      break
    case 'deleted':
      await apiDeleteTrack(change.id)
      break
  }
}

async function syncPlaylist(change: Change) {
  switch (change.type) {
    case 'created':
      const playlist = await dexieStorage.playlists.get(change.id)
      if (playlist) {
        await apiCreatePlaylist({
          id: playlist.id,
          name: playlist.name,
          createdAt: playlist.createdAt.toISOString(),
        })
      }
      break
    case 'deleted':
      await apiDeletePlaylist(change.id)
      break
  }
}

async function freshTracks() {
  const items = await apiGetTracks()
  await dexieStorage.transaction(
    'readwrite',
    ['tracks'],
    async ({ tracks }) => {
      await Promise.all(
        items.map((track) => {
          return tracks.upsert(track.id, {
            name: track.name,
            size: track.size,
            type: track.type,
            duration: track.duration,
            createdAt: new Date(track.createdAt),
          })
        }),
      )
      await tracks.filter((t) => !t.keepFile).modify({ file: undefined })
    },
  )
}

async function freshPlaylists() {
  const items = await apiGetPlaylists()
  await dexieStorage.playlists.bulkPut(
    items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      createdAt: new Date(playlist.createdAt),
    })),
  )
}
