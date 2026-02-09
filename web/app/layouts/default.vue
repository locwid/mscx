<script lang="ts" setup>
import { trySyncWithServer } from '~/shared/api/sync-with-server'
import { useAudio } from '~/composables/use-audio'
import { getFileUrlWithAuthKey } from '~/shared/api/actions'
import { AUDIO_INJECTION_KEY } from '~/shared/constants/keys'

const player = usePlayer()
const { currentTrack, isFullscreenOpen } = storeToRefs(player)
const { switchToNextTrack } = player

const audio = useAudio()
provide(AUDIO_INJECTION_KEY, audio)

const fileSrc = computed(() => {
  const track = currentTrack.value
  if (!track) return ''
  if (track.file) return URL.createObjectURL(track.file)
  const { authKey } = storeToRefs(useAuthStore())
  return getFileUrlWithAuthKey(track.id, authKey.value)
})

watch(fileSrc, (newSrc) => {
  if (newSrc) {
    audio.src.value = newSrc
  }
})

watch(audio.ended, (value) => {
  if (value) switchToNextTrack()
})

watch(
  () => audio.playing.value,
  (isPlaying) => {
    if (isPlaying) {
      audio.initAudioContext()
    }
  },
)

onBeforeMount(() => {
  trySyncWithServer()
  window.addEventListener('online', trySyncWithServer)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', trySyncWithServer)
})
</script>

<template>
  <div class="max-w-lg h-lvh overflow-hidden mx-auto shadow bg-default">
    <TheHeader />
    <slot />
    <Transition name="slide-up">
      <PlayerFloating
        v-if="currentTrack && !isFullscreenOpen"
        :track="currentTrack"
      />
    </Transition>
    <PlayerFullscreen
      v-if="currentTrack"
      :track="currentTrack"
    />
  </div>
</template>

<style lang="css">
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
