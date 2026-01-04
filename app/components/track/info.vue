<script lang="ts" setup>
import type { Track } from '~/dexie.storage'

defineEmits<{
  (e: 'delete'): void
}>()

defineProps<{
  track: Track
}>()

const open = ref(false)
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="track.name"
    :ui="{ content: 'max-w-lg mx-auto' }"
  >
    <slot />
    <template #body>
      <div class="flex flex-col gap-2">
        <div class="text-sm text-muted flex gap-4">
          <span>duration: {{ formatDuration(track.metadata.duration) }}</span>
          <span class="text-sm text-muted">
            size: {{ formatFileSize(track.metadata.size) }}
          </span>
        </div>
        <UButton
          leading-icon="i-lucide-trash"
          color="error"
          variant="ghost"
          @click="($emit('delete'), (open = false))"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
