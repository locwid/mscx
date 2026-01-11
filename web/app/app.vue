<script lang="ts" setup>
import { trySyncWithServer } from './api/sync-with-server'

const { currentTrack } = storeToRefs(usePlayer())
const { switchToNextTrack } = usePlayer()

onBeforeMount(() => {
  trySyncWithServer()
  window.addEventListener('online', trySyncWithServer)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', trySyncWithServer)
})
</script>

<template>
  <NuxtPwaAssets />
  <UApp>
    <div class="max-w-lg h-lvh overflow-hidden mx-auto shadow bg-default">
      <TheHeader />
      <NuxtPage />
      <Transition name="slide-up">
        <PlayerFloating
          v-if="currentTrack"
          :track="currentTrack"
          @ended="switchToNextTrack"
        />
      </Transition>
    </div>
  </UApp>
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
