import type { Track } from '~/dexie.storage'

export const usePlayer = defineStore('player', () => {
  const currentTrack = ref<Track | null>(null)
  const { tracks } = storeToRefs(useTracks())

  async function switchToNextTrack() {
    if (!tracks.value) return
    const index = tracks.value?.findIndex(
      (t) => t.id === currentTrack.value?.id,
    )
    if (index === -1) return
    currentTrack.value = tracks.value[(index + 1) % tracks.value.length] ?? null
  }

  return {
    currentTrack,
    switchToNextTrack,
  }
})
