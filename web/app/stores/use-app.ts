import type { HealthResponse } from '~/shared/api/types'

export const useAppStore = defineStore('app', () => {
  const headerTitle = ref('')
  const health = ref<HealthResponse | null>(null)
  const isFullscreenOpen = ref(false)

  function openFullscreen() {
    isFullscreenOpen.value = true
  }

  function closeFullscreen() {
    isFullscreenOpen.value = false
  }

  return {
    headerTitle,
    health,
    isFullscreenOpen: readonly(isFullscreenOpen),
    openFullscreen,
    closeFullscreen,
  }
})
