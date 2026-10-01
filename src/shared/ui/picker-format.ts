import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localeData from 'dayjs/plugin/localeData'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import 'dayjs/locale/en-gb'
import 'dayjs/locale/fr'
import 'dayjs/locale/de'
import 'dayjs/locale/es'
import 'dayjs/locale/ja'
import 'dayjs/locale/ko'
import { useMemo, useState } from 'react'
import { useConfig } from './config-context'
import { calendarDate, toISO } from './date-picker-state'
import {
  parsePickerValue,
  toPickerValue,
  type DatePickerUnit,
} from './date-unit-state'
import {
  dateTimeDisplay,
  dateTimeInput,
  parseDateTime,
} from './date-time-picker-state'
import {
  parseTime,
  timeDisplay,
  inferTimePrecision,
  timeFormat,
  timeInput,
  timeLength,
  timeString,
  type TimePrecision,
} from './time-picker-state'

dayjs.extend(utc)
dayjs.extend(advancedFormat)
dayjs.extend(localizedFormat)
dayjs.extend(localeData)

/** Functions receive the project's canonical string, never a library date object. */
export type PickerFormatFunction = (value: string) => string
export type PickerFormat =
  string | PickerFormatFunction | readonly (string | PickerFormatFunction)[]
export type PickerParseInfo = {
  kind: 'date' | 'time' | 'dateTime'
  picker: DatePickerUnit
  precision: TimePrecision
  locale: string
}
export type PickerParseInput = (
  text: string,
  info: PickerParseInfo,
) => string | undefined
export type PickerFormatProps = {
  format?: PickerFormat
  /** Used before string formats; must return a valid canonical value. */
  parseInput?: PickerParseInput
}
type Options = PickerFormatProps & {
  kind: PickerParseInfo['kind']
  picker?: DatePickerUnit
  precision?: TimePrecision
  use12Hours?: boolean
  locale?: string
  native?: boolean
}
const defaults: Record<DatePickerUnit, string> = {
  date: 'YYYY-MM-DD',
  week: 'GGGG-[W]WW',
  month: 'YYYY-MM',
  quarter: 'YYYY-[Q]Q',
  year: 'YYYY',
}
const tokens =
  /\[[^\]]*\]|GGGG|gggg|YYYY|MMMM|dddd|MMM|ddd|SSS|SS|YY|MM|DD|Do|dd|HH|hh|kk|mm|ss|WW|ww|wo|M|D|d|Q|H|h|k|m|s|S|W|w|A|a|ZZ|Z|zzz|z|X|x/g
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const list = (format?: PickerFormat) =>
  Array.isArray(format)
    ? format
    : format === undefined
      ? []
      : [format as string | PickerFormatFunction]
