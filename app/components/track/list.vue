<script lang="ts" setup>
import { useVirtualList } from '@vueuse/core'

const { tracks, deleteTrack } = useTracks()
const { currentTrack } = storeToRefs(useCurrentTrack())

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => tracks.value ?? []),
  {
    itemHeight: 56 + 8,
  },
)

const height = computed(
  () => `calc(100lvh - 64px - ${currentTrack.value ? `72px` : '0px'})`,
)
</script>

<template>
  <div v-bind="containerProps" :style="{ height }">
    <div v-bind="wrapperProps" class="space-y-2 p-2">
      <TrackListRow
        v-for="item in list"
        :key="item.index"
        :track="item.data"
        @delete="deleteTrack"
        @click="currentTrack = item.data"
      />
    </div>
  </div>
</template>
