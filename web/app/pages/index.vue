<script lang="ts" setup>
import { getAllTracksQuery } from '~/shared/queries'

useHeaderTitle('tracks')

const tracks = useDexieLiveQuery(() => getAllTracksQuery())
</script>

<template>
  <TrackList :tracks="tracks" />
</template>
