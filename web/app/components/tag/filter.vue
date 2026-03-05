<script lang="ts" setup>
import type { CheckboxGroupItem } from '@nuxt/ui'
import { getAllTagsQuery } from '~/shared/queries'

const player = usePlayer()
const { selectedTagIDs } = storeToRefs(player)
const tags = useIDB(() => getAllTagsQuery())
const open = ref(false)

const selected = computed({
  get: () => [...selectedTagIDs.value],
  set: (value: string[]) => {
    player.setSelectedTagIDs(value)
  },
})

const items = computed<CheckboxGroupItem[]>(
  () =>
    tags.value?.map((tag) => ({
      label: tag.name,
      value: tag.id,
    })) ?? [],
)

function clearFilter() {
  player.setSelectedTagIDs([])
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    title="active tags"
    :ui="{ footer: 'flex flex-col gap-2' }"
  >
    <slot />
    <template #body>
      <div class="space-y-4">
        <div class="text-sm text-muted">
          Tracks are filtered by all selected tags (AND).
        </div>
        <UCheckboxGroup
          v-model="selected"
          :items="items"
          size="xl"
          variant="card"
        />
      </div>
    </template>
    <template #footer>
      <UButton
        block
        size="xl"
        color="neutral"
        variant="subtle"
        @click="clearFilter"
      >
        clear filter
      </UButton>
      <UButton block size="xl" @click="open = false">done</UButton>
    </template>
  </UDrawer>
</template>
