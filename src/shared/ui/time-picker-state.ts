export type TimePrecision = 'minute' | 'second'
export type TimeUnit = 'hour' | 'minute' | 'second' | 'meridiem'
export type TimeParts = [hour: number, minute: number, second: number]
export type TimeConstraints = {
  precision: TimePrecision
  min?: string
  max?: string
  step?: number | string
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  disabledHours?: () => number[]
  disabledMinutes?: (hour: number) => number[]
  disabledSeconds?: (hour: number, minute: number) => number[]
  disabledTime?: (value: string) => boolean
}

export function parseTime(value?: string): TimeParts | undefined {
  if (!value || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return undefined
  const [hour, minute, second = 0] = value.split(':').map(Number)
  return hour < 24 && minute < 60 && second < 60
    ? [hour, minute, second]
    : undefined
}
export const timeSeconds = (parts: TimeParts) =>
  parts[0] * 3600 + parts[1] * 60 + parts[2]
export function timeString(parts: TimeParts, precision: TimePrecision) {
  return parts
    .slice(0, precision === 'second' ? 3 : 2)
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}
export function timeDisplay(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const parts = parseTime(value)
  if (!parts || !use12Hours) return value
  return (
    timeString([parts[0] % 12 || 12, parts[1], parts[2]], precision) +
    (parts[0] < 12 ? ' AM' : ' PM')
  )
}
export function timeInput(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const match = use12Hours
    ? /^(\d{2}:\d{2}(?::\d{2})?) (AM|PM)$/i.exec(value)
    : undefined
  const parts = parseTime(match?.[1] ?? value)
  if (!parts || (precision === 'minute' && parts[2] !== 0)) return undefined
  if (match) {
    if (parts[0] < 1 || parts[0] > 12) return undefined
    parts[0] = (parts[0] % 12) + (match[2].toUpperCase() === 'PM' ? 12 : 0)
  }
  const expected = precision === 'second' ? 8 : 5
  if ((match?.[1] ?? value).length !== expected) return undefined
  return timeString(parts, precision)
}
export function unitStep(value: number | undefined, limit: number) {
  return value !== undefined &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= limit
    ? value
    : 1
}

export function timeSelectable(value: string, options: TimeConstraints) {
  const parts = parseTime(value)
  if (!parts || value.length !== (options.precision === 'second' ? 8 : 5))
    return false
  const [hour, minute, second] = parts
  const min = parseTime(options.min),
    max = parseTime(options.max)
  const lower = min ? timeSeconds(min) : 0,
    upper = max ? timeSeconds(max) : 86399
  const total = timeSeconds(parts)
  if (
    lower <= upper
      ? total < lower || total > upper
      : total < lower && total > upper
  )
    return false
  if (
    hour % unitStep(options.hourStep, 24) ||
    minute % unitStep(options.minuteStep, 60) ||
    second % unitStep(options.secondStep, 60)
  )
    return false
  if (
    options.disabledHours?.().includes(hour) ||
    options.disabledMinutes?.(hour).includes(minute) ||
    options.disabledSeconds?.(hour, minute).includes(second)
  )
    return false
  if (options.step !== 'any') {
    const count = Number(
      options.step ?? (options.precision === 'minute' ? 60 : 1),
    )
    const distance =
      total - lower + (lower > upper && total < lower ? 86400 : 0)
    if (
      Number.isFinite(count) &&
      count > 0 &&
      Math.abs(distance / count - Math.round(distance / count)) > 1e-8
    )
      return false
  }
  return !options.disabledTime?.(value)
}

/** Changing an upper unit preserves lower units when possible, otherwise finds the nearest valid completion. */
export function timeUnitValue(
  base: TimeParts,
  unit: TimeUnit,
  value: number,
  options: TimeConstraints,
) {
  const target: TimeParts = [...base]
  if (unit === 'meridiem') target[0] = (target[0] % 12) + value * 12
  else target[unit === 'hour' ? 0 : unit === 'minute' ? 1 : 2] = value
  if (options.precision === 'minute') target[2] = 0
  const direct = timeString(target, options.precision)
  if (timeSelectable(direct, options)) return direct
  if (unit === 'second') return undefined
  let best: string | undefined,
    closest = Infinity
  const hours =
    unit === 'meridiem'
      ? Array.from({ length: 12 }, (_, index) => index + value * 12)
      : [target[0]]
  const minutes =
    unit === 'minute'
      ? [value]
      : Array.from(
          { length: Math.ceil(60 / unitStep(options.minuteStep, 60)) },
          (_, index) => index * unitStep(options.minuteStep, 60),
        )
  const seconds =
    options.precision === 'minute'
      ? [0]
      : Array.from(
          { length: Math.ceil(60 / unitStep(options.secondStep, 60)) },
          (_, index) => index * unitStep(options.secondStep, 60),
        )
  for (const hour of hours) {
    if (
      options.disabledHours?.().includes(hour) ||
      hour % unitStep(options.hourStep, 24)
    )
      continue
    for (const minute of minutes) {
      if (options.disabledMinutes?.(hour).includes(minute)) continue
      for (const second of seconds) {
        const next: TimeParts = [hour, minute, second]
        const distance = Math.abs(timeSeconds(next) - timeSeconds(target))
        if (distance >= closest) continue
        const candidate = timeString(next, options.precision)
        if (timeSelectable(candidate, options)) {
          best = candidate
          closest = distance
        }
      }
    }
  }
  return best
}
