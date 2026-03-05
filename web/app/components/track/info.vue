<script lang="ts" setup>
import type { Track } from '~/shared/storage/types'
import {
  addTagToTrackQuery,
  deleteTagFromTrackQuery,
  deleteTrackQuery,
  downloadTrackQuery,
  getTrackTagOptionsQuery,
  unloadTrackQuery,
} from '~/shared/queries'

const { track } = defineProps<{
  track: Track
}>()

const open = defineModel<boolean>('open', { default: false })

const tagOptions = useIDBWithDeps(
  () => track.id,
  (trackID) => getTrackTagOptionsQuery(trackID),
)

async function handleApplyTags(nextTagIDs: string[]) {
  const assigned = tagOptions.value?.assigned ?? new Set<string>()
  const next = new Set(nextTagIDs)

  const toAdd = Array.from(next).filter((id) => !assigned.has(id))
  const toDelete = Array.from(assigned).filter((id) => !next.has(id))

  try {
    await Promise.all(toAdd.map((tagID) => addTagToTrackQuery(tagID, track.id)))
    await Promise.all(
      toDelete.map((tagID) => deleteTagFromTrackQuery(tagID, track.id)),
    )

    open.value = false
  } catch (error) {
    console.debug('Failed to update track tags:', error)
  }
}

async function handleUnloadTrack() {
  try {
    await unloadTrackQuery(track.id)
    open.value = false
  } catch (error) {
    console.debug('Failed to unload track file:', error)
  }
}

async function handleDownloadTrack() {
  try {
    await downloadTrackQuery(track.id)
    open.value = false
  } catch (error) {
    console.debug('Failed to download track file:', error)
  }
}

async function handleDeleteTrack() {
  try {
    await deleteTrackQuery(track.id)
    open.value = false
  } catch (error) {
    console.debug('Failed to delete track:', error)
  }
}
</script>

<template>
  <UDrawer v-model:open="open" :title="track.name">
    <slot />
    <template #body>
      <div class="flex flex-col gap-2">
        <div class="text-sm text-muted flex gap-4">
          <span>duration: {{ formatDuration(track.duration) }}</span>
          <span class="text-sm text-muted">
            size: {{ formatFileSize(track.size) }}
          </span>
          <span v-if="track.keepFile" class="text-sm text-muted"> saved </span>
        </div>
        <TagPicker :track-id="track.id" @confirm="handleApplyTags">
          <UButton
            leading-icon="i-lucide-book-plus"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            edit tags
          </UButton>
        </TagPicker>
        <UButton
          v-if="track.keepFile"
          leading-icon="i-lucide-delete"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="handleUnloadTrack"
        >
          remove file
        </UButton>
        <UButton
          v-else
          leading-icon="i-lucide-download"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="handleDownloadTrack"
        >
          save file
        </UButton>
        <UButton
          leading-icon="i-lucide-trash"
          color="error"
          variant="ghost"
          size="xl"
          @click="handleDeleteTrack"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
