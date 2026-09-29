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
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground',
        className,
      )}
      aria-label={title}
      data-status={status}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          className="block size-full cursor-pointer object-contain"
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
          className="pointer-events-none absolute top-[var(--space-sm)] start-[var(--space-sm)] max-w-[calc(100%-1rem)] rounded-full bg-slate-900/80 px-[0.625rem] py-[0.35rem] text-[0.8125rem] leading-[1.25] text-slate-50"
          aria-label={`视频状态：${statusLabels[status]}`}
          aria-live="polite"
          role="status"
        >
          {statusLabels[status]}
        </div>
        {status === 'error' && (
          <div
            className="absolute top-1/2 left-1/2 w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] border border-destructive bg-slate-900/95 p-[var(--space-md)] text-center text-slate-50"
            role="alert"
          >
            <p className="mt-0 mb-[var(--space-sm)] leading-normal">
              {error?.message ?? '视频播放失败，请重试'}
            </p>
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
