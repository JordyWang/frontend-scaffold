export type VideoPlaybackStatus =
  'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export type VideoSubtitle = {
  src: string
  srcLang: string
  label: string
  kind?: 'subtitles' | 'captions'
  default?: boolean
}

export type VideoSource = {
  src: string
  type?: string
  poster?: string
  subtitles?: VideoSubtitle[]
}

export type VideoPlayerError = {
  code?: number
  message: string
}

export type VideoPlayerState = {
  status: VideoPlaybackStatus
  source: VideoSource | null
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  isFullscreen: boolean
  error: VideoPlayerError | null
}

export type VideoPlayerEvent =
  | { type: 'load-start'; source: VideoSource | null }
  | { type: 'loaded-metadata'; duration: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'time-update'; currentTime: number }
  | { type: 'progress'; buffered: number }
  | { type: 'ended' }
  | { type: 'error'; error: VideoPlayerError }
  | { type: 'volume-change'; volume: number; muted: boolean }
  | { type: 'fullscreen-change'; isFullscreen: boolean }
  | { type: 'reset' }

export function createInitialVideoPlayerState(
  source: VideoSource | null = null,
  options: { volume?: number; muted?: boolean } = {},
): VideoPlayerState {
  return {
    status: 'idle',
    source,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: clampVolume(options.volume ?? 1),
    muted: options.muted ?? false,
    isFullscreen: false,
    error: null,
  }
}

export function clampVolume(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1))
}

export function videoPlayerReducer(
  state: VideoPlayerState,
  event: VideoPlayerEvent,
): VideoPlayerState {
  switch (event.type) {
    case 'load-start':
      return {
        ...state,
        status: event.source ? 'loading' : 'idle',
        source: event.source,
        currentTime: 0,
        duration: 0,
        buffered: 0,
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
    case 'progress':
      return {
        ...state,
        buffered: Math.max(
          0,
          Number.isFinite(event.buffered) ? event.buffered : 0,
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
        volume: clampVolume(event.volume),
        muted: event.muted,
      }
    case 'fullscreen-change':
      return { ...state, isFullscreen: event.isFullscreen }
    case 'reset':
      return createInitialVideoPlayerState(null, {
        volume: state.volume,
        muted: state.muted,
      })
  }
}
