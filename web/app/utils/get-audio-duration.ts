export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.src = url
    audio.preload = 'metadata'

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
    })

    audio.addEventListener('error', (err) => {
      reject(err)
    })
  })
}
