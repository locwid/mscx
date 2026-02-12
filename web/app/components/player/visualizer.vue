<script lang="ts" setup>
import { AUDIO_PLAYER_KEY } from '~/shared/constants/keys'
import {
  createVisualizerFrameState,
  drawDuplicatedFrequencyRings,
  resizeCanvasForDPR,
  sampleFrequencyData,
  trackIdToPalette,
} from '~/shared/visualizer/frequency-rings'

const props = defineProps<{
  trackId: string
  playing: boolean
}>()

const audioPlayer = inject(AUDIO_PLAYER_KEY)!

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const palette = computed(() => trackIdToPalette(props.trackId))

let frameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let lastFrequencies: Uint8Array | null = null
let frameState: ReturnType<typeof createVisualizerFrameState> | null = null
let lastFrameTime = 0

function stopLoop() {
  if (frameId === null) return
  cancelAnimationFrame(frameId)
  frameId = null
}

function drawFrame(shouldSample: boolean) {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return

  if (!frameState) {
    frameState = createVisualizerFrameState(root.clientWidth, root.clientHeight)
  }

  const timeNow = performance.now()
  const deltaMs =
    lastFrameTime === 0 ? 16 : Math.max(0, timeNow - lastFrameTime)
  lastFrameTime = timeNow

  const context = resizeCanvasForDPR(
    canvas,
    root.clientWidth,
    root.clientHeight,
  )
  if (!context) return

  const graph = audioPlayer.getAudioGraph()
  const analyser = graph?.analyser

  if (shouldSample && analyser) {
    lastFrequencies = sampleFrequencyData(analyser)
  }

  if (!lastFrequencies) {
    if (analyser) {
      lastFrequencies = sampleFrequencyData(analyser)
    } else {
      lastFrequencies = new Uint8Array(1024)
    }
  }

  drawDuplicatedFrequencyRings(
    context,
    root.clientWidth,
    root.clientHeight,
    lastFrequencies,
    props.trackId,
    palette.value,
    frameState,
    {
      animate: shouldSample,
      deltaMs,
      timeMs: timeNow,
    },
  )
}

function startLoop() {
  stopLoop()

  const loop = () => {
    drawFrame(true)
    if (!props.playing) {
      frameId = null
      return
    }
    frameId = requestAnimationFrame(loop)
  }

  frameId = requestAnimationFrame(loop)
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    drawFrame(false)
  })

  if (rootRef.value) {
    resizeObserver.observe(rootRef.value)
  }

  drawFrame(false)

  if (props.playing) {
    void audioPlayer.resumeAudioContext()
    startLoop()
  }
})

onBeforeUnmount(() => {
  stopLoop()
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => props.trackId,
  () => {
    lastFrequencies = null
    frameState = null
    lastFrameTime = 0
    drawFrame(false)
    if (props.playing) {
      startLoop()
    }
  },
)

watch(
  () => props.playing,
  (isPlaying) => {
    if (isPlaying) {
      void audioPlayer.resumeAudioContext()
      startLoop()
      return
    }

    stopLoop()
    drawFrame(false)
  },
)
</script>

<template>
  <div
    ref="rootRef"
    class="absolute inset-0 pointer-events-none overflow-hidden"
  >
    <canvas ref="canvasRef" class="h-full w-full" />
  </div>
</template>
