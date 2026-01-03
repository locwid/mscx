<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const navigation: NavigationMenuItem[] = [
  {
    label: 'tracks',
    icon: 'i-lucide-list-music',
    to: '/',
    class: 'text-lg',
  },
  {
    label: 'playlists',
    icon: 'i-lucide-book-audio',
    to: '/playlists',
    class: 'text-lg',
  },
]
</script>

<template>
  <USlideover title="mscx" side="right" class="max-w-lg mx-auto">
    <slot />
    <template #body>
      <UNavigationMenu orientation="vertical" :items="navigation" />
    </template>
  </USlideover>
</template>
