export type VisualizerPalette = {
  primary: string
  secondary: string
  accent: string
  glow: string
}

export type AudioDynamics = {
  energy: number
  low: number
  mid: number
  high: number
}

export type VisualizerParticle = {
  x: number
  y: number
  velocityX: number
  velocityY: number
  baseSize: number
  phase: number
  wobble: number
}

export type ParticleField = {
  width: number
  height: number
  particles: VisualizerParticle[]
}

export type VisualizerFrameState = {
  previousLowEnergy: number
  beatPulse: number
  beatRotation: number
  linearRotation: number
  particles: ParticleField
}

export type RenderOptions = {
  animate: boolean
  deltaMs: number
  timeMs: number
}

export function trackIdToPalette(trackId: string): VisualizerPalette {
  const hash = hashTrackId(trackId)

  const hue = hash % 360
  const secondHue = (hue + 32) % 360
  const accentHue = (hue + 180) % 360

  return {
    primary: `hsla(${hue}, 86%, 60%, 0.95)`,
    secondary: `hsla(${secondHue}, 80%, 64%, 0.82)`,
    accent: `hsla(${accentHue}, 74%, 62%, 0.55)`,
    glow: `hsla(${hue}, 88%, 58%, 0.22)`,
  }
}

export function createVisualizerFrameState(
  width: number,
  height: number,
  particleCount = 95,
): VisualizerFrameState {
  return {
    previousLowEnergy: 0,
    beatPulse: 0,
    beatRotation: 0,
    linearRotation: 0,
    particles: createParticleField(width, height, particleCount),
  }
}

export function resizeCanvasForDPR(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nextWidth = Math.max(1, Math.floor(width * dpr))
  const nextHeight = Math.max(1, Math.floor(height * dpr))

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }

  const context = canvas.getContext('2d')
  if (!context) return null

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  return context
}

export function sampleFrequencyData(analyser: AnalyserNode) {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  return data
}

export function analyzeAudioDynamics(frequencies: Uint8Array): AudioDynamics {
  const length = frequencies.length
  if (!length) {
    return {
      energy: 0,
      low: 0,
      mid: 0,
      high: 0,
    }
  }

  const lowEnd = Math.max(1, Math.floor(length * 0.18))
  const midEnd = Math.max(lowEnd + 1, Math.floor(length * 0.5))

  let lowSum = 0
  for (let index = 0; index < lowEnd; index += 1) {
    lowSum += frequencies[index] ?? 0
  }

  let midSum = 0
  for (let index = lowEnd; index < midEnd; index += 1) {
    midSum += frequencies[index] ?? 0
  }

  let highSum = 0
  for (let index = midEnd; index < length; index += 1) {
    highSum += frequencies[index] ?? 0
  }

  const low = clamp01(lowSum / (lowEnd * 255))
  const mid = clamp01(midSum / ((midEnd - lowEnd) * 255))
  const high = clamp01(highSum / (Math.max(1, length - midEnd) * 255))

  return {
    low,
    mid,
    high,
    energy: clamp01(low * 0.5 + mid * 0.35 + high * 0.15),
  }
}

