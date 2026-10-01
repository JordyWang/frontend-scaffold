/** Local calendar dates are kept as ISO strings; no timezone conversion is applied to values. */
export function calendarDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setFullYear(year, month, day)
  date.setHours(12, 0, 0, 0)
  return date
}

export function toISO(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function toMonth(date: Date) {
  return toISO(date).slice(0, 7)
}

export function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31)
    return undefined
  const date = calendarDate(year, month - 1, day)
  return toISO(date) === value ? date : undefined
}

export function parseMonth(value?: string) {
  return value && /^\d{4}-\d{2}$/.test(value)
    ? parseDate(value + '-01')
    : undefined
}

export function addDays(date: Date, count: number) {
  return calendarDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + count,
  )
}

export function addMonths(date: Date, count: number) {
  return calendarDate(date.getFullYear(), date.getMonth() + count, 1)
}

export function sameMonth(left: Date, right: Date) {
  return toMonth(left) === toMonth(right)
}

export function dateStepMatches(
  date: string,
  min: string,
  step?: number | string,
) {
  if (step === undefined || step === 'any') return true
  const count = Number(step)
  if (!Number.isFinite(count) || count <= 0) return true
  const ordinal = (value: string) => {
    const parsed = parseDate(value)!
    const utc = new Date(0)
    utc.setUTCFullYear(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    )
    utc.setUTCHours(0, 0, 0, 0)
    return utc.getTime() / 86400000
  }
  const quotient = (ordinal(date) - ordinal(min)) / count
  return Math.abs(quotient - Math.round(quotient)) < 1e-8
}
