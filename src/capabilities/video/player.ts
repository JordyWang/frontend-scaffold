import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  clampVolume,
  createInitialVideoPlayerState,
  videoPlayerReducer,
  type VideoPlayerError,
  type VideoSource,
} from './player-machine'

export type UseVideoPlayerOptions = {
  source?: VideoSource | null
  autoPlay?: boolean
  initialVolume?: number
  initialMuted?: boolean
}

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
  webkitExitFullscreen?: () => void
}

function mediaErrorMessage(error: MediaError | null) {
  switch (error?.code) {
    case 1:
      return '视频加载被中止'
    case 2:
      return '网络错误，视频无法加载'
    case 3:
      return '视频格式或内容无法解码'
    case 4:
      return '当前浏览器不支持此视频格式'
    default:
      return '视频加载失败，请重试'
  }
}

function readBufferedEnd(video: HTMLVideoElement) {
  if (video.buffered.length === 0) return 0
  try {
    return video.buffered.end(video.buffered.length - 1)
  } catch {
    return 0
  }
}

function readMediaError(video: HTMLVideoElement): VideoPlayerError {
  return {
    code: video.error?.code,
    message: mediaErrorMessage(video.error),
  }
}

export function useVideoPlayer({
  source = null,
  autoPlay = false,
  initialVolume = 1,
  initialMuted = false,
}: UseVideoPlayerOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, dispatch] = useReducer(
    videoPlayerReducer,
    createInitialVideoPlayerState(null, {
      volume: initialVolume,
      muted: initialMuted,
    }),
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const sourceChanged = state.source?.src !== source?.src
    if (!source) {
      video.pause()
      video.removeAttribute('src')
      video.removeAttribute('poster')
      video.load()
      if (sourceChanged || state.source) dispatch({ type: 'reset' })
      return
    }

    if (!sourceChanged && state.source) return

    video.pause()
    dispatch({ type: 'load-start', source })
    video.src = source.src
    if (source.poster) video.poster = source.poster
    else video.removeAttribute('poster')
    video.load()
    if (autoPlay) void video.play().catch(() => undefined)
  }, [autoPlay, source, state.source])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = clampVolume(state.volume)
    video.muted = state.muted
  }, [state.muted, state.volume])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoadStart = () => dispatch({ type: 'load-start', source })
    const onLoadedMetadata = () =>
      dispatch({ type: 'loaded-metadata', duration: video.duration })
    const onPlay = () => dispatch({ type: 'play' })
    const onPause = () => dispatch({ type: 'pause' })
    const onTimeUpdate = () =>
      dispatch({ type: 'time-update', currentTime: video.currentTime })
    const onProgress = () =>
      dispatch({ type: 'progress', buffered: readBufferedEnd(video) })
    const onEnded = () => dispatch({ type: 'ended' })
    const onError = () =>
      dispatch({ type: 'error', error: readMediaError(video) })
    const onVolumeChange = () =>
      dispatch({
        type: 'volume-change',
        volume: video.volume,
        muted: video.muted,
      })
    const onFullscreenChange = () =>
      dispatch({
        type: 'fullscreen-change',
        isFullscreen: document.fullscreenElement === video,
      })
    const onWebkitBeginFullscreen = () =>
      dispatch({ type: 'fullscreen-change', isFullscreen: true })
    const onWebkitEndFullscreen = () =>
      dispatch({ type: 'fullscreen-change', isFullscreen: false })

    video.addEventListener('loadstart', onLoadStart)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('progress', onProgress)
    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('webkitbeginfullscreen', onWebkitBeginFullscreen)
    video.addEventListener('webkitendfullscreen', onWebkitEndFullscreen)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      video.removeEventListener('loadstart', onLoadStart)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener(
        'webkitbeginfullscreen',
        onWebkitBeginFullscreen,
      )
      video.removeEventListener('webkitendfullscreen', onWebkitEndFullscreen)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [source])

  const play = useCallback(async () => {
    const video = videoRef.current
    if (!video) return false
    try {
      await video.play()
      return true
    } catch (error) {
      dispatch({
        type: 'error',
        error: {
          message:
            error instanceof DOMException && error.name === 'NotAllowedError'
              ? '请先点击播放按钮'
              : '视频无法播放，请重试',
        },
      })
      return false
    }
  }, [])

  const pause = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return false
    if (video.paused || video.ended) return play()
    pause()
    return true
  }, [pause, play])

  const seek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    const max =
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    const nextTime = Math.min(
      max,
      Math.max(0, Number.isFinite(time) ? time : 0),
    )
    video.currentTime = nextTime
    dispatch({ type: 'time-update', currentTime: nextTime })
  }, [])

  const seekBy = useCallback(
    (seconds: number) => seek((videoRef.current?.currentTime ?? 0) + seconds),
    [seek],
  )

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = clampVolume(volume)
    dispatch({
      type: 'volume-change',
      volume: video.volume,
      muted: video.muted,
    })
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    dispatch({ type: 'volume-change', volume: video.volume, muted })
  }, [])

  const toggleMuted = useCallback(
    () => setMuted(!state.muted),
    [setMuted, state.muted],
  )

  const reload = useCallback(() => {
    const video = videoRef.current
    if (!video || !source) return
    dispatch({ type: 'load-start', source })
    video.load()
  }, [source])

  const enterFullscreen = useCallback(async () => {
    const video = videoRef.current as WebkitVideoElement | null
    if (!video) return false
    if (video.requestFullscreen) {
      try {
        await video.requestFullscreen()
        return true
      } catch {
        return false
      }
    }
    if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen()
      return true
    }
    return false
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (document.exitFullscreen) {
      try {
        await document.exitFullscreen()
        return true
      } catch {
        return false
      }
    }
    const video = videoRef.current as WebkitVideoElement | null
    if (video?.webkitExitFullscreen) {
      video.webkitExitFullscreen()
      return true
    }
    return false
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement || state.isFullscreen)
      return exitFullscreen()
    return enterFullscreen()
  }, [enterFullscreen, exitFullscreen, state.isFullscreen])

  return {
    ...state,
    videoRef,
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    setVolume,
    setMuted,
    toggleMuted,
    reload,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
