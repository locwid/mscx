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

export type ShapeType = 'circle' | 'ring' | 'triangle' | 'diamond' | 'line' | 'dot'

export interface TrackVisualParams {
  hueBase: number
  hueSecondary: number
  hueAccent: number
  particleCount: number
  speedMultiplier: number
  baseOrbitRadius: number
  colors: string[]
  glowColors: string[]
  /** Distribution of shapes unique to this track */
  shapeWeights: ShapeType[]
}

export function getTrackVisualParams(trackId: string): TrackVisualParams {
  const hash = hashString(trackId)
  const rng = seededRandom(hash)

  const hueBase = Math.floor(rng() * 360)
  const hueSecondary = (hueBase + 60 + Math.floor(rng() * 120)) % 360
  const hueAccent = (hueBase + 180 + Math.floor(rng() * 60)) % 360

  const particleCount = 55 + Math.floor(rng() * 40)
  const speedMultiplier = 0.7 + rng() * 0.6
  const baseOrbitRadius = 0.2 + rng() * 0.2

  const colors = [
    `hsl(${hueBase}, 85%, 65%)`,
    `hsl(${hueSecondary}, 80%, 60%)`,
    `hsl(${hueAccent}, 75%, 55%)`,
    `hsl(${(hueBase + 30) % 360}, 90%, 70%)`,
    `hsl(${(hueSecondary + 40) % 360}, 70%, 75%)`,
  ]

  const glowColors = [
    `hsla(${hueBase}, 90%, 60%, 0.4)`,
    `hsla(${hueSecondary}, 85%, 55%, 0.35)`,
    `hsla(${hueAccent}, 80%, 50%, 0.3)`,
    `hsla(${(hueBase + 30) % 360}, 95%, 65%, 0.4)`,
    `hsla(${(hueSecondary + 40) % 360}, 75%, 70%, 0.35)`,
  ]

  // Pick 3-4 shape types unique to this track
  const allShapes: ShapeType[] = ['circle', 'ring', 'triangle', 'diamond', 'line', 'dot']
  const shapeWeights: ShapeType[] = []
  const numShapes = 3 + Math.floor(rng() * 3)
  const shuffled = [...allShapes].sort(() => rng() - 0.5)
  for (let i = 0; i < numShapes; i++) {
    shapeWeights.push(shuffled[i % shuffled.length]!)
  }

  return {
    hueBase,
    hueSecondary,
    hueAccent,
    particleCount,
    speedMultiplier,
    baseOrbitRadius,
    colors,
    glowColors,
    shapeWeights,
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
  shape: ShapeType
  rotation: number
  rotationSpeed: number
}

export function createParticles(params: TrackVisualParams): Particle[] {
  const hash = hashString(
    params.hueBase.toString() + params.particleCount.toString(),
  )
  const rng = seededRandom(hash)

  const particles: Particle[] = []

  for (let i = 0; i < params.particleCount; i++) {
    const band = i % 3
    const shape = params.shapeWeights[i % params.shapeWeights.length]!

    particles.push({
      x: rng(),
      y: rng(),
      vx: (rng() - 0.5) * 0.002,
      vy: (rng() - 0.5) * 0.002,
      angle: rng() * Math.PI * 2,
      orbitRadius: params.baseOrbitRadius + rng() * 0.4,
      speed:
        (0.15 + rng() * 0.85) * params.speedMultiplier * (band === 0 ? 0.5 : 1),
      size: shape === 'dot' ? 1.5 + rng() * 2 : shape === 'line' ? 2 + rng() * 3 : 3 + rng() * 6,
      colorIndex: Math.floor(rng() * params.colors.length),
      phaseOffset: rng() * Math.PI * 2,
      radiusOscSpeed: 0.2 + rng() * 0.8,
      radiusOscAmp: 0.02 + rng() * 0.1,
      band,
      shape,
      rotation: rng() * Math.PI * 2,
      rotationSpeed: (rng() - 0.5) * 0.03,
    })
  }

  return particles
}
