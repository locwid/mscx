<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const close = () => open.value = false

const navigation: NavigationMenuItem[] = [
  {
    label: 'tracks',
    icon: 'i-lucide-list-music',
    to: '/',
    class: 'text-lg',
    onSelect: close
  },
  {
    label: 'playlists',
    icon: 'i-lucide-book-audio',
    to: '/playlists',
    class: 'text-lg', 
    onSelect: close
  },
]
</script>

<template>
  <USlideover v-model:open="open" title="mscx" side="right" class="max-w-lg mx-auto">
    <slot />
    <template #body>
      <UNavigationMenu orientation="vertical" :items="navigation" />
    </template>
  </USlideover>
</template>
