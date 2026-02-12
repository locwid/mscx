export type AudioGraph = {
  context: AudioContext
  source: MediaElementAudioSourceNode
  analyser: AnalyserNode
}

const graphByElement = new WeakMap<HTMLAudioElement, AudioGraph>()

export function getOrCreateAudioGraph(
  audioElement: HTMLAudioElement,
): AudioGraph {
  const existing = graphByElement.get(audioElement)
  if (existing) return existing

  const context = new AudioContext()
  const source = context.createMediaElementSource(audioElement)
  const analyser = context.createAnalyser()

  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.82

  source.connect(analyser)
  analyser.connect(context.destination)

  const created: AudioGraph = {
    context,
    source,
    analyser,
  }

  graphByElement.set(audioElement, created)
  return created
}

export async function resumeAudioContextIfNeeded(context: AudioContext) {
  if (context.state !== 'suspended') return
  await context.resume()
}
