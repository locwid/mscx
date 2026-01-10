<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'

defineProps<{
  track: Track
  active?: boolean
}>()

defineEmits<{
  (e: 'delete', id: string): void
  (e: 'click', id: string): void
}>()
</script>

<template>
  <div
    class="border bg-muted h-14 border-accented flex gap-2 items-center rounded-md transition-all"
    :class="{ 'border-primary-500': active }"
  >
    <div
      class="p-2 flex gap-2 overflow-hidden"
      @click="$emit('click', track.id)"
    >
      <Avatar :name="track.id" class="grow-0 shrink-0" />
      <div class="flex flex-col gap-1">
        <span class="truncate leading-none">{{ track.name }}</span>
        <span class="text-muted text-xs inline-flex gap-2">
          <span>{{ formatDuration(track.duration) }}</span>
          <span v-if="track.keepFile">saved</span>
        </span>
      </div>
    </div>
    <TrackInfo :track="track" @delete="$emit('delete', track.id)">
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
