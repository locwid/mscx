<script lang="ts" setup>
import type { Track } from '~/local-db'
import Avatar from 'vue-boring-avatars'

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
  <div class="border border-accented flex gap-2 items-center rounded-md">
    <div
      class="p-2 flex gap-2 overflow-hidden"
      @click="$emit('click', track.id)"
    >
      <Avatar :name="track.id" class="grow-0 shrink-0" />
      <div class="flex flex-col">
        <span class="truncate">{{ track.name }}</span>
        <span class="text-muted text-xs">
          {{ Math.floor(track.metadata.duration / 60) }}:{{
            Math.round(track.metadata.duration % 60)
          }}
        </span>
      </div>
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
