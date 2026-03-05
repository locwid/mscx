import { apiHealth } from '~/shared/api/actions'

export const useHealthCheck = () => {
  const appStore = useAppStore()

  const checkHealth = async () => {
    try {
      const response = await apiHealth()
      appStore.setHealth(response)
    } catch (error) {
      // Silently fail, health check is non-critical
      console.debug('Health check failed:', error)
    }
  }

  return {
    checkHealth,
  }
}
