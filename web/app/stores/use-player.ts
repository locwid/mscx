import { getAllTracksQuery, getPlaylistTracksQuery } from '~/shared/queries'

export const usePlayer = defineStore('player', () => {
  const currentPlaylistId = ref<string | null>(null)
  const currentTrackId = ref<string | null>(null)

  const tracks = useDexieLiveQueryWithDeps(currentPlaylistId, (id?: string) => {
    if (id) {
      return getPlaylistTracksQuery(id)
    }
    return getAllTracksQuery()
  })

  const currentTrack = computed(() =>
    tracks.value?.find((t) => t.id === currentTrackId.value),
  )

  const title = useTitle()
  watch(
    currentTrack,
    (val) => {
      title.value = val?.name ?? 'mscx'
    },
    {
      immediate: true,
    },
  )

  async function switchToNextTrack() {
    if (!tracks.value) return
    const index = tracks.value?.findIndex((t) => t.id === currentTrackId.value)
    if (index === -1) return
    currentTrackId.value =
      tracks.value[(index + 1) % tracks.value.length]?.id ?? null
  }

  async function startPlayList(id: string) {
    currentPlaylistId.value = id
    const changed = await until(tracks).changed({ timeout: 500 })
    if (changed?.length) {
      currentTrackId.value = changed[0]?.id ?? null
    } else {
      currentPlaylistId.value = null
      currentTrackId.value = null
    }
  }

  async function stopPlaylist() {
    currentPlaylistId.value = null
    currentTrackId.value = null
  }

  return {
    currentPlaylistId: readonly(currentPlaylistId),
    currentTrackId,
    currentTrack,
    startPlayList,
    stopPlaylist,
    switchToNextTrack,
  }
})
