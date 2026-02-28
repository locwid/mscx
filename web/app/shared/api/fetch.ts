export const apiFetch = $fetch.create({
  baseURL: '/api',
  onRequest: ({ options }) => {
    const authKey = useAuthStore().authKey
    if (authKey) {
      options.headers.set('Authorization', authKey)
    }
  },
  onResponseError: ({ response }) => {
    if (response.status === 401) {
      useAuthStore().authKey = ''
      navigateTo('/auth')
    }
  },
})
