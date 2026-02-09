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
let prevFreqData: Uint8Array | null = null

function fetchFrequencyData(): Uint8Array | null {
  if (!props.analyserNode || !props.playing || !props.getFrequencyData) {
    cachedFreqData = null
    return null
  }
  // Store previous frame for echo ring
  if (cachedFreqData) {
    if (!prevFreqData || prevFreqData.length !== cachedFreqData.length) {
      prevFreqData = new Uint8Array(cachedFreqData.length)
    }
    prevFreqData.set(cachedFreqData)
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

/**
 * Draw an organic blob shape using bezier curves with oscillating control points.
 * Each blob has unique deformation parameters that evolve over time.
 */
function drawBlob(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  x: number,
  y: number,
  size: number,
  t: number,
  energy: number,
) {
  const n = p.blobPoints
  const points: { px: number; py: number }[] = []

  for (let i = 0; i < n; i++) {
    const baseAngle = (i / n) * Math.PI * 2
    // Oscillating radius for organic deformation
    const osc =
      Math.sin(t * 0.001 * p.blobSpeeds[i]! + p.blobPhases[i]!) * 0.25
    const energyDeform = energy * 0.15 * Math.sin(t * 0.003 + i * 1.7)
    const r = size * (p.blobOffsets[i]! + osc + energyDeform)
    points.push({
      px: Math.cos(baseAngle) * r,
      py: Math.sin(baseAngle) * r,
    })
  }

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(p.rotation)

  ctx.beginPath()
  // Start from midpoint between last and first point
  const lastPt = points[n - 1]!
  const firstPt = points[0]!
  ctx.moveTo(
    (lastPt.px + firstPt.px) / 2,
    (lastPt.py + firstPt.py) / 2,
  )

  for (let i = 0; i < n; i++) {
    const curr = points[i]!
    const next = points[(i + 1) % n]!
    const midX = (curr.px + next.px) / 2
    const midY = (curr.py + next.py) / 2
    ctx.quadraticCurveTo(curr.px, curr.py, midX, midY)
  }

  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

/**
 * Draw a smooth frequency ring using quadratic curves.
 * Bass at bottom (6 o'clock), treble at top (12 o'clock), sequential (no mirroring).
 */
function drawFrequencyRing(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  cx: number,
  cy: number,
  ringRadius: number,
  startAngle: number,
  alpha: number,
  lineWidth: number,
  color: string,
) {
  const binCount = data.length
  // Use fewer points than bins for smoother curves, but enough for detail
  const pointCount = Math.min(binCount, 128)
  const sliceAngle = (Math.PI * 2) / pointCount

  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth

  // Pre-compute ring points
  const ringPoints: { rx: number; ry: number }[] = []
  for (let i = 0; i < pointCount; i++) {
    const binIdx = Math.floor((i / pointCount) * binCount)
    const binNext = Math.min(binIdx + 1, binCount - 1)
    const frac = ((i / pointCount) * binCount) - binIdx
    const rawVal = (data[binIdx]! * (1 - frac) + data[binNext]! * frac) / 255
    // Non-linear: boost quiet, compress loud for more dynamic feel
    const val = Math.pow(rawVal, 0.65)
    const r = ringRadius + val * ringRadius * 1.2
    const a = startAngle + i * sliceAngle
    ringPoints.push({
      rx: cx + Math.cos(a) * r,
      ry: cy + Math.sin(a) * r,
    })
  }

  // Draw smooth closed curve through ring points using quadratic bezier
  ctx.beginPath()
  const last = ringPoints[pointCount - 1]!
  const first = ringPoints[0]!
  ctx.moveTo((last.rx + first.rx) / 2, (last.ry + first.ry) / 2)

  for (let i = 0; i < pointCount; i++) {
    const curr = ringPoints[i]!
    const next = ringPoints[(i + 1) % pointCount]!
    ctx.quadraticCurveTo(curr.rx, curr.ry, (curr.rx + next.rx) / 2, (curr.ry + next.ry) / 2)
  }

  ctx.closePath()
  ctx.stroke()
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

    // Glow — larger, softer blob
    const glowSize = (p.size * 3.5 + energy * 12) * dpr
    ctx.globalAlpha = 0.1 + energy * 0.2
    ctx.fillStyle = params.glowColors[p.colorIndex]!
    drawBlob(ctx, p, x, y, glowSize, time, energy)
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
    drawBlob(ctx, p, x, y, particleSize, time, energy)
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
    const ringRadius = Math.min(w, h) * 0.22
    // Bass at bottom (π/2), treble at top, slow drift rotation
    const startAngle = Math.PI / 2 + time * 0.0002

    ctx.globalCompositeOperation = 'screen'

    // Echo ring (previous frame data) — inner, dimmer
    if (prevFreqData) {
      drawFrequencyRing(
        ctx,
        prevFreqData,
        cx,
        cy,
        ringRadius * 0.85,
        startAngle,
        0.12 + bands.bass * 0.1,
        4 * dpr,
        params.colors[3 % params.colors.length]!,
      )
    }

    // Main ring — outer, brighter
    drawFrequencyRing(
      ctx,
      cachedFreqData,
      cx,
      cy,
      ringRadius,
      startAngle,
      0.3 + bands.mid * 0.4,
      2 * dpr,
      params.colors[2 % params.colors.length]!,
    )

    // Inner glow ring
    drawFrequencyRing(
      ctx,
      cachedFreqData,
      cx,
      cy,
      ringRadius,
      startAngle,
      0.1 + bands.bass * 0.18,
      6 * dpr,
      params.colors[2 % params.colors.length]!,
    )
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  time += 16
  animationId = requestAnimationFrame(drawFrame)
}

function initParticles(trackId: string) {
  params = getTrackVisualParams(trackId)
  particles = createParticles(params)
  prevFreqData = null
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
