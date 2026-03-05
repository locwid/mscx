import {
  createStore,
  delMany,
  get,
  getMany,
  set,
  setMany,
  update,
} from 'idb-keyval'
import type { Playlist, PlaylistTracks, Sync, Track } from './types'

export const idbStore = createStore('mscx-keyval-db', 'mscx-keyval')

const TRACK_PREFIX = 'track:'
const PLAYLIST_PREFIX = 'playlist:'
const PLAYLIST_TRACK_PREFIX = 'playlistTrack:'

const TRACK_IDS_KEY = 'index:tracks:all'
const PLAYLIST_IDS_KEY = 'index:playlists:all'
const PLAYLIST_TRACK_IDS_KEY = 'index:playlistTracks:all'

const TRACK_SYNC_INDEX = {
  none: 'index:tracks:sync:none',
  created: 'index:tracks:sync:created',
  deleted: 'index:tracks:sync:deleted',
} as const

const PLAYLIST_SYNC_INDEX = {
  none: 'index:playlists:sync:none',
  created: 'index:playlists:sync:created',
  deleted: 'index:playlists:sync:deleted',
} as const

const PLAYLIST_TRACK_SYNC_INDEX = {
  none: 'index:playlistTracks:sync:none',
  created: 'index:playlistTracks:sync:created',
  deleted: 'index:playlistTracks:sync:deleted',
} as const

function trackKey(id: string) {
  return `${TRACK_PREFIX}${id}`
}

function playlistKey(id: string) {
  return `${PLAYLIST_PREFIX}${id}`
}

function relationId(playlistId: string, trackId: string) {
  return `${playlistId}:${trackId}`
}

function playlistTrackKey(id: string) {
  return `${PLAYLIST_TRACK_PREFIX}${id}`
}

function playlistTrackByPlaylistIndex(playlistId: string) {
  return `index:playlistTracks:playlist:${playlistId}`
}

function playlistTrackByTrackIndex(trackId: string) {
  return `index:playlistTracks:track:${trackId}`
}

async function getIndex(key: string): Promise<string[]> {
  return (await get<string[]>(key, idbStore)) ?? []
}

async function addToIndex(key: string, value: string) {
  await update<string[] | undefined>(
    key,
    (current) => {
      const index = current ?? []
      return index.includes(value) ? index : [...index, value]
    },
    idbStore,
  )
}

async function removeFromIndex(key: string, value: string) {
  await update<string[] | undefined>(
    key,
    (current) => {
      const index = current ?? []
      const next = index.filter((id) => id !== value)
      return next.length === index.length ? index : next
    },
    idbStore,
  )
}

async function readByIds<T>(
  ids: string[],
  keyBuilder: (id: string) => string,
): Promise<T[]> {
  if (!ids.length) return []
  return getMany<T>(
    ids.map((id) => keyBuilder(id)),
    idbStore,
  )
}

async function moveSyncIndex(
  id: string,
  nextSync: Sync,
  prevSync: Sync | undefined,
  syncIndex: Record<Sync, string>,
) {
  if (prevSync && prevSync !== nextSync) {
    await removeFromIndex(syncIndex[prevSync], id)
  }
  await addToIndex(syncIndex[nextSync], id)
}

function emptyIndexEntry(key: string): [string, string[]] {
  return [key, []]
}

export async function getTrack(id: string): Promise<Track | undefined> {
  return get<Track>(trackKey(id), idbStore)
}

export async function listTracks(): Promise<Track[]> {
  const ids = await getIndex(TRACK_IDS_KEY)
  return readByIds<Track>(ids, trackKey)
}

export async function listTracksBySync(sync: Sync): Promise<Track[]> {
  const ids = await getIndex(TRACK_SYNC_INDEX[sync])
  return readByIds<Track>(ids, trackKey)
}

export async function putTrack(track: Track) {
  const prev = await getTrack(track.id)
  await set(trackKey(track.id), track, idbStore)
  await addToIndex(TRACK_IDS_KEY, track.id)
  await moveSyncIndex(track.id, track.sync, prev?.sync, TRACK_SYNC_INDEX)
}

export async function putTracks(tracks: Track[]) {
  if (!tracks.length) return

  const keys = tracks.map((track) => trackKey(track.id))
  const prevItems = await getMany<Track>(keys, idbStore)
  await setMany(
    tracks.map((track, index) => [keys[index]!, track] as const),
    idbStore,
  )

  await Promise.all(
    tracks.map(async (track, index) => {
      await addToIndex(TRACK_IDS_KEY, track.id)
      await moveSyncIndex(
        track.id,
        track.sync,
        prevItems[index]?.sync,
        TRACK_SYNC_INDEX,
      )
    }),
  )
}

