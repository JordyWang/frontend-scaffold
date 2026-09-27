import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  audioPlayerReducer,
  clampAudioVolume,
  createInitialAudioPlayerState,
  type AudioPlayerError,
  type AudioSource,
} from './player-machine'

export type UseAudioPlayerOptions = {
  source?: AudioSource | null
  autoPlay?: boolean
  initialVolume?: number
  initialMuted?: boolean
}

function mediaErrorMessage(error: MediaError | null) {
  switch (error?.code) {
    case 1:
      return '音频加载被中止'
    case 2:
      return '网络错误，音频无法加载'
    case 3:
      return '音频格式或内容无法解码'
    case 4:
      return '当前浏览器不支持此音频格式'
    default:
      return '音频加载失败，请重试'
  }
}

function readMediaError(audio: HTMLAudioElement): AudioPlayerError {
  return {
    code: audio.error?.code,
    message: mediaErrorMessage(audio.error),
  }
}

export function useAudioPlayer({
  source = null,
  autoPlay = false,
  initialVolume = 1,
  initialMuted = false,
}: UseAudioPlayerOptions = {}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, dispatch] = useReducer(
    audioPlayerReducer,
    createInitialAudioPlayerState(null, {
      volume: initialVolume,
      muted: initialMuted,
    }),
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const sourceChanged = state.source?.src !== source?.src
    if (!source) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (sourceChanged || state.source) dispatch({ type: 'reset' })
      return
    }
    if (!sourceChanged && state.source) return

    audio.pause()
    dispatch({ type: 'load-start', source })
    audio.src = source.src
    audio.load()
    if (autoPlay) void audio.play().catch(() => undefined)
  }, [autoPlay, source, state.source])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = clampAudioVolume(state.volume)
    audio.muted = state.muted
  }, [state.muted, state.volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadStart = () => dispatch({ type: 'load-start', source })
    const onLoadedMetadata = () =>
      dispatch({ type: 'loaded-metadata', duration: audio.duration })
    const onPlay = () => dispatch({ type: 'play' })
    const onPause = () => dispatch({ type: 'pause' })
    const onTimeUpdate = () =>
      dispatch({ type: 'time-update', currentTime: audio.currentTime })
    const onEnded = () => dispatch({ type: 'ended' })
    const onError = () =>
      dispatch({ type: 'error', error: readMediaError(audio) })
    const onVolumeChange = () =>
      dispatch({
        type: 'volume-change',
        volume: audio.volume,
        muted: audio.muted,
      })

    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('volumechange', onVolumeChange)
    return () => {
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('volumechange', onVolumeChange)
    }
  }, [source])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false
    try {
      await audio.play()
      return true
    } catch (error) {
      dispatch({
        type: 'error',
        error: {
          message:
            error instanceof DOMException && error.name === 'NotAllowedError'
              ? '请先点击播放按钮'
              : '音频无法播放，请重试',
        },
      })
      return false
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false
    if (audio.paused || audio.ended) return play()
    pause()
    return true
  }, [pause, play])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max =
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
    const nextTime = Math.min(
      max,
      Math.max(0, Number.isFinite(time) ? time : 0),
    )
    audio.currentTime = nextTime
    dispatch({ type: 'time-update', currentTime: nextTime })
  }, [])

  const seekBy = useCallback(
    (seconds: number) => seek((audioRef.current?.currentTime ?? 0) + seconds),
    [seek],
  )

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = clampAudioVolume(volume)
    dispatch({
      type: 'volume-change',
      volume: audio.volume,
      muted: audio.muted,
    })
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
    dispatch({ type: 'volume-change', volume: audio.volume, muted })
  }, [])

  const toggleMuted = useCallback(
    () => setMuted(!state.muted),
    [setMuted, state.muted],
  )

  const reload = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !source) return
    dispatch({ type: 'load-start', source })
    audio.load()
  }, [source])

  return {
    ...state,
    audioRef,
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    setVolume,
    setMuted,
    toggleMuted,
    reload,
  }
}
