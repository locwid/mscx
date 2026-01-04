export function useServerSync(fn: () => Promise<void>) {
  const debouncedSync = useDebounceFn(fn, 1000)

  async function trySync(immediate = false) {
    if (navigator.onLine) {
      if (immediate) {
        fn()
      } else {
        debouncedSync()
      }
    }
  }

  async function setupSync() {
    trySync(true)
    window.addEventListener('online', () => trySync())
  }

  return {
    trySync,
    setupSync,
  }
}
