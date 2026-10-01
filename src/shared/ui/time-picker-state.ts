export type TimePrecision = 'minute' | 'second' | 'millisecond'
export type TimeUnit = 'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem'
export type TimeParts = [
  hour: number,
  minute: number,
  second: number,
  millisecond?: number,
]
export type TimeConstraints = {
  precision: TimePrecision
  min?: string
  max?: string
  step?: number | string
  /** Internal civil date-time grid origin, measured in milliseconds from this day's midnight. */
  stepBaseMilliseconds?: number
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  millisecondStep?: number
  disabledHours?: () => number[]
  disabledMinutes?: (hour: number) => number[]
  disabledSeconds?: (hour: number, minute: number) => number[]
  disabledMilliseconds?: (
    hour: number,
    minute: number,
    second: number,
  ) => number[]
  disabledTime?: (value: string) => boolean
}

export function parseTime(value?: string): TimeParts | undefined {
  const match =
    value && /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?$/.exec(value)
  if (!match) return undefined
  const [hour, minute, second, millisecond] = match
    .slice(1)
    .map((part) => Number(part ?? 0))
  return hour < 24 && minute < 60 && second < 60
    ? [hour, minute, second, millisecond]
    : undefined
}
export const timeMilliseconds = (parts: TimeParts) =>
  (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000 + (parts[3] ?? 0)
export const timeSeconds = (parts: TimeParts) => timeMilliseconds(parts) / 1000
export const timeLength = (precision: TimePrecision) =>
  precision === 'minute' ? 5 : precision === 'second' ? 8 : 12
export const defaultTimeStep = (precision: TimePrecision) =>
  precision === 'minute' ? 60 : precision === 'second' ? 1 : 0.001
export function timeFormat(precision: TimePrecision, use12Hours = false) {
  return (
    (use12Hours ? 'hh:mm' : 'HH:mm') +
    (precision === 'minute' ? '' : ':ss') +
    (precision === 'millisecond' ? '.SSS' : '') +
    (use12Hours ? ' AM/PM' : '')
  )
}
export function inferTimePrecision(
  values: (string | undefined)[],
  step?: number | string,
): TimePrecision {
  const times = values.map((value) => value?.split('T').at(-1))
  const count = Number(step)
  if (
    times.some((value) => value?.length === 12) ||
    (Number.isFinite(count) && count > 0 && count % 1 !== 0)
  )
    return 'millisecond'
  return times.some((value) => value?.length === 8) || count % 60 > 0
    ? 'second'
    : 'minute'
}
export function timeString(parts: TimeParts, precision: TimePrecision) {
  const value = parts
    .slice(0, precision === 'minute' ? 2 : 3)
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
  return precision === 'millisecond'
    ? value + '.' + String(parts[3] ?? 0).padStart(3, '0')
    : value
}
export function timeNow(now: Date, precision: TimePrecision) {
  return timeString(
    [
      now.getHours(),
      now.getMinutes(),
      precision === 'minute' ? 0 : now.getSeconds(),
      precision === 'millisecond' ? now.getMilliseconds() : 0,
    ],
    precision,
  )
}
export function timeDisplay(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const parts = parseTime(value)
  if (!parts || !use12Hours) return value
  return (
    timeString([parts[0] % 12 || 12, parts[1], parts[2], parts[3]], precision) +
    (parts[0] < 12 ? ' AM' : ' PM')
  )
}
export function timeInput(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const match = use12Hours
    ? /^(\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?) (AM|PM)$/i.exec(value)
    : undefined
  const raw = match?.[1] ?? value
  const parts = parseTime(raw)
  if (!parts || raw.length !== timeLength(precision)) return undefined
  if (match) {
    if (parts[0] < 1 || parts[0] > 12) return undefined
    parts[0] = (parts[0] % 12) + (match[2].toUpperCase() === 'PM' ? 12 : 0)
  }
  return timeString(parts, precision)
}
/** Native inputs may omit zero seconds and trailing fractional zeros. Never discard nonzero lower fields. */
export function nativeTimeInput(value: string, precision: TimePrecision) {
  const match = /^(\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value)
  if (!match) return undefined
  const parts = parseTime(
    match[1] + ':' + (match[2] ?? '00') + '.' + (match[3] ?? '').padEnd(3, '0'),
  )
  if (
    !parts ||
    (precision !== 'millisecond' && parts[3]) ||
    (precision === 'minute' && parts[2])
  )
    return undefined
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
function stepMilliseconds(options: TimeConstraints) {
  if (options.step === 'any') return undefined
  const count =
    Number(options.step ?? defaultTimeStep(options.precision)) * 1000
  if (!Number.isFinite(count) || count <= 0) return undefined
  const rounded = Math.round(count)
  return Math.abs(count - rounded) < 1e-8 ? rounded : count
}
function bounds(options: TimeConstraints) {
  const min = parseTime(options.min),
    max = parseTime(options.max)
  return {
    lower: min ? timeMilliseconds(min) : 0,
    upper: max ? timeMilliseconds(max) : 86399999,
  }
}
function onGrid(
  total: number,
  options: TimeConstraints,
  lower: number,
  upper: number,
) {
  const count = stepMilliseconds(options)
  if (!count) return true
  const origin = options.stepBaseMilliseconds ?? lower
  const distance =
    total -
    origin +
    (options.stepBaseMilliseconds === undefined &&
    lower > upper &&
    total < lower
      ? 86400000
      : 0)
  const remainder = distance % count
  return (
    Math.min(Math.abs(remainder), Math.abs(Math.abs(remainder) - count)) < 1e-7
  )
}
export function timeSelectable(value: string, options: TimeConstraints) {
  const parts = parseTime(value)
  if (!parts || value.length !== timeLength(options.precision)) return false
  const [hour, minute, second, millisecond = 0] = parts
  const { lower, upper } = bounds(options),
    total = timeMilliseconds(parts)
  if (
    lower <= upper
      ? total < lower || total > upper
      : total < lower && total > upper
  )
    return false
  if (
    hour % unitStep(options.hourStep, 24) ||
    minute % unitStep(options.minuteStep, 60) ||
    second % unitStep(options.secondStep, 60) ||
    millisecond % unitStep(options.millisecondStep, 1000)
  )
    return false
  if (
    options.disabledHours?.().includes(hour) ||
    options.disabledMinutes?.(hour).includes(minute) ||
    options.disabledSeconds?.(hour, minute).includes(second) ||
    options.disabledMilliseconds?.(hour, minute, second).includes(millisecond)
  )
    return false
  return onGrid(total, options, lower, upper) && !options.disabledTime?.(value)
}

/** Search hierarchical time buckets nearest first, pruning bounds, unit exclusions and distant buckets before visiting milliseconds. */
export function nearestTime(
  base: TimeParts,
  options: TimeConstraints,
  fixed: Partial<Record<0 | 1 | 2, number[]>> = {},
) {
  const target = timeMilliseconds(base),
    { lower, upper } = bounds(options)
  const ranges =
    lower <= upper
      ? [[lower, upper]]
      : [
          [0, upper],
          [lower, 86399999],
        ]
  const count = stepMilliseconds(options)
  const gridRanges = (start: number, end: number) =>
    ranges
      .map(([a, b]) => {
        const first = Math.max(a, start),
          last = Math.min(b, end)
        const origin =
          options.stepBaseMilliseconds ??
          (lower > upper && last < lower ? lower - 86400000 : lower)
        return first <= last &&
          (!count ||
            !Number.isInteger(count) ||
            origin + Math.ceil((first - origin) / count) * count <= last)
          ? [first, last]
          : undefined
      })
      .filter((range): range is number[] => Boolean(range))
  const weights = [3600000, 60000, 1000, 1]
  const counts = [
    24,
    60,
    options.precision === 'minute' ? 1 : 60,
    options.precision === 'millisecond' ? 1000 : 1,
  ]
  const steps = [
    unitStep(options.hourStep, 24),
    unitStep(options.minuteStep, 60),
    unitStep(options.secondStep, 60),
    unitStep(options.millisecondStep, 1000),
  ]
  const parts: TimeParts = [0, 0, 0, 0]
  let best: string | undefined,
    closest = Infinity,
    bestTotal = Infinity
  const distanceTo = (start: number, end: number) =>
    target < start ? start - target : target > end ? target - end : 0
  function visit(depth: 0 | 1 | 2 | 3, prefix: number) {
    const excluded = new Set(
      depth === 0
        ? options.disabledHours?.()
        : depth === 1
          ? options.disabledMinutes?.(parts[0])
          : depth === 2
            ? options.disabledSeconds?.(parts[0], parts[1])
            : options.disabledMilliseconds?.(parts[0], parts[1], parts[2]),
    )
    const numbers =
      depth < 3 && fixed[depth as 0 | 1 | 2]
        ? fixed[depth as 0 | 1 | 2]!
        : Array.from(
            { length: Math.ceil(counts[depth] / steps[depth]) },
            (_, index) => index * steps[depth],
          )
    const tail =
      depth === 3
        ? 0
        : weights[depth] -
          (options.precision === 'minute'
            ? 60000
            : options.precision === 'second'
              ? 1000
              : 1)
    const choices = numbers
      .filter(
        (number) =>
          !excluded.has(number) &&
          number % steps[depth] === 0 &&
          (depth !== 3 || onGrid(prefix + number, options, lower, upper)),
      )
      .map((number) => {
        const start = prefix + number * weights[depth],
          end = start + Math.max(0, tail)
        const intersections = gridRanges(start, end)
        const distance = intersections.length
          ? Math.min(...intersections.map(([a, b]) => distanceTo(a, b)))
          : Infinity
        return { number, start, distance }
      })
      .sort((a, b) => a.distance - b.distance || a.number - b.number)
    for (const choice of choices) {
      if (choice.distance === Infinity || choice.distance > closest) break
      parts[depth] = choice.number
      if (depth < 3) visit((depth + 1) as 1 | 2 | 3, choice.start)
      else {
        if (!onGrid(choice.start, options, lower, upper)) continue
        const value = timeString(parts, options.precision)
        if (
          !options.disabledTime?.(value) &&
          (choice.distance < closest || choice.start < bestTotal)
        ) {
          best = value
          closest = choice.distance
          bestTotal = choice.start
        }
      }
    }
  }
  visit(0, 0)
  return best
}

/** Changing an upper unit preserves lower fields, otherwise completes the closest available time. */
export function timeUnitValue(
  base: TimeParts,
  unit: TimeUnit,
  value: number,
  options: TimeConstraints,
) {
  const target: TimeParts = [...base]
  if (unit === 'meridiem') target[0] = (target[0] % 12) + value * 12
  else
    target[
      unit === 'hour' ? 0 : unit === 'minute' ? 1 : unit === 'second' ? 2 : 3
    ] = value
  if (options.precision === 'minute') target[2] = 0
  if (options.precision !== 'millisecond') target[3] = 0
  const direct = timeString(target, options.precision)
  if (timeSelectable(direct, options)) return direct
  if (
    unit === 'millisecond' ||
    (unit === 'second' && options.precision !== 'millisecond')
  )
    return undefined
  const fixed: Partial<Record<0 | 1 | 2, number[]>> = {
    0:
      unit === 'meridiem'
        ? Array.from({ length: 12 }, (_, index) => index + value * 12)
        : [target[0]],
  }
  if (unit === 'minute' || unit === 'second') fixed[1] = [target[1]]
  if (unit === 'second') fixed[2] = [target[2]]
  return nearestTime(target, options, fixed)
}
