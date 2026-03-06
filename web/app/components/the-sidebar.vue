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
const { autoDownloadTracks } = storeToRefs(useAppStore())

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
      <USeparator class="my-6" />
      <div class="px-2">
        <UCheckbox
          v-model="autoDownloadTracks"
          label="auto download tracks"
          description="download all tracks after sync"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex items-center gap-3">
        <UColorModeSwitch />
      </div>
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
