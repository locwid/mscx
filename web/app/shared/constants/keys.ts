import type { InjectionKey } from 'vue'
import type { AudioPlayer } from '~/composables/use-audio-player'

export const AUTH_STORAGE_KEY = 'authKey'
export const AUTO_DOWNLOAD_TRACKS_STORAGE_KEY = 'autoDownloadTracks'
export const AUDIO_PLAYER_KEY: InjectionKey<AudioPlayer> = Symbol('audioPlayer')
