<script lang="ts" setup>
import type { Track } from '~/shared/storage/types'
import { PLAYLIST_ID_KEY } from '~/shared/constants/keys'
import {
  addTrackToPlaylistQuery,
  deleteTrackFromPlaylistQuery,
  deleteTrackQuery,
  downloadTrackQuery,
  unloadTrackQuery,
} from '~/shared/queries'

const { track } = defineProps<{
  track: Track
}>()

const open = defineModel<boolean>('open', { default: false })

const playlistId = inject(PLAYLIST_ID_KEY)

async function handleAddToPlaylists(idList: string[]) {
  try {
    await Promise.all(
      idList.map((targetPlaylistId) =>
        addTrackToPlaylistQuery(targetPlaylistId, track.id),
      ),
    )
    open.value = false
  } catch (error) {
    console.debug('Failed to add track to playlist:', error)
  }
}

async function handleRemoveFromPlaylist() {
  if (!playlistId) return

  try {
    await deleteTrackFromPlaylistQuery(playlistId, track.id)
    open.value = false
  } catch (error) {
    console.debug('Failed to remove track from playlist:', error)
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
        <PlaylistPicker @confirm="handleAddToPlaylists">
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
          @click="handleRemoveFromPlaylist"
        >
          remove from playlist
        </UButton>
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
