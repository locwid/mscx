import {
  createStore,
  delMany,
  get,
  getMany,
  set,
  setMany,
  update,
} from 'idb-keyval'
import type { Sync, Tag, Track, TrackTag } from './types'

export const idbStore = createStore('mscx-keyval-db', 'mscx-keyval')

const TRACK_PREFIX = 'track:'
const TAG_PREFIX = 'tag:'
const TRACK_TAG_PREFIX = 'trackTag:'

const TRACK_IDS_KEY = 'index:tracks:all'
const TAG_IDS_KEY = 'index:tags:all'
const TRACK_TAG_IDS_KEY = 'index:trackTags:all'

const TRACK_SYNC_INDEX = {
  none: 'index:tracks:sync:none',
  created: 'index:tracks:sync:created',
  deleted: 'index:tracks:sync:deleted',
} as const

const TAG_SYNC_INDEX = {
  none: 'index:tags:sync:none',
  created: 'index:tags:sync:created',
  deleted: 'index:tags:sync:deleted',
} as const

const TRACK_TAG_SYNC_INDEX = {
  none: 'index:trackTags:sync:none',
  created: 'index:trackTags:sync:created',
  deleted: 'index:trackTags:sync:deleted',
} as const

function trackKey(id: string) {
  return `${TRACK_PREFIX}${id}`
}

function tagKey(id: string) {
  return `${TAG_PREFIX}${id}`
}

function relationID(tagId: string, trackId: string) {
  return `${tagId}:${trackId}`
}

function trackTagKey(id: string) {
  return `${TRACK_TAG_PREFIX}${id}`
}

function trackTagByTagIndex(tagId: string) {
  return `index:trackTags:tag:${tagId}`
}

