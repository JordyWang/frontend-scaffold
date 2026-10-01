import {
  addDays,
  calendarDate,
  dateStepMatches,
  parseDate,
  parseMonth,
  toISO,
  toMonth,
} from './date-picker-state'

export type DatePickerUnit = 'date' | 'week' | 'month' | 'quarter' | 'year'
export type DatePeriodUnit = Exclude<DatePickerUnit, 'date'>

export const pickerFormats: Record<DatePickerUnit, string> = {
  date: 'YYYY-MM-DD',
  week: 'YYYY-Www',
  month: 'YYYY-MM',
  quarter: 'YYYY-Qn',
  year: 'YYYY',
}

export const pickerUnitNames: Record<DatePickerUnit, string> = {
  date: '日期',
  week: '周',
  month: '月份',
  quarter: '季度',
  year: '年份',
}

function firstISOWeek(year: number) {
  const fourth = calendarDate(year, 0, 4)
  return addDays(fourth, -((fourth.getDay() + 6) % 7))
}

function ordinal(date: Date) {
  const utc = new Date(0)
  utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  utc.setUTCHours(0, 0, 0, 0)
  return utc.getTime() / 86400000
}

/** ISO week identity depends on the Thursday, including across calendar years. */
export function toPickerValue(date: Date, picker: DatePickerUnit) {
  const year = String(date.getFullYear()).padStart(4, '0')
  if (picker === 'date') return toISO(date)
  if (picker === 'month') return toMonth(date)
  if (picker === 'year') return year
  if (picker === 'quarter')
    return year + '-Q' + (Math.floor(date.getMonth() / 3) + 1)
  const thursday = addDays(date, 3 - ((date.getDay() + 6) % 7))
  const weekYear = thursday.getFullYear()
  const week =
    Math.floor((ordinal(thursday) - ordinal(firstISOWeek(weekYear))) / 7) + 1
  return (
    String(weekYear).padStart(4, '0') + '-W' + String(week).padStart(2, '0')
  )
}

/** Returns the first local day of a strictly valid unit, without UTC value conversion. */
export function parsePickerValue(
  value: string | undefined,
  picker: DatePickerUnit,
) {
  if (picker === 'date') return parseDate(value)
  if (picker === 'month') return parseMonth(value)
  if (!value) return undefined
  const match =
    picker === 'week'
      ? /^(\d{4})-W(\d{2})$/.exec(value)
      : picker === 'quarter'
        ? /^(\d{4})-Q([1-4])$/.exec(value)
        : /^(\d{4})$/.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  if (year < 1 || year > 9999) return undefined
  if (picker === 'year') return calendarDate(year, 0, 1)
  if (picker === 'quarter')
    return calendarDate(year, (Number(match[2]) - 1) * 3, 1)
  const week = Number(match[2])
  if (week < 1 || week > 53) return undefined
  const start = addDays(firstISOWeek(year), (week - 1) * 7)
  return toPickerValue(start, 'week') === value ? start : undefined
}

export function pickerValueMonth(
  value: string | undefined,
  picker: DatePickerUnit,
) {
  const date = parsePickerValue(value, picker)
  return date ? toMonth(picker === 'week' ? addDays(date, 3) : date) : undefined
}

export function pickerSpan(value: string, picker: DatePickerUnit) {
  const start = parsePickerValue(value, picker)
  if (!start) return undefined
  const end =
    picker === 'week'
      ? addDays(start, 6)
      : picker === 'month'
        ? calendarDate(start.getFullYear(), start.getMonth() + 1, 0)
        : picker === 'quarter'
          ? calendarDate(start.getFullYear(), start.getMonth() + 3, 0)
          : picker === 'year'
            ? calendarDate(start.getFullYear(), 11, 31)
            : start
  return [start, end] as const
}

export function pickerBoundMonth(
  value: string,
  picker: DatePickerUnit,
  edge: 0 | 1,
) {
  const date = pickerSpan(value, picker)?.[edge]
  if (!date) return edge === 0 ? '0001-01' : '9999-12'
  if (date.getFullYear() < 1) return '0001-01'
  if (date.getFullYear() > 9999) return '9999-12'
  return toMonth(date)
}

export function pickerDefaultBounds(picker: DatePickerUnit) {
  return [
    toPickerValue(calendarDate(1, 0, 1), picker),
    toPickerValue(calendarDate(9999, 11, 31), picker),
  ] as const
}

export function pickerStepMatches(
  value: string,
  picker: DatePickerUnit,
  min?: string,
  step?: number | string,
) {
  if (picker === 'date')
    return dateStepMatches(value, parseDate(min) ? min! : '1970-01-01', step)
  if (step === undefined || step === 'any') return true
  const count = Number(step)
  if (!Number.isFinite(count) || count <= 0) return true
  const date = parsePickerValue(value, picker)
  const base =
    parsePickerValue(min, picker) ??
    parsePickerValue(toPickerValue(calendarDate(1970, 0, 1), picker), picker)!
  if (!date) return false
  const index = (target: Date) =>
    picker === 'week'
      ? ordinal(target) / 7
      : picker === 'month'
        ? target.getFullYear() * 12 + target.getMonth()
        : picker === 'quarter'
          ? target.getFullYear() * 4 + Math.floor(target.getMonth() / 3)
          : target.getFullYear()
  const quotient = (index(date) - index(base)) / count
  return Math.abs(quotient - Math.round(quotient)) < 1e-8
}

export function movePickerValue(
  value: string,
  picker: DatePickerUnit,
  count: number,
) {
  const start = parsePickerValue(value, picker)
  if (!start) return undefined
  const next =
    picker === 'week'
      ? addDays(start, count * 7)
      : picker === 'date'
        ? addDays(start, count)
        : calendarDate(
            start.getFullYear() + (picker === 'year' ? count : 0),
            start.getMonth() +
              (picker === 'month'
                ? count
                : picker === 'quarter'
                  ? count * 3
                  : 0),
            1,
          )
  if (next.getFullYear() < 1 || next.getFullYear() > 9999) return undefined
  const result = toPickerValue(next, picker)
  return parsePickerValue(result, picker) ? result : undefined
}
