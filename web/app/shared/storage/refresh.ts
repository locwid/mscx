import { set } from 'idb-keyval'
import { idbStore } from './idb-storage'

export const STORAGE_REFRESH_KEY = 'meta:storage-refresh'

const subscribers = new Set<(value: number) => void>()

export async function touchStorageRefresh() {
  const value = Date.now()
  await set(STORAGE_REFRESH_KEY, value, idbStore)
  subscribers.forEach((callback) => callback(value))
}

export function subscribeStorageRefresh(callback: (value: number) => void) {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}
