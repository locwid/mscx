<script lang="ts" setup>
import type { Playlist } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'

defineEmits<{
  (e: 'delete', id: string): void
}>()

defineProps<{
  playlist: Playlist
}>()
</script>

<template>
  <div
    class="border h-14 border-accented flex gap-2 items-center justify-between rounded-md p-2"
  >
    <div class="flex items-center gap-2">
      <Avatar :name="playlist.id" variant="pixel" class="grow-0 shrink-0" />
      <span>{{ playlist.name }}</span>
    </div>
    <PlaylistInfo :playlist="playlist" @delete="$emit('delete', playlist.id)">
      <UButton icon="i-lucide-ellipsis" variant="ghost" color="neutral" />
    </PlaylistInfo>
  </div>
</template>
