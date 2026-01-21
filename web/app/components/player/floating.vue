<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'
import { useTrackFile } from '~/composables/use-track-file'

const emit = defineEmits<{
  (e: 'ended'): void
}>()

const props = defineProps<{
  track: Track
}>()

const fileSrc = useTrackFile(() => props.track)

const audioRef = useTemplateRef('audio')
const { playing, currentTime, duration, ended } = useMediaControls(audioRef, {
  src: fileSrc,
})

watch(ended, (value) => {
  if (value) emit('ended')
})
</script>

<template>
  <div
    class="fixed bottom-0 h-18 bg-muted flex justify-between overflow-hidden max-w-lg w-full left-1/2 -translate-x-1/2 px-2 py-4"
  >
    <Transition name="fade" mode="out-in">
      <Avatar :key="track.id" :name="track.id" class="grow-0 shrink-0" />
    </Transition>
    <Transition name="fade" mode="out-in">
      <div
        class="flex flex-col justify-between px-2 pb-2 h-full gap-2 grow overflow-hidden"
        :key="track.id"
      >
        <div class="truncate leading-none">
          {{ track.name }}
        </div>
        <div>
          <audio ref="audio" preload="metadata" autoplay />
          <USlider v-model="currentTime" size="sm" :min="0" :max="duration" />
        </div>
      </div>
    </Transition>
    <UButton
      variant="subtle"
      size="xl"
      :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
      @click="playing = !playing"
    />
  </div>
</template>
