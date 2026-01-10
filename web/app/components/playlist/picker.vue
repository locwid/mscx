<script lang="ts" setup>
import type { CheckboxGroupItem } from '@nuxt/ui'

defineEmits<{
  (e: 'confirm', idList: string[]): void
}>()

const { playlists } = storeToRefs(usePlaylists())

const items = computed<CheckboxGroupItem[]>(
  () =>
    playlists.value?.map((p) => ({
      label: p.name,
      value: p.id,
    })) ?? [],
)

const value = ref([])
</script>

<template>
  <USlideover title="pick playlists" :ui="{ footer: 'flex flex-col gap-2' }">
    <slot />
    <template #body>
      <UCheckboxGroup v-model="value" :items="items" size="xl" variant="card" />
    </template>
    <template #footer="{ close }">
      <UButton size="xl" color="neutral" variant="subtle" block @click="close">
        cancel
      </UButton>
      <UButton size="xl" block @click="(close(), $emit('confirm', value))">
        confirm
      </UButton>
    </template>
  </USlideover>
</template>
