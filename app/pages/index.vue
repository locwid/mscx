<script lang="ts" setup>
const { tracks, deleteTrack } = useTracks()
const { currentTrack } = storeToRefs(useCurrentTrack())
</script>

<template>
  <div class="flex flex-col gap-2 p-2">
    <TrackListRow
      v-for="track in tracks"
      :key="track.id"
      :track="track"
      @delete="deleteTrack"
      @click="currentTrack = track"
    />
  </div>
</template>
