<script lang="ts" setup>
import { getAllTracksQuery } from '~/shared/queries'

useHeaderTitle('tracks')

const tracks = useIDB(() => getAllTracksQuery())
</script>

<template>
  <TrackList :tracks="tracks" />
</template>
