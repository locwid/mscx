<script lang="ts" setup>
import { dexieStorage, type Playlist } from '~/dexie.storage'
import { getPlaylistTracksQuery } from '~/shared/queries'

const route = useRoute()
const playlistId = computed(() => route.params.id as string)

const playlist = useDexieLiveQuery(() =>
  dexieStorage.playlists.get(playlistId.value),
)
const name = computed(() => playlist.value?.name ?? '')
useHeaderTitle(() => name.value)

const tracks = useDexieLiveQueryWithDeps(playlist, (p: Playlist) =>
  p?.id ? getPlaylistTracksQuery(p.id) : [],
)
</script>

<template>
  <TrackList :tracks="tracks" :playlist-id="playlistId" />
</template>
