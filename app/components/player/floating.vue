<script lang="ts" setup>
import type { Track } from '~/local-db'
import Avatar from 'vue-boring-avatars'

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
    class="fixed bottom-0 h-18 bg-muted flex gap-2 justify-between overflow-hidden max-w-lg w-full left-1/2 -translate-x-1/2 px-2 py-4"
  >
    <Avatar :name="track.id" class="grow-0 shrink-0" />
    <div class="flex flex-col justify-between gap-2 grow overflow-hidden">
      <div class="truncate leading-none">
        {{ track.name }}
      </div>
      <div class="mb-1">
        <audio ref="audio" />
        <USlider v-model="currentTime" size="sm" :min="0" :max="duration" />
      </div>
    </div>
    <UButton
      variant="subtle"
      size="xl"
      :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
      @click="playing = !playing"
    />
  </div>
</template>
