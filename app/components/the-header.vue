<script lang="ts" setup>
const route = useRoute()

const online = useOnline()
const title = computed(() => route.meta.title)
</script>

<template>
  <div
    class="p-4 sticky h-16 top-0 bg-muted z-10 flex justify-between items-center"
  >
    <span class="inline-flex items-center gap-2">
      <UChip standalone inset :color="online ? 'success' : 'warning'" />
      <span class="text-lg leading-none">
        mscx /
        <span class="text-muted"> {{ title }}</span>
      </span>
    </span>
    <div class="flex gap-2">
      <TrackUpload>
        <UButton icon="i-lucide-upload" />
      </TrackUpload>
      <TheSidebar>
        <UButton icon="i-lucide-panel-right" color="neutral" />
      </TheSidebar>
    </div>
  </div>
</template>
