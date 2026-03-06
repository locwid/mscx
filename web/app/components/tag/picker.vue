<script lang="ts" setup>
import type { CheckboxGroupItem } from '@nuxt/ui'
import { getTrackTagOptionsQuery } from '~/shared/queries'
import { storageRefreshKeys } from '~/shared/storage/refresh'

const { trackId } = defineProps<{
  trackId: string
}>()

defineEmits<{
  (e: 'confirm', idList: string[]): void
}>()

const options = useIDBWithDeps(
  () => trackId,
  (id) => getTrackTagOptionsQuery(id),
  {
    refreshKey: storageRefreshKeys.trackTagOptions(trackId),
  },
)

const items = computed<CheckboxGroupItem[]>(
  () =>
    options.value?.allTags.map((tag) => ({
      label: tag.name,
      value: tag.id,
    })) ?? [],
)

const value = ref<string[]>([])

watch(
  options,
  (next) => {
    value.value = next ? Array.from(next.assigned) : []
  },
  { immediate: true },
)
</script>

<template>
  <USlideover title="pick tags" :ui="{ footer: 'flex flex-col gap-2' }">
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
