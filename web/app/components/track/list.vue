<script lang="ts" setup>
import { useVirtualList } from '@vueuse/core'
import type { Track } from '~/dexie.storage'

const { tracks = [], playlistId } = defineProps<{
  tracks?: Track[]
  playlistId?: string
}>()

provide('playlistId', playlistId)

const player = usePlayer()
const { currentTrack, currentTrackId } = storeToRefs(player)

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => tracks),
  {
    itemHeight: 56 + 8,
  },
)

const height = computed(
  () => `calc(100lvh - 64px - ${currentTrack.value ? `72px` : '0px'})`,
)

function handleTrackClick(trackId: string) {
  player.start(trackId, playlistId)
}
</script>

<template>
  <div v-if="tracks.length" v-bind="containerProps" :style="{ height }">
    <div v-bind="wrapperProps" class="space-y-2 p-2 mb-2">
      <TrackListRow
        v-for="item in list"
        :key="item.data.id"
        :track="item.data"
        @click="handleTrackClick(item.data.id)"
        :active="currentTrackId === item.data.id"
      />
    </div>
  </div>
  <UEmpty
    v-else
    title="No tracks"
    description="It looks like you haven't added any tracks"
    icon="i-lucide-info"
    class="m-2 ring-0"
  />
</template>
