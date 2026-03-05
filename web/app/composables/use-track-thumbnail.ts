import type { Track } from '~/shared/storage/types'

export function useTrackThumbnail(trackGetter: () => Track | undefined) {
  const track = toRef(trackGetter)
  const src = ref<string | undefined>()
  const hasThumbnail = computed(() => !!track.value?.thumbnail)

  watch(
    track,
    (currentTrack, _prev, onCleanup) => {
      if (!currentTrack?.thumbnail) {
        src.value = undefined
        return
      }

      const objectUrl = URL.createObjectURL(currentTrack.thumbnail)
      src.value = objectUrl
      onCleanup(() => {
        URL.revokeObjectURL(objectUrl)
      })
    },
    { immediate: true },
  )

  return { src: readonly(src), hasThumbnail }
}
