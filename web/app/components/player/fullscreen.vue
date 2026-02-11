<script lang="ts" setup>
import type { Track } from '~/dexie.storage'
import { usePlayer } from '~/stores/use-player'
import { AUDIO_INJECTION_KEY } from '~/shared/constants/keys'

defineProps<{
  track: Track
}>()

const player = usePlayer()
const audio = inject(AUDIO_INJECTION_KEY)!
const { playing, currentTime, duration, analyserNode, getFrequencyData } = audio

const openInfo = ref(false)
</script>

<template>
  <UModal v-model:open="player.isFullscreenOpen" fullscreen :ui="{ content: 'h-screen w-full max-w-lg mx-auto bg-black rounded-lg shadow-lg ring ring-default flex flex-col focus:outline-none overflow-hidden rounded-none' }">
    <template #content>
      <div class="relative flex flex-col h-full">
        <PlayerVisualizer
          :key="track.id"
          :track-id="track.id"
          :analyser-node="analyserNode"
          :playing="playing"
          :get-frequency-data="getFrequencyData"
        />
        <div class="absolute inset-0 flex flex-col p-6 z-10">
          <div class="flex justify-between items-center mb-4">
            <div class="text-white/60 text-sm drop-shadow">
              playing {{ player.currentPlaylist?.name || '🎵' }}
            </div>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-arrow-left"
              color="neutral"
              class="text-white/80"
              @click="player.closeFullscreen()"
            />
          </div>
          <div class="flex-1" />
          <div class="flex gap-8 flex-col backdrop-blur-sm bg-black/80 rounded-xl px-4 py-6">
<div class="w-full">
            <Transition name="fade" mode="out-in">
              <div class="text-center" :key="track.id">
                <h2 class="text-2xl font-bold truncate text-white drop-shadow-lg">{{ track.name }}</h2>
              </div>
            </Transition>
          </div>
          <div class="w-full">
            <div class="mb-6">
              <USlider v-model="currentTime" :min="0" :max="duration" />
            </div>
            <div class="flex justify-between items-center gap-4">
              <UButton
                :variant="player.shuffle ? 'solid' : 'ghost'"
                size="xl"
                icon="i-lucide-shuffle"
                :color="player.shuffle ? 'primary' : 'neutral'"
                class="text-white/80"
                @click="player.toggleShuffle()"
              />
              <div class="flex gap-2">
                <UButton
                  variant="ghost"
                  size="xl"
                  icon="i-lucide-skip-back"
                  color="neutral"
                  class="text-white/80"
                  @click="player.switchToPreviousTrack()"
                />
                <UButton
                  variant="ghost"
                  size="xl"
                  :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
                  color="neutral"
                  class="text-white"
                  @click="playing = !playing"
                />
                <UButton
                  variant="ghost"
                  size="xl"
                  icon="i-lucide-skip-forward"
                  color="neutral"
                  class="text-white/80"
                  @click="player.switchToNextTrack()"
                />
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-ellipsis"
                size="xl"
                class="text-white/80"
                @click="openInfo = true"
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
  <TrackInfo :track="track" v-model:open="openInfo" />
</template>
