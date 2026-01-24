import { getFileUrlWithAuthKey } from '~/shared/api/actions'
import type { Track } from '~/dexie.storage'

export function useTrackFile(trackGetter: () => Track) {
  const track = toRef(trackGetter)
  const { authKey } = storeToRefs(useAuthStore())

  const src = computed(() => {
    if (track.value.file) {
      return URL.createObjectURL(track.value.file)
    }
    return getFileUrlWithAuthKey(track.value.id, authKey.value)
  })

  return src
}
