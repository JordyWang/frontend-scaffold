import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { DatePickerPanel } from './date-picker-panel'
import {
  dateTimeDateSelectable,
  dateTimeForDate,
  dateTimeTimeConstraints,
  parseDateTime,
  type DateTimeConstraints,
} from './date-time-picker-state'
import { focusDateTimePanel } from './date-time-panel-focus'
import { TimePickerPanel } from './time-picker-panel'
import type { TimeUnit } from './time-picker-state'

type DateTimePanelProps = {
  label: string
  value: string
  range?: [string, string]
  month: string
  onMonthChange: (month: string) => void
  onChange: (value: string, info: { part: 'date' | 'time' }) => void
  onError: (message: string) => void
  constraints: DateTimeConstraints
  disabled?: boolean
  defaultOpenTime?: string
  use12Hours?: boolean
  hideDisabledOptions?: boolean
  changeOnScroll?: boolean
  onPreview?: (value?: string) => void
  weekStartsOn?: 0 | 1
  locale?: string
  renderDate?: (date: string) => ReactNode
  getDateDescription?: (date: string) => string | undefined
  renderCell?: (value: number, unit: TimeUnit) => ReactNode
  getCellDescription?: (value: number, unit: TimeUnit) => string | undefined
  classNames?: Partial<
    Record<
      'switcher' | 'calendar' | 'time' | 'columns' | 'column' | 'option',
      string
    >
  >
}
/** Shared date/time browsing; the owning field manages the draft and submission. */
export const DateTimePickerPanel = forwardRef<
  HTMLDivElement,
  DateTimePanelProps
>(function DateTimePickerPanel(
  {
    label,
    value,
    range,
    month,
    onMonthChange,
    onChange,
    onError,
    constraints,
    disabled,
    defaultOpenTime,
    use12Hours,
    hideDisabledOptions,
    changeOnScroll,
    onPreview,
    weekStartsOn,
    locale,
    renderDate,
    getDateDescription,
    renderCell,
    getCellDescription,
    classNames,
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null),
    requested = useRef(false),
    owned = useRef(false),
    lastPartFocus = useRef<HTMLElement | null>(null)
  const combinedRef = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element
      if (typeof ref === 'function') ref(element)
      else if (ref) ref.current = element
    },
    [ref],
  )
  const [activePart, setActivePart] = useState<'date' | 'time'>('date')
  const parts = parseDateTime(value)
  const previewTime = useCallback(
    (time?: string) =>
      onPreview?.(parts?.date && time ? parts.date + 'T' + time : undefined),
    [onPreview, parts?.date],
  )
  const timeConstraints = useMemo(
    () => dateTimeTimeConstraints(parts?.date ?? '', constraints),
    [parts?.date, constraints],
  )
  useLayoutEffect(() => {
    const focused = document.activeElement
    if (
      requested.current ||
      (!disabled &&
        owned.current &&
        root.current?.contains(focused) &&
        focused instanceof HTMLElement &&
        focused.matches(':disabled'))
    ) {
      requested.current = false
      focusDateTimePanel(root.current)
    }
  })
  useEffect(() => {
    const panel = root.current
    if (!panel || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const focused = document.activeElement
      if (
        (focused instanceof HTMLElement &&
          panel.contains(focused) &&
          !focused.getClientRects().length) ||
        (focused === document.body &&
          owned.current &&
          lastPartFocus.current &&
          !lastPartFocus.current.getClientRects().length)
      )
        focusDateTimePanel(panel)
    })
    observer.observe(panel)
    return () => observer.disconnect()
  })
  return (
    <div
      ref={combinedRef}
      data-datetime-active-part={activePart}
      className="@container min-w-0 space-y-2"
      onFocusCapture={(event) => {
        owned.current = true
        const target = event.target as HTMLElement
        lastPartFocus.current = target.closest('[data-datetime-part]')
          ? target
          : null
      }}
      onBlurCapture={(event) => {
        if (event.relatedTarget && !root.current?.contains(event.relatedTarget))
          owned.current = false
      }}
    >
      <div
        role="group"
        aria-label={label + '面板切换'}
        className={cn('flex gap-2', classNames?.switcher)}
      >
        {(['date', 'time'] as const).map((part) => (
          <Button
            key={part}
            data-datetime-switch={part}
            variant={activePart === part ? 'primary' : 'outline'}
            aria-pressed={activePart === part}
            disabled={disabled}
            onClick={() => {
              onPreview?.()
              setActivePart(part)
              requested.current = true
            }}
          >
            {part === 'date' ? '选择日期' : '调整时间'}
          </Button>
        ))}
      </div>
      <div className="grid min-w-0 gap-3 @min-[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div
          data-datetime-part="date"
          className={cn(
            activePart !== 'date' && 'hidden @min-[640px]:block',
            'min-w-0',
            classNames?.calendar,
          )}
        >
          <DatePickerPanel
            picker="date"
            label={label + '日期'}
            value={parts?.date ?? ''}
            range={range}
            month={month}
            onMonthChange={onMonthChange}
            disabled={disabled}
            minDate={parseDateTime(constraints.min)?.date}
            maxDate={parseDateTime(constraints.max)?.date}
            disabledDate={(date) => !dateTimeDateSelectable(date, constraints)}
            weekStartsOn={weekStartsOn}
            locale={locale}
            renderDate={renderDate}
            getDateDescription={getDateDescription}
            classNames={{ grid: 'min-w-[308px]', cell: 'p-0' }}
            onChange={(date) => {
              const next = dateTimeForDate(
                date,
                parts?.time ?? defaultOpenTime,
                constraints,
              )
              if (next) onChange(next, { part: 'date' })
              else onError('所选日期没有可用时间，请选择其他日期')
            }}
            onPreview={
              onPreview
                ? (date) => {
                    onPreview(
                      date
                        ? dateTimeForDate(
                            date,
                            parts?.time ?? defaultOpenTime,
                            constraints,
                          )
                        : undefined,
                    )
                  }
                : undefined
            }
          />
        </div>
        <div
          data-datetime-part="time"
          className={cn(
            activePart !== 'time' && 'hidden @min-[640px]:block',
            'min-w-0 space-y-2',
            classNames?.time,
          )}
        >
          <p className="text-sm text-muted-foreground">
            {parts?.date ?? '请先选择日期'}
          </p>
          <TimePickerPanel
            label={label}
            value={parts?.time ?? ''}
            defaultOpenValue={defaultOpenTime}
            constraints={timeConstraints}
            disabled={disabled || !parts}
            onChange={(time) => {
              if (parts) onChange(parts.date + 'T' + time, { part: 'time' })
            }}
            use12Hours={use12Hours}
            hideDisabledOptions={hideDisabledOptions}
            changeOnScroll={changeOnScroll}
            onPreview={onPreview ? previewTime : undefined}
            renderCell={renderCell}
            getCellDescription={getCellDescription}
            classNames={classNames}
            onFocusUnavailable={() =>
              root.current
                ?.querySelector<HTMLElement>('[data-datetime-switch="date"]')
                ?.focus({ preventScroll: true })
            }
          />
        </div>
      </div>
    </div>
  )
})
