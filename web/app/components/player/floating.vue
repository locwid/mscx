<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'
import { getFileUrl } from '~/api/actions';

const emit = defineEmits<{
  (e: 'ended'): void
}>()

const props = defineProps<{
  track: Track
}>()

const fileSrc = computed(() => {
  if (props.track.filename) {
    return getFileUrl(props.track.filename)
  }
  if (props.track.file) {
    const url = URL.createObjectURL(props.track.file)
    return url
  }
  throw new Error('One of file or filename must exists')
})

const audioRef = useTemplateRef('audio')
const { playing, currentTime, duration, ended } = useMediaControls(audioRef, {
  src: fileSrc,
})
useTitle(props.track.name)

watch(ended, () => {
  emit('ended')
})

onMounted(() => {
  playing.value = true
})
</script>

<template>
  <div
    class="fixed bottom-0 h-18 bg-muted flex justify-between overflow-hidden max-w-lg w-full left-1/2 -translate-x-1/2 px-2 py-4"
  >
    <Avatar :name="track.id" class="grow-0 shrink-0" />
    <div
      class="flex flex-col justify-between px-2 pb-2 h-full gap-2 grow overflow-hidden"
    >
      <div class="truncate leading-none">
        {{ track.name }}
      </div>
      <div>
        <audio ref="audio" preload="none" />
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
