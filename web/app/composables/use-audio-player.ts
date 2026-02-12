import { useMediaControls, useThrottleFn } from '@vueuse/core'
import { useTrackFile } from '~/composables/use-track-file'
import {
  getOrCreateAudioGraph,
  resumeAudioContextIfNeeded,
  type AudioGraph,
} from '~/shared/visualizer/audio-graph'
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
  const audioGraph = shallowRef<AudioGraph | null>(null)

  const { playing, currentTime, duration, ended } = useMediaControls(audioRef, {
    src: computed(() => fileSrc.value || ''),
  })

  const mediaSession = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined
  const canSetMetadata = typeof MediaMetadata !== 'undefined'
  const canSetPositionState = typeof mediaSession?.setPositionState === 'function'

  function getAudioGraph() {
    const element = audioRef.value
    if (!element) return null
    const graph = getOrCreateAudioGraph(element)
    audioGraph.value = graph
    return graph
  }

  async function resumeAudioContext() {
    const graph = getAudioGraph()
    if (!graph) return
    await resumeAudioContextIfNeeded(graph.context)
  }

  function setMediaSessionHandler(
    action: MediaSessionAction,
    handler: MediaSessionActionHandler | null,
  ) {
    if (!mediaSession) return
    try {
      mediaSession.setActionHandler(action, handler)
    } catch {
      return
    }
  }

  function setupMediaSessionHandlers() {
    if (!mediaSession) return
    setMediaSessionHandler('seekbackward', null)
    setMediaSessionHandler('seekforward', null)
    setMediaSessionHandler('nexttrack', () => {
      if (!currentTrack.value) return
      player.switchToNextTrack()
    })
    setMediaSessionHandler('previoustrack', () => {
      if (!currentTrack.value) return
      player.switchToPreviousTrack()
    })
  }

  function clearMediaSessionHandlers() {
    if (!mediaSession) return
    setMediaSessionHandler('seekbackward', null)
    setMediaSessionHandler('seekforward', null)
    setMediaSessionHandler('nexttrack', null)
    setMediaSessionHandler('previoustrack', null)
  }

  function updateMediaSessionMetadata() {
    if (!mediaSession || !canSetMetadata) return
    const track = currentTrack.value
    if (!track) {
      mediaSession.metadata = null
      return
    }
    mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: 'mscx',
      album: 'mscx',
      artwork: [
        { src: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
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
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(position) || position < 0) return
    mediaSession.setPositionState({
      duration: total,
      position,
      playbackRate: 1,
    })
  }, 500)

  onBeforeUnmount(() => {
    clearMediaSessionHandlers()
  })

  watch(currentTrack, () => {
    updateMediaSessionMetadata()
    setupMediaSessionHandlers()
  }, { immediate: true })

  watch(playing, () => {
    updateMediaSessionPlaybackState()
    setupMediaSessionHandlers()

    if (!playing.value) return
    void resumeAudioContext()
  }, { immediate: true })

  watch(audioRef, () => {
    getAudioGraph()
  })

  watch([currentTime, duration], () => {
    updateMediaSessionPositionState()
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
    getAudioGraph,
    resumeAudioContext,
  }
}

export type AudioPlayer = {
  audioRef: Ref<HTMLAudioElement | null>
  playing: Ref<boolean>
  currentTime: Ref<number>
  duration: Ref<number>
  ended: Ref<boolean>
  getAudioGraph: () => AudioGraph | null
  resumeAudioContext: () => Promise<void>
}
