<script lang="ts" setup>
import { getAllPlaylistsQuery } from '~/shared/queries'

const playlists = useDexieLiveQuery(() => getAllPlaylistsQuery())
const { currentPlaylistId } = storeToRefs(usePlayer())
</script>

<template>
  <div v-if="playlists?.length" class="space-y-2 p-2 mb-2">
    <PlaylistListRow
      v-for="playlist in playlists"
      :key="playlist.id"
      :playlist="playlist"
      :playing="playlist.id === currentPlaylistId"
    />
  </div>
  <UEmpty
    v-else
    title="No playlists"
    description="It looks like you haven't created any playlists"
    icon="i-lucide-info"
    class="m-2 ring-0"
  />
</template>
