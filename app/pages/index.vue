<script lang="ts" setup>
const { tracks, deleteTrack } = useTracks()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="item in tracks" :key="item.id" class="border p-1">
      {{ item.name }}
      <audio controls :src="`/file/${item.id}`"></audio>
      <UButton
        color="error"
        icon="i-lucide-trash"
        @click="deleteTrack(item.id)"
      />
    </div>
  </div>
</template>
