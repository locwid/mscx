<script lang="ts" setup>
import type { Track } from '~/local-db'

defineProps<{
  track: Track
}>()

defineEmits<{
  (e: 'delete', id: string): void
  (e: 'click', id: string): void
}>()

const open = ref(false)
</script>

<template>
  <div class="border border-accented flex gap-4 items-center rounded-md">
    <div class="truncate h-full p-2" @click="$emit('click', track.id)">
      {{ track.name }}
    </div>
    <UDrawer
      v-model:open="open"
      :title="track.name"
      :ui="{ content: 'max-w-lg mx-auto' }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-ellipsis"
        class="mr-2"
        @click.prevent
      />
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
