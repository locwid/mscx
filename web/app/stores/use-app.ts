import type { HealthResponse } from '~/shared/api/types'
import { AUTO_DOWNLOAD_TRACKS_STORAGE_KEY } from '~/shared/constants/keys'

export const useAppStore = defineStore('app', () => {
  const autoDownloadTracks = useLocalStorage(
    AUTO_DOWNLOAD_TRACKS_STORAGE_KEY,
    false,
  )
  const headerTitle = ref('')
  const health = ref<HealthResponse | null>(null)
  const isFullscreenOpen = ref(false)
  const isSyncing = ref(false)
  const lastSyncAt = ref<Date | null>(null)
  const syncError = ref<string | null>(null)

  function setHeaderTitle(title: string) {
    headerTitle.value = title
  }

  function setHealth(value: HealthResponse | null) {
    health.value = value
  }

  function markSyncStart() {
    isSyncing.value = true
    syncError.value = null
  }

  function markSyncSuccess() {
    isSyncing.value = false
    lastSyncAt.value = new Date()
    syncError.value = null
  }

  function markSyncError(error: unknown) {
    isSyncing.value = false
    syncError.value =
      error instanceof Error ? error.message : 'Unknown sync error'
  }

  function openFullscreen() {
    isFullscreenOpen.value = true
  }

  function closeFullscreen() {
    isFullscreenOpen.value = false
  }

  function setAutoDownloadTracks(value: boolean) {
    autoDownloadTracks.value = value
  }

  return {
    autoDownloadTracks,
    headerTitle: readonly(headerTitle),
    health: readonly(health),
    isFullscreenOpen: readonly(isFullscreenOpen),
    isSyncing: readonly(isSyncing),
    lastSyncAt: readonly(lastSyncAt),
    syncError: readonly(syncError),
    setHeaderTitle,
    setHealth,
    markSyncStart,
    markSyncSuccess,
    markSyncError,
    openFullscreen,
    closeFullscreen,
    setAutoDownloadTracks,
  }
})
