import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { Icon } from './icon'
import { revealPickerTarget } from './picker-popup'
import {
  addDays,
  addMonths,
  calendarDate,
  parseDate,
  parseMonth,
  sameMonth,
  toISO,
  toMonth,
} from './date-picker-state'

export type CalendarPart =
  | 'root'
  | 'header'
  | 'heading'
  | 'navigation'
  | 'gridContainer'
  | 'grid'
  | 'cell'
  | 'day'

export type CalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> & {
  value?: string
  defaultValue?: string
  onChange?: (date: string) => void
  month?: string
  defaultMonth?: string
  onMonthChange?: (month: string) => void
  minDate?: string
  maxDate?: string
  disabledDate?: (date: string) => boolean
  weekStartsOn?: 0 | 1
  showOutsideDays?: boolean
  renderDate?: (date: string) => ReactNode
  getDateDescription?: (date: string) => string | undefined
  locale?: string
  label?: string
  size?: 'default' | 'small'
  disabled?: boolean
  invalid?: boolean
  classNames?: Partial<Record<CalendarPart, string>>
  range?: [start: string, end: string]
  previewRange?: [start: string, end: string]
  onDateHover?: (date?: string) => void
  onDateFocus?: (date: string) => void
}

type Day = { date: Date; iso: string; inMonth: boolean }

function monthDays(month: Date, weekStartsOn: 0 | 1): Day[] {
  const offset =
    (calendarDate(month.getFullYear(), month.getMonth(), 1).getDay() -
      weekStartsOn +
      7) %
    7
  const first = calendarDate(month.getFullYear(), month.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(first, index)
    return { date, iso: toISO(date), inMonth: sameMonth(date, month) }
  })
}

