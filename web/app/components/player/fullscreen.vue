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
  <UModal
    v-model:open="player.isFullscreenOpen"
    fullscreen
    :ui="{
      content:
        'h-screen w-full max-w-lg mx-auto bg-default rounded-lg shadow-lg ring ring-default flex flex-col focus:outline-none',
    }"
  >
    <template #content>
      <div class="relative flex flex-col h-full px-6 py-8 overflow-hidden">
        <div class="relative z-10 flex justify-between items-center mb-4">
          <div class="text-muted text-lg">
            playing
            <span class="text-primary">{{
              player.currentPlaylist?.name || 'mscx'
            }}</span>
          </div>
          <UButton
            variant="link"
            color="neutral"
            icon="i-lucide-arrow-left"
            @click="player.closeFullscreen()"
          />
        </div>
        <div class="relative z-10 flex grow items-center justify-center">
          <Transition name="fade" mode="out-in">
            <div :key="track.id" class="h-72 w-72 rounded-xl overflow-hidden">
              <img
                v-if="player.hasThumbnail"
                :src="player.thumbnailSrc"
                :alt="track.name"
                class="h-full w-full object-cover"
              />
              <Avatar v-else :name="track.id" class="h-full w-full" />
            </div>
          </Transition>
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
              :variant="player.shuffle ? 'soft' : 'link'"
              size="xl"
              icon="i-lucide-shuffle"
              :color="player.shuffle ? 'primary' : 'neutral'"
              @click="player.toggleShuffle()"
            />
            <div class="flex gap-2">
              <UButton
                variant="link"
                color="neutral"
                size="xl"
                icon="i-lucide-skip-back"
                @click="player.switchToPreviousTrack()"
              />
              <UButton
                variant="link"
                color="neutral"
                :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'"
                @click="playing = !playing"
              />
              <UButton
                variant="link"
                color="neutral"
                icon="i-lucide-skip-forward"
                @click="player.switchToNextTrack()"
              />
            </div>
            <UButton
              variant="link"
              color="neutral"
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
