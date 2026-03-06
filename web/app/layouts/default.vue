<script lang="ts" setup>
import { AUDIO_PLAYER_KEY } from '~/shared/constants/keys'
import { useAudioPlayer } from '~/composables/use-audio-player'
import { useHealthCheck } from '~/composables/use-health-check'

const player = usePlayer()
const { currentTrack } = storeToRefs(player)

const appStore = useAppStore()
const { isFullscreenOpen } = storeToRefs(appStore)

const title = useTitle()
watch(
  currentTrack,
  (val) => {
    title.value = val?.name ?? 'mscx'
  },
  { immediate: true },
)

const audioPlayer = useAudioPlayer({
  trackGetter: () => currentTrack.value,
  thumbnailSrcGetter: () => player.thumbnailSrc,
  hasThumbnailGetter: () => player.hasThumbnail,
  onEnded: () => player.switchToNextTrack(),
  onNext: () => player.switchToNextTrack(),
  onPrev: () => player.switchToPreviousTrack(),
})
const { checkHealth } = useHealthCheck()
const { setupSync, trySync } = useServerSync()
let disposeSync: (() => void) | undefined

provide(AUDIO_PLAYER_KEY, audioPlayer)

onBeforeMount(() => {
  checkHealth()
  disposeSync = setupSync()
  trySync()
})

onBeforeUnmount(() => {
  disposeSync?.()
})
</script>

<template>
  <div class="max-w-lg h-lvh overflow-hidden mx-auto shadow bg-default">
    <TheHeader />
    <slot />
    <audio
      :ref="(el) => (audioPlayer.audioRef.value = el as HTMLAudioElement)"
      preload="metadata"
      autoplay
    />
    <Transition name="slide-up">
      <PlayerFloating
        v-if="currentTrack && !isFullscreenOpen"
        :track="currentTrack"
      />
    </Transition>
    <PlayerFullscreen v-if="currentTrack" :track="currentTrack" />
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
