import {
  forwardRef,
  useCallback,
  useEffect,
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
  changeOnScroll?: boolean
  onPreview?: (value?: string) => void
  renderCell?: (value: number, unit: TimeUnit) => ReactNode
  getCellDescription?: (value: number, unit: TimeUnit) => string | undefined
  onFocusUnavailable?: () => void
  classNames?: Partial<Record<'columns' | 'column' | 'option', string>>
}
const names: Record<TimeUnit, string> = {
  hour: '小时',
  minute: '分钟',
  second: '秒',
  millisecond: '毫秒',
  meridiem: '时段',
}
type Choice = { number: number; next?: string; text: string }

function align(button: HTMLElement, scroll: HTMLElement) {
  const box = scroll.getBoundingClientRect(),
    bounds = button.getBoundingClientRect()
  const padding = Number.parseFloat(getComputedStyle(scroll).paddingTop) || 0
  scroll.scrollTop += bounds.top - box.top - scroll.clientTop - padding
}

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
      changeOnScroll = false,
      onPreview,
      renderCell,
      getCellDescription,
      onFocusUnavailable,
      classNames,
    },
    ref,
  ) {
    const { direction } = useConfig()
    const rootRef = useRef<HTMLDivElement>(null)
    const refs = useRef(new Map<string, HTMLButtonElement>())
    const scrollers = useRef(new Map<TimeUnit, HTMLDivElement>())
    const gestures = useRef(
      new Map<
        TimeUnit,
        {
          armed: boolean
          pointer: boolean
          moved: boolean
          timer?: ReturnType<typeof setTimeout>
        }
      >(),
    )
    const previousLayout = useRef('')
    const lastFocusedUnit = useRef<TimeUnit | undefined>(undefined)
    const owned = useRef(false),
      pending = useRef<string | undefined>(undefined)
    const [cursor, setCursor] = useState<Partial<Record<TimeUnit, number>>>({})
    const selected = parseTime(value)
    const columns = useMemo(() => {
      const base = parseTime(value) ??
        parseTime(defaultOpenValue) ??
        parseTime(constraints.min) ?? [0, 0, 0, 0]
      const units: TimeUnit[] = [
        'hour',
        'minute',
        ...(constraints.precision !== 'minute' ? ['second' as const] : []),
        ...(constraints.precision === 'millisecond'
          ? ['millisecond' as const]
          : []),
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
              : unit === 'millisecond'
                ? 1000
                : 60
        const step = unitStep(
          unit === 'hour'
            ? constraints.hourStep
            : unit === 'minute'
              ? constraints.minuteStep
              : unit === 'second'
                ? constraints.secondStep
                : unit === 'millisecond'
                  ? constraints.millisecondStep
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
                ).padStart(unit === 'millisecond' ? 3 : 2, '0')
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
              : unit === 'millisecond'
                ? (selected[3] ?? 0)
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
    const layoutKey = JSON.stringify([
      value,
      defaultOpenValue,
      disabled,
      changeOnScroll,
      columns.map(({ unit, choices }) => [
        unit,
        choices.map(({ number, next }) => [number, next]),
      ]),
    ])
    const latest = useRef({
      columns,
      onChange,
      disabled,
      changeOnScroll,
      value,
    })
    useLayoutEffect(() => {
      latest.current = {
        columns,
        onChange,
        disabled,
        changeOnScroll,
        value,
      }
    })
    function cancelScrolls() {
      for (const gesture of gestures.current.values()) {
        clearTimeout(gesture.timer)
        gesture.timer = undefined
        gesture.armed = false
        gesture.pointer = false
        gesture.moved = false
      }
    }
    function arm(unit: TimeUnit, pointer = false) {
      if (!changeOnScroll || disabled) return
      const gesture = gestures.current.get(unit) ?? {
        armed: false,
        pointer: false,
        moved: false,
      }
      if (!gesture.armed) gesture.moved = false
      gesture.armed = true
      gesture.pointer = pointer
      gestures.current.set(unit, gesture)
    }
    function updateTail(scroll: HTMLElement) {
      const last = scroll.querySelector<HTMLElement>(
        '[data-time-unit]:last-of-type',
      )
      const style = getComputedStyle(scroll)
      scroll.style.setProperty(
        '--ui-time-scroll-tail',
        Math.max(
          0,
          scroll.clientHeight -
            (Number.parseFloat(style.paddingTop) || 0) -
            (Number.parseFloat(style.paddingBottom) || 0) -
            (last?.getBoundingClientRect().height ?? 44),
        ) + 'px',
      )
    }
    const settle = useCallback((unit: TimeUnit) => {
      const gesture = gestures.current.get(unit),
        current = latest.current
      if (
        !gesture?.armed ||
        !gesture.moved ||
        gesture.pointer ||
        current.disabled ||
        !current.changeOnScroll
      )
        return
      clearTimeout(gesture.timer)
      gesture.armed = false
      const scroll = scrollers.current.get(unit)
      if (!scroll?.isConnected || !scroll.getClientRects().length) return
      const anchor =
        scroll.getBoundingClientRect().top +
        scroll.clientTop +
        (Number.parseFloat(getComputedStyle(scroll).paddingTop) || 0)
      let nearest: { choice: Choice; button: HTMLButtonElement } | undefined,
        distance = Infinity
      for (const choice of current.columns.find(
        (column) => column.unit === unit,
      )?.choices ?? []) {
        const button = refs.current.get(unit + ':' + choice.number)
        if (!choice.next || !button || button.disabled) continue
        const delta = Math.abs(button.getBoundingClientRect().top - anchor)
        if (delta < distance) {
          nearest = { choice, button }
          distance = delta
        }
      }
      if (!nearest) return
      align(nearest.button, scroll)
      if (nearest.choice.next !== current.value)
        current.onChange(nearest.choice.next!)
    }, [])
    function scroll(unit: TimeUnit) {
      const gesture = gestures.current.get(unit)
      if (!gesture?.armed) return
      gesture.moved = true
      clearTimeout(gesture.timer)
      gesture.timer = setTimeout(() => settle(unit), 150)
    }
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
      if (previousLayout.current === layoutKey) return
      previousLayout.current = layoutKey
      cancelScrolls()
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
                : unit === 'millisecond'
                  ? (parts[3] ?? 0)
                  : parts[0] < 12
                    ? 0
                    : 1
        const button =
          number === undefined
            ? undefined
            : refs.current.get(unit + ':' + number)
        const scroll = button?.parentElement
        if (button && scroll) {
          if (changeOnScroll) {
            updateTail(scroll)
            align(button, scroll)
            continue
          }
          const bounds = button.getBoundingClientRect(),
            box = scroll.getBoundingClientRect()
          if (bounds.top < box.top) scroll.scrollTop -= box.top - bounds.top
          else if (bounds.bottom > box.bottom)
            scroll.scrollTop += bounds.bottom - box.bottom
        }
      }
    })
    useLayoutEffect(() => {
      const update = () => {
        for (const element of scrollers.current.values()) updateTail(element)
      }
      update()
      if (typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(update)
      for (const element of scrollers.current.values())
        observer.observe(element)
      return () => observer.disconnect()
    }, [changeOnScroll, columns])
    useEffect(() => {
      const release = () => {
        for (const [unit, gesture] of gestures.current) {
          if (!gesture.pointer) continue
          // Native touch scrolling cancels pointer events before inertia.
          gesture.pointer = false
          if (gesture.armed && gesture.moved) {
            clearTimeout(gesture.timer)
            gesture.timer = setTimeout(() => settle(unit), 150)
          }
        }
      }
      const outside = (event: Event) => {
        if (
          event.target instanceof Node &&
          !rootRef.current?.contains(event.target)
        ) {
          cancelScrolls()
          onPreview?.()
        }
      }
      document.addEventListener('pointerdown', outside, true)
      document.addEventListener('focusin', outside, true)
      document.addEventListener('pointerup', release, true)
      document.addEventListener('pointercancel', release, true)
      return () => {
        document.removeEventListener('pointerdown', outside, true)
        document.removeEventListener('focusin', outside, true)
        document.removeEventListener('pointerup', release, true)
        document.removeEventListener('pointercancel', release, true)
        cancelScrolls()
      }
    }, [onPreview, settle])
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
            ({ unit, choices }) =>
              choices.some((choice) => choice.next) &&
              unit ===
                (focused instanceof HTMLElement
                  ? (focused.dataset.timeUnit ?? lastFocusedUnit.current)
                  : lastFocusedUnit.current),
          ) ??
          columns.find(({ choices }) => choices.some((choice) => choice.next))
        if (column) {
          const number = activeNumber(column.unit, column.choices)
          if (number !== undefined) focus(column.unit, number)
          else if (onFocusUnavailable) onFocusUnavailable()
          else
            rootRef.current?.parentElement
              ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
              ?.focus({ preventScroll: true })
        } else if (onFocusUnavailable) onFocusUnavailable()
        else
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
        data-picker-scroll
        onFocusCapture={() => {
          owned.current = true
        }}
        onPointerLeave={() => onPreview?.()}
        onKeyDownCapture={() => {
          cancelScrolls()
          onPreview?.()
        }}
        onBlurCapture={(event) => {
          if (
            event.relatedTarget &&
            !rootRef.current?.contains(event.relatedTarget)
          )
            owned.current = false
        }}
        className={cn(
          'flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain',
          classNames?.columns,
        )}
      >
        {columns.map(({ unit, choices }) => (
          <div key={unit} className="min-w-[54px] flex-1 space-y-1">
            <span
              aria-hidden="true"
              className="block text-center text-xs text-muted-foreground"
            >
              {names[unit]}
            </span>
            <div
              ref={(element) => {
                if (element) scrollers.current.set(unit, element)
                else scrollers.current.delete(unit)
              }}
              role="listbox"
              aria-label={label + names[unit]}
              data-picker-scroll
              data-time-scroll-unit={unit}
              onWheel={() => {
                onPreview?.()
                arm(unit)
              }}
              onPointerDown={() => {
                onPreview?.()
                arm(unit, true)
              }}
              onScroll={() => scroll(unit)}
              onScrollEnd={() => settle(unit)}
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
                  onFocus={() => {
                    lastFocusedUnit.current = unit
                    setCursor((previous) => ({
                      ...previous,
                      [unit]: choice.number,
                    }))
                  }}
                  onKeyDown={(event) => handleKey(event, unit, choice.number)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse' && choice.next)
                      onPreview?.(choice.next)
                  }}
                  onPointerLeave={() => onPreview?.()}
                  onClick={() => {
                    cancelScrolls()
                    onPreview?.()
                    if (choice.next) onChange(choice.next)
                  }}
                >
                  <span>{choice.text}</span>
                  {renderCell?.(choice.number, unit)}
                </button>
              ))}
              {changeOnScroll && (
                <div
                  aria-hidden="true"
                  className="h-[var(--ui-time-scroll-tail,0px)]"
                />
              )}
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
