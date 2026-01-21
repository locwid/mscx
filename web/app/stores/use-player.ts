export const usePlayer = defineStore('player', () => {
  const currentTrackId = ref<string | null>(null)
  const { tracks } = storeToRefs(useTracks())

  const currentTrack = computed(() =>
    tracks.value?.find((t) => t.id === currentTrackId.value),
  )

  const title = useTitle()
  watch(
    currentTrack,
    (val) => {
      title.value = val?.name ?? 'mscx'
    },
    {
      immediate: true
    }
  )

  async function switchToNextTrack() {
    if (!tracks.value) return
    const index = tracks.value?.findIndex((t) => t.id === currentTrackId.value)
    if (index === -1) return
    currentTrackId.value =
      tracks.value[(index + 1) % tracks.value.length]?.id ?? null
  }

  return {
    currentTrackId,
    currentTrack,
    switchToNextTrack,
  }
})
