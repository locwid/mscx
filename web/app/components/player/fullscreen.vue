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

const openInfo = ref(false)
</script>

<template>
  <UModal v-model:open="player.isFullscreenOpen" fullscreen :ui="{ content: 'h-screen w-full max-w-lg mx-auto bg-default rounded-lg shadow-lg ring ring-default flex flex-col focus:outline-none' }">
    <template #content>
      <div class="relative flex flex-col h-full p-6 overflow-hidden">
        <PlayerVisualizer :track-id="track.id" :playing="playing" />
        <div class="relative z-10 flex justify-between items-center mb-4">
          <div class="text-muted text-sm">
            playing {{ player.currentPlaylist?.name || '🎵' }}
          </div>
          <UButton
            variant="subtle"
            size="sm"
            icon="i-lucide-arrow-left"
            @click="player.closeFullscreen()"
          />
        </div>
        <div class="relative z-10 w-full mb-8 mt-auto">
          <Transition name="fade" mode="out-in">
            <div class="text-center" :key="track.id">
              <h2 class="text-xl font-bold truncate">{{ track.name }}</h2>
            </div>
          </Transition>
        </div>
        <div class="relative z-10 w-full">
          <div class="mb-8">
            <USlider v-model="currentTime" :min="0" :max="duration" />
          </div>
          <div class="flex justify-between items-center gap-4">
            <UButton
              :variant="player.shuffle ? 'solid' : 'subtle'"
              size="xl"
              icon="i-lucide-shuffle"
              :color="player.shuffle ? 'primary' : undefined"
              @click="player.toggleShuffle()"
            />
            <div class="flex gap-2">
              <UButton
                variant="subtle"
                size="xl"
                icon="i-lucide-skip-back"
                @click="player.switchToPreviousTrack()"
              />
              <UButton
                variant="subtle"
                size="xl"
                :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
                @click="playing = !playing"
              />
              <UButton
                variant="subtle"
                size="xl"
                icon="i-lucide-skip-forward"
                @click="player.switchToNextTrack()"
              />
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-ellipsis"
              size="xl"
              @click="openInfo = true"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
  <TrackInfo :track="track" v-model:open="openInfo" />
</template>
