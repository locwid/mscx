<script lang="ts" setup>
import type { Playlist } from '~/shared/storage/types'
import { deletePlaylistQuery } from '~/shared/queries'

const { playlist } = defineProps<{
  playlist: Playlist
}>()

const open = ref(false)

async function handleDeletePlaylist() {
  try {
    await deletePlaylistQuery(playlist.id)
    open.value = false
  } catch (error) {
    console.debug('Failed to delete playlist:', error)
  }
}
</script>

<template>
  <UDrawer v-model:open="open" :title="playlist.name">
    <slot />
    <template #body>
      <div class="flex flex-col gap-2">
        <UButton
          icon="i-lucide-trash"
          variant="ghost"
          color="error"
          @click="handleDeletePlaylist"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
