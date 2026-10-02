import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { useConfig } from './config-context'
import { InputNumber } from './data-input'
import { Slider } from './slider'
import { revealPickerTarget } from './picker-popup'
import {
  gradientToCss,
  insertGradientStop,
  suggestGradientPosition,
  type ColorPickerStop,
} from './color-picker-gradient-state'
import type { ColorPickerPart } from './color-picker-panel'

type Props = {
  stops: ColorPickerStop[]
  value: string
  active: number
  label: string
  disabled: boolean
  classNames?: Partial<Record<ColorPickerPart, string>>
  onSelect: (index: number) => void
  onChange: (stops: ColorPickerStop[], active: number) => void
  onComplete: () => void
  onCancel: () => void
}

/** Reuse Slider coordinates and keyboard semantics; explicit actions keep stop editing usable on H5. */
export function ColorPickerGradientEditor({
  stops,
  value,
  active,
  label,
  disabled,
  classNames,
  onSelect,
  onChange,
  onComplete,
  onCancel,
}: Props) {
  const { direction } = useConfig()
  const root = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<{ value: string; index: number } | null>(null)
  const drag = useRef<{
    pointer: number
    rail: HTMLElement
    stops: ColorPickerStop[]
    index: number
    latest: string
  } | null>(null)
  const endedPointer = useRef<number | null>(null)
  const selected = useRef(active)
  const previous = useRef(value)
  const canRemove = stops.length > 2 && !disabled
  const suggested = suggestGradientPosition(stops)
  useLayoutEffect(() => {
    selected.current = active
    const session = drag.current
    if (
      session &&
      (disabled || (previous.current !== value && value !== session.latest))
    ) {
      drag.current = null
      onCancel()
      if (root.current?.hasPointerCapture?.(session.pointer))
        root.current.releasePointerCapture(session.pointer)
    }
    previous.current = value
    const request = pendingFocus.current
    if (!request || request.value !== value) return
    pendingFocus.current = null
    if (
      document.activeElement === document.body ||
      root.current?.contains(document.activeElement)
    ) {
      const target = root.current?.querySelector<HTMLInputElement>(
        `[data-slider-thumb-index="${request.index}"] input`,
      )
      if (target) revealPickerTarget(target)
    }
  }, [value, active, disabled, onCancel])

  function selectInput(target: HTMLElement) {
    const index = target.closest<HTMLElement>('[data-slider-thumb-index]')
      ?.dataset.sliderThumbIndex
    if (index !== undefined) {
      selected.current = Number(index)
      onSelect(Number(index))
    }
  }
  function publish(next: ColorPickerStop[], index: number, restore = false) {
    if (disabled) return
    selected.current = index
    if (restore) {
      root.current?.focus({ preventScroll: true })
      pendingFocus.current = { value: gradientToCss(next), index }
    }
    onChange(next, index)
  }
  function add(percent: number) {
    const result = insertGradientStop(stops, percent)
    if (result) publish(result.stops, result.index, true)
    return result
  }
  function remove(index = active) {
    if (!canRemove) return
    publish(
      stops.filter((_, at) => at !== index),
      Math.min(index, stops.length - 2),
      true,
    )
    onComplete()
  }
  function point(event: PointerEvent, rail: HTMLElement) {
    const box = rail.getBoundingClientRect()
    const ratio = box.width ? (event.clientX - box.left) / box.width : 0
    return (
      Math.round(
        Math.max(0, Math.min(1, direction === 'rtl' ? 1 - ratio : ratio)) *
          10000,
      ) / 100
    )
  }
  function move(event: PointerEvent) {
    const session = drag.current
    if (!session || session.pointer !== event.pointerId || disabled) return
    const next = session.stops.map((stop) => ({ ...stop }))
    next[session.index].percent = Math.max(
      next[session.index - 1]?.percent ?? 0,
      Math.min(
        next[session.index + 1]?.percent ?? 100,
        point(event, session.rail),
      ),
    )
    session.latest = gradientToCss(next)
    onChange(next, session.index)
  }
  return (
    <div
      ref={root}
      tabIndex={-1}
      role="group"
      aria-label={`${label}渐变编辑`}
      data-color-gradient=""
      className={cn('grid min-w-0 gap-2', classNames?.gradient)}
      onPointerDownCapture={(event) => {
        endedPointer.current = null
        if (
          disabled ||
          event.button !== 0 ||
          event.isPrimary === false ||
          drag.current
        )
          return
        const target = event.target as HTMLElement
        if (target.closest('[data-slider-thumb-index]')) return
        const rail = target.closest<HTMLElement>('[data-slider-rail]')
        if (!rail) return
        event.preventDefault()
        event.stopPropagation()
        const result = add(point(event, rail))
        if (!result) return
        drag.current = {
          pointer: event.pointerId,
          rail,
          stops: result.stops,
          index: result.index,
          latest: gradientToCss(result.stops),
        }
        if (event.nativeEvent.isTrusted)
          event.currentTarget.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={move}
      onPointerUpCapture={(event) => {
        endedPointer.current = event.pointerId
      }}
      onPointerUp={(event) => {
        const session = drag.current
        if (!session || session.pointer !== event.pointerId) return
        move(event)
        drag.current = null
        if (event.currentTarget.hasPointerCapture?.(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
        onComplete()
      }}
      onPointerCancelCapture={(event) => {
        endedPointer.current = event.pointerId
        drag.current = null
        onCancel()
        if (event.currentTarget.hasPointerCapture?.(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onLostPointerCaptureCapture={(event) => {
        if (endedPointer.current === event.pointerId) return
        drag.current = null
        onCancel()
      }}
    >
      <p className="text-sm text-muted-foreground">
        选择色标后调整颜色。点击轨道添加，拖动或方向键调整位置。
      </p>
      <div className="relative">
        <Slider
          range
          label={`${label}色标位置`}
          handleLabels={stops.map(
            (stop, index) => `第 ${index + 1} 色标 ${stop.color}`,
          )}
          value={stops.map((stop) => stop.percent)}
          step={0.01}
          disabled={disabled}
          included={false}
          tooltip={{ formatter: (percent) => `${percent}%` }}
          style={
            {
              '--color-gradient': gradientToCss(stops, direction === 'rtl'),
            } as CSSProperties
          }
          classNames={{
            rail: '[&>span:first-child]:h-3 [&>span:first-child]:bg-[image:var(--color-gradient),conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] [&>span:first-child]:bg-[length:auto,8px_8px]',
          }}
          onFocus={(event) => selectInput(event.currentTarget)}
          onChange={(positions) =>
            publish(
              stops.map((stop, index) => ({
                ...stop,
                percent: positions[index],
              })),
              selected.current,
            )
          }
          onChangeComplete={onComplete}
          onKeyDown={(event) => {
            if (
              event.repeat ||
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229
            )
              return
            if (event.key === 'Delete' || event.key === 'Backspace') {
              event.preventDefault()
              const index = event.currentTarget.closest<HTMLElement>(
                '[data-slider-thumb-index]',
              )?.dataset.sliderThumbIndex
              remove(index === undefined ? active : Number(index))
            }
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[22px] top-1/2"
        >
          {stops.map((stop, index) => (
            <span
              key={index}
              className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] bg-[length:6px_6px]"
              style={{
                left: `${direction === 'rtl' ? 100 - stop.percent : stop.percent}%`,
              }}
            >
              <span
                className="absolute inset-0"
                style={{ background: stop.color }}
              />
            </span>
          ))}
        </span>
      </div>
      <div className={cn('flex flex-wrap gap-2', classNames?.stops)}>
        {stops.map((stop, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-pressed={active === index}
            aria-label={`${label}选择第 ${index + 1} 色标 ${stop.color} ${stop.percent}%`}
            className="flex min-h-11 min-w-11 touch-manipulation items-center gap-1 rounded-md border border-border bg-card px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/20 disabled:opacity-50"
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              onSelect(index)
            }}
          >
            <span
              aria-hidden="true"
              className="relative size-4 overflow-hidden rounded-sm border border-border bg-[conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] bg-[length:8px_8px]"
            >
              <span
                className="absolute inset-0"
                style={{ backgroundColor: stop.color }}
              />
            </span>
            {index + 1} · {stop.percent}%
          </button>
        ))}
      </div>
      <label className="grid min-w-0 gap-1 text-sm">
        第 {active + 1} 色标位置 (%)
        <InputNumber
          controls={false}
          aria-label={`${label}选中色标位置`}
          dir="ltr"
          value={stops[active].percent}
          min={stops[active - 1]?.percent ?? 0}
          max={stops[active + 1]?.percent ?? 100}
          step={0.01}
          precision={2}
          disabled={disabled}
          onChange={(percent) => {
            if (percent === undefined) return
            const next = stops.map((stop) => ({ ...stop }))
            next[active].percent = Math.max(
              next[active - 1]?.percent ?? 0,
              Math.min(next[active + 1]?.percent ?? 100, percent),
            )
            publish(next, active)
          }}
          onBlur={onComplete}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.nativeEvent.isComposing &&
              event.nativeEvent.keyCode !== 229
            ) {
              event.preventDefault()
              onComplete()
            }
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={disabled || suggested === null}
          onClick={() => {
            if (suggested !== null && add(suggested)) onComplete()
          }}
        >
          添加色标
        </Button>
        <Button
          variant="outline"
          disabled={!canRemove}
          onClick={() => remove()}
        >
          移除第 {active + 1} 色标
        </Button>
      </div>
    </div>
  )
}
