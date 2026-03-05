<script lang="ts" setup>
import { trySyncWithServer } from '~/shared/api/sync-with-server'

const online = useOnline()
const { headerTitle } = storeToRefs(useAppStore())
const player = usePlayer()
const { selectedTagIDs } = storeToRefs(player)
</script>

<template>
  <div
    class="px-4 sticky h-16 top-0 bg-muted z-10 flex justify-between items-center"
  >
    <span class="inline-flex items-center gap-2">
      <UChip standalone inset :color="online ? 'success' : 'warning'" />
      <span class="text-lg leading-none relative">
        <NuxtLink to="/">mscx</NuxtLink>&nbsp;/&nbsp;<Transition
          name="slide-up"
        >
          <span class="text-muted" :key="headerTitle">{{ headerTitle }}</span>
        </Transition>
      </span>
    </span>
    <div class="flex gap-2">
      <UButton
        icon="i-lucide-cloud-sync"
        variant="outline"
        color="neutral"
        @click="trySyncWithServer"
        loading-auto
      />
      <TrackUpload>
        <UButton icon="i-lucide-upload" variant="outline" color="neutral" />
      </TrackUpload>
      <TagFilter>
        <UChip
          inset
          :show="selectedTagIDs.length > 0"
          :text="String(selectedTagIDs.length)"
          color="primary"
          size="2xl"
        >
          <UButton icon="i-lucide-tags" variant="outline" color="neutral" />
        </UChip>
      </TagFilter>
      <TheSidebar>
        <UButton
          icon="i-lucide-panel-right"
          variant="outline"
          color="neutral"
        />
      </TheSidebar>
    </div>
  </div>
</template>

<style lang="css" scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  position: absolute;
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
