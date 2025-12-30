<script lang="ts" setup>
import type { Track } from '~/local-db'

defineProps<{
  track: Track
}>()

defineEmits<{
  (e: 'delete', id: string): void
}>()

const open = ref(false)
</script>

<template>
  <div class="border border-accented p-2 flex gap-4 items-center">
    <span class="truncate">{{ track.name }}</span>
    <UDrawer
      v-model:open="open"
      :title="track.name"
      :ui="{ content: 'max-w-lg mx-auto' }"
    >
      <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis" />
      <template #body>
        <div class="flex flex-col gap-2">
          <UButton
            leading-icon="i-lucide-trash"
            color="error"
            variant="ghost"
            @click="($emit('delete', track.id), (open = false))"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
