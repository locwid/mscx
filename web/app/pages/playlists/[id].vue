<script lang="ts" setup>
import { liveQuery } from 'dexie'
import { dexieStorage, type Track } from '~/dexie.storage'

const route = useRoute()
const playlistId = computed(() => route.params.id as string)

const playlist = computedAsync(() =>
  dexieStorage.playlists.get(playlistId.value),
)
const name = computed(() => playlist.value?.name ?? '')
useHeaderTitle(() => name.value)

const tracks = useObservable(
  from(
    liveQuery(async () => {
      const pairs = await dexieStorage.playlistTracks
        .where('playlistId')
        .equals(playlistId.value)
        .toArray()
      const items = await Promise.all(
        pairs.map((p) => dexieStorage.tracks.get(p.trackId)),
      )
      return items.filter(Boolean) as Track[]
    }),
  ),
)
</script>

<template>
  <TrackList :tracks="tracks" :playlist-id="playlistId" />
</template>
