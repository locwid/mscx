<script lang="ts" setup>
import { useVirtualList } from '@vueuse/core'
import type { Track } from '~/dexie.storage';

const { tracks = [] } = defineProps<{
  tracks?: Track[]
}>()

const { currentTrack } = storeToRefs(usePlayer())

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => tracks),
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
    <div v-bind="wrapperProps" class="space-y-2 p-2 mb-2">
      <TrackListRow
        v-for="item in list"
        :key="item.data.id"
        :track="item.data"
        @click="currentTrack = item.data"
      />
    </div>
  </div>
</template>
