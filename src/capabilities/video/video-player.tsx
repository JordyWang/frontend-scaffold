import { useEffect } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useVideoPlayer } from './player'
import { CaptionTrack } from './caption-track'
import { VideoControls } from './video-controls'
import type { VideoSource } from './player-machine'

export type VideoPlayerProps = {
  source: VideoSource
  title?: string
  autoPlay?: boolean
  initialMuted?: boolean
  initialVolume?: number
  className?: string
  onStatusChange?: (status: ReturnType<typeof useVideoPlayer>['status']) => void
}

const statusLabels = {
  idle: '等待播放',
  loading: '正在加载视频',
  ready: '视频已就绪',
  playing: '正在播放',
  paused: '已暂停',
  ended: '播放结束',
  error: '视频播放失败',
} as const

export function VideoPlayer({
  source,
  title = '视频播放器',
  autoPlay = false,
  initialMuted = false,
  initialVolume = 1,
  className,
  onStatusChange,
}: VideoPlayerProps) {
  const {
    videoRef,
    status,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    isFullscreen,
    error,
    togglePlay,
    seek,
    seekBy,
    toggleMuted,
    setVolume,
    toggleFullscreen,
    reload,
  } = useVideoPlayer({
    source,
    autoPlay,
    initialMuted,
    initialVolume,
  })

  useEffect(() => {
    onStatusChange?.(status)
  }, [onStatusChange, status])

  const isPlaying = status === 'playing'

  return (
    <section
      className={cn('ui-video-player', className)}
      aria-label={title}
      data-status={status}
    >
      <div className="ui-video-player__stage">
        <video
          ref={videoRef}
          className="ui-video-player__media"
          tabIndex={0}
          playsInline
          preload="metadata"
          poster={source.poster}
          aria-label={title}
          onClick={() => void togglePlay()}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              void togglePlay()
            }
          }}
        >
          {source.type && <source src={source.src} type={source.type} />}
          {source.subtitles?.map((track) => (
            <CaptionTrack key={`${track.srcLang}-${track.src}`} {...track} />
          ))}
        </video>
        <div
          className="ui-video-player__status"
          aria-label={`视频状态：${statusLabels[status]}`}
          aria-live="polite"
          role="status"
        >
          {statusLabels[status]}
        </div>
        {status === 'error' && (
          <div className="ui-video-player__error" role="alert">
            <p>{error?.message ?? '视频播放失败，请重试'}</p>
            <Button variant="outline" onClick={reload}>
              重试播放
            </Button>
          </div>
        )}
      </div>
      <VideoControls
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onSeekBy={seekBy}
        onToggleMuted={toggleMuted}
        onVolumeChange={setVolume}
        onToggleFullscreen={toggleFullscreen}
      />
    </section>
  )
}
