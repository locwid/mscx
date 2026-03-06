import { nanoid } from 'nanoid'
import { apiGetFile, apiImportYouTube } from './api/actions'
import { scheduleSyncWithServer } from './api/sync-with-server'
import {
  createTrackTagRelation,
  getTag,
  listTags,
  listTrackTagsByTagId,
  listTrackTagsByTrackId,
  listTracks,
  putTag,
  putTrackTag,
  putTracks,
  updateTag,
  updateTrack,
  updateTrackTag,
} from './storage/idb-storage'
import { storageRefreshKeys, touchStorageRefresh } from './storage/refresh'
import type { Tag, Track } from './storage/types'

type AddTrackFailure = {
  name: string
  reason: string
}

type AddTracksResult = {
  added: number
  failed: AddTrackFailure[]
}

async function listAllTrackTagOptionRefreshKeys() {
  const tracks = await listTracks()
  return tracks
    .filter((track) => track.sync !== 'deleted')
    .map((track) => storageRefreshKeys.trackTagOptions(track.id))
}

async function finalizeLocalMutation(keys: string[]) {
  await touchStorageRefresh(keys)
  scheduleSyncWithServer()
}

function sortByCreatedAt<T extends { createdAt: Date }>(items: T[]) {
  return [...items].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
}

function toActiveItems<T extends { sync: 'none' | 'created' | 'deleted' }>(
  items: T[],
) {
  return items.filter((item) => item.sync !== 'deleted')
}

export async function getAllTracksQuery() {
  const tracks = await listTracks()
  return sortByCreatedAt(toActiveItems(tracks))
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
    await finalizeLocalMutation([storageRefreshKeys.tracks])
  }

  return {
    added: items.length,
    failed,
  } satisfies AddTracksResult
}

export async function importYouTubeQuery(url: string) {
  await apiImportYouTube({ url })
  await finalizeLocalMutation([storageRefreshKeys.tracks])
}

export async function deleteTrackQuery(id: string) {
  await updateTrack(id, {
    sync: 'deleted',
    keepFile: false,
    file: undefined,
  })

  const relations = await listTrackTagsByTrackId(id)
  await Promise.all(
    relations.map((relation) =>
      updateTrackTag(relation.tagId, relation.trackId, {
        sync: 'deleted',
      }),
    ),
  )

  await finalizeLocalMutation([
    storageRefreshKeys.tracks,
    storageRefreshKeys.trackTagOptions(id),
  ])
}

export async function downloadTrackQuery(id: string) {
  const file = await apiGetFile(id)
  await updateTrack(id, { file, keepFile: true, autoDownloadDisabled: false })
  await touchStorageRefresh([storageRefreshKeys.tracks])
}

export async function unloadTrackQuery(id: string) {
  await updateTrack(id, {
    file: undefined,
    keepFile: false,
    autoDownloadDisabled: true,
  })
  await touchStorageRefresh([storageRefreshKeys.tracks])
}

export async function getAllTagsQuery() {
  const tags = await listTags()
  return sortByCreatedAt(toActiveItems(tags))
}

export async function getTagByIdQuery(id: string) {
  return getTag(id)
}

export async function addTagQuery(name: string) {
  await putTag({
    id: nanoid(),
    name,
    sync: 'created',
    createdAt: new Date(),
  })

  const trackTagOptionKeys = await listAllTrackTagOptionRefreshKeys()
  await finalizeLocalMutation([storageRefreshKeys.tags, ...trackTagOptionKeys])
}

export async function deleteTagQuery(id: string) {
  await updateTag(id, { sync: 'deleted' })

  const relations = await listTrackTagsByTagId(id)
  await Promise.all(
    relations.map((relation) =>
      updateTrackTag(relation.tagId, relation.trackId, {
        sync: 'deleted',
      }),
    ),
  )

  const trackTagOptionKeys = await listAllTrackTagOptionRefreshKeys()
  await finalizeLocalMutation([
    storageRefreshKeys.tags,
    storageRefreshKeys.tracks,
    ...trackTagOptionKeys,
  ])
}

export async function getTrackTagsQuery(trackId: string) {
  const [tags, relations] = await Promise.all([
    listTags(),
    listTrackTagsByTrackId(trackId),
  ])

  const activeTagIDs = new Set(
    relations
      .filter((relation) => relation.sync !== 'deleted')
      .map((r) => r.tagId),
  )

  return sortByCreatedAt(
    tags.filter((tag) => tag.sync !== 'deleted' && activeTagIDs.has(tag.id)),
  )
}

export async function getTracksByTagIdsQuery(tagIDs: string[]) {
  const cleanTagIDs = Array.from(new Set(tagIDs.filter(Boolean)))
  if (!cleanTagIDs.length) {
    return getAllTracksQuery()
  }

  const relationGroups = await Promise.all(
    cleanTagIDs.map((tagID) => listTrackTagsByTagId(tagID)),
  )

  // Strict AND: intersect track ids for each selected tag.
  const trackIDSets = relationGroups.map(
    (relations) =>
      new Set(
        relations
          .filter((relation) => relation.sync !== 'deleted')
          .map((relation) => relation.trackId),
      ),
  )

  const [firstSet, ...restSets] = trackIDSets
  if (!firstSet?.size) {
    return []
  }

  const intersection = new Set(
    Array.from(firstSet).filter((trackID) =>
      restSets.every((set) => set.has(trackID)),
    ),
  )

  if (!intersection.size) {
    return []
  }

  const tracks = await listTracks()
  return sortByCreatedAt(
    tracks.filter(
      (track) => track.sync !== 'deleted' && intersection.has(track.id),
    ),
  )
}

export async function addTagToTrackQuery(tagID: string, trackID: string) {
  await putTrackTag(
    createTrackTagRelation(tagID, trackID, {
      createdAt: new Date(),
      sync: 'created',
    }),
  )

  await finalizeLocalMutation([
    storageRefreshKeys.tracks,
    storageRefreshKeys.trackTagOptions(trackID),
  ])
}

export async function deleteTagFromTrackQuery(tagID: string, trackID: string) {
  await updateTrackTag(tagID, trackID, {
    sync: 'deleted',
  })

  await finalizeLocalMutation([
    storageRefreshKeys.tracks,
    storageRefreshKeys.trackTagOptions(trackID),
  ])
}

export async function getTrackTagOptionsQuery(trackID: string) {
  const [allTags, assignedTags] = await Promise.all([
    getAllTagsQuery(),
    getTrackTagsQuery(trackID),
  ])

  const assigned = new Set(assignedTags.map((tag) => tag.id))
  return {
    allTags,
    assigned,
  } satisfies {
    allTags: Tag[]
    assigned: Set<string>
  }
}
