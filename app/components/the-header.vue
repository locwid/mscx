<script lang="ts" setup>
const route = useRoute()

const title = computed(() => route.meta.title)
</script>

<template>
  <div
    class="p-4 sticky h-16 top-0 bg-muted z-10 flex justify-between items-center"
  >
    <span>
      mscx / <span class="text-muted"> {{ title }}</span>
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