function resolveLocale(locale?: string) {
  const requested = (locale ?? 'en').toLowerCase().replace(/_/g, '-')
  const exact = dayjs().locale(requested).locale()
  return exact === requested
    ? exact
    : dayjs().locale(requested.split('-')[0]).locale()
}
function expanded(pattern: string, locale: string) {
  const data = dayjs().locale(locale).localeData()
  return pattern.replace(/\[[^\]]*\]|LTS?|l{1,4}|L{1,4}/g, (token) => {
    if (token.startsWith('[')) return token
    const localFormats = dayjs.Ls[locale].formats as Record<
      string,
      string | undefined
    >
    if (localFormats[token]) return localFormats[token]!
    const full = data.longDateFormat(token.toUpperCase())
    return token === token.toUpperCase()
      ? full
      : full.replace(/MMMM|MM|DD|dddd/g, (part) => part.slice(1))
  })
}
type Piece = { literal: string } | { token: string }
function pieces(pattern: string, locale: string): Piece[] {
  const source = expanded(pattern, locale),
    result: Piece[] = []
  let position = 0
  for (const match of source.matchAll(tokens)) {
    if (match.index! > position)
      result.push({ literal: source.slice(position, match.index) })
    const token = match[0]
    result.push(
      token.startsWith('[') ? { literal: token.slice(1, -1) } : { token },
    )
    position = match.index! + token.length
  }
  if (position < source.length) result.push({ literal: source.slice(position) })
  return result
}
function stamp(value: string, info: PickerParseInfo) {
  const dateValue =
    info.kind === 'date'
      ? parsePickerValue(value, info.picker)
      : info.kind === 'dateTime'
        ? parsePickerValue(value.slice(0, 10), 'date')
        : calendarDate(2000, 0, 1)
  const time =
    info.kind === 'date'
      ? [0, 0, 0, 0]
      : parseTime(info.kind === 'time' ? value : value.slice(11))
  if (!dateValue || !time) return undefined
  // Synthetic UTC fields preserve civil dates, early years and DST-gap wall times.
  const date = new Date(0)
  date.setUTCFullYear(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
  )
  date.setUTCHours(time[0], time[1], time[2], time[3] ?? 0)
  return dayjs.utc(date).locale(info.locale)
}
function weekOrdinal(week: number, locale: string) {
  const ordinal = dayjs.Ls[locale].ordinal as
    ((value: number, period?: string) => string | number) | undefined
  return String(ordinal?.(week, 'W') ?? week).replace(/[[\]]/g, '')
}
function tokenText(token: string, date: dayjs.Dayjs, info: PickerParseInfo) {
  const isWeek = info.kind === 'date' && info.picker === 'week'
  if (
    ['GGGG', 'gggg', 'W', 'WW', 'w', 'ww', 'wo'].includes(token) ||
    (isWeek && ['YYYY', 'YY'].includes(token))
  ) {
    const value = toPickerValue(
      calendarDate(date.year(), date.month(), date.date()),
      'week',
    )
    const year = value.slice(0, 4),
      week = Number(value.slice(6))
    if (token === 'wo') return weekOrdinal(week, info.locale)
    if (token === 'W' || token === 'w') return String(week)
    if (token === 'WW' || token === 'ww') return String(week).padStart(2, '0')
    return token === 'YY' ? year.slice(-2) : year
  }
  if (token === 'S' || token === 'SS')
    return String(date.millisecond()).padStart(3, '0').slice(0, token.length)
  // Values have no timezone or timestamp identity. Such formats require a function.
  if (['Z', 'ZZ', 'z', 'zzz', 'X', 'x'].includes(token)) return token
  return date.format(token)
}
function formatted(value: string, parts: Piece[], info: PickerParseInfo) {
  const date = stamp(value, info)
  return date
    ? parts
        .map((part) =>
          'literal' in part ? part.literal : tokenText(part.token, date, info),
        )
        .join('')
    : value
}
const twoDigits = new Set([
  'MM',
  'DD',
  'HH',
  'hh',
  'kk',
  'mm',
  'ss',
  'WW',
  'ww',
  'YY',
])
function parsePattern(
  text: string,
  parts: Piece[],
  info: PickerParseInfo,
): string | undefined {
  const fields: { token: string; value: string }[] = []
  const base = dayjs.utc('2000-01-02').locale(info.locale)
  const choices = (token: string) => {
    if (token === 'MMM' || token === 'MMMM')
      return Array.from({ length: 12 }, (_, index) =>
        base.month(index).format(token),
      )
    if (['dd', 'ddd', 'dddd'].includes(token))
      return Array.from({ length: 7 }, (_, index) =>
        base.day(index).format(token),
      )
    if (token === 'A' || token === 'a')
      return [
        ...new Set(
          Array.from({ length: 48 }, (_, index) =>
            base
              .hour(Math.floor(index / 2))
              .minute((index % 2) * 30)
              .format(token),
          ),
        ),
      ]
    if (token === 'Do')
      return Array.from({ length: 31 }, (_, index) =>
        base.date(index + 1).format(token),
      )
    if (token === 'wo')
      return Array.from({ length: 53 }, (_, index) =>
        weekOrdinal(index + 1, info.locale),
      )
    return undefined
  }
  const source = parts
    .map((part) => {
      if ('literal' in part) return escape(part.literal)
      fields.push({ token: part.token, value: '' })
      const names = choices(part.token)
      if (names)
        return (
          '(' +
          names
            .sort((a, b) => b.length - a.length)
            .map(escape)
            .join('|') +
          ')'
        )
      if (['Z', 'ZZ', 'z', 'zzz', 'X', 'x'].includes(part.token)) return '(?!)'
      return (
        '(\\d{' +
        (['YYYY', 'GGGG', 'gggg'].includes(part.token)
          ? '4'
          : part.token.startsWith('S')
            ? part.token.length
            : twoDigits.has(part.token)
              ? '2'
              : '1,2') +
        '})'
      )
    })
    .join('')
  const match = new RegExp('^' + source + '$', 'i').exec(text.trim())
  if (!match) return undefined
  fields.forEach((field, index) => {
    field.value = match[index + 1]
  })
  const field = (...names: string[]) =>
    fields.find((item) => names.includes(item.token))
  const number = (...names: string[]) => {
    const result = field(...names)
    return result ? Number(result.value) : undefined
  }
  const same = (left: string, right: string) =>
    left.toLocaleLowerCase() === right.toLocaleLowerCase()
  let year = number('YYYY', 'GGGG', 'gggg')
  const shortYear = number('YY')
  if (year === undefined && shortYear !== undefined)
    year = shortYear + (shortYear > 68 ? 1900 : 2000)
  let month = number('M', 'MM'),
    day = number('D', 'DD')
  const monthName = field('MMM', 'MMMM'),
    ordinal = field('Do')
  if (monthName)
    month =
      choices(monthName.token)!.findIndex((name) =>
        same(name, monthName.value),
      ) + 1
  if (ordinal)
    day = choices('Do')!.findIndex((name) => same(name, ordinal.value)) + 1
  let dateValue = ''
  if (info.kind !== 'time') {
    if (year === undefined || year < 1 || year > 9999) return undefined
    const prefix = String(year).padStart(4, '0')
    if (info.kind === 'date' && info.picker === 'week') {
      let week = number('W', 'WW', 'w', 'ww')
      const weekOrdinal = field('wo')
      if (weekOrdinal)
        week =
          choices('wo')!.findIndex((name) => same(name, weekOrdinal.value)) + 1
      if (week === undefined) return undefined
      dateValue = prefix + '-W' + String(week).padStart(2, '0')
    } else {
      if (info.kind === 'date' && info.picker === 'quarter') {
        const quarter = number('Q')
        if (quarter === undefined || quarter < 1 || quarter > 4)
          return undefined
        month = (quarter - 1) * 3 + 1
      }
      if (info.kind === 'date' && info.picker === 'year') month ??= 1
      if (info.kind === 'date' && info.picker !== 'date') day ??= 1
      if (month === undefined || day === undefined) return undefined
      const raw =
        prefix +
        '-' +
        String(month).padStart(2, '0') +
        '-' +
        String(day).padStart(2, '0')
      const parsed = parsePickerValue(raw, 'date')
      if (!parsed) return undefined
      dateValue =
        info.kind === 'date'
          ? toPickerValue(parsed, info.picker)
          : toISO(parsed)
    }
    if (info.kind === 'date')
      return parsePickerValue(dateValue, info.picker) &&
        same(formatted(dateValue, parts, info), text.trim())
        ? dateValue
        : undefined
  }
  let hour = number('H', 'HH')
  const minute = number('m', 'mm'),
    second = number('s', 'ss') ?? 0
  const fractional = field('S', 'SS', 'SSS'),
    millisecond = fractional ? Number(fractional.value.padEnd(3, '0')) : 0
  const twelve = number('h', 'hh'),
    midnight = number('k', 'kk'),
    meridiem = field('A', 'a')
  if (midnight !== undefined) {
    if (midnight < 1 || midnight > 24) return undefined
    hour = midnight % 24
  }
  if (twelve !== undefined) {
    if (twelve < 1 || twelve > 12 || !meridiem || minute === undefined)
      return undefined
    hour = [twelve % 12, (twelve % 12) + 12].find((candidate) =>
      same(
        base.hour(candidate).minute(minute!).format(meridiem.token),
        meridiem.value,
      ),
    )
  }
  if (
    hour === undefined ||
    minute === undefined ||
    (info.precision === 'minute' && (second || millisecond)) ||
    (info.precision === 'second' && millisecond)
  )
    return undefined
  const raw = timeString([hour, minute, second, millisecond], info.precision)
  if (!parseTime(raw)) return undefined
  const value = info.kind === 'time' ? raw : dateValue + 'T' + raw
  return same(formatted(value, parts, info), text.trim()) ? value : undefined
}
export function createPickerFormat(options: Options) {
  const {
    kind,
    picker = 'date',
    precision = 'minute',
    use12Hours = false,
  } = options
  const info: PickerParseInfo = {
    kind,
    picker,
    precision,
    locale: resolveLocale(options.locale),
  }
  const formats = options.native ? [] : list(options.format)
  const prepared = formats.map((format) =>
    typeof format === 'string' ? pieces(format, info.locale) : format,
  )
  const valid = (value: string) =>
    kind === 'date'
      ? Boolean(parsePickerValue(value, picker))
      : kind === 'time'
        ? Boolean(parseTime(value)) && value.length === timeLength(precision)
        : Boolean(parseDateTime(value, precision))
  const fallback = (value: string) =>
    kind === 'date'
      ? value
      : kind === 'time'
        ? timeDisplay(value, precision, use12Hours)
        : dateTimeDisplay(value, precision, use12Hours)
  return {
    hint:
      typeof formats[0] === 'string'
        ? formats[0]
        : kind === 'date'
          ? picker === 'week'
            ? 'YYYY-Www'
            : picker === 'quarter'
              ? 'YYYY-Qn'
              : defaults[picker]
          : (kind === 'dateTime' ? 'YYYY-MM-DD ' : '') +
            timeFormat(precision, use12Hours),
    display(value: string) {
      if (!value) return ''
      const first = prepared[0]
      return typeof first === 'function'
        ? first(value)
        : first
          ? formatted(value, first, info)
          : fallback(value)
    },
    parse(text: string): string | undefined {
      if (!text.trim()) return ''
      const custom = !options.native
        ? options.parseInput?.(text, info)
        : undefined
      if (custom !== undefined && valid(custom)) return custom
      for (const format of prepared) {
        if (typeof format !== 'function') {
          const value = parsePattern(text, format, info)
          if (value !== undefined && valid(value)) return value
        }
      }
      if (prepared.some((format) => typeof format !== 'function'))
        return undefined
      const value =
        kind === 'date'
          ? text.trim()
          : kind === 'time'
            ? timeInput(text.trim(), precision, use12Hours)
            : dateTimeInput(text.trim(), precision, use12Hours)
      return value !== undefined && valid(value) ? value : undefined
    },
  }
}
/** Stable equivalent arrays avoid discarding an edit on unrelated parent renders. */
export function usePickerFormat(options: Options) {
  const { locale: configuredLocale } = useConfig()
  const [previous, setPrevious] = useState(() => list(options.format))
  const next = list(options.format)
  if (
    next.length !== previous.length ||
    next.some((value, index) => value !== previous[index])
  )
    setPrevious(next)
  const stableFormat =
    next.length === previous.length &&
    next.every((value, index) => value === previous[index])
      ? previous
      : next
  const {
    kind,
    picker,
    precision,
    use12Hours,
    native,
    parseInput,
    locale = configuredLocale,
  } = options
  return useMemo(
    () =>
      createPickerFormat({
        kind,
        picker,
        precision,
        use12Hours,
        native,
        parseInput,
        locale,
        format: stableFormat,
      }),
    [
      kind,
      picker,
      precision,
      use12Hours,
      native,
      parseInput,
      locale,
      stableFormat,
    ],
  )
}
export function inferFormattedTimePrecision(
  format: PickerFormat | undefined,
  fallback: TimePrecision,
  locale?: string,
): TimePrecision {
  const units = list(format).flatMap((item) =>
    typeof item === 'string'
      ? pieces(item, resolveLocale(locale)).flatMap((part) =>
          'token' in part ? [part.token] : [],
        )
      : [],
  )
  if (fallback === 'millisecond' || units.some((unit) => /^S+$/.test(unit)))
    return 'millisecond'
  return fallback === 'second' ||
    units.some((unit) => unit === 's' || unit === 'ss')
    ? 'second'
    : 'minute'
}
export function formatUses12Hours(format?: PickerFormat, locale?: string) {
  const first = list(format)[0]
  return (
    typeof first === 'string' &&
    pieces(first, resolveLocale(locale)).some(
      (part) => 'token' in part && (part.token === 'h' || part.token === 'hh'),
    )
  )
}

/** Format sets an empty field's initial precision; later constraints can still raise it. */
export function usePickerTimePrecision(
  options: {
    precision?: TimePrecision
    format?: PickerFormat
    step?: number | string
    locale?: string
    mode?: 'popup' | 'panel' | 'native'
  },
  values: (string | undefined)[],
  hasSelection: boolean,
) {
  const [emptyPrecision, setEmptyPrecision] = useState(() =>
    inferFormattedTimePrecision(
      options.mode === 'native' ? undefined : options.format,
      'minute',
      options.locale,
    ),
  )
  const base = inferTimePrecision(values, options.step)
  const inferred =
    base === 'millisecond' || emptyPrecision === 'millisecond'
      ? 'millisecond'
      : base === 'second' || emptyPrecision === 'second'
        ? 'second'
        : 'minute'
  if (
    !hasSelection &&
    options.precision === undefined &&
    emptyPrecision !== inferred
  )
    setEmptyPrecision(inferred)
  return options.precision ?? (hasSelection ? base : inferred)
}