export function drawDuplicatedFrequencyRings(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  frequencies: Uint8Array,
  trackId: string,
  palette: VisualizerPalette,
  state: VisualizerFrameState,
  options: RenderOptions,
) {
  const dynamics = analyzeAudioDynamics(frequencies)
  const signature = getTrackSignature(trackId)

  if (options.animate) {
    const attack = Math.max(0, dynamics.low - state.previousLowEnergy)
    state.beatPulse = clamp01(state.beatPulse * 0.82 + attack * 2.8)
    state.beatRotation = fract(state.beatRotation + attack * 0.058 + state.beatPulse * 0.008)
    state.linearRotation = fract(state.linearRotation + options.deltaMs * 0.0000014)
    state.previousLowEnergy = state.previousLowEnergy * 0.72 + dynamics.low * 0.28
  } else {
    state.beatPulse *= 0.96
  }

  if (state.particles.width !== width || state.particles.height !== height) {
    state.particles = createParticleField(width, height, state.particles.particles.length)
  }

  context.clearRect(0, 0, width, height)

  drawBlobGlow(context, width, height, palette, dynamics, state.beatPulse, options.timeMs)
  drawParticles(
    context,
    state.particles,
    dynamics,
    state.beatPulse,
    palette,
    options.animate ? options.deltaMs : 0,
    options.timeMs,
  )

  const centerX = width / 2
  const centerY = height / 2
  const outerBaseRadius = Math.min(width, height) * 0.1025
  const gapFactor = 0.072 + dynamics.mid * 0.028 + dynamics.high * 0.02
  const ringGap = outerBaseRadius * gapFactor
  const middleBaseRadius = outerBaseRadius - ringGap
  const innerBaseRadius = middleBaseRadius - ringGap * (0.92 + dynamics.low * 0.16)
  const maxAmplitude = Math.min(width, height) * 0.14
  const ringOffsetBase = fract(state.beatRotation + state.linearRotation)
  const dynamicAmplitude =
    0.76
    + Math.pow(dynamics.low, 1.25) * 0.82
    + Math.pow(dynamics.energy, 1.1) * 0.46
    + state.beatPulse * 0.35

  context.save()
  context.translate(centerX, centerY)

  drawRing(context, frequencies, {
    baseRadius: outerBaseRadius,
    maxAmplitude: maxAmplitude * dynamicAmplitude * signature.outerAmplitude,
    strokeStyle: palette.primary,
    lineWidth: 2.1 + state.beatPulse * 1.4,
    alpha: 1,
    frequencyOffset: ringOffsetBase,
    responseCurve: signature.outerResponse - dynamics.high * 0.34,
    detailBoost: signature.detailBoost + dynamics.mid * 0.35,
    amplitudeFloor: 0.12 + dynamics.energy * 0.16,
  })

  drawRing(context, frequencies, {
    baseRadius: middleBaseRadius,
    maxAmplitude:
      maxAmplitude
      * (0.58 + dynamics.mid * 0.5 + state.beatPulse * 0.22)
      * signature.innerAmplitude,
    strokeStyle: palette.accent,
    lineWidth: 1.8 + state.beatPulse * 0.85,
    alpha: 0.86,
    frequencyOffset: ringOffsetBase,
    responseCurve: signature.innerResponse - dynamics.mid * 0.14,
    detailBoost: signature.detailBoost * 0.96 + dynamics.low * 0.22,
    amplitudeFloor: 0.11 + dynamics.mid * 0.14,
  })

  drawRing(context, frequencies, {
    baseRadius: innerBaseRadius,
    maxAmplitude:
      maxAmplitude
      * (0.42 + dynamics.mid * 0.42 + state.beatPulse * 0.16)
      * (signature.innerAmplitude * 0.94),
    strokeStyle: palette.secondary,
    lineWidth: 1.5 + state.beatPulse * 0.8,
    alpha: 0.9,
    frequencyOffset: ringOffsetBase,
    responseCurve: signature.innerResponse - dynamics.low * 0.2,
    detailBoost: signature.detailBoost * 0.9 + dynamics.high * 0.2,
    amplitudeFloor: 0.1 + dynamics.mid * 0.14,
  })

  context.restore()
}

type DrawRingOptions = {
  baseRadius: number
  maxAmplitude: number
  strokeStyle: string
  lineWidth: number
  alpha: number
  frequencyOffset: number
  responseCurve: number
  detailBoost: number
  amplitudeFloor: number
}

