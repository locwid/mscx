import type { Track } from '~/local-db'

export const useCurrentTrack = defineStore('current-track', () => {
  const currentTrack = ref<Track | null>(null)

  return { currentTrack }
})
