import {
  getAllTracksQuery,
  getAllTagsQuery,
  getTracksByTagIdsQuery,
} from '~/shared/queries'
import { storageRefreshKeys } from '~/shared/storage/refresh'
import { type Track } from '~/shared/storage/types'

export const usePlayer = defineStore('player', () => {
  const selectedTagIDs = ref<string[]>([])
  const currentTrackId = ref<string | null>(null)
  const shuffle = ref(false)
  const shuffleQueue = ref<Track[]>([])

  const tracks = useIDBWithDeps(
    selectedTagIDs,
    (tagIDs) =>
      tagIDs.length ? getTracksByTagIdsQuery(tagIDs) : getAllTracksQuery(),
    {
      refreshKey: storageRefreshKeys.tracks,
    },
  )

  const selectedTags = useIDBWithDeps(
    selectedTagIDs,
    async (tagIDs) => {
      const tags = await getAllTagsQuery()
      const selected = new Set(tagIDs)
      return tags.filter((tag) => selected.has(tag.id))
    },
    {
      refreshKey: storageRefreshKeys.tags,
      initialValue: [],
    },
  )

  function generateShuffleQueue() {
    if (!tracks.value || tracks.value.length === 0) {
      shuffleQueue.value = []
      return
    }
    const shuffled = [...tracks.value].sort(() => Math.random() - 0.5)
    // Avoid starting with the same track as current if possible
    if (shuffled.length > 1 && shuffled[0]?.id === currentTrackId.value) {
      const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1
      const first = shuffled[0]!
      const swap = shuffled[swapIndex]!
      shuffled[0] = swap
      shuffled[swapIndex] = first
    }
    shuffleQueue.value = shuffled
  }

  watch(
    shuffle,
    (isEnabled) => {
      if (isEnabled) {
        generateShuffleQueue()
      } else {
        shuffleQueue.value = []
      }
    },
    { immediate: true },
  )

  watch(
    tracks,
    (items) => {
      if (shuffle.value) {
        generateShuffleQueue()
      }

      if (!currentTrackId.value) return

      const hasCurrent = items?.some((item) => item.id === currentTrackId.value)
      if (!hasCurrent) {
        currentTrackId.value = items?.[0]?.id ?? null
      }
    },
    { immediate: true },
  )

  const shuffledTracks = computed(() =>
    shuffle.value ? shuffleQueue.value : tracks.value,
  )

  const currentTrack = computed(() =>
    tracks.value?.find((t) => t.id === currentTrackId.value),
  )

  const { src: thumbnailSrc, hasThumbnail } = useTrackThumbnail(
    () => currentTrack.value,
  )

  async function switchToNextTrack() {
    if (!shuffledTracks.value) return
    const index = shuffledTracks.value?.findIndex(
      (t) => t.id === currentTrackId.value,
    )
    if (index === -1) return
    const nextIndex = (index + 1) % shuffledTracks.value.length
    if (nextIndex === 0 && shuffle.value) {
      generateShuffleQueue()
      currentTrackId.value = shuffleQueue.value[0]?.id ?? null
    } else {
      currentTrackId.value = shuffledTracks.value[nextIndex]?.id ?? null
    }
  }

  async function switchToPreviousTrack() {
    if (!shuffledTracks.value) return
    const index = shuffledTracks.value?.findIndex(
      (t) => t.id === currentTrackId.value,
    )
    if (index === -1) return
    const prevIndex = index === 0 ? shuffledTracks.value.length - 1 : index - 1
    currentTrackId.value = shuffledTracks.value[prevIndex]?.id ?? null
  }

  async function start(trackId?: string) {
    if (trackId) {
      currentTrackId.value = trackId
      return
    }

    if (!tracks.value) {
      try {
        await until(tracks).toMatch((value) => Array.isArray(value), {
          timeout: 1500,
        })
      } catch {
        // Keep selected tags even if loading timed out.
      }
    }

    const availableTracks = tracks.value ?? []
    if (!availableTracks.length) {
      currentTrackId.value = null
      return
    }

    if (shuffle.value) {
      if (!shuffleQueue.value.length) {
        generateShuffleQueue()
      }
      currentTrackId.value = shuffleQueue.value[0]?.id ?? null
      return
    }

    currentTrackId.value = availableTracks[0]?.id ?? null
  }

  async function stop() {
    currentTrackId.value = null
  }

  function setSelectedTagIDs(tagIDs: string[]) {
    selectedTagIDs.value = Array.from(new Set(tagIDs))
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value
  }

  return {
    selectedTagIDs: readonly(selectedTagIDs),
    selectedTags,
    currentTrackId,
    currentTrack,
    tracks,
    thumbnailSrc: readonly(thumbnailSrc),
    hasThumbnail: readonly(hasThumbnail),
    shuffle: readonly(shuffle),
    setSelectedTagIDs,
    toggleShuffle,
    start,
    stop,
    switchToNextTrack,
    switchToPreviousTrack,
  }
})
