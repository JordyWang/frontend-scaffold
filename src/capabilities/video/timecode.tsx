import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { formatTimecode } from './format-timecode'

export function Timecode({
  seconds,
  className,
  ...props
}: { seconds: number } & HTMLAttributes<HTMLTimeElement>) {
  return (
    <time className={cn('tabular-nums', className)} {...props}>
      {formatTimecode(seconds)}
    </time>
  )
}
