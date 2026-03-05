<script lang="ts" setup>
import type { Track } from '~/shared/storage/types'
import Avatar from 'vue-boring-avatars'
import { AUDIO_PLAYER_KEY } from '~/shared/constants/keys'
import { usePlayer } from '~/stores/use-player'

const props = defineProps<{
  track: Track
}>()

const player = usePlayer()
const appStore = useAppStore()
const audioPlayer = inject(AUDIO_PLAYER_KEY)!
const { playing, currentTime, duration } = audioPlayer

function handleDoubleClick() {
  appStore.openFullscreen()
}
</script>

<template>
  <div
    class="fixed bottom-0 h-18 bg-muted flex justify-between overflow-hidden max-w-lg w-full left-1/2 -translate-x-1/2 px-2 py-4"
    @dblclick="handleDoubleClick"
  >
    <Transition name="fade" mode="out-in">
      <div :key="track.id" class="grow-0 shrink-0">
        <img
          v-if="player.hasThumbnail"
          :src="player.thumbnailSrc"
          :alt="track.name"
          class="w-10 h-10 rounded object-cover"
        />
        <Avatar v-else :name="track.id" class="w-10 h-10" />
      </div>
    </Transition>
    <Transition name="fade" mode="out-in">
      <div
        class="flex flex-col justify-between px-2 pb-2 h-full gap-2 grow overflow-hidden"
        :key="track.id"
      >
        <div class="truncate leading-none">
          {{ track.name }}
        </div>
        <div>
          <USlider v-model="currentTime" size="sm" :min="0" :max="duration" />
        </div>
      </div>
    </Transition>
    <div class="flex gap-1">
      <UButton
        :variant="player.shuffle ? 'soft' : 'link'"
        size="xl"
        icon="i-lucide-shuffle"
        :color="player.shuffle ? 'primary' : 'neutral'"
        @click.stop="player.toggleShuffle()"
      />
      <UButton
        variant="link"
        color="neutral"
        icon="i-lucide-skip-back"
        @click.stop="player.switchToPreviousTrack()"
      />
      <UButton
        variant="link"
        color="neutral"
        :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
        @click.stop="playing = !playing"
      />
      <UButton
        variant="link"
        color="neutral"
        icon="i-lucide-skip-forward"
        @click.stop="player.switchToNextTrack()"
      />
    </div>
  </div>
</template>
