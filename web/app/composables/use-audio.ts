const audioElement = document.createElement('audio')
audioElement.preload = 'metadata'

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let frequencyData: Uint8Array<ArrayBuffer> | null = null

function initAudioContext() {
  if (audioContext) return

  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.6

  sourceNode = audioContext.createMediaElementSource(audioElement)
  sourceNode.connect(analyser)
  analyser.connect(audioContext.destination)

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

export function useAudio() {
  const src = ref('')
  const playing = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const ended = ref(false)

  let isSeeking = false

  watch(src, (newSrc) => {
    if (newSrc) {
      ended.value = false
      audioElement.src = newSrc
      audioElement.load()
      audioElement.play().then(() => {
        playing.value = true
      }).catch(() => {
        playing.value = false
      })
    }
  })

  function onPlay() {
    playing.value = true
    ended.value = false
  }

  function onPause() {
    playing.value = false
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

  watch(playing, (val) => {
    if (val) {
      initAudioContext()
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
  }
}
