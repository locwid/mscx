import {
  apiAddTagToTrack,
  apiCreateTag,
  apiCreateTrack,
  apiDeleteTag,
  apiDeleteTagFromTrack,
  apiGetFile,
  apiDeleteTrack,
  apiGetTags,
  apiGetThumbnail,
  apiGetTracks,
} from './actions'
import {
  clearTags,
  clearTrackTags,
  clearTracks,
  createTrackTagRelation,
  getTrack,
  listTagsBySync,
  listTracks,
  listTracksBySync,
  listTrackTagsBySync,
  putTags,
  putTracks,
  putTrackTags,
  updateTrack,
} from '../storage/idb-storage'
import { storageRefreshKeys, touchStorageRefresh } from '../storage/refresh'

let activeSync: Promise<void> | null = null
let pendingSync = false
let syncTimer: ReturnType<typeof setTimeout> | null = null
let activeAutoDownload: Promise<void> | null = null
const autoDownloadQueue = new Set<string>()

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
  await syncTrackTags()
  await syncTracks()
  await syncTags()

  const [trackIDs] = await Promise.all([freshTracks(), freshTags()])

  await touchStorageRefresh([
    storageRefreshKeys.tracks,
    storageRefreshKeys.tags,
    ...trackIDs.map((trackId) => storageRefreshKeys.trackTagOptions(trackId)),
  ])

  await enqueueAutoDownloadTracks()
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

async function syncTags() {
  const created = await listTagsBySync('created')
  for (const tag of created) {
    await apiCreateTag({
      id: tag.id,
      name: tag.name,
    })
  }

  const deleted = await listTagsBySync('deleted')
  for (const tag of deleted) {
    await apiDeleteTag(tag.id)
  }
}

async function syncTrackTags() {
  const created = await listTrackTagsBySync('created')
  for (const rel of created) {
    await apiAddTagToTrack(rel.tagId, rel.trackId)
  }

  const deleted = await listTrackTagsBySync('deleted')
  for (const rel of deleted) {
    await apiDeleteTagFromTrack(rel.tagId, rel.trackId)
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
        autoDownloadDisabled: prev?.autoDownloadDisabled,
        thumbnail: prev?.thumbnail,
        size: track.size,
        type: track.type,
        duration: track.duration,
        sync: 'none',
        createdAt: new Date(track.createdAt),
      }
    }),
  )

  await fetchThumbnails(items.map((item) => item.id))

  return items.map((item) => item.id)
}

async function enqueueAutoDownloadTracks() {
  const appStore = useAppStore()
  if (!appStore.autoDownloadTracks) {
    autoDownloadQueue.clear()
    return
  }

  const tracks = await listTracks()
  for (const track of tracks) {
    if (
      track.sync !== 'deleted' &&
      !track.keepFile &&
      !track.file &&
      !track.autoDownloadDisabled
    ) {
      autoDownloadQueue.add(track.id)
    }
  }

  await processAutoDownloadQueue()
}

async function processAutoDownloadQueue() {
  if (activeAutoDownload) {
    return activeAutoDownload
  }

  activeAutoDownload = (async () => {
    while (autoDownloadQueue.size && canSyncNow()) {
      const appStore = useAppStore()
      if (!appStore.autoDownloadTracks) {
        autoDownloadQueue.clear()
        break
      }

      const [trackId] = autoDownloadQueue
      if (!trackId) {
        break
      }

      autoDownloadQueue.delete(trackId)

      try {
        const track = await getTrack(trackId)
        if (
          !track ||
          track.sync === 'deleted' ||
          track.keepFile ||
          track.file ||
          track.autoDownloadDisabled
        ) {
          continue
        }

        const file = await apiGetFile(trackId)
        await updateTrack(trackId, {
          file,
          keepFile: true,
          autoDownloadDisabled: false,
        })
        await touchStorageRefresh([storageRefreshKeys.tracks])
      } catch (error) {
        console.debug('Failed to auto-download track file:', error)
      }
    }
  })()

  try {
    await activeAutoDownload
  } finally {
    activeAutoDownload = null
  }
}

async function freshTags() {
  const items = await apiGetTags()
  const rels = items.flatMap((item) =>
    item.tracks.map((track) => ({ tagId: item.id, trackId: track.id })),
  )

  await clearTags()
  await clearTrackTags()

  await putTags(
    items.map((tag) => ({
      id: tag.id,
      name: tag.name,
      sync: 'none',
      createdAt: new Date(tag.createdAt),
    })),
  )

  await putTrackTags(
    rels.map((rel) =>
      createTrackTagRelation(rel.tagId, rel.trackId, {
        createdAt: new Date(),
        sync: 'none',
      }),
    ),
  )
}

async function fetchThumbnails(trackIDs: string[]) {
  for (const id of trackIDs) {
    try {
      const track = await getTrack(id)
      if (!track?.thumbnail) {
        const blob = await apiGetThumbnail(id)
        if (blob.size > 0) {
          await updateTrack(id, { thumbnail: blob })
        }
      }
    } catch {
      // Skip on fetch errors to avoid interrupting full sync.
    }
  }
}
