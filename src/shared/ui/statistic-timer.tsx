import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Statistic, type StatisticProps } from './data-display'

export type StatisticTimerProps = Omit<
  StatisticProps,
  'value' | 'precision' | 'formatter' | 'onChange'
> & {
  /** Countdown target or countup start, as a Unix timestamp in milliseconds. */
  value: number
  type?: 'countdown' | 'countup'
  /** D, DD, H, HH, m, mm, s, ss, S, SS and SSS; wrap literal text in brackets. */
  format?: string
  onChange?: (milliseconds: number) => void
  onFinish?: () => void
}

function currentDuration(value: number, type: 'countdown' | 'countup') {
  if (!Number.isFinite(value)) return null
  const difference =
    type === 'countdown' ? value - Date.now() : Date.now() - value
  return Math.max(0, Math.floor(difference))
}

function visibleDuration(
  milliseconds: number,
  type: 'countdown' | 'countup',
  showMilliseconds: boolean,
) {
  if (showMilliseconds) return milliseconds
  return type === 'countdown'
    ? Math.ceil(milliseconds / 1000) * 1000
    : Math.floor(milliseconds / 1000) * 1000
}

function formatDuration(milliseconds: number | null, format: string) {
  if (milliseconds === null) return '—'
  const totalSeconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const tokens = format.replace(/\[[^\]]*\]/g, '')
  const hasDays = /D/.test(tokens)
  const hasHours = /H/.test(tokens)
  const hasMinutes = /m/.test(tokens)
  const totalHours = Math.floor(totalSeconds / 3600)
  const hours = hasDays ? totalHours % 24 : totalHours
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = hasHours
    ? totalMinutes % 60
    : hasDays
      ? totalMinutes % 1440
      : totalMinutes
  const seconds = hasMinutes
    ? totalSeconds % 60
    : hasHours
      ? totalSeconds % 3600
      : hasDays
        ? totalSeconds % 86_400
        : totalSeconds
  const fraction = String(milliseconds % 1000).padStart(3, '0')
  const pad = (value: number, length: number) =>
    String(value).padStart(length, '0')

  return format.replace(
    /\[([^\]]*)\]|D{1,2}|H{1,2}|m{1,2}|s{1,2}|S{1,3}/g,
    (token, literal: string | undefined) => {
      if (literal !== undefined) return literal
      if (token[0] === 'D') return pad(days, token.length)
      if (token[0] === 'H') return pad(hours, token.length)
      if (token[0] === 'm') return pad(minutes, token.length)
      if (token[0] === 's') return pad(seconds, token.length)
      return fraction.slice(0, token.length)
    },
  )
}

function readableTimerTitle(title: ReactNode): string | undefined {
  if (typeof title === 'string' || typeof title === 'number')
    return String(title)
  return undefined
}

/** Live time statistic derived from the clock so background tabs do not drift. */
export function StatisticTimer({
  title,
  value,
  type = 'countdown',
  format = 'HH:mm:ss',
  onChange,
  onFinish,
  loading = false,
  'aria-label': ariaLabel,
  ...props
}: StatisticTimerProps) {
  const showMilliseconds = /S/.test(format.replace(/\[[^\]]*\]/g, ''))
  const [duration, setDuration] = useState(() => currentDuration(value, type))
  const onChangeRef = useRef(onChange)
  const onFinishRef = useRef(onFinish)
  const finishedValueRef = useRef<number | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
    onFinishRef.current = onFinish
  }, [onChange, onFinish])

  useEffect(() => {
    let lastReported: number | null = null
    let finished = type === 'countdown' && finishedValueRef.current === value
    const interval = { current: undefined as number | undefined }
    const tick = () => {
      const raw = currentDuration(value, type)
      const next =
        raw === null ? null : visibleDuration(raw, type, showMilliseconds)
      setDuration((current) => (current === next ? current : next))
      if (next !== null && next !== lastReported) {
        lastReported = next
        onChangeRef.current?.(next)
      }
      if (type === 'countdown' && raw === 0 && !finished) {
        finished = true
        finishedValueRef.current = value
        onFinishRef.current?.()
        if (interval.current !== undefined)
          window.clearInterval(interval.current)
        window.removeEventListener('focus', tick)
        document.removeEventListener('visibilitychange', resume)
      }
    }
    const resume = () => {
      if (!document.hidden) tick()
    }

    tick()
    if (!Number.isFinite(value) || (type === 'countdown' && finished)) return
    interval.current = window.setInterval(tick, showMilliseconds ? 50 : 200)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.clearInterval(interval.current)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [value, type, showMilliseconds])

  const display = formatDuration(duration, format)
  const titleText = readableTimerTitle(title)
  return (
    <Statistic
      {...props}
      title={title}
      value={display}
      loading={loading}
      role={loading ? undefined : 'timer'}
      aria-label={ariaLabel ?? `${titleText ?? '计时'}：${display}`}
      aria-live="off"
      data-ui-statistic-timer={type}
    />
  )
}
