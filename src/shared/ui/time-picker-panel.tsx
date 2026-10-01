import {
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { revealPickerTarget } from './picker-popup'
import {
  parseTime,
  timeUnitValue,
  unitStep,
  type TimeConstraints,
  type TimeUnit,
} from './time-picker-state'

type TimePanelProps = {
  value: string
  defaultOpenValue?: string
  label: string
  constraints: TimeConstraints
  onChange: (value: string) => void
  disabled?: boolean
  use12Hours?: boolean
  hideDisabledOptions?: boolean
  renderCell?: (value: number, unit: TimeUnit) => ReactNode
  getCellDescription?: (value: number, unit: TimeUnit) => string | undefined
  classNames?: Partial<Record<'columns' | 'column' | 'option', string>>
}
const names: Record<TimeUnit, string> = {
  hour: '小时',
  minute: '分钟',
  second: '秒',
  meridiem: '时段',
}
type Choice = { number: number; next?: string; text: string }

export const TimePickerPanel = forwardRef<HTMLDivElement, TimePanelProps>(
  function TimePickerPanel(
    {
      value,
      defaultOpenValue,
      label,
      constraints,
      onChange,
      disabled,
      use12Hours,
      hideDisabledOptions,
      renderCell,
      getCellDescription,
      classNames,
    },
    ref,
  ) {
    const { direction } = useConfig()
    const rootRef = useRef<HTMLDivElement>(null)
    const refs = useRef(new Map<string, HTMLButtonElement>())
    const owned = useRef(false),
      pending = useRef<string | undefined>(undefined)
    const [cursor, setCursor] = useState<Partial<Record<TimeUnit, number>>>({})
    const selected = parseTime(value)
    const columns = useMemo(() => {
      const base = parseTime(value) ??
        parseTime(defaultOpenValue) ??
        parseTime(constraints.min) ?? [0, 0, 0]
      const units: TimeUnit[] = [
        'hour',
        'minute',
        ...(constraints.precision === 'second' ? ['second' as const] : []),
        ...(use12Hours ? ['meridiem' as const] : []),
      ]
      return units.map((unit) => {
        const count =
          unit === 'hour'
            ? use12Hours
              ? 12
              : 24
            : unit === 'meridiem'
              ? 2
              : 60
        const step = unitStep(
          unit === 'hour'
            ? constraints.hourStep
            : unit === 'minute'
              ? constraints.minuteStep
              : unit === 'second'
                ? constraints.secondStep
                : undefined,
          unit === 'hour' ? 24 : count,
        )
        const choices: Choice[] = Array.from({ length: count }, (_, index) => {
          const number =
            unit === 'hour' && use12Hours
              ? ((index + 1) % 12) + (base[0] < 12 ? 0 : 12)
              : index
          const text =
            unit === 'meridiem'
              ? index === 0
                ? '上午 AM'
                : '下午 PM'
              : String(
                  unit === 'hour' && use12Hours ? number % 12 || 12 : number,
                ).padStart(2, '0')
          return {
            number,
            text,
            next: disabled
              ? undefined
              : timeUnitValue(base, unit, number, constraints),
          }
        }).filter(
          (choice) =>
            (unit === 'meridiem' || choice.number % step === 0) &&
            (!hideDisabledOptions || choice.next !== undefined),
        )
        return { unit, choices }
      })
    }, [
      value,
      defaultOpenValue,
      constraints,
      disabled,
      use12Hours,
      hideDisabledOptions,
    ])
    const selectedNumber = (unit: TimeUnit) =>
      !selected
        ? undefined
        : unit === 'hour'
          ? selected[0]
          : unit === 'minute'
            ? selected[1]
            : unit === 'second'
              ? selected[2]
              : selected[0] < 12
                ? 0
                : 1
    const activeNumber = (unit: TimeUnit, choices: Choice[]) =>
      choices.find((choice) => choice.next && choice.number === cursor[unit])
        ?.number ??
      choices.find(
        (choice) => choice.next && choice.number === selectedNumber(unit),
      )?.number ??
      choices.find((choice) => choice.next)?.number
    function focus(unit: TimeUnit, number: number) {
      const key = unit + ':' + number
      setCursor((previous) => ({ ...previous, [unit]: number }))
      pending.current = key
      owned.current = true
      const target = refs.current.get(key)
      if (target && !target.disabled) {
        pending.current = undefined
        revealPickerTarget(target)
      }
    }
    function handleKey(
      event: KeyboardEvent<HTMLButtonElement>,
      unit: TimeUnit,
      number: number,
    ) {
      const column = columns.find((column) => column.unit === unit)!
      const available = column.choices.filter((choice) => choice.next)
      const index = available.findIndex((choice) => choice.number === number)
      let position: number | undefined
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
        position = index + (event.key === 'ArrowUp' ? -1 : 1)
      else if (event.key === 'Home' || event.key === 'End')
        position = event.key === 'Home' ? 0 : available.length - 1
      else if (event.key === 'PageUp' || event.key === 'PageDown')
        position = index + (event.key === 'PageUp' ? -5 : 5)
      if (position !== undefined) {
        event.preventDefault()
        const next =
          available[Math.max(0, Math.min(available.length - 1, position))]
        if (next) focus(unit, next.number)
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const sign =
          (event.key === 'ArrowLeft' ? -1 : 1) * (direction === 'rtl' ? -1 : 1)
        for (
          let index = columns.indexOf(column) + sign;
          index >= 0 && index < columns.length;
          index += sign
        ) {
          const next = columns[index],
            number = activeNumber(next.unit, next.choices)
          if (number !== undefined) {
            focus(next.unit, number)
            break
          }
        }
      }
    }
    useLayoutEffect(() => {
      const parts = parseTime(value)
      for (const { unit } of columns) {
        const number = !parts
          ? undefined
          : unit === 'hour'
            ? parts[0]
            : unit === 'minute'
              ? parts[1]
              : unit === 'second'
                ? parts[2]
                : parts[0] < 12
                  ? 0
                  : 1
        const button =
          number === undefined
            ? undefined
            : refs.current.get(unit + ':' + number)
        const scroll = button?.parentElement
        if (button && scroll) {
          const bounds = button.getBoundingClientRect(),
            box = scroll.getBoundingClientRect()
          if (bounds.top < box.top) scroll.scrollTop -= box.top - bounds.top
          else if (bounds.bottom > box.bottom)
            scroll.scrollTop += bounds.bottom - box.bottom
        }
      }
    }, [value, columns])
    useLayoutEffect(() => {
      const focused = document.activeElement
      const target = pending.current
        ? refs.current.get(pending.current)
        : undefined
      if (owned.current && target && !target.disabled) {
        pending.current = undefined
        revealPickerTarget(target)
      } else if (
        owned.current &&
        !disabled &&
        (focused === document.body ||
          (focused instanceof HTMLButtonElement &&
            focused.disabled &&
            rootRef.current?.contains(focused)))
      ) {
        const column =
          columns.find(
            ({ unit }) =>
              unit ===
              (focused instanceof HTMLElement
                ? focused.dataset.timeUnit
                : undefined),
          ) ??
          columns.find(({ choices }) => choices.some((choice) => choice.next))
        if (column) {
          const number = activeNumber(column.unit, column.choices)
          if (number !== undefined) focus(column.unit, number)
          else
            rootRef.current?.parentElement
              ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
              ?.focus({ preventScroll: true })
        } else
          rootRef.current?.parentElement
            ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
            ?.focus({ preventScroll: true })
      }
    })
    return (
      <div
        ref={(element) => {
          rootRef.current = element
          if (typeof ref === 'function') ref(element)
          else if (ref) ref.current = element
        }}
        dir={direction}
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
        className={cn('flex min-w-0 gap-2', classNames?.columns)}
      >
        {columns.map(({ unit, choices }) => (
          <div key={unit} className="min-w-0 flex-1 space-y-1">
            <span
              aria-hidden="true"
              className="block text-center text-xs text-muted-foreground"
            >
              {names[unit]}
            </span>
            <div
              role="listbox"
              aria-label={label + names[unit]}
              data-picker-scroll
              className={cn(
                'h-56 min-w-11 overflow-y-auto overscroll-contain rounded-[var(--ui-field-radius)] border border-border p-1',
                classNames?.column,
              )}
            >
              {choices.map((choice) => (
                <button
                  key={choice.number}
                  ref={(element) => {
                    const key = unit + ':' + choice.number
                    if (element) refs.current.set(key, element)
                    else refs.current.delete(key)
                  }}
                  type="button"
                  role="option"
                  data-time-unit={unit}
                  data-time-value={choice.number}
                  disabled={choice.next === undefined}
                  tabIndex={
                    choice.number === activeNumber(unit, choices) ? 0 : -1
                  }
                  aria-selected={selectedNumber(unit) === choice.number}
                  aria-label={[
                    choice.text + (unit === 'meridiem' ? '' : names[unit]),
                    getCellDescription?.(choice.number, unit),
                  ]
                    .filter(Boolean)
                    .join('，')}
                  className={cn(
                    'flex min-h-11 w-full min-w-11 touch-manipulation flex-col items-center justify-center rounded-[var(--ui-field-radius)] px-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40',
                    selectedNumber(unit) === choice.number
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'hover:bg-accent',
                    classNames?.option,
                  )}
                  onFocus={() =>
                    setCursor((previous) => ({
                      ...previous,
                      [unit]: choice.number,
                    }))
                  }
                  onKeyDown={(event) => handleKey(event, unit, choice.number)}
                  onClick={() => {
                    if (choice.next) onChange(choice.next)
                  }}
                >
                  <span>{choice.text}</span>
                  {renderCell?.(choice.number, unit)}
                </button>
              ))}
              {!choices.some((choice) => choice.next) && (
                <p
                  role="status"
                  className="py-2 text-center text-xs text-muted-foreground"
                >
                  无可选{names[unit]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  },
)
