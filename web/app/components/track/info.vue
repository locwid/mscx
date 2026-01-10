<script lang="ts" setup>
import type { Track } from '~/dexie.storage'

const { downloadTrack, unloadTrack, deleteTrack } = useTracks()
const { addTrackToPlaylist } = usePlaylists()

defineProps<{
  track: Track
}>()

const open = ref(false)
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="track.name"
    :ui="{ content: 'max-w-lg mx-auto' }"
  >
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
        <PlaylistPicker
          @confirm="
            (idList) => {
              idList.forEach((playlistId) =>
                addTrackToPlaylist(playlistId, track.id),
              )
              open = false
            }
          "
        >
          <UButton
            leading-icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            add to playlist
          </UButton>
        </PlaylistPicker>
        <UButton
          v-if="track.keepFile"
          leading-icon="i-lucide-delete"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="(unloadTrack(track.id), (open = false))"
        >
          remove file
        </UButton>
        <UButton
          v-else
          leading-icon="i-lucide-download"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="(downloadTrack(track.id), (open = false))"
        >
          save file
        </UButton>
        <UButton
          leading-icon="i-lucide-trash"
          color="error"
          variant="ghost"
          size="xl"
          @click="(deleteTrack(track.id), (open = false))"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
