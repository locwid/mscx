import {
  getTrackVisualParams,
  type TrackVisualParams,
} from '~/utils/track-visual-params'

const SIZE = 32
const BAR_COUNT = 20
const UPDATE_INTERVAL = 100 // ~10 FPS for favicon updates

/**
 * Animated favicon driven by audio frequency data.
 * Renders a simplified radial-bar visualization on a tiny offscreen canvas
 * and pushes it to the browser favicon at ~10 FPS while playing.
 */
export function useFaviconVisualizer(opts: {
  playing: Ref<boolean>
  analyserNode: ComputedRef<AnalyserNode | null>
  getFrequencyData: () => Uint8Array
  trackId: Ref<string | null>
}) {
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  let animationId: number | null = null
  let lastUpdate = 0
  let params: TrackVisualParams | null = null
  let linkEl: HTMLLinkElement | null = null

  function ensureCanvas() {
    if (canvas) return
    canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    ctx = canvas.getContext('2d')
  }

  /** Insert our own <link rel="icon"> at the end of <head> to override all existing favicons. */
  function insertFaviconLink() {
    if (linkEl) return
    linkEl = document.createElement('link')
    linkEl.rel = 'icon'
    linkEl.type = 'image/png'
    linkEl.setAttribute('data-favicon-visualizer', '')
    document.head.appendChild(linkEl)
  }

  /** Remove our injected link — browser falls back to the original favicon declarations. */
  function removeFaviconLink() {
    if (linkEl) {
      linkEl.remove()
      linkEl = null
    }
  }

  function getFrequencyBands(data: Uint8Array): {
    bass: number
    mid: number
    treble: number
  } {
    const binCount = data.length
    let bassSum = 0
    let midSum = 0
    let trebleSum = 0

    const bassEnd = Math.floor(binCount * 0.33)
    const midEnd = Math.floor(binCount * 0.66)

    for (let i = 0; i < bassEnd; i++) bassSum += data[i]!
    for (let i = bassEnd; i < midEnd; i++) midSum += data[i]!
    for (let i = midEnd; i < binCount; i++) trebleSum += data[i]!

    return {
      bass: bassSum / bassEnd / 255,
      mid: midSum / (midEnd - bassEnd) / 255,
      treble: trebleSum / (binCount - midEnd) / 255,
    }
  }

  function drawFavicon(timestamp: number) {
    if (!ctx || !canvas || !params) return

    // Throttle favicon DOM updates to ~10 FPS
    if (timestamp - lastUpdate < UPDATE_INTERVAL) {
      animationId = requestAnimationFrame(drawFavicon)
      return
    }
    lastUpdate = timestamp

    const data = opts.getFrequencyData()
    const bands = getFrequencyBands(data)
    const cx = SIZE / 2
    const cy = SIZE / 2

    // Clear
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Black circle background
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(cx, cy, SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    // Center glow — pulses with bass
    const glowRadius = 5 + bands.bass * 6
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
    grad.addColorStop(0, params.colors[0]!)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.6 + bands.bass * 0.4
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
    ctx.fill()

    // Radial frequency bars
    ctx.globalCompositeOperation = 'screen'
    const binCount = data.length
    const innerRadius = 6
    const maxBarHeight = 8

    for (let i = 0; i < BAR_COUNT; i++) {
      const binIdx = Math.floor((i / BAR_COUNT) * binCount)
      const val = data[binIdx]! / 255
      // Non-linear for more dynamic feel
      const norm = Math.pow(val, 0.7)
      const barHeight = norm * maxBarHeight

      if (barHeight < 0.5) continue

      // Angle: start from top (−π/2) going clockwise
      const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const x1 = cx + cos * innerRadius
      const y1 = cy + sin * innerRadius
      const x2 = cx + cos * (innerRadius + barHeight)
      const y2 = cy + sin * (innerRadius + barHeight)

      const colorIdx = i % params.colors.length
      ctx.strokeStyle = params.colors[colorIdx]!
      ctx.globalAlpha = 0.7 + norm * 0.3
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Reset
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    // Push to favicon
    if (linkEl) {
      linkEl.type = 'image/png'
      linkEl.href = canvas.toDataURL('image/png')
    }

    animationId = requestAnimationFrame(drawFavicon)
  }

  function startAnimation() {
    if (animationId) return
    ensureCanvas()
    insertFaviconLink()
    lastUpdate = 0
    animationId = requestAnimationFrame(drawFavicon)
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    removeFaviconLink()
  }

  // React to track changes — update color palette
  watch(
    () => opts.trackId.value,
    (id) => {
      if (id) {
        params = getTrackVisualParams(id)
      }
    },
    { immediate: true },
  )

  // React to play/pause
  watch(
    () => opts.playing.value,
    (isPlaying) => {
      if (isPlaying && opts.trackId.value) {
        startAnimation()
      } else {
        stopAnimation()
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stopAnimation()
  })
}
