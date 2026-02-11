<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import Avatar from 'vue-boring-avatars'
import { AUDIO_PLAYER_KEY } from '~/shared/constants/keys'
import { usePlayer } from '~/stores/use-player'

const props = defineProps<{
  track: Track
}>()

const player = usePlayer()
const audioPlayer = inject(AUDIO_PLAYER_KEY)!
const { playing, currentTime, duration } = audioPlayer

function handleDoubleClick() {
  player.openFullscreen()
}
</script>

<template>
  <div
    class="fixed bottom-0 h-18 bg-muted flex justify-between overflow-hidden max-w-lg w-full left-1/2 -translate-x-1/2 px-2 py-4"
    @dblclick="handleDoubleClick"
  >
    <Transition name="fade" mode="out-in">
      <Avatar :key="track.id" :name="track.id" class="grow-0 shrink-0" />
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
        :variant="player.shuffle ? 'solid' : 'subtle'"
        size="xl"
        icon="i-lucide-shuffle"
        :color="player.shuffle ? 'primary' : undefined"
        @click.stop="player.toggleShuffle()"
      />
      <UButton
        variant="subtle"
        size="xl"
        icon="i-lucide-skip-back"
        @click.stop="player.switchToPreviousTrack()"
      />
      <UButton
        variant="subtle"
        size="xl"
        :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
        @click.stop="playing = !playing"
      />
      <UButton
        variant="subtle"
        size="xl"
        icon="i-lucide-skip-forward"
        @click.stop="player.switchToNextTrack()"
      />
    </div>
  </div>
</template>
