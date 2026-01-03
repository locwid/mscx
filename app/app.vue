<script lang="ts" setup>
const { currentTrack } = storeToRefs(useCurrentTrack())
const tracksSync = useSyncTracks()

onBeforeMount(() => {
  tracksSync.setup()
})
</script>

<template>
  <UApp>
    <div class="max-w-lg h-lvh overflow-y-auto mx-auto shadow bg-default">
      <TheHeader />
      <NuxtPage />
      <PlayerFloating
        v-if="currentTrack"
        :key="currentTrack.id"
        :track="currentTrack"
      />
    </div>
  </UApp>
</template>
