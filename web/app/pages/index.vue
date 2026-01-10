<script lang="ts" setup>
useHeaderTitle("tracks")

const { tracks } = storeToRefs(useTracks())
</script>

<template>
  <TrackList :tracks="tracks" />
</template>
