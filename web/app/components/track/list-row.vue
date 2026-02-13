<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'

const props = defineProps<{
  track: Track
  active?: boolean
}>()

defineEmits<{
  (e: 'click', id: string): void
  (e: 'dblclick', id: string): void
}>()

const { src, hasThumbnail } = useTrackThumbnail(() => props.track)
</script>

<template>
  <div
    class="border bg-muted h-14 border-accented flex gap-2 items-center rounded-md transition-all"
    :class="{ 'border-primary-500': active }"
  >
    <div
      class="p-2 flex gap-2 overflow-hidden"
      @click="$emit('click', track.id)"
      @dblclick="$emit('dblclick', track.id)"
    >
      <div class="grow-0 shrink-0">
        <img
          v-if="hasThumbnail"
          :src="src"
          :alt="track.name"
          class="w-10 h-10 rounded object-cover"
        />
        <Avatar v-else :name="track.id" class="w-10 h-10" />
      </div>
      <div class="flex flex-col gap-1">
        <span class="truncate leading-none">{{ track.name }}</span>
        <span class="text-muted text-xs inline-flex gap-2">
          <span>{{ formatDuration(track.duration) }}</span>
          <span v-if="track.keepFile">saved</span>
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
