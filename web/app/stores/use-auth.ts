import { useStorage } from '@vueuse/core'
import { AUTH_STORAGE_KEY } from '~/shared/constants/keys'

export const useAuthStore = defineStore('auth', () => {
  const authKey = useStorage(AUTH_STORAGE_KEY, '', localStorage)

  return { authKey }
})
