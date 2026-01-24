<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import {
  addTrackToPlaylistQuery,
  deleteTrackFromPlaylistQuery,
  deleteTrackQuery,
  downloadTrackQuery,
  unloadTrackQuery,
} from '~/shared/queries'

defineProps<{
  track: Track
}>()

const open = ref(false)

const playlistId = inject<string>('playlistId', '')
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
        <PlaylistPicker
          @confirm="
            (idList) => {
              idList.forEach((playlistId) =>
                addTrackToPlaylistQuery(playlistId, track.id),
              )
              open = false
            }
          "
        >
          <UButton
            leading-icon="i-lucide-book-plus"
            color="neutral"
            variant="ghost"
            size="xl"
          >
            add to playlist
          </UButton>
        </PlaylistPicker>
        <UButton
          v-if="playlistId"
          leading-icon="i-lucide-book-x"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="
            (deleteTrackFromPlaylistQuery(playlistId, track.id), (open = false))
          "
        >
          remove from playlist
        </UButton>
        <UButton
          v-if="track.keepFile"
          leading-icon="i-lucide-delete"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="(unloadTrackQuery(track.id), (open = false))"
        >
          remove file
        </UButton>
        <UButton
          v-else
          leading-icon="i-lucide-download"
          color="neutral"
          variant="ghost"
          size="xl"
          @click="(downloadTrackQuery(track.id), (open = false))"
        >
          save file
        </UButton>
        <UButton
          leading-icon="i-lucide-trash"
          color="error"
          variant="ghost"
          size="xl"
          @click="(deleteTrackQuery(track.id), (open = false))"
        >
          delete
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