function trackTagByTrackIndex(trackId: string) {
  return `index:trackTags:track:${trackId}`
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

export async function getTag(id: string): Promise<Tag | undefined> {
  return get<Tag>(tagKey(id), idbStore)
}

export async function listTags(): Promise<Tag[]> {
  const ids = await getIndex(TAG_IDS_KEY)
  return readByIds<Tag>(ids, tagKey)
}

export async function listTagsBySync(sync: Sync): Promise<Tag[]> {
  const ids = await getIndex(TAG_SYNC_INDEX[sync])
  return readByIds<Tag>(ids, tagKey)
}

export async function putTag(tag: Tag) {
  const prev = await getTag(tag.id)
  await set(tagKey(tag.id), tag, idbStore)
  await addToIndex(TAG_IDS_KEY, tag.id)
  await moveSyncIndex(tag.id, tag.sync, prev?.sync, TAG_SYNC_INDEX)
}

export async function putTags(tags: Tag[]) {
  if (!tags.length) return

  const keys = tags.map((tag) => tagKey(tag.id))
  const prevItems = await getMany<Tag>(keys, idbStore)

  await setMany(
    tags.map((tag, index) => [keys[index]!, tag] as const),
    idbStore,
  )

  await Promise.all(
    tags.map(async (tag, index) => {
      await addToIndex(TAG_IDS_KEY, tag.id)
      await moveSyncIndex(
        tag.id,
        tag.sync,
        prevItems[index]?.sync,
        TAG_SYNC_INDEX,
      )
    }),
  )
}

export async function updateTag(id: string, patch: Partial<Tag>) {
  let prevSync: Sync | undefined
  let nextSync: Sync | undefined

  await update<Tag | undefined>(
    tagKey(id),
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

  await addToIndex(TAG_IDS_KEY, id)
  await moveSyncIndex(id, nextSync, prevSync, TAG_SYNC_INDEX)
}

export async function clearTags() {
  const ids = await getIndex(TAG_IDS_KEY)

  await delMany(
    ids.map((id) => tagKey(id)),
    idbStore,
  )

  await setMany(
    [
      emptyIndexEntry(TAG_IDS_KEY),
      ...Object.values(TAG_SYNC_INDEX).map((key) => emptyIndexEntry(key)),
    ],
    idbStore,
  )
}

export async function getTrackTagByRelationID(
  id: string,
): Promise<TrackTag | undefined> {
  return get<TrackTag>(trackTagKey(id), idbStore)
}

export async function getTrackTag(
  tagId: string,
  trackId: string,
): Promise<TrackTag | undefined> {
  return getTrackTagByRelationID(relationID(tagId, trackId))
}

export async function listTrackTags(): Promise<TrackTag[]> {
  const ids = await getIndex(TRACK_TAG_IDS_KEY)
  return readByIds<TrackTag>(ids, trackTagKey)
}

export async function listTrackTagsBySync(sync: Sync): Promise<TrackTag[]> {
  const ids = await getIndex(TRACK_TAG_SYNC_INDEX[sync])
  return readByIds<TrackTag>(ids, trackTagKey)
}

export async function listTrackTagsByTagId(tagId: string): Promise<TrackTag[]> {
  const ids = await getIndex(trackTagByTagIndex(tagId))
  return readByIds<TrackTag>(ids, trackTagKey)
}

export async function listTrackTagsByTrackId(
  trackId: string,
): Promise<TrackTag[]> {
  const ids = await getIndex(trackTagByTrackIndex(trackId))
  return readByIds<TrackTag>(ids, trackTagKey)
}

export async function putTrackTag(relation: TrackTag) {
  const prev = await getTrackTagByRelationID(relation.id)

  await set(trackTagKey(relation.id), relation, idbStore)
  await addToIndex(TRACK_TAG_IDS_KEY, relation.id)
  await addToIndex(trackTagByTagIndex(relation.tagId), relation.id)
  await addToIndex(trackTagByTrackIndex(relation.trackId), relation.id)

  await moveSyncIndex(
    relation.id,
    relation.sync,
    prev?.sync,
    TRACK_TAG_SYNC_INDEX,
  )
}

export async function putTrackTags(relations: TrackTag[]) {
  if (!relations.length) return

  const keys = relations.map((relation) => trackTagKey(relation.id))
  const prevItems = await getMany<TrackTag>(keys, idbStore)

  await setMany(
    relations.map((relation, index) => [keys[index]!, relation] as const),
    idbStore,
  )

  await Promise.all(
    relations.map(async (relation, index) => {
      await addToIndex(TRACK_TAG_IDS_KEY, relation.id)
      await addToIndex(trackTagByTagIndex(relation.tagId), relation.id)
      await addToIndex(trackTagByTrackIndex(relation.trackId), relation.id)
      await moveSyncIndex(
        relation.id,
        relation.sync,
        prevItems[index]?.sync,
        TRACK_TAG_SYNC_INDEX,
      )
    }),
  )
}

export async function updateTrackTag(
  tagId: string,
  trackId: string,
  patch: Partial<TrackTag>,
) {
  const id = relationID(tagId, trackId)
  let prevSync: Sync | undefined
  let nextSync: Sync | undefined

  await update<TrackTag | undefined>(
    trackTagKey(id),
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

  await addToIndex(TRACK_TAG_IDS_KEY, id)
  await addToIndex(trackTagByTagIndex(tagId), id)
  await addToIndex(trackTagByTrackIndex(trackId), id)
  await moveSyncIndex(id, nextSync, prevSync, TRACK_TAG_SYNC_INDEX)
}

export async function clearTrackTags() {
  const all = await listTrackTags()

  await delMany(
    all.map((item) => trackTagKey(item.id)),
    idbStore,
  )

  const resetEntries: Array<[string, string[]]> = [
    emptyIndexEntry(TRACK_TAG_IDS_KEY),
    ...Object.values(TRACK_TAG_SYNC_INDEX).map((key) => emptyIndexEntry(key)),
  ]

  const tagKeys = new Set(all.map((item) => trackTagByTagIndex(item.tagId)))
  const trackKeys = new Set(
    all.map((item) => trackTagByTrackIndex(item.trackId)),
  )

  resetEntries.push(
    ...Array.from(tagKeys).map((key) => emptyIndexEntry(key)),
    ...Array.from(trackKeys).map((key) => emptyIndexEntry(key)),
  )

  await setMany(resetEntries, idbStore)
}

export function createTrackTagRelation(
  tagId: string,
  trackId: string,
  payload: Omit<TrackTag, 'id' | 'tagId' | 'trackId'>,
): TrackTag {
  return {
    id: relationID(tagId, trackId),
    tagId,
    trackId,
    ...payload,
  }
}
