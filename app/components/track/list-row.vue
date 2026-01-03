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
          {{ formatDuration(track.metadata.duration) }}
        </span>
      </div>
    </div>
    <TrackInfo :track="track">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-ellipsis"
        class="mr-2 ml-auto"
        @click.prevent
      />
    </TrackInfo>
  </div>
</template>
