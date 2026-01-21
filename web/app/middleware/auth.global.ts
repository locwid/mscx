export default defineNuxtRouteMiddleware((to) => {
  const { authKey } = storeToRefs(useAuthStore())
  if (to.name === 'auth' && authKey.value) {
    return navigateTo('/')
  }
  if (to.name !== 'auth' && !authKey.value) {
    return navigateTo('/auth')
  }
})
