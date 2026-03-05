<script lang="ts" setup>
import type { Playlist } from '~/shared/storage/types'
import { deletePlaylistQuery } from '~/shared/queries'

defineProps<{
  playlist: Playlist
}>()

const open = ref(false)
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
          @click="deletePlaylistQuery(playlist.id)"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