function drawRing(
  context: CanvasRenderingContext2D,
  frequencies: Uint8Array,
  options: DrawRingOptions,
) {
  const points = Math.round(190 + clamp01(options.detailBoost) * 80)
  const step = (Math.PI * 2) / points
  const frequenciesLength = frequencies.length

  context.beginPath()

  for (let pointIndex = 0; pointIndex <= points; pointIndex += 1) {
    const angle = pointIndex * step
    const shifted = pointIndex / points + options.frequencyOffset
    const normalized = shifted > 1 ? shifted - 1 : shifted
    const rawAmplitude = sampleMirroredHalfFrequency(frequencies, frequenciesLength, normalized)
    const response = Math.max(0.96, options.responseCurve - 0.16)
    const shapedAmplitude = Math.pow(rawAmplitude, response)
    const waveGain = 1.28 + clamp01(options.detailBoost) * 0.38
    const amplitude = Math.max(0, options.amplitudeFloor + shapedAmplitude * waveGain)
    const radius = options.baseRadius + amplitude * options.maxAmplitude
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    if (pointIndex === 0) {
      context.moveTo(x, y)
      continue
    }

    context.lineTo(x, y)
  }

  context.closePath()
  context.globalAlpha = options.alpha
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.strokeStyle = options.strokeStyle
  context.lineWidth = options.lineWidth
  context.stroke()
  context.globalAlpha = 1
}

function drawBlobGlow(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: VisualizerPalette,
  dynamics: AudioDynamics,
  beatPulse: number,
  timeMs: number,
) {
  const time = timeMs * 0.001
  const blobRadius = Math.min(width, height) * (0.28 + dynamics.energy * 0.16)
  const blurRadius = Math.round(Math.min(width, height) * (0.08 + dynamics.energy * 0.06))

  context.save()
  context.filter = `blur(${blurRadius}px)`
  context.globalCompositeOperation = 'lighter'

  const blobs = [
    {
      x: width * (0.5 + Math.sin(time * 0.74) * (0.07 + dynamics.low * 0.06)),
      y: height * (0.45 + Math.cos(time * 0.61) * (0.08 + dynamics.mid * 0.05)),
      color: palette.glow,
      alpha: 0.5 + dynamics.low * 0.35,
      radius: blobRadius,
    },
    {
      x: width * (0.44 + Math.cos(time * 0.52 + 2.2) * (0.13 + dynamics.mid * 0.08)),
      y: height * (0.56 + Math.sin(time * 0.66 + 0.8) * (0.1 + dynamics.high * 0.07)),
      color: palette.secondary,
      alpha: 0.33 + dynamics.mid * 0.4,
      radius: blobRadius * 0.76,
    },
    {
      x: width * (0.58 + Math.sin(time * 0.88 + 0.6) * (0.12 + beatPulse * 0.09)),
      y: height * (0.52 + Math.cos(time * 0.57 + 1.4) * (0.11 + dynamics.low * 0.06)),
      color: palette.accent,
      alpha: 0.24 + beatPulse * 0.35,
      radius: blobRadius * 0.64,
    },
  ]

  for (const blob of blobs) {
    const gradient = context.createRadialGradient(
      blob.x,
      blob.y,
      blob.radius * 0.12,
      blob.x,
      blob.y,
      blob.radius,
    )
    gradient.addColorStop(0, applyAlpha(blob.color, blob.alpha))
    gradient.addColorStop(1, applyAlpha(blob.color, 0))

    context.fillStyle = gradient
    context.beginPath()
    context.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawParticles(
  context: CanvasRenderingContext2D,
  field: ParticleField,
  dynamics: AudioDynamics,
  beatPulse: number,
  palette: VisualizerPalette,
  deltaMs: number,
  timeMs: number,
) {
  const deltaSeconds = Math.min(0.045, Math.max(0, deltaMs) / 1000)
  const energySpeed = 0.28 + Math.pow(dynamics.energy, 1.8) * 2.4
  const beatBoost = 1 + beatPulse * 1.8
  const jitterStrength = 6 + beatPulse * 18
  const highKick = 1 + Math.pow(dynamics.high, 1.65) * 4.2
  const time = timeMs * 0.001

  context.save()
  context.globalCompositeOperation = 'lighter'

  for (const particle of field.particles) {
    if (deltaSeconds > 0) {
      const wobbleX = Math.sin(time * particle.wobble + particle.phase) * jitterStrength
      const wobbleY = Math.cos(time * (particle.wobble * 0.92) + particle.phase * 1.3) * jitterStrength
      const kickX = Math.sin(time * (3.6 + particle.wobble) + particle.phase * 0.7) * highKick * 14
      const kickY = Math.cos(time * (3.2 + particle.wobble * 0.8) + particle.phase * 1.1) * highKick * 14

      particle.x += (particle.velocityX * energySpeed * beatBoost + wobbleX + kickX) * deltaSeconds
      particle.y += (particle.velocityY * energySpeed + wobbleY + kickY) * deltaSeconds

      if (particle.x < -40) particle.x = field.width + 40
      if (particle.x > field.width + 40) particle.x = -40
      if (particle.y < -40) particle.y = field.height + 40
      if (particle.y > field.height + 40) particle.y = -40
    }

    const twinkle = 0.45 + Math.sin(time * 1.8 + particle.phase) * 0.18
    const expansion = 0.65 + dynamics.high * 1.35 + beatPulse * 0.8
    const radius = particle.baseSize * expansion
    const brightnessBoost = clamp01((expansion - 0.65) / 1.5)

    const gradient = context.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      radius,
    )
    gradient.addColorStop(0, applyAlpha(palette.secondary, 0.24 + twinkle * 0.24 + brightnessBoost * 0.3))
    gradient.addColorStop(0.6, applyAlpha(palette.primary, 0.12 + beatPulse * 0.16 + brightnessBoost * 0.24))
    gradient.addColorStop(1, applyAlpha(palette.accent, 0))

    context.fillStyle = gradient
    context.beginPath()
    context.arc(particle.x, particle.y, radius, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function createParticleField(width: number, height: number, count: number): ParticleField {
  const particles: VisualizerParticle[] = []

  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      velocityX: (Math.random() - 0.5) * 120,
      velocityY: (Math.random() - 0.5) * 120,
      baseSize: 1.2 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.8 + Math.random() * 2.6,
    })
  }

  return {
    width,
    height,
    particles,
  }
}

function applyAlpha(hsla: string, alpha: number) {
  const match = hsla.match(/hsla\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\s*\)/)
  if (!match) return hsla

  const [, hue, saturation, lightness] = match
  return `hsla(${hue}, ${saturation}, ${lightness}, ${clamp01(alpha)})`
}

