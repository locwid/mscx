<script lang="ts" setup>
const { data } = useFetch('/api/track')
</script>

<template>
  <div v-if="data" class="flex flex-col gap-2">
    <div v-for="item in data" :key="item.id" class="border p-1">
      #{{ item.id }}
    </div>
  </div>
</template>
