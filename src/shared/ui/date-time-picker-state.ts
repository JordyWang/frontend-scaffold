import { parseDate } from './date-picker-state'
import {
  parseTime,
  timeDisplay,
  timeInput,
  timeSeconds,
  timeSelectable,
  timeString,
  unitStep,
  type TimeConstraints,
  type TimePrecision,
} from './time-picker-state'

export type DateTimeConstraints = Omit<
  TimeConstraints,
  | 'min'
  | 'max'
  | 'disabledHours'
  | 'disabledMinutes'
  | 'disabledSeconds'
  | 'disabledTime'
> & {
  min?: string
  max?: string
  disabledDate?: (date: string) => boolean
  disabledHours?: (date: string) => number[]
  disabledMinutes?: (hour: number, date: string) => number[]
  disabledSeconds?: (hour: number, minute: number, date: string) => number[]
  disabledTime?: (value: string) => boolean
}
export function parseDateTime(value?: string, precision?: TimePrecision) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value))
    return undefined
  const date = value.slice(0, 10),
    time = value.slice(11)
  if (
    !parseDate(date) ||
    !parseTime(time) ||
    (precision && time.length !== (precision === 'second' ? 8 : 5))
  )
    return undefined
  return { date, time }
}
/** Civil calendar arithmetic measures local fields without converting a user value to UTC. */
export function dateTimeSeconds(value: string) {
  const parts = parseDateTime(value)!
  const [year, month, day] = parts.date.split('-').map(Number)
  const ordinal = new Date(0)
  ordinal.setUTCFullYear(year, month - 1, day)
  ordinal.setUTCHours(0, 0, 0, 0)
  return ordinal.getTime() / 1000 + timeSeconds(parseTime(parts.time)!)
}
export function dateTimeDisplay(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const parts = parseDateTime(value)
  return parts
    ? parts.date + ' ' + timeDisplay(parts.time, precision, use12Hours)
    : value
}
export function dateTimeInput(
  value: string,
  precision: TimePrecision,
  use12Hours = false,
) {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](.+)$/.exec(value)
  const time = match ? timeInput(match[2], precision, use12Hours) : undefined
  return match && parseDate(match[1]) && time
    ? match[1] + 'T' + time
    : undefined
}
export function dateTimeDateSelectable(
  date: string,
  options: DateTimeConstraints,
) {
  const min = parseDateTime(options.min),
    max = parseDateTime(options.max)
  return (
    Boolean(parseDate(date)) &&
    (!min || date >= min.date) &&
    (!max || date <= max.date) &&
    !(
      min &&
      max &&
      dateTimeSeconds(options.min!) > dateTimeSeconds(options.max!)
    ) &&
    !options.disabledDate?.(date)
  )
}
export function dateTimeTimeConstraints(
  date: string,
  options: DateTimeConstraints,
): TimeConstraints {
  const min = parseDateTime(options.min),
    max = parseDateTime(options.max)
  const dateAvailable = dateTimeDateSelectable(date, options)
  const lower = min ? dateTimeSeconds(options.min!) : undefined
  const upper = max ? dateTimeSeconds(options.max!) : undefined
  const count = Number(
    options.step ?? (options.precision === 'minute' ? 60 : 1),
  )
  const base = lower ?? 0
  return {
    precision: options.precision,
    min: min?.date === date ? min.time : undefined,
    max: max?.date === date ? max.time : undefined,
    hourStep: options.hourStep,
    minuteStep: options.minuteStep,
    secondStep: options.secondStep,
    step: 'any',
    disabledHours: options.disabledHours
      ? () => options.disabledHours!(date)
      : undefined,
    disabledMinutes: options.disabledMinutes
      ? (hour) => options.disabledMinutes!(hour, date)
      : undefined,
    disabledSeconds: options.disabledSeconds
      ? (hour, minute) => options.disabledSeconds!(hour, minute, date)
      : undefined,
    disabledTime: (time) => {
      if (!dateAvailable) return true
      const value = date + 'T' + time
      const total = dateTimeSeconds(value)
      if (
        (lower !== undefined && total < lower) ||
        (upper !== undefined && total > upper)
      )
        return true
      const quotient = (total - base) / count
      if (
        options.step !== 'any' &&
        Number.isFinite(count) &&
        count > 0 &&
        Math.abs(quotient - Math.round(quotient)) > 1e-8
      )
        return true
      return Boolean(options.disabledTime?.(value))
    },
  }
}
export function dateTimeSelectable(
  value: string,
  options: DateTimeConstraints,
) {
  const parts = parseDateTime(value, options.precision)
  return Boolean(
    parts &&
    dateTimeDateSelectable(parts.date, options) &&
    timeSelectable(parts.time, dateTimeTimeConstraints(parts.date, options)),
  )
}
export function dateTimeForDate(
  date: string,
  preferredTime: string | undefined,
  options: DateTimeConstraints,
) {
  if (!dateTimeDateSelectable(date, options)) return undefined
  const constraints = dateTimeTimeConstraints(date, options)
  const base = parseTime(preferredTime) ?? [0, 0, 0]
  if (options.precision === 'minute') base[2] = 0
  const direct = timeString(base, options.precision)
  if (timeSelectable(direct, constraints)) return date + 'T' + direct
  let best: string | undefined,
    closest = Infinity
  for (let hour = 0; hour < 24; hour += unitStep(options.hourStep, 24)) {
    if (options.disabledHours?.(date).includes(hour)) continue
    for (
      let minute = 0;
      minute < 60;
      minute += unitStep(options.minuteStep, 60)
    ) {
      if (options.disabledMinutes?.(hour, date).includes(minute)) continue
      for (
        let second = 0;
        second < (options.precision === 'second' ? 60 : 1);
        second += unitStep(options.secondStep, 60)
      ) {
        const distance = Math.abs(
          timeSeconds([hour, minute, second]) - timeSeconds(base),
        )
        if (distance >= closest) continue
        const time = timeString([hour, minute, second], options.precision)
        if (timeSelectable(time, constraints)) {
          best = date + 'T' + time
          closest = distance
        }
      }
    }
  }
  return best
}
