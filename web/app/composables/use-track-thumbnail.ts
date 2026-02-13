import type { Track } from '~/dexie.storage'

export function useTrackThumbnail(trackGetter: () => Track | undefined) {
  const track = computed(trackGetter)

  const src = computed(() => {
    if (track.value && track.value.thumbnail) {
      return URL.createObjectURL(track.value.thumbnail)
    }
    return undefined
  })

  const hasThumbnail = computed(() => {
    return !!(track.value && track.value.thumbnail)
  })

  return { src, hasThumbnail }
}
