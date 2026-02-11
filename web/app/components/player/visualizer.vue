<script lang="ts" setup>
import {
  getTrackVisualParams,
  createParticles,
  type Particle,
  type TrackVisualParams,
} from '~/utils/track-visual-params'

const props = defineProps<{
  trackId: string
  analyserNode: AnalyserNode | null
  playing: boolean
  getFrequencyData?: () => Uint8Array
}>()

const canvasRef = useTemplateRef('canvas')
let animationId: number | null = null
let particles: Particle[] = []
let params: TrackVisualParams | null = null
let time = 0
let w = 0
let h = 0

const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.parentElement?.getBoundingClientRect()
  if (!rect) return
  w = rect.width * dpr
  h = rect.height * dpr
  canvas.width = w
  canvas.height = h
}

let cachedFreqData: Uint8Array | null = null

function fetchFrequencyData(): Uint8Array | null {
  if (!props.analyserNode || !props.playing || !props.getFrequencyData) {
    cachedFreqData = null
    return null
  }
  cachedFreqData = props.getFrequencyData()
  return cachedFreqData
}

function getFrequencyBands(): { bass: number; mid: number; treble: number } {
  const data = cachedFreqData
  if (!data) return { bass: 0, mid: 0, treble: 0 }

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

function drawShape(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  x: number,
  y: number,
  size: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(p.rotation)

  switch (p.shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'ring':
      ctx.lineWidth = size * 0.3
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.stroke()
      break

    case 'triangle': {
      const h = size * 1.7
      ctx.beginPath()
      ctx.moveTo(0, -h / 2)
      ctx.lineTo(-size, h / 2)
      ctx.lineTo(size, h / 2)
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'diamond': {
      const s = size * 1.4
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.lineTo(s * 0.6, 0)
      ctx.lineTo(0, s)
      ctx.lineTo(-s * 0.6, 0)
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'line': {
      const len = size * 3
      ctx.lineWidth = size * 0.4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-len / 2, 0)
      ctx.lineTo(len / 2, 0)
      ctx.stroke()
      break
    }

    case 'dot':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.fill()
      break
  }

  ctx.restore()
}

function drawFrame() {
  const canvas = canvasRef.value
  if (!canvas || !params) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cx = w / 2
  const cy = h / 2
  const diag = Math.hypot(w, h)

  fetchFrequencyData()
  const bands = getFrequencyBands()

  const breathe = props.playing ? 1 : 0.93 + Math.sin(time * 0.0012) * 0.07

  // Fade trail
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  ctx.fillRect(0, 0, w, h)

  // === LARGE AMBIENT BLOBS ===
  ctx.globalCompositeOperation = 'screen'
  const blobEnergy = bands.bass * 0.6 + bands.mid * 0.3
  for (let i = 0; i < 3; i++) {
    const bAngle = time * 0.0003 * (i + 1) + (i * Math.PI * 2) / 3
    const bRadius = diag * (0.15 + blobEnergy * 0.12) * breathe
    const bx = cx + Math.cos(bAngle) * diag * 0.18
    const by = cy + Math.sin(bAngle) * diag * 0.12

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius)
    grad.addColorStop(0, params.glowColors[i % params.glowColors.length]!)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 0.2 + blobEnergy * 0.3
    ctx.fillStyle = grad
    ctx.fillRect(bx - bRadius, by - bRadius, bRadius * 2, bRadius * 2)
  }

  // === GLOW LAYER ===
  ctx.globalCompositeOperation = 'screen'

  for (const p of particles) {
    const bandValue =
      p.band === 0 ? bands.bass : p.band === 1 ? bands.mid : bands.treble
    const energy = props.playing ? bandValue : 0

    // Movement: orbital + drift
    const speedFactor = props.playing ? 1 + energy * 2.5 : 0.25
    p.angle += p.speed * 0.008 * speedFactor
    p.rotation += p.rotationSpeed * speedFactor

    // Drift slowly across screen
    p.x += p.vx * speedFactor
    p.y += p.vy * speedFactor
    // Wrap around edges
    if (p.x < -0.1) p.x = 1.1
    if (p.x > 1.1) p.x = -0.1
    if (p.y < -0.1) p.y = 1.1
    if (p.y > 1.1) p.y = -0.1

    const radiusOsc =
      Math.sin(time * 0.001 * p.radiusOscSpeed + p.phaseOffset) *
      p.radiusOscAmp
    const energyPush = energy * 0.12
    const effectiveOrbit = (p.orbitRadius + radiusOsc + energyPush) * breathe

    const x = p.x * w + Math.cos(p.angle) * effectiveOrbit * diag * 0.25
    const y = p.y * h + Math.sin(p.angle) * effectiveOrbit * diag * 0.25

    // Glow
    const glowSize = (p.size * 3.5 + energy * 12) * dpr
    ctx.globalAlpha = 0.1 + energy * 0.2
    ctx.fillStyle = params.glowColors[p.colorIndex]!
    ctx.strokeStyle = params.glowColors[p.colorIndex]!
    drawShape(ctx, { ...p, shape: 'circle' } as Particle, x, y, glowSize)
  }

  // === SHARP PARTICLE LAYER ===
  for (const p of particles) {
    const bandValue =
      p.band === 0 ? bands.bass : p.band === 1 ? bands.mid : bands.treble
    const energy = props.playing ? bandValue : 0

    const radiusOsc =
      Math.sin(time * 0.001 * p.radiusOscSpeed + p.phaseOffset) *
      p.radiusOscAmp
    const energyPush = energy * 0.12
    const effectiveOrbit = (p.orbitRadius + radiusOsc + energyPush) * breathe

    const x = p.x * w + Math.cos(p.angle) * effectiveOrbit * diag * 0.25
    const y = p.y * h + Math.sin(p.angle) * effectiveOrbit * diag * 0.25

    const particleSize = (p.size + energy * 4) * dpr
    const alpha = 0.5 + energy * 0.5

    ctx.globalAlpha = alpha
    ctx.fillStyle = params.colors[p.colorIndex]!
    ctx.strokeStyle = params.colors[p.colorIndex]!
    drawShape(ctx, p, x, y, particleSize)
  }

  // === CENTER GLOW ===
  const centerEnergy = bands.bass * 0.5 + bands.mid * 0.3 + bands.treble * 0.2
  const centerRadius = diag * (0.08 + centerEnergy * 0.12) * breathe
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius)
  grad.addColorStop(0, params.glowColors[0]!)
  grad.addColorStop(0.4, params.glowColors[1]!)
  grad.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.25 + centerEnergy * 0.35
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2)
  ctx.fill()

  // === FREQUENCY RING ===
  if (props.playing && cachedFreqData) {
    const data = cachedFreqData
    const ringRadius = Math.min(w, h) * 0.22
    // Mirror spectrum: bass at top, treble at bottom, symmetric left/right
    const binCount = data.length
    const pointCount = binCount
    const sliceAngle = (Math.PI * 2) / pointCount

    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.2 + bands.mid * 0.25
    ctx.strokeStyle = params.colors[2 % params.colors.length]!
    ctx.lineWidth = 2 * dpr

    ctx.beginPath()
    for (let i = 0; i < pointCount; i++) {
      // Map: first half goes clockwise (right side), second half mirrors (left side)
      // So bin 0 (bass) is at top, bin N/2 (treble) is at bottom
      let binIdx: number
      if (i < pointCount / 2) {
        binIdx = i * 2 // right side: 0..N ascending
      } else {
        binIdx = (pointCount - 1 - i) * 2 // left side: mirror
      }
      binIdx = Math.min(binIdx, binCount - 1)

      const val0 = data[binIdx]! / 255
      const val1 = (data[Math.min(binIdx + 1, binCount - 1)]!) / 255
      const val = (val0 + val1) / 2
      const r = ringRadius + val * ringRadius * 0.8
      const a = i * sliceAngle - Math.PI / 2
      const rx = cx + Math.cos(a) * r
      const ry = cy + Math.sin(a) * r
      if (i === 0) ctx.moveTo(rx, ry)
      else ctx.lineTo(rx, ry)
    }
    ctx.closePath()
    ctx.stroke()

    // Inner glow ring
    ctx.globalAlpha = 0.08 + bands.bass * 0.15
    ctx.lineWidth = 6 * dpr
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  time += 16
  animationId = requestAnimationFrame(drawFrame)
}

function initParticles(trackId: string) {
  params = getTrackVisualParams(trackId)
  particles = createParticles(params)
}

function startAnimation() {
  if (animationId) return
  time = 0
  resizeCanvas()

  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
    }
  }

  animationId = requestAnimationFrame(drawFrame)
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

let resizeObserver: ResizeObserver | null = null

watch(
  () => props.trackId,
  (id) => {
    initParticles(id)
  },
  { immediate: true },
)

onMounted(() => {
  resizeCanvas()
  startAnimation()

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
  })
  if (canvasRef.value?.parentElement) {
    resizeObserver.observe(canvasRef.value.parentElement)
  }
})

onUnmounted(() => {
  stopAnimation()
  resizeObserver?.disconnect()
})
</script>

<template>
  <canvas
    ref="canvas"
    class="absolute inset-0 w-full h-full"
  />
</template>
