export type AudioPlaybackStatus =
  'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export type AudioSource = {
  src: string
  type?: string
}

export type AudioPlayerError = {
  code?: number
  message: string
}

export type AudioPlayerState = {
  status: AudioPlaybackStatus
  source: AudioSource | null
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  error: AudioPlayerError | null
}

export type AudioPlayerEvent =
  | { type: 'load-start'; source: AudioSource | null }
  | { type: 'loaded-metadata'; duration: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'time-update'; currentTime: number }
  | { type: 'ended' }
  | { type: 'error'; error: AudioPlayerError }
  | { type: 'volume-change'; volume: number; muted: boolean }
  | { type: 'reset' }

export function clampAudioVolume(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1))
}

export function createInitialAudioPlayerState(
  source: AudioSource | null = null,
  options: { volume?: number; muted?: boolean } = {},
): AudioPlayerState {
  return {
    status: 'idle',
    source,
    currentTime: 0,
    duration: 0,
    volume: clampAudioVolume(options.volume ?? 1),
    muted: options.muted ?? false,
    error: null,
  }
}

export function audioPlayerReducer(
  state: AudioPlayerState,
  event: AudioPlayerEvent,
): AudioPlayerState {
  switch (event.type) {
    case 'load-start':
      return {
        ...state,
        status: event.source ? 'loading' : 'idle',
        source: event.source,
        currentTime: 0,
        duration: 0,
        error: null,
      }
    case 'loaded-metadata':
      return {
        ...state,
        status: state.status === 'error' ? 'error' : 'ready',
        duration: Math.max(
          0,
          Number.isFinite(event.duration) ? event.duration : 0,
        ),
        error: null,
      }
    case 'play':
      return { ...state, status: 'playing', error: null }
    case 'pause':
      return {
        ...state,
        status: state.status === 'ended' ? 'ended' : 'paused',
      }
    case 'time-update':
      return {
        ...state,
        currentTime: Math.max(
          0,
          Number.isFinite(event.currentTime) ? event.currentTime : 0,
        ),
      }
    case 'ended':
      return {
        ...state,
        status: 'ended',
        currentTime: state.duration > 0 ? state.duration : state.currentTime,
      }
    case 'error':
      return { ...state, status: 'error', error: event.error }
    case 'volume-change':
      return {
        ...state,
        volume: clampAudioVolume(event.volume),
        muted: event.muted,
      }
    case 'reset':
      return createInitialAudioPlayerState(null, {
        volume: state.volume,
        muted: state.muted,
      })
  }
}
