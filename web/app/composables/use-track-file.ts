import { getFileUrlWithAuthKey } from '~/shared/api/actions'
import type { Track } from '~/shared/storage/types'

export function useTrackFile(trackGetter: () => Track | undefined) {
  const track = computed(trackGetter)
  const { authKey } = storeToRefs(useAuthStore())

  const src = computed(() => {
    if (track.value && track.value.file) {
      return URL.createObjectURL(track.value.file)
    }
    return track.value ? getFileUrlWithAuthKey(track.value.id, authKey.value) : undefined
  })

  return src
}
