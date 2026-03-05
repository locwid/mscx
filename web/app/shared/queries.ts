import { nanoid } from 'nanoid'
import { apiGetFile } from './api/actions'
import { trySyncWithServer } from './api/sync-with-server'
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
  const items = await Promise.all(
    files.map(async (file) => {
      const url = URL.createObjectURL(file)
      const duration = await getAudioDuration(url)
      URL.revokeObjectURL(url)
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
    }),
  )
  await putTracks(items)
  await touchStorageRefresh()
  trySyncWithServer()
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

  await touchStorageRefresh()
  trySyncWithServer()
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
  await touchStorageRefresh()
  trySyncWithServer()
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

  await touchStorageRefresh()
  trySyncWithServer()
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
  await touchStorageRefresh()
  trySyncWithServer()
}

export async function deleteTrackFromPlaylistQuery(
  playlistId: string,
  trackId: string,
) {
  await updatePlaylistTrack(playlistId, trackId, {
    sync: 'deleted',
  })
  await touchStorageRefresh()
  trySyncWithServer()
}
