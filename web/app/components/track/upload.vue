<script lang="ts" setup>
import type { TabsItem } from '@nuxt/ui';

const open = ref(false)

const items = [
  {
    label: 'files',
    description: 'upload your tracks by manually selecting them from your device',
    slot: 'files' as const
  },
  {
    label: 'youtube',
    description: 'upload tracks by youtube playlist url',
    slot: 'youtube' as const
  }
] satisfies TabsItem[]
</script>

<template>
  <UDrawer v-model:open="open" title="upload tracks">
    <slot />
    <template #body>
      <UTabs :items="items">
        <template #files>
          <TrackUploadFiles @submit="open = false" />
        </template>
        <template #youtube>
          <TrackUploadYoutube @submit="open = false" />
        </template>
      </UTabs>
    </template>
  </UDrawer>
</template>
