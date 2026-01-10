export const useAppStore = defineStore('app', () => {
  const headerTitle = ref('')

  return {
    headerTitle,
  }
})
