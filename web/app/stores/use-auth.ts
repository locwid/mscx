import { useStorage } from '@vueuse/core'

export const useAuthStore = defineStore('auth', () => {
  const authKey = useStorage('authKey', '', localStorage)

  return { authKey }
})
