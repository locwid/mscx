const audioElement = document.createElement('audio')
audioElement.preload = 'metadata'
audioElement.setAttribute('playsinline', '')
audioElement.setAttribute('webkit-playsinline', '')

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let frequencyData: Uint8Array<ArrayBuffer> | null = null

function initAudioContext() {
  if (audioContext) return

  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.6

  // captureStream() считывает частотные данные без перехвата
  // вывода аудиоэлемента — звук продолжает воспроизводиться
  // напрямую через <audio>, что критично для фонового режима
  if (
    'captureStream' in audioElement &&
    typeof (audioElement as any).captureStream === 'function'
  ) {
    const stream = (audioElement as any).captureStream() as MediaStream
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    // НЕ подключаем analyser к destination —
    // аудиоэлемент сам выводит звук
  }
  // Если captureStream недоступен (Safari/iOS), визуализатор
  // работает без частотных данных, но фоновое воспроизведение сохраняется

  frequencyData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
}

function getFrequencyData(): Uint8Array {
  if (!analyser || !frequencyData) {
    return new Uint8Array(256)
  }

  if (audioContext?.state === 'suspended') {
    audioContext.resume()
  }

  analyser.getByteFrequencyData(frequencyData)
  return frequencyData
}

function setupMediaSession(meta?: { title?: string; artist?: string }) {
  if (!('mediaSession' in navigator)) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: meta?.title || 'mscx',
    artist: meta?.artist || '',
    album: 'mscx',
  })
}

export function useAudio() {
  const src = ref('')
  const playing = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const ended = ref(false)

  let isSeeking = false
  let mediaSessionHandlersSet = false

  watch(src, (newSrc) => {
    if (newSrc) {
      ended.value = false
      audioElement.src = newSrc
      audioElement.load()
      audioElement
        .play()
        .then(() => {
          playing.value = true
        })
        .catch(() => {
          playing.value = false
        })
    }
  })

  function onPlay() {
    playing.value = true
    ended.value = false
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing'
    }
  }

  function onPause() {
    playing.value = false
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused'
    }
  }

  function onTimeUpdate() {
    if (!isSeeking) {
      currentTime.value = audioElement.currentTime
    }
  }

  function onDurationChange() {
    duration.value = audioElement.duration || 0
  }

  function onEnded() {
    ended.value = true
    playing.value = false
  }

  function onLoadedMetadata() {
    duration.value = audioElement.duration || 0
  }

  audioElement.addEventListener('play', onPlay)
  audioElement.addEventListener('pause', onPause)
  audioElement.addEventListener('timeupdate', onTimeUpdate)
  audioElement.addEventListener('durationchange', onDurationChange)
  audioElement.addEventListener('ended', onEnded)
  audioElement.addEventListener('loadedmetadata', onLoadedMetadata)

  // Восстановление AudioContext при возвращении из фона
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (
        !document.hidden &&
        audioContext?.state === 'suspended' &&
        playing.value
      ) {
        audioContext.resume()
      }
    })
  }

  watch(playing, (val) => {
    if (val) {
      if (audioContext?.state === 'suspended') {
        audioContext.resume()
      }
      audioElement.play().catch(() => {
        playing.value = false
      })
    } else {
      audioElement.pause()
    }
  })

  const seekTo = (time: number) => {
    isSeeking = true
    audioElement.currentTime = time
    currentTime.value = time
    nextTick(() => {
      isSeeking = false
    })
  }

  const writableCurrentTime = computed({
    get: () => currentTime.value,
    set: (val: number) => seekTo(val),
  })

  function play() {
    playing.value = true
  }

  function pause() {
    playing.value = false
  }

  function togglePlay() {
    playing.value = !playing.value
  }

  function setTrackMeta(meta: { title?: string; artist?: string }) {
    setupMediaSession(meta)
  }

  function setMediaSessionHandlers(handlers: {
    onNext?: () => void
    onPrevious?: () => void
  }) {
    if (mediaSessionHandlersSet || !('mediaSession' in navigator)) return
    mediaSessionHandlersSet = true

    navigator.mediaSession.setActionHandler('play', () => {
      audioElement.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioElement.pause()
    })
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) {
        audioElement.currentTime = details.seekTime
        currentTime.value = details.seekTime
      }
    })
    if (handlers.onNext) {
      navigator.mediaSession.setActionHandler(
        'nexttrack',
        handlers.onNext,
      )
    }
    if (handlers.onPrevious) {
      navigator.mediaSession.setActionHandler(
        'previoustrack',
        handlers.onPrevious,
      )
    }
  }

  const analyserNode = computed(() => analyser)

  return {
    src,
    playing,
    currentTime: writableCurrentTime,
    duration: readonly(duration),
    ended: readonly(ended),
    analyserNode,
    getFrequencyData,
    initAudioContext,
    play,
    pause,
    togglePlay,
    setTrackMeta,
    setMediaSessionHandlers,
  }
}
