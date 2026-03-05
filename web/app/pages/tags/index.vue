<script lang="ts" setup>
import { deleteTagQuery, getAllTagsQuery } from '~/shared/queries'

useHeaderTitle('tags')

const tags = useIDB(() => getAllTagsQuery())

async function handleDeleteTag(tagId: string) {
  await deleteTagQuery(tagId)
}
</script>

<template>
  <div class="space-y-4 p-3">
    <TagCreate>
      <UButton icon="i-lucide-tag" size="xl" variant="outline">
        create tag
      </UButton>
    </TagCreate>

    <UCard>
      <template #header>
        <div class="font-medium">manage tags</div>
      </template>
      <div v-if="tags?.length" class="space-y-2">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="border border-accented rounded-md h-12 px-3 flex items-center justify-between"
        >
          <span>{{ tag.name }}</span>
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            @click="handleDeleteTag(tag.id)"
          />
        </div>
      </div>
      <UEmpty
        v-else
        title="No tags"
        description="Create tags to filter and group tracks"
        icon="i-lucide-tag"
        class="ring-0"
      />
    </UCard>
  </div>
</template>