export async function updateTrack(id: string, patch: Partial<Track>) {
  let prevSync: Sync | undefined
  let nextSync: Sync | undefined

  await update<Track | undefined>(
    trackKey(id),
    (prev) => {
      if (!prev) return undefined
      prevSync = prev.sync
      const next = { ...prev, ...patch }
      nextSync = next.sync
      return next
    },
    idbStore,
  )

  if (!nextSync) return

  await addToIndex(TRACK_IDS_KEY, id)
  await moveSyncIndex(id, nextSync, prevSync, TRACK_SYNC_INDEX)
}

export async function clearTracks() {
  const ids = await getIndex(TRACK_IDS_KEY)
  await delMany(
    ids.map((id) => trackKey(id)),
    idbStore,
  )
  await setMany(
    [
      emptyIndexEntry(TRACK_IDS_KEY),
      ...Object.values(TRACK_SYNC_INDEX).map((key) => emptyIndexEntry(key)),
    ],
    idbStore,
  )
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  return get<Playlist>(playlistKey(id), idbStore)
}

export async function listPlaylists(): Promise<Playlist[]> {
  const ids = await getIndex(PLAYLIST_IDS_KEY)
  return readByIds<Playlist>(ids, playlistKey)
}

export async function listPlaylistsBySync(sync: Sync): Promise<Playlist[]> {
  const ids = await getIndex(PLAYLIST_SYNC_INDEX[sync])
  return readByIds<Playlist>(ids, playlistKey)
}

export async function putPlaylist(playlist: Playlist) {
  const prev = await getPlaylist(playlist.id)
  await set(playlistKey(playlist.id), playlist, idbStore)
  await addToIndex(PLAYLIST_IDS_KEY, playlist.id)
  await moveSyncIndex(
    playlist.id,
    playlist.sync,
    prev?.sync,
    PLAYLIST_SYNC_INDEX,
  )
}

export async function putPlaylists(playlists: Playlist[]) {
  if (!playlists.length) return

  const keys = playlists.map((playlist) => playlistKey(playlist.id))
  const prevItems = await getMany<Playlist>(keys, idbStore)
  await setMany(
    playlists.map((playlist, index) => [keys[index]!, playlist] as const),
    idbStore,
  )

  await Promise.all(
    playlists.map(async (playlist, index) => {
      await addToIndex(PLAYLIST_IDS_KEY, playlist.id)
      await moveSyncIndex(
        playlist.id,
        playlist.sync,
        prevItems[index]?.sync,
        PLAYLIST_SYNC_INDEX,
      )
    }),
  )
}

export async function updatePlaylist(id: string, patch: Partial<Playlist>) {
  let prevSync: Sync | undefined
  let nextSync: Sync | undefined

  await update<Playlist | undefined>(
    playlistKey(id),
    (prev) => {
      if (!prev) return undefined
      prevSync = prev.sync
      const next = { ...prev, ...patch }
      nextSync = next.sync
      return next
    },
    idbStore,
  )

  if (!nextSync) return

  await addToIndex(PLAYLIST_IDS_KEY, id)
  await moveSyncIndex(id, nextSync, prevSync, PLAYLIST_SYNC_INDEX)
}

export async function clearPlaylists() {
  const ids = await getIndex(PLAYLIST_IDS_KEY)
  await delMany(
    ids.map((id) => playlistKey(id)),
    idbStore,
  )
  await setMany(
    [
      emptyIndexEntry(PLAYLIST_IDS_KEY),
      ...Object.values(PLAYLIST_SYNC_INDEX).map((key) => emptyIndexEntry(key)),
    ],
    idbStore,
  )
}

export async function getPlaylistTrackByRelationId(
  id: string,
): Promise<PlaylistTracks | undefined> {
  return get<PlaylistTracks>(playlistTrackKey(id), idbStore)
}

export async function getPlaylistTrack(
  playlistId: string,
  trackId: string,
): Promise<PlaylistTracks | undefined> {
  return getPlaylistTrackByRelationId(relationId(playlistId, trackId))
}

export async function listPlaylistTracks(): Promise<PlaylistTracks[]> {
  const ids = await getIndex(PLAYLIST_TRACK_IDS_KEY)
  return readByIds<PlaylistTracks>(ids, playlistTrackKey)
}