function clamp01(value: number) {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function hashTrackId(trackId: string) {
  return Array.from(trackId).reduce((accumulator, char) => {
    return (accumulator * 31 + char.charCodeAt(0)) >>> 0
  }, 0)
}

function getTrackSignature(trackId: string) {
  const hash = hashTrackId(trackId)

  return {
    seed: (hash % 1000) / 1000,
    outerAmplitude: 1 + ((hash >>> 3) % 34) / 100,
    innerAmplitude: 0.92 + ((hash >>> 7) % 28) / 100,
    outerResponse: 1.35 + ((hash >>> 11) % 40) / 100,
    innerResponse: 1.22 + ((hash >>> 16) % 34) / 100,
    detailBoost: ((hash >>> 21) % 70) / 100,
  }
}

function fract(value: number) {
  return value - Math.floor(value)
}

function sampleMirroredHalfFrequency(
  frequencies: Uint8Array,
  frequenciesLength: number,
  normalized: number,
) {
  const halfLength = Math.max(1, Math.floor(frequenciesLength / 2))
  if (halfLength === 1) {
    return (frequencies[0] ?? 0) / 255
  }

  const halfProgress = normalized < 0.5
    ? normalized * 2
    : (normalized - 0.5) * 2
  const indexFloat = halfProgress * (halfLength - 1)
  const indexA = Math.floor(indexFloat)
  const indexB = Math.min(halfLength - 1, indexA + 1)
  const ratio = indexFloat - indexA

  const valueA = frequencies[indexA] ?? 0
  const valueB = frequencies[indexB] ?? 0

  return (valueA * (1 - ratio) + valueB * ratio) / 255
}
