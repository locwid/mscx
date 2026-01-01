<script lang="ts" setup>
const { currentTrack } = storeToRefs(useCurrentTrack())
const tracksSync = useSyncTracks()

onBeforeMount(() => {
  tracksSync.setup()
})
</script>

<template>
  <UApp>
    <div class="max-w-lg h-lvh mx-auto shadow bg-default">
      <div
        class="p-4 border-b border-accented flex justify-between items-center"
      >
        mscx
        <TrackUpload>
          <UButton icon="i-lucide-upload">Upload</UButton>
        </TrackUpload>
      </div>
      <NuxtPage />
    </div>
    <PlayerFloating v-if="currentTrack" :track="currentTrack" />
  </UApp>
</template>
