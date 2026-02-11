<script lang="ts" setup>
import { trySyncWithServer } from '~/shared/api/sync-with-server'
import { AUDIO_PLAYER_KEY } from '~/shared/constants/keys'
import { useAudioPlayer } from '~/composables/use-audio-player'

const { currentTrack, isFullscreenOpen } = storeToRefs(usePlayer())
const { switchToNextTrack } = usePlayer()

const audioPlayer = useAudioPlayer()
provide(AUDIO_PLAYER_KEY, audioPlayer)

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
    <audio :ref="(el) => audioPlayer.audioRef.value = el as HTMLAudioElement" preload="metadata" autoplay />
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
