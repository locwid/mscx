import { getFileUrlWithAuthKey } from '~/shared/api/actions'
import type { Track } from '~/shared/storage/types'

export function useTrackFile(trackGetter: () => Track | undefined) {
  const track = toRef(trackGetter)
  const { authKey } = storeToRefs(useAuthStore())
  const src = ref<string | undefined>()

  watch(
    [track, authKey],
    ([currentTrack, currentAuthKey], _prev, onCleanup) => {
      if (currentTrack?.file) {
        const objectUrl = URL.createObjectURL(currentTrack.file)
        src.value = objectUrl
        onCleanup(() => {
          URL.revokeObjectURL(objectUrl)
        })
        return
      }

      src.value = currentTrack
        ? getFileUrlWithAuthKey(currentTrack.id, currentAuthKey)
        : undefined
    },
    { immediate: true },
  )

  return readonly(src)
}
