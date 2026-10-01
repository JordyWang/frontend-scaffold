import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Calendar, type CalendarProps } from './calendar'
import { useConfig } from './config-context'
import {
  addDays,
  addMonths,
  calendarDate,
  parseMonth,
  toMonth,
} from './date-picker-state'
import {
  movePickerValue,
  parsePickerValue,
  pickerSpan,
  pickerValueMonth,
  toPickerValue,
  type DatePeriodUnit,
  type DatePickerUnit,
} from './date-unit-state'
import { Icon } from './icon'
import { revealPickerTarget } from './picker-popup'

type PanelProps = Pick<
  CalendarProps,
  | 'label'
  | 'value'
  | 'selectedDates'
  | 'month'
  | 'onMonthChange'
  | 'onChange'
  | 'minDate'
  | 'maxDate'
  | 'disabledDate'
  | 'disabled'
  | 'weekStartsOn'
  | 'locale'
  | 'renderDate'
  | 'getDateDescription'
  | 'classNames'
> & { picker: DatePickerUnit }
type View = DatePeriodUnit | 'decade'
type Cell = { value: string; date: Date; end: Date; text: string }

export const DatePickerPanel = forwardRef<HTMLDivElement, PanelProps>(
  function DatePickerPanel({ picker, ...props }, ref) {
    return picker === 'date' ? (
      <Calendar {...props} ref={ref} />
    ) : (
      <PeriodPanel
        {...props}
        classNames={{
          ...props.classNames,
          grid: cn(props.classNames?.grid, 'min-w-0'),
        }}
        picker={picker}
        ref={ref}
      />
    )
  },
)

const PeriodPanel = forwardRef<
  HTMLDivElement,
  Omit<PanelProps, 'picker'> & { picker: DatePeriodUnit }
