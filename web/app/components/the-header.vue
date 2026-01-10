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
      <span class="text-lg leading-none">
        <NuxtLink to="/">mscx</NuxtLink> /
        <span class="text-muted"> {{ headerTitle }}</span>
      </span>
    </span>
    <div class="flex gap-2">
      <TrackUpload>
        <UButton icon="i-lucide-upload" variant="outline" />
      </TrackUpload>
      <PlaylistCreate>
        <UButton icon="i-lucide-book-plus" variant="outline" />
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
