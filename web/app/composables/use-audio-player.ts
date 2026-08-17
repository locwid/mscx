import { useMediaControls, useThrottleFn } from '@vueuse/core'
import type { ShallowRef } from 'vue'
import { useTrackFile } from '~/composables/use-track-file'
import type { Track } from '~/shared/storage/types'

export type AudioPlayerOptions = {
  track: ComputedRef<Track | undefined>
  thumbnailSrcGetter: () => string | undefined
  hasThumbnailGetter: () => boolean
  onEnded: () => void
  onNext: () => void
  onPrev: () => void
}

export function useAudioPlayer(audioRef: ShallowRef<HTMLAudioElement | null>,options: AudioPlayerOptions) {
  const {
    track,
    thumbnailSrcGetter,
    hasThumbnailGetter,
    onEnded,
    onNext,
    onPrev,
  } = options

  const fileSrc = useTrackFile(() => track.value)

  const { playing, currentTime, duration, ended } = useMediaControls(audioRef, {
    src: computed(() => fileSrc.value || ''),
  })

  const mediaSession =
    typeof navigator !== 'undefined' ? navigator.mediaSession : undefined
  const canSetMetadata = typeof MediaMetadata !== 'undefined'
  const canSetPositionState =
    typeof mediaSession?.setPositionState === 'function'

  function setupMediaSessionHandlers() {
    if (!mediaSession) return
    mediaSession.setActionHandler('seekbackward', null)
    mediaSession.setActionHandler('seekforward', null)
    mediaSession.setActionHandler('nexttrack', () => {
      if (!track.value) return
      onNext()
    })
    mediaSession.setActionHandler('previoustrack', () => {
      if (!track.value) return
      onPrev()
    })
  }

  function clearMediaSessionHandlers() {
    if (!mediaSession) return
    mediaSession.setActionHandler('seekbackward', null)
    mediaSession.setActionHandler('seekforward', null)
    mediaSession.setActionHandler('nexttrack', null)
    mediaSession.setActionHandler('previoustrack', null)
  }

  function updateMediaSessionMetadata() {
    if (!mediaSession || !canSetMetadata) return
    if (!track.value) {
      mediaSession.metadata = null
      return
    }

    const artwork: MediaImage[] = []
    if (hasThumbnailGetter() && thumbnailSrcGetter()) {
      artwork.push({
        src: thumbnailSrcGetter()!,
        sizes: 'any',
        type: 'image/webp',
      })
    }
    artwork.push(
      {
        src: '/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    )

    mediaSession.metadata = new MediaMetadata({
      title: track.value.name,
      artist: 'mscx',
      album: 'mscx',
      artwork,
    })
  }

  function updateMediaSessionPlaybackState() {
    if (!mediaSession) return
    mediaSession.playbackState = playing.value ? 'playing' : 'paused'
  }

  const updateMediaSessionPositionState = useThrottleFn(() => {
    if (!mediaSession || !canSetPositionState) return
    const total = duration.value
    const position = currentTime.value
    if (
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isFinite(position) ||
      position < 0
    )
      return
    mediaSession.setPositionState({
      duration: total,
      position,
      playbackRate: 1,
    })
  }, 500)

  onBeforeUnmount(() => {
    clearMediaSessionHandlers()
  })

  watch(
    track,
    async () => {
      await nextTick()
      audioRef.value?.play()
      updateMediaSessionMetadata()
      setupMediaSessionHandlers()
    },
    { immediate: true },
  )

  watchDebounced(
    playing,
    () => {
      updateMediaSessionPlaybackState()
      setupMediaSessionHandlers()
    },
    { immediate: true, debounce: 50 },
  )

  watch([currentTime, duration], () => {
    updateMediaSessionPositionState()
  })

  watch(ended, async () => {
    clearMediaSessionHandlers()
    await nextTick()
    if (ended.value) onEnded()
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