/** A project-owned month calendar with roving keyboard focus and ISO values. */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue,
      onChange,
      month,
      defaultMonth,
      onMonthChange,
      minDate,
      maxDate,
      disabledDate,
      weekStartsOn = 1,
      showOutsideDays = true,
      renderDate,
      getDateDescription,
      locale,
      label = '日历',
      size,
      disabled = false,
      invalid = false,
      className,
      classNames,
      range,
      previewRange,
      onDateHover,
      onDateFocus,
      'aria-label': ariaLabel,
      'aria-invalid': ariaInvalid,
      ...props
    } = allProps
    const { componentSize, locale: configLocale, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const resolvedLocale = locale ?? configLocale ?? 'zh-CN'
    const today = new Date()
    const todayISO = toISO(today)
    const initialSelected = parseDate(defaultValue)
    const selectedDate = controlled ? parseDate(value) : initialSelected
    const [internalValue, setInternalValue] = useState(defaultValue)
    const selectedISO = controlled ? value : internalValue
    const initialMonth =
      parseMonth(month) ??
      parseMonth(defaultMonth) ??
      parseDate(value) ??
      initialSelected ??
      today
    const [internalMonth, setInternalMonth] = useState(toMonth(initialMonth))
    const visibleMonth = parseMonth(month ?? internalMonth) ?? today
    const visibleMonthKey = toMonth(visibleMonth)
    const [activeDate, setActiveDate] = useState(
      selectedDate ? toISO(selectedDate) : todayISO,
    )
    const pendingFocusRef = useRef<string | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const ownedFocus = useRef(false)
    const dayRefs = useRef(new Map<string, HTMLButtonElement>())
    const min = parseDate(minDate)
    const max = parseDate(maxDate)
    const minISO = min ? toISO(min) : undefined
    const maxISO = max ? toISO(max) : undefined
    const days = monthDays(visibleMonth, weekStartsOn)
    const visibleDays = showOutsideDays
      ? days
      : days.filter((day) => day.inMonth)
    const isUnavailable = (date: string) =>
      disabled ||
      !parseDate(date) ||
      (minISO !== undefined && date < minISO) ||
      (maxISO !== undefined && date > maxISO) ||
      Boolean(disabledDate?.(date))
    const activeKey = visibleDays.some(
      (day) => day.iso === activeDate && !isUnavailable(day.iso),
    )
      ? activeDate
      : (visibleDays.find((day) => day.inMonth && !isUnavailable(day.iso))
          ?.iso ?? visibleDays.find((day) => !isUnavailable(day.iso))?.iso)
    const dateLabel = new Intl.DateTimeFormat(resolvedLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
    const monthLabel = new Intl.DateTimeFormat(resolvedLocale, {
      year: 'numeric',
      month: 'long',
    }).format(visibleMonth)
    const weekdayLabel = new Intl.DateTimeFormat(resolvedLocale, {
      weekday: 'short',
    })
    const weekdayNames = Array.from({ length: 7 }, (_, index) =>
      weekdayLabel.format(addDays(new Date(2024, 0, 7), index + weekStartsOn)),
    )
    const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true'

    function reveal(button: HTMLButtonElement) {
      revealPickerTarget(button)
    }
    useLayoutEffect(() => {
      const target = pendingFocusRef.current
      if (!target || target.slice(0, 7) !== visibleMonthKey) return
      const button = dayRefs.current.get(target)
      if (!button || button.disabled) return
      pendingFocusRef.current = null
      if (ownedFocus.current) reveal(button)
    }, [visibleMonthKey])
    useLayoutEffect(() => {
      const current = document.activeElement
      if (
        ownedFocus.current &&
        !pendingFocusRef.current &&
        activeKey &&
        (current === document.body ||
          (rootRef.current?.contains(current) &&
            current?.hasAttribute('data-calendar-date') &&
            current.getAttribute('data-calendar-date') !== activeKey))
      ) {
        const button = dayRefs.current.get(activeKey)
        if (button) reveal(button)
      }
    })
    useEffect(() => {
      const outside = (event: PointerEvent) => {
        if (
          event.target instanceof Node &&
          !rootRef.current?.contains(event.target)
        )
          ownedFocus.current = false
      }
      document.addEventListener('pointerdown', outside, true)
      return () => document.removeEventListener('pointerdown', outside, true)
    }, [])

    function changeMonth(nextMonth: Date) {
      const next = toMonth(nextMonth)
      if (month === undefined) setInternalMonth(next)
      onMonthChange?.(next)
    }

    function focusDay(date: Date) {
      const iso = toISO(date)
      setActiveDate(iso)
      if (!sameMonth(date, visibleMonth)) {
        pendingFocusRef.current = iso
        changeMonth(calendarDate(date.getFullYear(), date.getMonth(), 1))
      } else {
        const button = dayRefs.current.get(iso)
        if (button) reveal(button)
      }
    }

    function findEnabled(start: Date, step: number) {
      let date = start
      for (let attempt = 0; attempt < 366; attempt += 1) {
        const iso = toISO(date)
        if (minISO && iso < minISO && step < 0) return undefined
        if (maxISO && iso > maxISO && step > 0) return undefined
        if (!isUnavailable(iso)) return date
        date = addDays(date, step)
      }
      return undefined
    }

    function handleDayKeyDown(
      event: KeyboardEvent<HTMLButtonElement>,
      date: Date,
    ) {
      const key = event.key
      let target: Date | undefined
      let step = 1
      if (key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'))
        target = addDays(date, 1)
      else if (key === (direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft')) {
        target = addDays(date, -1)
        step = -1
      } else if (key === 'ArrowDown') target = addDays(date, 7)
      else if (key === 'ArrowUp') {
        target = addDays(date, -7)
        step = -1
      } else if (key === 'Home') {
        target = addDays(date, -((date.getDay() - weekStartsOn + 7) % 7))
      } else if (key === 'End') {
        target = addDays(date, 6 - ((date.getDay() - weekStartsOn + 7) % 7))
        step = -1
      } else if (key === 'PageUp' || key === 'PageDown') {
        const direction = key === 'PageUp' ? -1 : 1
        const nextMonth = addMonths(date, direction * (event.shiftKey ? 12 : 1))
        const lastDay = calendarDate(
          nextMonth.getFullYear(),
          nextMonth.getMonth() + 1,
          0,
        ).getDate()
        target = calendarDate(
          nextMonth.getFullYear(),
          nextMonth.getMonth(),
          Math.min(date.getDate(), lastDay),
        )
        step = direction
      } else return
      event.preventDefault()
      const enabled = findEnabled(target, step)
      if (enabled) focusDay(enabled)
    }

    function selectDay(date: string) {
      if (isUnavailable(date)) return
      if (!controlled) setInternalValue(date)
      setActiveDate(date)
      const selected = parseDate(date)!
      if (!sameMonth(selected, visibleMonth)) changeMonth(selected)
      onChange?.(date)
    }

    const previousMonth = addMonths(visibleMonth, -1)
    const nextMonth = addMonths(visibleMonth, 1)
    const canGoPrevious =
      !disabled && (!min || toMonth(previousMonth) >= toMonth(min))
    const canGoNext = !disabled && (!max || toMonth(nextMonth) <= toMonth(max))
    const canGoToday =
      !disabled &&
      (!min || toMonth(today) >= toMonth(min)) &&
      (!max || toMonth(today) <= toMonth(max))

    return (
      <div
        {...props}
        ref={(element) => {
          rootRef.current = element
          if (typeof ref === 'function') ref(element)
          else if (ref) ref.current = element
        }}
        dir={props.dir ?? direction}
        onFocusCapture={(event) => {
          ownedFocus.current = true
          props.onFocusCapture?.(event)
        }}
        onBlurCapture={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            ownedFocus.current = false
          props.onBlurCapture?.(event)
        }}
        aria-invalid={isInvalid || undefined}
        onMouseLeave={(event) => {
          onDateHover?.()
          props.onMouseLeave?.(event)
        }}
        className={cn(
          'w-full min-w-0 rounded-[var(--ui-card-radius)] border border-border bg-card p-3 text-card-foreground',
          resolvedSize === 'default' && 'sm:p-4',
          isInvalid && 'border-destructive',
          className,
          classNames?.root,
        )}
      >
        <div
          className={cn(
            'mb-3 flex flex-wrap items-center justify-between gap-2',
            classNames?.header,
          )}
        >
          <div className={classNames?.heading}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold" aria-live="polite">
              {monthLabel}
            </p>
          </div>
          <div
            className={cn(
              'flex flex-wrap items-center gap-2',
              classNames?.navigation,
            )}
          >
            <button
              type="button"
              tabIndex={0}
              aria-label="上个月"
              disabled={!canGoPrevious}
              className="inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-input text-base hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => changeMonth(previousMonth)}
            >
              <Icon
                name={direction === 'rtl' ? 'arrowRight' : 'arrowLeft'}
                size={16}
              />
            </button>
            <button
              type="button"
              tabIndex={0}
              aria-label="今天"
              disabled={!canGoToday}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-input px-3 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                changeMonth(
                  calendarDate(today.getFullYear(), today.getMonth(), 1),
                )
                setActiveDate(todayISO)
              }}
            >
              今天
            </button>
            <button
              type="button"
              tabIndex={0}
              aria-label="下个月"
              disabled={!canGoNext}
              className="inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-input text-base hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => changeMonth(nextMonth)}
            >
              <Icon
                name={direction === 'rtl' ? 'arrowLeft' : 'arrowRight'}
                size={16}
              />
            </button>
          </div>
        </div>
        <div
          data-calendar-scroll
          className={cn(
            'max-w-full overflow-x-auto',
            classNames?.gridContainer,
          )}
        >
          <table
            role="grid"
            aria-multiselectable={range ? true : undefined}
            aria-label={ariaLabel ?? `${label}，${monthLabel}`}
            className={cn(
              'w-full min-w-[336px] table-fixed border-separate border-spacing-0',
              classNames?.grid,
            )}
          >
            <thead>
              <tr role="row">
                {weekdayNames.map((name, index) => (
                  <th
                    key={index}
                    role="columnheader"
                    scope="col"
                    className="h-9 text-center text-xs font-medium text-muted-foreground"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week} role="row">
                  {days.slice(week * 7, week * 7 + 7).map((day) => {
                    const unavailable = isUnavailable(day.iso)
                    const hidden = !showOutsideDays && !day.inMonth
                    const edge =
                      range && (day.iso === range[0] || day.iso === range[1])
                    const inRange = Boolean(
                      range?.[0] &&
                      range?.[1] &&
                      day.iso >= range[0] &&
                      day.iso <= range[1],
                    )
                    const inPreview = Boolean(
                      previewRange?.[0] &&
                      previewRange?.[1] &&
                      day.iso >= previewRange[0] &&
                      day.iso <= previewRange[1],
                    )
                    const selected = range
                      ? Boolean(edge || inRange)
                      : day.iso === selectedISO
                    const rangePart =
                      range && day.iso === range[0] && day.iso === range[1]
                        ? 'single'
                        : range && day.iso === range[0]
                          ? 'start'
                          : range && day.iso === range[1]
                            ? 'end'
                            : inRange
                              ? 'inside'
                              : undefined
                    const rangeDescription =
                      rangePart === 'start'
                        ? '范围开始'
                        : rangePart === 'end'
                          ? '范围结束'
                          : rangePart === 'single'
                            ? '范围开始和结束'
                            : rangePart === 'inside'
                              ? '范围内'
                              : undefined
                    const description = getDateDescription?.(day.iso)
                    return (
                      <td
                        key={day.iso}
                        role="gridcell"
                        aria-selected={selected}
                        className={cn(
                          'p-0.5 text-center align-top',
                          classNames?.cell,
                        )}
                      >
                        {!hidden && (
                          <button
                            ref={(node) => {
                              if (node) dayRefs.current.set(day.iso, node)
                              else dayRefs.current.delete(day.iso)
                            }}
                            type="button"
                            data-calendar-date={day.iso}
                            data-calendar-range={rangePart}
                            data-calendar-preview={
                              inPreview && !edge ? '' : undefined
                            }
                            aria-label={[
                              dateLabel.format(day.date),
                              rangeDescription,
                              description,
                            ]
                              .filter(Boolean)
                              .join('，')}
                            aria-current={
                              day.iso === todayISO ? 'date' : undefined
                            }
                            disabled={unavailable}
                            tabIndex={day.iso === activeKey ? 0 : -1}
                            className={cn(
                              'flex min-h-11 w-full min-w-11 touch-manipulation flex-col items-center justify-center rounded-[var(--ui-field-radius)] border border-transparent px-1 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45',
                              !day.inMonth && 'text-muted-foreground',
                              day.iso === todayISO &&
                                !selected &&
                                'border-primary',
                              (range ? edge : selected) &&
                                'bg-primary text-primary-foreground',
                              inRange &&
                                !edge &&
                                'rounded-none bg-accent text-accent-foreground',
                              inPreview &&
                                !edge &&
                                'border-primary border-dashed bg-accent text-accent-foreground',
                              !selected &&
                                !unavailable &&
                                'hover:bg-accent hover:text-accent-foreground',
                              classNames?.day,
                            )}
                            onFocus={() => {
                              setActiveDate(day.iso)
                              onDateFocus?.(day.iso)
                            }}
                            onMouseEnter={() => onDateHover?.(day.iso)}
                            onKeyDown={(event) =>
                              handleDayKeyDown(event, day.date)
                            }
                            onClick={() => selectDay(day.iso)}
                          >
                            <span>{day.date.getDate()}</span>
                            {renderDate?.(day.iso)}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  },
)
