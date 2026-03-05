import {
  apiAddTrackToPlaylist,
  apiCreatePlaylist,
  apiCreateTrack,
  apiDeletePlaylist,
  apiDeleteTrack,
  apiDeleteTrackFromPlaylist,
  apiGetPlaylists,
  apiGetTracks,
  apiGetThumbnail,
} from './actions'
import {
  clearPlaylists,
  clearPlaylistTracks,
  clearTracks,
  createPlaylistTrackRelation,
  getTrack,
  listPlaylistsBySync,
  listPlaylistTracksBySync,
  listTracks,
  listTracksBySync,
  putPlaylists,
  putPlaylistTracks,
  putTracks,
  updateTrack,
} from '../storage/idb-storage'
import { touchStorageRefresh } from '../storage/refresh'

let activeSync: Promise<void> | null = null
let pendingSync = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

function canSyncNow() {
  return typeof navigator !== 'undefined' && navigator.onLine
}

export function scheduleSyncWithServer(delayMs = 1000) {
  if (!canSyncNow()) return

  if (syncTimer) {
    clearTimeout(syncTimer)
  }

  syncTimer = setTimeout(() => {
    syncTimer = null
    void trySyncWithServer()
  }, delayMs)
}

export async function trySyncWithServer() {
  if (!canSyncNow()) return

  if (activeSync) {
    pendingSync = true
    return activeSync
  }

  const appStore = useAppStore()

  activeSync = (async () => {
    appStore.markSyncStart()
    try {
      await syncWithServer()
      appStore.markSyncSuccess()
    } catch (error) {
      appStore.markSyncError(error)
      throw error
    } finally {
      activeSync = null
      if (pendingSync) {
        pendingSync = false
        queueMicrotask(() => {
          void trySyncWithServer()
        })
      }
    }
  })()

  return activeSync
}

async function syncWithServer() {
  await syncPlaylistTracks()
  await syncTracks()
  await syncPlaylists()
  await Promise.all([freshTracks(), freshPlaylists()])
}

async function syncTracks() {
  const created = await listTracksBySync('created')
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

  const deleted = await listTracksBySync('deleted')
  for (const track of deleted) {
    await apiDeleteTrack(track.id)
  }
}

async function syncPlaylists() {
  const created = await listPlaylistsBySync('created')
  for (const playlist of created) {
    await apiCreatePlaylist({
      id: playlist.id,
      name: playlist.name,
      createdAt: playlist.createdAt.toISOString(),
    })
  }

  const deleted = await listPlaylistsBySync('deleted')
  for (const playlist of deleted) {
    await apiDeletePlaylist(playlist.id)
  }
}

async function syncPlaylistTracks() {
  const created = await listPlaylistTracksBySync('created')
  for (const pair of created) {
    await apiAddTrackToPlaylist(pair.playlistId, pair.trackId)
  }

  const deleted = await listPlaylistTracksBySync('deleted')
  for (const pair of deleted) {
    await apiDeleteTrackFromPlaylist(pair.playlistId, pair.trackId)
  }
}

async function freshTracks() {
  const items = await apiGetTracks()
  const allPrev = await listTracks()
  const withFiles = allPrev.filter((track) => !!track.keepFile)

  await clearTracks()
  await putTracks(
    items.map((track) => {
      const prev = allPrev.find((item) => item.id === track.id)
      const prevWithFile = withFiles.find((item) => item.id === track.id)
      return {
        id: track.id,
        name: track.name,
        keepFile: prevWithFile?.keepFile,
        file: prevWithFile?.file,
        thumbnail: prev?.thumbnail,
        size: track.size,
        type: track.type,
        duration: track.duration,
        sync: 'none',
        createdAt: new Date(track.createdAt),
      }
    }),
  )

  // Fetch thumbnails for all tracks
  await fetchThumbnails(items.map((t) => t.id))
}

async function freshPlaylists() {
  const items = await apiGetPlaylists()
  const rels = items.flatMap((item) =>
    item.tracks.map((t) => ({ playlistId: item.id, trackId: t.id })),
  )
  await clearPlaylists()
  await clearPlaylistTracks()

  await putPlaylists(
    items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      sync: 'none',
      createdAt: new Date(playlist.createdAt),
    })),
  )

  await putPlaylistTracks(
    rels.map((rel) =>
      createPlaylistTrackRelation(rel.playlistId, rel.trackId, {
        createdAt: new Date(),
        sync: 'none',
      }),
    ),
  )
}

async function fetchThumbnails(trackIds: string[]) {
  for (const id of trackIds) {
    try {
      const track = await getTrack(id)
      // Only fetch if thumbnail doesn't exist
      if (!track?.thumbnail) {
        const blob = await apiGetThumbnail(id)
        if (blob.size > 0) {
          await updateTrack(id, { thumbnail: blob })
        }
      }
    } catch {
      // Silently skip if thumbnail fetch fails for any reason
    }
  }

  await touchStorageRefresh()
}
