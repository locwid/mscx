<script lang="ts" setup>
const { currentTrack } = storeToRefs(usePlayer())
const { switchToNextTrack } = usePlayer()

const { setupTracksSync } = useTracks()
const { setupPlaylistsSync } = usePlaylists()

onBeforeMount(() => {
  setupTracksSync()
  setupPlaylistsSync()
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