export async function listPlaylistTracksBySync(
  sync: Sync,
): Promise<PlaylistTracks[]> {
  const ids = await getIndex(PLAYLIST_TRACK_SYNC_INDEX[sync])
  return readByIds<PlaylistTracks>(ids, playlistTrackKey)
}

export async function listPlaylistTracksByPlaylistId(
  playlistId: string,
): Promise<PlaylistTracks[]> {
  const ids = await getIndex(playlistTrackByPlaylistIndex(playlistId))
  return readByIds<PlaylistTracks>(ids, playlistTrackKey)
}

export async function listPlaylistTracksByTrackId(
  trackId: string,
): Promise<PlaylistTracks[]> {
  const ids = await getIndex(playlistTrackByTrackIndex(trackId))
  return readByIds<PlaylistTracks>(ids, playlistTrackKey)
}

export async function putPlaylistTrack(relation: PlaylistTracks) {
  const prev = await getPlaylistTrackByRelationId(relation.id)
  await set(playlistTrackKey(relation.id), relation, idbStore)
  await addToIndex(PLAYLIST_TRACK_IDS_KEY, relation.id)
  await addToIndex(
    playlistTrackByPlaylistIndex(relation.playlistId),
    relation.id,
  )
  await addToIndex(playlistTrackByTrackIndex(relation.trackId), relation.id)
  await moveSyncIndex(
    relation.id,
    relation.sync,
    prev?.sync,
    PLAYLIST_TRACK_SYNC_INDEX,
  )
}

export async function putPlaylistTracks(relations: PlaylistTracks[]) {
  if (!relations.length) return

  const keys = relations.map((relation) => playlistTrackKey(relation.id))
  const prevItems = await getMany<PlaylistTracks>(keys, idbStore)

  await setMany(
    relations.map((relation, index) => [keys[index]!, relation] as const),
    idbStore,
  )

  await Promise.all(
    relations.map(async (relation, index) => {
      await addToIndex(PLAYLIST_TRACK_IDS_KEY, relation.id)
      await addToIndex(
        playlistTrackByPlaylistIndex(relation.playlistId),
        relation.id,
      )
      await addToIndex(playlistTrackByTrackIndex(relation.trackId), relation.id)
      await moveSyncIndex(
        relation.id,
        relation.sync,
        prevItems[index]?.sync,
        PLAYLIST_TRACK_SYNC_INDEX,
      )
    }),
  )
}

export async function updatePlaylistTrack(
  playlistId: string,
  trackId: string,
  patch: Partial<PlaylistTracks>,
) {
  const id = relationId(playlistId, trackId)
  let prevSync: Sync | undefined
  let nextSync: Sync | undefined

  await update<PlaylistTracks | undefined>(
    playlistTrackKey(id),
    (prev) => {
      if (!prev) return undefined
      prevSync = prev.sync
      const next = { ...prev, ...patch }
      nextSync = next.sync
      return next
    },
    idbStore,
  )

  if (!nextSync) return

  await addToIndex(PLAYLIST_TRACK_IDS_KEY, id)
  await addToIndex(playlistTrackByPlaylistIndex(playlistId), id)
  await addToIndex(playlistTrackByTrackIndex(trackId), id)
  await moveSyncIndex(id, nextSync, prevSync, PLAYLIST_TRACK_SYNC_INDEX)
}

export async function clearPlaylistTracks() {
  const all = await listPlaylistTracks()
  await delMany(
    all.map((item) => playlistTrackKey(item.id)),
    idbStore,
  )
  const resetEntries: Array<[string, string[]]> = [
    emptyIndexEntry(PLAYLIST_TRACK_IDS_KEY),
    ...Object.values(PLAYLIST_TRACK_SYNC_INDEX).map((key) =>
      emptyIndexEntry(key),
    ),
  ]

  const playlistKeys = new Set(
    all.map((item) => playlistTrackByPlaylistIndex(item.playlistId)),
  )
  const trackKeys = new Set(
    all.map((item) => playlistTrackByTrackIndex(item.trackId)),
  )

  resetEntries.push(
    ...Array.from(playlistKeys).map((key) => emptyIndexEntry(key)),
    ...Array.from(trackKeys).map((key) => emptyIndexEntry(key)),
  )

  await setMany(resetEntries, idbStore)
}

export function createPlaylistTrackRelation(
  playlistId: string,
  trackId: string,
  payload: Omit<PlaylistTracks, 'id' | 'playlistId' | 'trackId'>,
): PlaylistTracks {
  return {
    id: relationId(playlistId, trackId),
    playlistId,
    trackId,
    ...payload,
  }
}
