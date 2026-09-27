import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { Timecode } from './timecode'

export type VideoControlsProps = {
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  isPlaying: boolean
  isFullscreen: boolean
  onTogglePlay: () => void | Promise<unknown>
  onSeek: (time: number) => void
  onSeekBy: (seconds: number) => void
  onToggleMuted: () => void
  onVolumeChange: (volume: number) => void
  onToggleFullscreen: () => void | Promise<unknown>
  className?: string
}

function formatPercent(value: number, max: number) {
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path d="m7 4 8 6-8 6V4Z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M6 4v12M14 4v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SeekIcon({ direction }: { direction: 'back' | 'forward' }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d={
          direction === 'back'
            ? 'M8 5 3 10l5 5M4 10h8a4 4 0 1 1-3.2 3.2'
            : 'M12 5l5 5-5 5M16 10H8a4 4 0 1 0 3.2 3.2'
        }
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path d="M3 8v4h3l4 3V5L6 8H3Z" fill="currentColor" />
      {muted ? (
        <path
          d="m13 8 4 4m0-4-4 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5a7 7 0 0 1 0 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      {active ? (
        <path
          d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function VideoControls({
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  isPlaying,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onSeekBy,
  onToggleMuted,
  onVolumeChange,
  onToggleFullscreen,
  className,
}: VideoControlsProps) {
  const hasDuration = duration > 0
  const progressLabel = hasDuration
    ? `${Math.round(formatPercent(currentTime, duration))}%`
    : '无法获取时长'

  return (
    <div className={cn('ui-video-controls', className)} aria-label="视频控制栏">
      <div className="ui-video-controls__progress">
        <div
          className="ui-video-controls__buffered"
          aria-hidden="true"
          style={{ width: `${formatPercent(buffered, duration)}%` }}
        />
        <input
          className="ui-video-controls__seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          disabled={!hasDuration}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label={`视频进度，当前 ${progressLabel}`}
        />
      </div>
      <div className="ui-video-controls__row">
        <div className="ui-video-controls__cluster">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void onTogglePlay()}
            aria-label={isPlaying ? '暂停视频' : '播放视频'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onSeekBy(-10)}
            aria-label="后退 10 秒"
          >
            <SeekIcon direction="back" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onSeekBy(10)}
            aria-label="前进 10 秒"
          >
            <SeekIcon direction="forward" />
          </Button>
          <span className="ui-video-controls__time" aria-label="播放时间">
            <Timecode seconds={currentTime} />
            <span aria-hidden="true"> / </span>
            <Timecode seconds={duration} />
          </span>
        </div>
        <div className="ui-video-controls__cluster">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMuted}
            aria-label={muted ? '取消静音' : '静音视频'}
            aria-pressed={muted}
          >
            <VolumeIcon muted={muted} />
          </Button>
          <label className="ui-video-controls__volume">
            <span className="sr-only">音量</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              aria-label="音量"
            />
          </label>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void onToggleFullscreen()}
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
            aria-pressed={isFullscreen}
          >
            <FullscreenIcon active={isFullscreen} />
          </Button>
        </div>
      </div>
    </div>
  )
}
