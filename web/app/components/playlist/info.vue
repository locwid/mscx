<script lang="ts" setup>
import type { Playlist } from '~/dexie.storage'

defineEmits<{
  (e: 'delete'): void
}>()

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
          @click="$emit('delete')"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
