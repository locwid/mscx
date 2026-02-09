import type { InjectionKey } from 'vue'
import type { useAudio } from '~/composables/use-audio'

export const AUTH_STORAGE_KEY = 'authKey'

export type AudioContext = ReturnType<typeof useAudio>
export const AUDIO_INJECTION_KEY: InjectionKey<AudioContext> = Symbol('audio')
