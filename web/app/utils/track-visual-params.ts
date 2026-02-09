function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export interface TrackVisualParams {
  hueBase: number
  hueSecondary: number
  hueAccent: number
  particleCount: number
  speedMultiplier: number
  baseOrbitRadius: number
  colors: string[]
  glowColors: string[]
}

export function getTrackVisualParams(trackId: string): TrackVisualParams {
  const hash = hashString(trackId)
  const rng = seededRandom(hash)

  const hueBase = Math.floor(rng() * 360)
  // Analogous harmony: hues within 25-65° of each other
  const hue2 = (hueBase + 25 + Math.floor(rng() * 20)) % 360
  const hue3 = (hueBase + 45 + Math.floor(rng() * 20)) % 360
  const hue4 = (hueBase - 20 - Math.floor(rng() * 15) + 360) % 360
  const hue5 = (hueBase + 30 + Math.floor(rng() * 25)) % 360

  const particleCount = 55 + Math.floor(rng() * 40)
  const speedMultiplier = 0.7 + rng() * 0.6
  const baseOrbitRadius = 0.2 + rng() * 0.2

  const colors = [
    `hsl(${hueBase}, ${80 + Math.floor(rng() * 15)}%, ${60 + Math.floor(rng() * 10)}%)`,
    `hsl(${hue2}, ${75 + Math.floor(rng() * 15)}%, ${55 + Math.floor(rng() * 15)}%)`,
    `hsl(${hue3}, ${70 + Math.floor(rng() * 20)}%, ${58 + Math.floor(rng() * 12)}%)`,
    `hsl(${hue4}, ${78 + Math.floor(rng() * 17)}%, ${62 + Math.floor(rng() * 10)}%)`,
    `hsl(${hue5}, ${72 + Math.floor(rng() * 18)}%, ${55 + Math.floor(rng() * 15)}%)`,
  ]

  const glowColors = [
    `hsla(${hueBase}, 90%, 60%, 0.35)`,
    `hsla(${hue2}, 85%, 55%, 0.3)`,
    `hsla(${hue3}, 82%, 52%, 0.28)`,
    `hsla(${hue4}, 88%, 58%, 0.35)`,
    `hsla(${hue5}, 80%, 56%, 0.3)`,
  ]

  return {
    hueBase,
    hueSecondary: hue2,
    hueAccent: hue3,
    particleCount,
    speedMultiplier,
    baseOrbitRadius,
    colors,
    glowColors,
  }
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  orbitRadius: number
  speed: number
  size: number
  colorIndex: number
  phaseOffset: number
  radiusOscSpeed: number
  radiusOscAmp: number
  /** Which frequency band affects this particle: 0=bass, 1=mid, 2=treble */
  band: number
  rotation: number
  rotationSpeed: number
  /** Number of control points for blob shape */
  blobPoints: number
  /** Radial offsets for each blob control point (0.6–1.4) */
  blobOffsets: number[]
  /** Oscillation speed for each blob control point */
  blobSpeeds: number[]
  /** Initial oscillation phase for each blob control point */
  blobPhases: number[]
}

export function createParticles(params: TrackVisualParams): Particle[] {
  const hash = hashString(
    params.hueBase.toString() + params.particleCount.toString(),
  )
  const rng = seededRandom(hash)

  const particles: Particle[] = []

  for (let i = 0; i < params.particleCount; i++) {
    const band = i % 3
    const blobPoints = 5 + Math.floor(rng() * 4) // 5–8 points
    const blobOffsets: number[] = []
    const blobSpeeds: number[] = []
    const blobPhases: number[] = []

    for (let j = 0; j < blobPoints; j++) {
      blobOffsets.push(0.7 + rng() * 0.6) // 0.7–1.3
      blobSpeeds.push(0.3 + rng() * 1.2)  // 0.3–1.5
      blobPhases.push(rng() * Math.PI * 2)
    }

    particles.push({
      x: rng(),
      y: rng(),
      vx: (rng() - 0.5) * 0.002,
      vy: (rng() - 0.5) * 0.002,
      angle: rng() * Math.PI * 2,
      orbitRadius: params.baseOrbitRadius + rng() * 0.4,
      speed:
        (0.15 + rng() * 0.85) * params.speedMultiplier * (band === 0 ? 0.5 : 1),
      size: 3 + rng() * 7,
      colorIndex: Math.floor(rng() * params.colors.length),
      phaseOffset: rng() * Math.PI * 2,
      radiusOscSpeed: 0.2 + rng() * 0.8,
      radiusOscAmp: 0.02 + rng() * 0.1,
      band,
      rotation: rng() * Math.PI * 2,
      rotationSpeed: (rng() - 0.5) * 0.03,
      blobPoints,
      blobOffsets,
      blobSpeeds,
      blobPhases,
    })
  }

  return particles
}
