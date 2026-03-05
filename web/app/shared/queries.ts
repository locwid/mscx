import { nanoid } from 'nanoid'
import { apiGetFile, apiImportYouTube } from './api/actions'
import { scheduleSyncWithServer } from './api/sync-with-server'
import {
  createPlaylistTrackRelation,
  getPlaylist,
  listPlaylistTracksByPlaylistId,
  listPlaylistTracksByTrackId,
  listPlaylists,
  listTracks,
  putPlaylist,
  putPlaylistTrack,
  putTracks,
  updatePlaylist,
  updatePlaylistTrack,
  updateTrack,
} from './storage/idb-storage'
import { touchStorageRefresh } from './storage/refresh'
import type { Track } from './storage/types'

type AddTrackFailure = {
  name: string
  reason: string
}

type AddTracksResult = {
  added: number
  failed: AddTrackFailure[]
}

async function finalizeLocalMutation() {
  await touchStorageRefresh()
  scheduleSyncWithServer()
}

function sortByCreatedAt<T extends { createdAt: Date }>(items: T[]) {
  return [...items].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
}

export async function getAllTracksQuery() {
  const tracks = await listTracks()
  return sortByCreatedAt(tracks.filter((track) => track.sync !== 'deleted'))
}

export async function addTracksQuery(files: File[]) {
  const now = new Date()
  const settled = await Promise.allSettled(
    files.map(async (file) => {
      const url = URL.createObjectURL(file)
      try {
        const duration = await getAudioDuration(url)
        return {
          id: nanoid(),
          name: file.name,
          duration: Math.round(duration),
          size: file.size,
          type: file.type,
          file,
          sync: 'created',
          createdAt: now,
        } satisfies Track
      } finally {
        URL.revokeObjectURL(url)
      }
    }),
  )

  const items: Track[] = []
  const failed: AddTrackFailure[] = []

  settled.forEach((item, index) => {
    if (item.status === 'fulfilled') {
      items.push(item.value)
      return
    }

    failed.push({
      name: files[index]?.name ?? 'unknown',
      reason:
        item.reason instanceof Error
          ? item.reason.message
          : 'Failed to read audio metadata',
    })
  })

  if (items.length) {
    await putTracks(items)
    await finalizeLocalMutation()
  }

  return {
    added: items.length,
    failed,
  } satisfies AddTracksResult
}

export async function importYouTubeQuery(url: string) {
  await apiImportYouTube({ url })
  await finalizeLocalMutation()
}

export async function deleteTrackQuery(id: string) {
  await updateTrack(id, {
    sync: 'deleted',
    keepFile: false,
    file: undefined,
  })

  const relations = await listPlaylistTracksByTrackId(id)
  await Promise.all(
    relations.map((relation) =>
      updatePlaylistTrack(relation.playlistId, relation.trackId, {
        sync: 'deleted',
      }),
    ),
  )

  await finalizeLocalMutation()
}

export async function downloadTrackQuery(id: string) {
  const file = await apiGetFile(id)
  await updateTrack(id, { file, keepFile: true })
  await touchStorageRefresh()
}

export async function unloadTrackQuery(id: string) {
  await updateTrack(id, { file: undefined, keepFile: false })
  await touchStorageRefresh()
}

export async function getAllPlaylistsQuery() {
  const playlists = await listPlaylists()
  return sortByCreatedAt(
    playlists.filter((playlist) => playlist.sync !== 'deleted'),
  )
}

export function getPlaylistByIdQuery(id: string) {
  return getPlaylist(id)
}

export async function addPlaylistQuery(name: string) {
  await putPlaylist({
    id: nanoid(),
    name,
    sync: 'created',
    createdAt: new Date(),
  })
  await finalizeLocalMutation()
}

export async function getPlaylistTracksQuery(id: string) {
  const pairs = await listPlaylistTracksByPlaylistId(id)
  const trackIdSet = new Set(pairs.map((p) => p.trackId))
  const tracks = await listTracks()
  return sortByCreatedAt(
    tracks.filter(
      (track) => track.sync !== 'deleted' && trackIdSet.has(track.id),
    ),
  )
}

export async function deletePlaylistQuery(id: string) {
  await updatePlaylist(id, { sync: 'deleted' })

  const relations = await listPlaylistTracksByPlaylistId(id)
  await Promise.all(
    relations.map((relation) =>
      updatePlaylistTrack(relation.playlistId, relation.trackId, {
        sync: 'deleted',
      }),
    ),
  )

  await finalizeLocalMutation()
}

export async function addTrackToPlaylistQuery(
  playlistId: string,
  trackId: string,
) {
  await putPlaylistTrack(
    createPlaylistTrackRelation(playlistId, trackId, {
      createdAt: new Date(),
      sync: 'created',
    }),
  )
  await finalizeLocalMutation()
}

export async function deleteTrackFromPlaylistQuery(
  playlistId: string,
  trackId: string,
) {
  await updatePlaylistTrack(playlistId, trackId, {
    sync: 'deleted',
  })
  await finalizeLocalMutation()
}
