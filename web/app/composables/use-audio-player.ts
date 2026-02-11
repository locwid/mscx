import { useMediaControls } from '@vueuse/core'
import { useTrackFile } from '~/composables/use-track-file'
import { usePlayer } from '~/stores/use-player'

export function useAudioPlayer() {
  const player = usePlayer()
  const currentTrack = computed(() => player.currentTrack)

  const fileSrc = computed(() => {
    const track = currentTrack.value
    if (!track) return undefined
    return useTrackFile(() => track).value
  })

  const audioRef = ref<HTMLAudioElement | null>(null)

  const { playing, currentTime, duration, ended } = useMediaControls(audioRef, {
    src: computed(() => fileSrc.value || ''),
  })

  watch(ended, () => {
    if (ended.value) player.switchToNextTrack()
  })

  return {
    audioRef,
    playing,
    currentTime,
    duration,
    ended,
  }
}

export type AudioPlayer = {
  audioRef: Ref<HTMLAudioElement | null>
  playing: Ref<boolean>
  currentTime: Ref<number>
  duration: Ref<number>
  ended: Ref<boolean>
}