>(function PeriodPanel(
  {
    picker,
    label = '日期',
    value = '',
    selectedDates,
    month,
    onMonthChange,
    onChange,
    minDate,
    maxDate,
    disabledDate,
    disabled = false,
    locale,
    renderDate,
    getDateDescription,
    classNames,
  },
  ref,
) {
  const config = useConfig()
  const resolvedLocale = locale ?? config.locale ?? 'zh-CN'
  const visible = parseMonth(month) ?? new Date()
  const year = visible.getFullYear()
  const [view, setView] = useState<View>(picker)
  const [cursor, setCursor] = useState(value)
  const rootRef = useRef<HTMLDivElement>(null)
  const owned = useRef(false)
  const pendingFocus = useRef<string | undefined>(undefined)
  const cellsRef = useRef(new Map<string, HTMLButtonElement>())
  const lower = pickerSpan(minDate ?? '', picker)?.[0] ?? calendarDate(1, 0, 1)
  const upper =
    pickerSpan(maxDate ?? '', picker)?.[1] ?? calendarDate(9999, 11, 31)
  const firstYear = (target: number) => calendarDate(target, 0, 1)
  const endYear = (target: number) => calendarDate(target, 11, 31)
  const decade = Math.floor(year / 10) * 10
  const century = Math.floor(year / 100) * 100
  const monthLabel = new Intl.DateTimeFormat(resolvedLocale, {
    year: 'numeric',
    month: 'long',
  })
  const shortMonth = new Intl.DateTimeFormat(resolvedLocale, { month: 'short' })
  const weekdayLabel = new Intl.DateTimeFormat(resolvedLocale, {
    weekday: 'short',
  })
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    weekdayLabel.format(calendarDate(2024, 0, 1 + index)),
  )
  let cells: Cell[]
  if (view === 'week') {
    const first = addDays(visible, -((visible.getDay() + 6) % 7))
    cells = Array.from({ length: 6 }, (_, index) => {
      const date = addDays(first, index * 7)
      return {
        value: toPickerValue(date, 'week'),
        date,
        end: addDays(date, 6),
        text: toPickerValue(date, 'week'),
      }
    })
  } else if (view === 'month' || view === 'quarter') {
    cells = Array.from({ length: view === 'month' ? 12 : 4 }, (_, index) => {
      const date = calendarDate(year, index * (view === 'quarter' ? 3 : 1), 1)
      const key = toPickerValue(date, view)
      return {
        value: key,
        date,
        end: pickerSpan(key, view)![1],
        text: view === 'month' ? shortMonth.format(date) : 'Q' + (index + 1),
      }
    })
  } else {
    cells = Array.from({ length: 12 }, (_, index) => {
      const start =
        (view === 'year' ? decade - 1 : century - 10) +
        index * (view === 'year' ? 1 : 10)
      const end = start + (view === 'decade' ? 9 : 0)
      const usableStart = view === 'decade' && start === 0 ? 1 : start
      return {
        value: String(usableStart).padStart(4, '0'),
        date: firstYear(usableStart),
        end: endYear(end),
        text:
          start > 9999 || end < 1
            ? '—'
            : view === 'decade'
              ? usableStart + '–' + end
              : String(start).padStart(4, '0'),
      }
    })
  }
  const final = view === picker
  const columns = view === 'week' ? 1 : view === 'quarter' ? 2 : 3
  const unavailable = (cell: Cell) =>
    disabled ||
    cell.date.getFullYear() > 9999 ||
    cell.end.getFullYear() < 1 ||
    cell.end < lower ||
    cell.date > upper ||
    (final &&
      (!parsePickerValue(cell.value, picker) ||
        Boolean(disabledDate?.(cell.value))))
  const available = cells.filter((cell) => !unavailable(cell))
  const drillKey =
    view === 'decade'
      ? String(Math.max(1, decade)).padStart(4, '0')
      : view === 'year'
        ? toPickerValue(visible, 'year')
        : view === 'month'
          ? toMonth(visible)
          : ''
  const active =
    available.find((cell) => cell.value === cursor)?.value ??
    available.find((cell) =>
      final
        ? (selectedDates ?? [value]).includes(cell.value)
        : cell.value === drillKey,
    )?.value ??
    available[0]?.value
  const title =
    view === 'week'
      ? monthLabel.format(visible)
      : view === 'month' || view === 'quarter'
        ? String(year).padStart(4, '0') + '年'
        : view === 'year'
          ? Math.max(1, decade) + '–' + Math.min(9999, decade + 9)
          : Math.max(1, century) + '–' + Math.min(9999, century + 99)
  const span =
    view === 'week'
      ? 1
      : view === 'month' || view === 'quarter'
        ? 12
        : view === 'year'
          ? 120
          : 1200
  function pageAvailable(target: Date, targetView: View = view) {
    if (target.getFullYear() < 1 || target.getFullYear() > 9999) return false
    const startYear =
      targetView === 'year'
        ? Math.floor(target.getFullYear() / 10) * 10
        : targetView === 'decade'
          ? Math.floor(target.getFullYear() / 100) * 100
          : target.getFullYear()
    const start =
      targetView === 'week' ? target : firstYear(Math.max(1, startYear))
    const end =
      targetView === 'week'
        ? calendarDate(target.getFullYear(), target.getMonth() + 1, 0)
        : endYear(
            Math.min(
              9999,
              startYear +
                (targetView === 'year' ? 9 : targetView === 'decade' ? 99 : 0),
            ),
          )
    return end >= lower && start <= upper
  }
  function changeMonth(next: Date) {
    const key = toMonth(next)
    if (key !== month) onMonthChange?.(key)
  }
  function reveal(key: string) {
    pendingFocus.current = key
    owned.current = true
    setCursor(key)
    const button = cellsRef.current.get(key)
    if (button && !button.disabled) {
      pendingFocus.current = undefined
      revealPickerTarget(button)
    }
  }
  function browse(count: number) {
    const next = addMonths(visible, count * span)
    if (!disabled && pageAvailable(next)) {
      pendingFocus.current = undefined
      changeMonth(next)
    }
  }
  function select(cell: Cell) {
    if (unavailable(cell)) return
    if (final) onChange?.(cell.value)
    else {
      changeMonth(
        calendarDate(
          Math.max(1, cell.date.getFullYear()),
          cell.date.getMonth(),
          1,
        ),
      )
      setView(
        view === 'decade'
          ? 'year'
          : view === 'year' && picker === 'week'
            ? 'month'
            : picker,
      )
      pendingFocus.current = ''
      owned.current = true
    }
  }
  function targetCell(key: string): Cell | undefined {
    const unit = view === 'decade' ? 'year' : view
    const date = parsePickerValue(key, unit)
    if (!date) return undefined
    const end =
      view === 'decade'
        ? endYear(Math.min(9999, Math.floor(date.getFullYear() / 10) * 10 + 9))
        : pickerSpan(key, unit)![1]
    return { value: key, date, end, text: key }
  }
  function move(cell: Cell, count: number) {
    const unit = view === 'decade' ? 'year' : view
    function moveKey(key: string, amount: number) {
      if (view !== 'decade') return movePickerValue(key, unit, amount)
      const next = Math.floor(Number(key) / 10) * 10 + amount * 10
      return next < 0 || next > 9999
        ? undefined
        : String(Math.max(1, next)).padStart(4, '0')
    }
    let next = moveKey(cell.value, count)
    for (let attempt = 0; next && attempt < 600; attempt++) {
      const candidate = targetCell(next)
      if (
        !candidate ||
        (count < 0 && candidate.end < lower) ||
        (count > 0 && candidate.date > upper)
      )
        return
      if (!unavailable(candidate)) {
        if (!cells.some((item) => item.value === next)) {
          const key = pickerValueMonth(next, unit)!
          changeMonth(parseMonth(key)!)
        }
        reveal(next)
        return
      }
      next = moveKey(next, count < 0 ? -1 : 1)
    }
  }
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, cell: Cell) {
    const horizontal = config.direction === 'rtl' ? -1 : 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(cell, (event.key === 'ArrowLeft' ? -1 : 1) * horizontal)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(cell, (event.key === 'ArrowUp' ? -1 : 1) * columns)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const row = Math.floor(cells.indexOf(cell) / columns)
      const options = event.ctrlKey
        ? available
        : cells
            .slice(row * columns, (row + 1) * columns)
            .filter((item) => !unavailable(item))
      const target = event.key === 'Home' ? options[0] : options.at(-1)
      if (target) reveal(target.value)
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const sign = event.key === 'PageUp' ? -1 : 1
      if (view === 'week') {
        const next = addMonths(cell.date, sign * (event.shiftKey ? 12 : 1))
        const key = toPickerValue(next, 'week')
        const target = targetCell(key)
        if (target && !unavailable(target)) {
          changeMonth(next)
          reveal(key)
        }
      } else
        move(
          cell,
          sign *
            (view === 'month'
              ? 12
              : view === 'quarter'
                ? 4
                : view === 'year'
                  ? 10
                  : 10),
        )
    }
  }
  useLayoutEffect(() => {
    const focused = document.activeElement
    const desired = pendingFocus.current || active
    const target = desired ? cellsRef.current.get(desired) : undefined
    if (!owned.current || disabled) return
    if (
      target &&
      !target.disabled &&
      (pendingFocus.current !== undefined ||
        focused === document.body ||
        (rootRef.current?.contains(focused) &&
          focused?.hasAttribute('data-picker-value') &&
          focused.getAttribute('data-picker-value') !== active))
    ) {
      pendingFocus.current = undefined
      revealPickerTarget(target)
    } else if (
      !target &&
      (focused === document.body ||
        (focused instanceof HTMLButtonElement &&
          focused.disabled &&
          rootRef.current?.contains(focused)))
    ) {
      const header = rootRef.current?.querySelector<HTMLButtonElement>(
        'button:not(:disabled)',
      )
      header?.focus({ preventScroll: true })
    }
  })
  const headerClass =
    'inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-border px-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <div
      ref={(element) => {
        rootRef.current = element
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      }}
      dir={config.direction}
      data-picker-unit={picker}
      className={cn('min-w-0 space-y-2', classNames?.root)}
      onFocusCapture={() => {
        owned.current = true
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !rootRef.current?.contains(event.relatedTarget)
        )
          owned.current = false
      }}
    >
      <div
        className={cn('flex min-w-0 items-center gap-1', classNames?.header)}
      >
        <button
          type="button"
          tabIndex={0}
          aria-label="上一页"
          className={headerClass}
          disabled={disabled || !pageAvailable(addMonths(visible, -span))}
          onClick={() => browse(-1)}
        >
          <Icon
            name={config.direction === 'rtl' ? 'arrowRight' : 'arrowLeft'}
            size={16}
          />
        </button>
        <button
          type="button"
          tabIndex={0}
          aria-label={view === 'decade' ? title : '浏览' + title}
          className={cn(
            headerClass,
            'min-w-0 flex-1 border-transparent text-base font-semibold',
          )}
          disabled={disabled || view === 'decade'}
          onClick={() => {
            setView(
              view === 'week' ? 'month' : view === 'year' ? 'decade' : 'year',
            )
            pendingFocus.current = ''
            owned.current = true
          }}
        >
          {title}
        </button>
        <button
          type="button"
          tabIndex={0}
          aria-label="下一页"
          className={headerClass}
          disabled={disabled || !pageAvailable(addMonths(visible, span))}
          onClick={() => browse(1)}
        >
          <Icon
            name={config.direction === 'rtl' ? 'arrowLeft' : 'arrowRight'}
            size={16}
          />
        </button>
      </div>
      <span className="sr-only" role="status">
        {title}
      </span>
      {view === 'week' && (
        <div
          aria-hidden="true"
          className="grid grid-cols-8 gap-1 px-1 text-center text-xs text-muted-foreground"
        >
          <span>周</span>
          {weekdays.map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>
      )}
      <div
        role="grid"
        aria-label={label + '，' + title}
        aria-multiselectable={final && selectedDates ? true : undefined}
        className={cn('min-w-0 space-y-1', classNames?.grid)}
        data-picker-scroll
      >
        {Array.from({ length: Math.ceil(cells.length / columns) }, (_, row) => (
          <div
            key={row}
            role="row"
            className={cn(
              'grid gap-1',
              columns === 1
                ? 'grid-cols-1'
                : columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3',
            )}
          >
            {cells.slice(row * columns, (row + 1) * columns).map((cell) => {
              const selected =
                final && (selectedDates ?? [value]).includes(cell.value)
              const blocked = unavailable(cell)
              const readable =
                view === 'week'
                  ? cell.value +
                    '，' +
                    toPickerValue(cell.date, 'date') +
                    '至' +
                    toPickerValue(cell.end, 'date')
                  : view === 'month'
                    ? monthLabel.format(cell.date)
                    : cell.text
              return (
                <div
                  key={cell.value}
                  role="gridcell"
                  aria-selected={final ? selected : undefined}
                  aria-disabled={blocked || undefined}
                  className={classNames?.cell}
                >
                  <button
                    ref={(element) => {
                      if (element) cellsRef.current.set(cell.value, element)
                      else cellsRef.current.delete(cell.value)
                    }}
                    type="button"
                    data-picker-value={cell.value}
                    tabIndex={cell.value === active ? 0 : -1}
                    disabled={blocked}
                    aria-label={[
                      readable,
                      selected ? '已选择' : undefined,
                      final ? getDateDescription?.(cell.value) : undefined,
                    ]
                      .filter(Boolean)
                      .join('，')}
                    className={cn(
                      'flex min-h-11 w-full min-w-0 touch-manipulation items-center justify-center gap-1 rounded-[var(--ui-field-radius)] px-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40',
                      selected
                        ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-accent',
                      view !== 'week' && 'min-h-16 flex-col',
                    )}
                    onFocus={() => setCursor(cell.value)}
                    onKeyDown={(event) => handleKey(event, cell)}
                    onClick={() => select(cell)}
                  >
                    {view === 'week' ? (
                      <span
                        className="grid w-full grid-cols-8 gap-1"
                        aria-hidden="true"
                      >
                        <span className="font-semibold">
                          {Number(cell.value.slice(-2))}
                        </span>
                        {Array.from({ length: 7 }, (_, day) => {
                          const date = addDays(cell.date, day)
                          return (
                            <span
                              key={day}
                              className={cn(
                                date.getMonth() !== visible.getMonth() &&
                                  !selected &&
                                  'text-muted-foreground',
                              )}
                            >
                              {date.getDate()}
                            </span>
                          )
                        })}
                      </span>
                    ) : (
                      <span>{cell.text}</span>
                    )}
                    {final && renderDate?.(cell.value)}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
        {available.length === 0 && (
          <p role="status" className="py-2 text-sm text-muted-foreground">
            当前面板没有可选项
          </p>
        )}
      </div>
      <button
        type="button"
        tabIndex={0}
        className={cn(headerClass, 'w-full')}
        disabled={disabled || !pageAvailable(new Date(), picker)}
        onClick={() => {
          const today = toPickerValue(new Date(), picker)
          changeMonth(parseMonth(pickerValueMonth(today, picker)!)!)
          setView(picker)
          reveal(today)
        }}
      >
        浏览当前
        {picker === 'week'
          ? '周'
          : picker === 'month'
            ? '月份'
            : picker === 'quarter'
              ? '季度'
              : '年份'}
      </button>
    </div>
  )
})
