<script lang="ts" setup>
definePageMeta({
  title: 'tracks',
})

const { tracks } = storeToRefs(useTracks())
</script>

<template>
  <TrackList :tracks="tracks" />
</template>
