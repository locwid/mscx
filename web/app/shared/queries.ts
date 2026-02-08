import { nanoid } from 'nanoid'
import { dexieStorage, type Track } from '~/dexie.storage'
import { apiGetFile } from './api/actions'
import { trySyncWithServer } from './api/sync-with-server'

export function getAllTracksQuery() {
  return dexieStorage.tracks
    .where('sync')
    .notEqual('deleted')
    .sortBy('createdAt')
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
  await dexieStorage.tracks.bulkAdd(items)
  trySyncWithServer()
}

export async function deleteTrackQuery(id: string) {
  await dexieStorage.transaction(
    'rw',
    ['tracks', 'playlistTracks'],
    async ({ tracks, playlistTracks }) => {
      await tracks.update(id, {
        sync: 'deleted',
        keepFile: false,
        file: undefined,
      })
      await playlistTracks
        .where('trackId')
        .equals(id)
        .modify((obj) => {
          obj.sync = 'deleted'
        })
    },
  )
  trySyncWithServer()
}

export async function downloadTrackQuery(id: string) {
  const file = await apiGetFile(id)
  await dexieStorage.tracks.update(id, { file, keepFile: true })
}

export async function unloadTrackQuery(id: string) {
  await dexieStorage.tracks.update(id, { file: undefined, keepFile: false })
}

export function getAllPlaylistsQuery() {
  return dexieStorage.playlists
    .where('sync')
    .notEqual('deleted')
    .sortBy('createdAt')
}

export function getPlaylistByIdQuery(id: string) {
  return dexieStorage.playlists.get(id)
}

export async function addPlaylistQuery(name: string) {
  await dexieStorage.playlists.add({
    id: nanoid(),
    name,
    sync: 'created',
    createdAt: new Date(),
  })
  trySyncWithServer()
}

export async function getPlaylistTracksQuery(id: string) {
  const pairs = await dexieStorage.playlistTracks
    .where('playlistId')
    .equals(id)
    .toArray()
  const trackIdSet = new Set(pairs.map((p) => p.trackId))
  return dexieStorage.tracks
    .where('sync')
    .notEqual('deleted')
    .filter((track) => trackIdSet.has(track.id))
    .sortBy('createdAt')
}

export async function deletePlaylistQuery(id: string) {
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

export async function addTrackToPlaylistQuery(
  playlistId: string,
  trackId: string,
) {
  await dexieStorage.playlistTracks.add({
    id: nanoid(),
    playlistId,
    trackId,
    createdAt: new Date(),
    sync: 'created',
  })
  trySyncWithServer()
}

export async function deleteTrackFromPlaylistQuery(
  playlistId: string,
  trackId: string,
) {
  await dexieStorage.playlistTracks
    .where('[playlistId+trackId]')
    .equals([playlistId, trackId])
    .modify((obj) => {
      obj.sync = 'deleted'
    })
  trySyncWithServer()
}
