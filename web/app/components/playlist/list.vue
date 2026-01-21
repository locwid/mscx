<script lang="ts" setup>
const { playlists } = storeToRefs(usePlaylists())
const { deletePlaylist } = usePlaylists()
</script>

<template>
  <div v-if="playlists?.length" class="space-y-2 p-2 mb-2">
    <PlaylistListRow
      v-for="playlist in playlists"
      :key="playlist.id"
      :playlist="playlist"
      @delete="deletePlaylist"
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
