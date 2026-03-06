import { set } from 'idb-keyval'
import { idbStore } from './idb-storage'

const STORAGE_REFRESH_KEY_PREFIX = 'meta:storage-refresh:'

export const storageRefreshKeys = {
  tracks: 'tracks',
  tags: 'tags',
  trackTagOptions: (trackId: string) => `track-tag-options:${trackId}`,
} as const

export function makeStorageRefreshIDBKey(key: string) {
  return `${STORAGE_REFRESH_KEY_PREFIX}${key}`
}

const subscribers = new Map<string, Set<(value: number) => void>>()
const isDev = import.meta.dev

function logStorageRefresh(message: string, details: Record<string, unknown>) {
  if (!isDev) return
  console.debug(`[storage-refresh] ${message}`, details)
}

export async function touchStorageRefresh(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (!uniqueKeys.length) return

  logStorageRefresh('touch:start', { keys: uniqueKeys })

  const value = Date.now()
  await Promise.all(
    uniqueKeys.map((key) =>
      set(makeStorageRefreshIDBKey(key), value, idbStore),
    ),
  )

  uniqueKeys.forEach((key) => {
    const callbacks = subscribers.get(key)
    logStorageRefresh('touch:key', {
      key,
      subscribers: callbacks?.size ?? 0,
    })
    callbacks?.forEach((callback) => callback(value))
  })

  logStorageRefresh('touch:done', {
    keys: uniqueKeys,
    timestamp: value,
  })
}

export function subscribeStorageRefresh(
  key: string,
  callback: (value: number) => void,
) {
  const current = subscribers.get(key)
  if (current) {
    current.add(callback)
  } else {
    subscribers.set(key, new Set([callback]))
  }

  logStorageRefresh('subscribe', {
    key,
    subscribers: subscribers.get(key)?.size ?? 0,
  })

  return () => {
    const current = subscribers.get(key)
    if (!current) return

    current.delete(callback)
    if (current.size === 0) {
      subscribers.delete(key)
    }

    logStorageRefresh('unsubscribe', {
      key,
      subscribers: subscribers.get(key)?.size ?? 0,
    })
  }
}
