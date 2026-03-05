<script lang="ts" setup>
import { getPlaylistByIdQuery, getPlaylistTracksQuery } from '~/shared/queries'

const route = useRoute()
const playlistId = computed(() => route.params.id as string)

const playlist = useIDB(() => getPlaylistByIdQuery(playlistId.value))
const name = computed(() => playlist.value?.name ?? '')
useHeaderTitle(() => name.value)

const tracks = useIDBWithDeps(playlist, (p) =>
  p?.id ? getPlaylistTracksQuery(p.id) : [],
)
</script>

<template>
  <TrackList :tracks="tracks" :playlist-id="playlistId" />
</template>
