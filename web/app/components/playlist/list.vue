<script lang="ts" setup>
const { playlists } = storeToRefs(usePlaylists())
const { deletePlaylist } = usePlaylists()
</script>

<template>
  <div class="space-y-2 p-2 mb-2">
    <PlaylistListRow
      v-for="playlist in playlists"
      :key="playlist.id"
      :playlist="playlist"
      @delete="deletePlaylist"
    />
  </div>
</template>
