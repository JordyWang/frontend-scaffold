import { useEffect } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useAudioPlayer } from './player'
import { AudioControls } from './audio-controls'
import type { AudioSource } from './player-machine'

export type AudioPlayerProps = {
  source: AudioSource
  title?: string
  autoPlay?: boolean
  initialMuted?: boolean
  initialVolume?: number
  className?: string
  onStatusChange?: (status: ReturnType<typeof useAudioPlayer>['status']) => void
}

const statusLabels = {
  idle: '等待播放',
  loading: '正在加载音频',
  ready: '音频已就绪',
  playing: '正在播放',
  paused: '已暂停',
  ended: '播放结束',
  error: '音频播放失败',
} as const

export function AudioPlayer({
  source,
  title = '音频播放器',
  autoPlay = false,
  initialMuted = false,
  initialVolume = 1,
  className,
  onStatusChange,
}: AudioPlayerProps) {
  const {
    audioRef,
    status,
    currentTime,
    duration,
    volume,
    muted,
    error,
    togglePlay,
    seek,
    seekBy,
    toggleMuted,
    setVolume,
    reload,
  } = useAudioPlayer({
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
      className={cn('ui-audio-player', className)}
      aria-label={title}
      data-status={status}
    >
      <div className="ui-audio-player__body">
        <div className="ui-audio-player__art" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              style={{ height: `${30 + ((index * 17) % 55)}%` }}
            />
          ))}
        </div>
        <audio
          ref={audioRef}
          className="ui-audio-player__media"
          preload="metadata"
          aria-label={title}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              void togglePlay()
            }
          }}
        >
          {source.type && <source src={source.src} type={source.type} />}
        </audio>
        <div
          className="ui-audio-player__status"
          aria-label={`音频状态：${statusLabels[status]}`}
          aria-live="polite"
          role="status"
        >
          {statusLabels[status]}
        </div>
        {status === 'error' && (
          <div className="ui-audio-player__error" role="alert">
            <p>{error?.message ?? '音频播放失败，请重试'}</p>
            <Button variant="outline" onClick={reload}>
              重试播放
            </Button>
          </div>
        )}
      </div>
      <AudioControls
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onSeekBy={seekBy}
        onToggleMuted={toggleMuted}
        onVolumeChange={setVolume}
      />
    </section>
  )
}
