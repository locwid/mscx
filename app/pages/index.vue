<script lang="ts" setup>
const { tracks, deleteTrack } = useTracks()
</script>

<template>
  <div class="flex flex-col gap-2">
    <TrackListRow
      v-for="track in tracks"
      :key="track.id"
      :track="track"
      @delete="deleteTrack"
    />
  </div>
</template>
