import type { HealthResponse } from '~/shared/api/types'

export const useAppStore = defineStore('app', () => {
  const headerTitle = ref('')
  const health = ref<HealthResponse | null>(null)

  return {
    headerTitle,
    health,
  }
})
