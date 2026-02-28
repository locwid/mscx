import { useMediaControls, useThrottleFn } from '@vueuse/core'
import { useTrackFile } from '~/composables/use-track-file'
import type { Track } from '~/dexie.storage'

export type AudioPlayerOptions = {
  trackGetter: () => Track | undefined
  thumbnailSrcGetter: () => string | undefined
  hasThumbnailGetter: () => boolean
  onEnded: () => void
  onNext: () => void
  onPrev: () => void
}

export function useAudioPlayer(options: AudioPlayerOptions) {
  const {
    trackGetter,
    thumbnailSrcGetter,
    hasThumbnailGetter,
    onEnded,
    onNext,
    onPrev,
  } = options

  const fileSrc = useTrackFile(() => trackGetter())

  const audioRef = ref<HTMLAudioElement | null>(null)

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
      if (!trackGetter()) return
      onNext()
    })
    mediaSession.setActionHandler('previoustrack', () => {
      if (!trackGetter()) return
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
    const track = trackGetter()
    if (!track) {
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
      title: track.name,
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
    () => trackGetter(),
    () => {
      updateMediaSessionMetadata()
      setupMediaSessionHandlers()
    },
    { immediate: true },
  )

  watch(
    playing,
    () => {
      updateMediaSessionPlaybackState()
      setupMediaSessionHandlers()
    },
    { immediate: true },
  )

  watch([currentTime, duration], () => {
    updateMediaSessionPositionState()
  })

  watch(ended, () => {
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
