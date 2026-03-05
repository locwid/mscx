<script lang="ts" setup>
useHeaderTitle('tracks')

const player = usePlayer()
const { tracks } = storeToRefs(player)
</script>

<template>
  <TrackList :tracks="tracks" />
</template>
