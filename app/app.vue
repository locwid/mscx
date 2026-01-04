<script lang="ts" setup>
const { currentTrack } = storeToRefs(usePlayer())
const { switchToNextTrack } = usePlayer()

const { setupTracksSync } = useTracks()
const { setupPlaylistsSync } = usePlaylists()
const { $pwa } = useNuxtApp()

onBeforeMount(() => {
  setupTracksSync()
  setupPlaylistsSync()
  console.log($pwa)
})
</script>

<template>
  <NuxtPwaManifest />
  <NuxtPwaAssets />
  <UApp>
    <div class="max-w-lg h-lvh overflow-hidden mx-auto shadow bg-default">
      <TheHeader />
      <NuxtPage />
      <PlayerFloating
        v-if="currentTrack"
        :key="currentTrack.id"
        :track="currentTrack"
        @ended="switchToNextTrack"
      />
    </div>
  </UApp>
</template>
