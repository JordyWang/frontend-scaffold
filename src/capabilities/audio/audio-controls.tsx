import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatAudioTimecode } from './format-timecode'

export type AudioControlsProps = {
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  isPlaying: boolean
  onTogglePlay: () => void | Promise<unknown>
  onSeek: (time: number) => void
  onSeekBy: (seconds: number) => void
  onToggleMuted: () => void
  onVolumeChange: (volume: number) => void
  className?: string
}

function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      {playing ? (
        <path
          d="M6 4v12M14 4v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path d="m7 4 8 6-8 6V4Z" fill="currentColor" />
      )}
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
      <path
        d={muted ? 'm13 8 4 4m0-4-4 4' : 'M13 7.5a3.5 3.5 0 0 1 0 5'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AudioControls({
  currentTime,
  duration,
  volume,
  muted,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSeekBy,
  onToggleMuted,
  onVolumeChange,
  className,
}: AudioControlsProps) {
  const hasDuration = duration > 0
  return (
    <div className={cn('ui-audio-controls', className)} aria-label="音频控制栏">
      <input
        className="ui-audio-controls__seek"
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        disabled={!hasDuration}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label={`音频进度，当前 ${formatAudioTimecode(currentTime)}`}
      />
      <div className="ui-audio-controls__row">
        <div className="ui-audio-controls__cluster">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void onTogglePlay()}
            aria-label={isPlaying ? '暂停音频' : '播放音频'}
            aria-pressed={isPlaying}
          >
            <PlayIcon playing={isPlaying} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="[&>span]:text-xs [&>span]:font-bold"
            onClick={() => onSeekBy(-10)}
            aria-label="后退 10 秒"
          >
            <span aria-hidden="true">−10</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="[&>span]:text-xs [&>span]:font-bold"
            onClick={() => onSeekBy(10)}
            aria-label="前进 10 秒"
          >
            <span aria-hidden="true">+10</span>
          </Button>
          <span className="ui-audio-controls__time" aria-label="播放时间">
            {formatAudioTimecode(currentTime)} / {formatAudioTimecode(duration)}
          </span>
        </div>
        <div className="ui-audio-controls__cluster">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMuted}
            aria-label={muted ? '取消静音' : '静音音频'}
            aria-pressed={muted}
          >
            <VolumeIcon muted={muted} />
          </Button>
          <label className="ui-audio-controls__volume">
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
        </div>
      </div>
    </div>
  )
}
