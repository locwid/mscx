import { liveQuery } from 'dexie'
import { nanoid } from 'nanoid'
import {
  apiGetFile,
} from '~/api/actions'
import { pushChange } from '~/api/sync-with-server'
import { dexieStorage, type Track } from '~/dexie.storage'

export const useTracks = defineStore('tracks', () => {
  const tracks = useObservable<Track[]>(
    from(
      liveQuery(() =>
        dexieStorage.tracks.toCollection().sortBy('createdAt'),
      ),
    ),
  )

  async function addTrack(files: File[]) {
    const now = new Date()
    try {
      const items = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file)
          const duration = await getAudioDuration(url)
          URL.revokeObjectURL(url)
          return {
            id: nanoid(),
            name: file.name,
            duration: Math.round(duration),
            size: file.size,
            type: file.type,
            file,
            createdAt: now,
          } satisfies Track
        }),
      )
      await dexieStorage.tracks.bulkAdd(items)
      await Promise.all(items.map(item => pushChange({
        id: item.id,
        entity: 'track',
        type: 'created'
      })))
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteTrack(id: string) {
    await dexieStorage.tracks.delete(id)
    await pushChange({
      id,
      entity: 'track',
      type: 'deleted'
    })
  }

  async function downloadTrack(id: string) {
    const file = await apiGetFile(id)
    await dexieStorage.tracks.update(id, { file, keepFile: true })
  }

  async function unloadTrack(id: string) {
    await dexieStorage.tracks.update(id, { file: undefined, keepFile: false })
  }

  return {
    tracks,
    addTrack,
    deleteTrack,
    downloadTrack,
    unloadTrack,
  }
})
