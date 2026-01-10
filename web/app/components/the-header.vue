<script lang="ts" setup>
const online = useOnline()
const { headerTitle } = storeToRefs(useAppStore())
</script>

<template>
  <div
    class="p-4 sticky h-16 top-0 bg-muted z-10 flex justify-between items-center"
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
      <TrackUpload>
        <UButton icon="i-lucide-upload" variant="outline" color="neutral" />
      </TrackUpload>
      <PlaylistCreate>
        <UButton icon="i-lucide-book-plus" variant="outline" color="neutral" />
      </PlaylistCreate>
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
