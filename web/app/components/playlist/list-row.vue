<script lang="ts" setup>
import type { Playlist } from '~/shared/storage/types'
import Avatar from 'vue-boring-avatars'

defineProps<{
  playlist: Playlist
  playing?: boolean
}>()

const { start, stop } = usePlayer()
</script>

<template>
  <div
    class="border h-14 border-accented flex gap-2 items-center justify-between rounded-md"
    :class="{ 'border-primary-500': playing }"
  >
    <div
      class="flex items-center gap-2 p-2 grow"
      @click="$router.push(`/playlists/${playlist.id}`)"
    >
      <Avatar :name="playlist.id" variant="pixel" class="grow-0 shrink-0" />
      <span>{{ playlist.name }}</span>
    </div>
    <div class="flex gap-2 mr-2 ml-auto" @click.stop>
      <PlaylistInfo :playlist="playlist">
        <UButton icon="i-lucide-ellipsis" variant="ghost" color="neutral" />
      </PlaylistInfo>
      <UButton
        :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
        variant="ghost"
        @click="playing ? stop() : start(undefined, playlist.id)"
      />
    </div>
  </div>
</template>
