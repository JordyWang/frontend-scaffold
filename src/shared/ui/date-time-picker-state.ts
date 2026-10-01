import { parseDate } from './date-picker-state'
import {
  parseTime,
  timeDisplay,
  timeInput,
  timeMilliseconds,
  timeLength,
  nativeTimeInput,
  nearestTime,
  timeSelectable,
  timeString,
  type TimeConstraints,
  type TimePrecision,
  type TimeParts,
} from './time-picker-state'

export type DateTimeConstraints = Omit<
  TimeConstraints,
  | 'min'
  | 'max'
  | 'disabledHours'
  | 'disabledMinutes'
  | 'disabledSeconds'
  | 'disabledTime'
  | 'disabledMilliseconds'
  | 'stepBaseMilliseconds'
> & {
  min?: string
  max?: string
  /** Internal range bounds can narrow availability while retaining the original step grid. */
  stepBase?: string
  disabledDate?: (date: string) => boolean
  disabledHours?: (date: string) => number[]
  disabledMinutes?: (hour: number, date: string) => number[]
  disabledSeconds?: (hour: number, minute: number, date: string) => number[]
  disabledMilliseconds?: (
    hour: number,
    minute: number,
    second: number,
    date: string,
  ) => number[]
  disabledTime?: (value: string) => boolean
}
export function parseDateTime(value?: string, precision?: TimePrecision) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined
  const date = value.slice(0, 10),
    time = value.slice(11)
  if (
    !parseDate(date) ||
    !parseTime(time) ||
    (precision && time.length !== timeLength(precision))
  )
    return undefined
  return { date, time }
}
/** Civil calendar arithmetic measures local fields without converting a user value to UTC. */
export function dateTimeMilliseconds(value: string) {
  const parts = parseDateTime(value)!
  const [year, month, day] = parts.date.split('-').map(Number)
  const ordinal = new Date(0)
  ordinal.setUTCFullYear(year, month - 1, day)
  ordinal.setUTCHours(0, 0, 0, 0)
  return ordinal.getTime() + timeMilliseconds(parseTime(parts.time)!)
}
export const dateTimeSeconds = (value: string) =>
  dateTimeMilliseconds(value) / 1000
export function nativeDateTimeInput(value: string, precision: TimePrecision) {
  if (value[10] !== 'T') return undefined
  const date = value.slice(0, 10),
    raw = value.slice(11)
  const time = raw && nativeTimeInput(raw, precision)
  return parseDate(date) && time ? date + 'T' + time : undefined
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
      dateTimeMilliseconds(options.min!) > dateTimeMilliseconds(options.max!)
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
  const lower = min ? dateTimeMilliseconds(options.min!) : undefined
  const base = parseDateTime(options.stepBase)
    ? dateTimeMilliseconds(options.stepBase!)
    : (lower ?? 0)
  const midnight = parseDate(date) ? dateTimeMilliseconds(date + 'T00:00') : 0
  return {
    precision: options.precision,
    min: min?.date === date ? min.time : undefined,
    max: max?.date === date ? max.time : undefined,
    hourStep: options.hourStep,
    minuteStep: options.minuteStep,
    secondStep: options.secondStep,
    millisecondStep: options.millisecondStep,
    step: options.step,
    stepBaseMilliseconds: base - midnight,
    disabledHours: options.disabledHours
      ? () => options.disabledHours!(date)
      : undefined,
    disabledMinutes: options.disabledMinutes
      ? (hour) => options.disabledMinutes!(hour, date)
      : undefined,
    disabledSeconds: options.disabledSeconds
      ? (hour, minute) => options.disabledSeconds!(hour, minute, date)
      : undefined,
    disabledMilliseconds: options.disabledMilliseconds
      ? (hour, minute, second) =>
          options.disabledMilliseconds!(hour, minute, second, date)
      : undefined,
    disabledTime: (time) =>
      !dateAvailable || Boolean(options.disabledTime?.(date + 'T' + time)),
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
  const base: TimeParts = parseTime(preferredTime) ?? [0, 0, 0, 0]
  if (options.precision === 'minute') base[2] = 0
  if (options.precision !== 'millisecond') base[3] = 0
  const direct = timeString(base, options.precision)
  if (timeSelectable(direct, constraints)) return date + 'T' + direct
  const time = nearestTime(base, constraints)
  return time ? date + 'T' + time : undefined
}
