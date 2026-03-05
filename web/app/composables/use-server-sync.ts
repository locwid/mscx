import {
  scheduleSyncWithServer,
  trySyncWithServer,
} from '~/shared/api/sync-with-server'

export function useServerSync() {
  function trySync(immediate = false) {
    if (immediate) {
      void trySyncWithServer()
      return
    }

    scheduleSyncWithServer()
  }

  function setupSync() {
    const onOnline = () => {
      scheduleSyncWithServer()
    }

    trySync(true)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('online', onOnline)
    }
  }

  return {
    trySync,
    setupSync,
  }
}
