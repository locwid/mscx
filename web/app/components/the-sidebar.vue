<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const close = () => (open.value = false)

const navigation: NavigationMenuItem[] = [
  {
    label: 'tracks',
    icon: 'i-lucide-list-music',
    to: '/',
    class: 'text-lg',
    onSelect: close,
  },
  {
    label: 'tags',
    icon: 'i-lucide-tags',
    to: '/tags',
    class: 'text-lg',
    onSelect: close,
  },
]

const { authKey } = storeToRefs(useAuthStore())

const dropAuthKey = () => {
  authKey.value = ''
  navigateTo('/auth')
}
</script>

<template>
  <USlideover
    v-model:open="open"
    title="mscx"
    side="right"
    class="max-w-lg mx-auto"
    :ui="{
      footer: 'flex justify-between',
    }"
  >
    <slot />
    <template #body>
      <UNavigationMenu orientation="vertical" :items="navigation" />
    </template>
    <template #footer>
      <UColorModeSwitch />
      <UButton
        color="error"
        size="md"
        variant="subtle"
        label="drop auth key"
        @click="dropAuthKey"
      />
    </template>
  </USlideover>
</template>
