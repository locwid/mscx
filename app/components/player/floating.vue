<script lang="ts" setup>
import type { Track } from '~/local-db'

const props = defineProps<{
  track: Track
}>()

const audioRef = useTemplateRef('audio')
const { playing, currentTime, duration } = useMediaControls(audioRef, {
  src: `file/${props.track.id}`,
})
useTitle(props.track.name)

onMounted(() => {
  playing.value = true
})
</script>

<template>
  <div
    class="fixed bottom-0 bg-default max-w-lg w-full left-1/2 -translate-x-1/2 border-t border-accented px-2 py-4"
  >
    <div class="flex gap-2 overflow-hidden">
      <UButton
        variant="subtle"
        size="xl"
        :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
        @click="playing = !playing"
      />
      <figure class="flex flex-col gap-2 overflow-hidden">
        <figcaption class="truncate leading-none">
          {{ track.name }}
        </figcaption>
        <div>
          <audio ref="audio" />
          <USlider v-model="currentTime" size="sm" :min="0" :max="duration" />
        </div>
      </figure>
    </div>
  </div>
</template>
