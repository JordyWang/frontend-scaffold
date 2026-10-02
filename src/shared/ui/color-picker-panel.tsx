import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { InputNumber } from './data-input'
import { Icon } from './icon'
import { Slider } from './slider'
import {
  colorFromPoint,
  colorToHex,
  colorToRgb,
  displayPickerColor,
  parsePickerColor,
  rgbToColor,
  type ColorPickerFormat,
  type PickerColor,
} from './color-picker-state'

export type ColorPickerPart =
  | 'root'
  | 'trigger'
  | 'swatch'
  | 'description'
  | 'popup'
  | 'panel'
  | 'area'
  | 'sliders'
  | 'format'
  | 'presets'
  | 'footer'
  | 'error'
export type ColorPickerPreset = {
  key: string
  label: ReactNode
  colors: { value: string; label?: string }[]
}

type PanelProps = {
  color: PickerColor
  value: string
  label: string
  disabled: boolean
  disabledAlpha: boolean
  disabledFormat: boolean
  allowClear: boolean
  format: ColorPickerFormat
  presets: ColorPickerPreset[]
  classNames?: Partial<Record<ColorPickerPart, string>>
  onChange: (color: PickerColor) => void
  onComplete: () => void
  onCancel: () => void
  onFormatChange: (format: ColorPickerFormat) => void
  onClear: () => void
}
const hueRail =
  '[&>span:first-child]:bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] rtl:[&>span:first-child]:bg-[linear-gradient(to_left,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]'

export function ColorPickerPanel({
  color,
  value,
  label,
  disabled,
  disabledAlpha,
  disabledFormat,
  allowClear,
  format,
  presets,
  classNames,
  onChange,
  onComplete,
  onCancel,
  onFormatChange,
  onClear,
}: PanelProps) {
  const formatted = displayPickerColor(value, format, color)
  const [entry, setEntry] = useState({
    source: formatted,
    draft: formatted,
    error: '',
  })
  const draft = entry.source === formatted ? entry.draft : formatted
  const error = entry.source === formatted ? entry.error : ''
  function setDraft(next: string) {
    setEntry({ source: formatted, draft: next, error: '' })
  }
  function setError(next: string) {
    setEntry({ source: formatted, draft, error: next })
  }
  const errorId = useId()
  const area = useRef<HTMLDivElement>(null)
  const saturation = useRef<HTMLInputElement>(null)
  const drag = useRef<{
    pointer: number
    base: PickerColor
    latest: PickerColor
  } | null>(null)
  const previous = useRef({ value, disabled, disabledAlpha })
  useLayoutEffect(() => {
    const session = drag.current
    const changed =
      previous.current.disabled !== disabled ||
      previous.current.disabledAlpha !== disabledAlpha ||
      (previous.current.value !== value &&
        session &&
        value !== colorToHex(session.latest))
    previous.current = { value, disabled, disabledAlpha }
    if (session && changed) {
      drag.current = null
      if (area.current?.hasPointerCapture?.(session.pointer))
        area.current.releasePointerCapture(session.pointer)
      onCancel()
    }
  }, [value, disabled, disabledAlpha, onCancel])

  function move(event: PointerEvent<HTMLDivElement>) {
    const session = drag.current,
      box = area.current?.getBoundingClientRect()
    if (!session || !box || event.pointerId !== session.pointer || disabled)
      return
    const next = colorFromPoint(
      session.base,
      event.clientX - box.left,
      event.clientY - box.top,
      box.width,
      box.height,
    )
    session.latest = next
    onChange(next)
  }
  function finish(event: PointerEvent<HTMLDivElement>, cancel = false) {
    const session = drag.current
    if (!session || session.pointer !== event.pointerId) return
    if (!cancel) move(event)
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(session.pointer)
    if (cancel) onCancel()
    else onComplete()
  }
  function commitDraft() {
    if (disabled) return
    const parsed = parsePickerColor(draft, color.h)
    if (!parsed) {
      setError('请输入有效的 Hex、RGB 或 HSB 颜色')
      return
    }
    setDraft(formatted)
    onChange(disabledAlpha ? { ...parsed, a: 1 } : parsed)
    onComplete()
  }
  const rgb = colorToRgb(color)
  const channels =
    format === 'rgb'
      ? [
          { key: 'r', text: 'R', value: rgb.r, max: 255 },
          { key: 'g', text: 'G', value: rgb.g, max: 255 },
          { key: 'b', text: 'B', value: rgb.b, max: 255 },
        ]
      : [
          {
            key: 'h',
            text: 'H',
            value: Math.round(color.h * 100) / 100,
            max: 360,
          },
          {
            key: 's',
            text: 'S',
            value: Math.round(color.s * 100) / 100,
            max: 100,
          },
          {
            key: 'b',
            text: 'B',
            value: Math.round(color.b * 100) / 100,
            max: 100,
          },
        ]
  return (
    <div
      data-color-panel=""
      className={cn('grid min-w-0 gap-3', classNames?.panel)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span
          aria-hidden="true"
          className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-[conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] bg-[length:12px_12px]"
        >
          <span
            className="absolute inset-0"
            style={{ backgroundColor: value || 'transparent' }}
          />
        </span>
      </div>
      <div
        ref={area}
        data-color-area=""
        aria-hidden="true"
        className={cn(
          'relative h-32 w-full touch-none overflow-hidden rounded-md border border-border',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair',
          classNames?.area,
        )}
        style={{
          backgroundColor: colorToHex({ ...color, s: 100, b: 100, a: 1 }),
        }}
        onPointerDown={(event) => {
          if (
            disabled ||
            event.button !== 0 ||
            event.isPrimary === false ||
            drag.current
          )
            return
          event.preventDefault()
          saturation.current?.focus({ preventScroll: true })
          drag.current = {
            pointer: event.pointerId,
            base: color,
            latest: color,
          }
          if (event.nativeEvent.isTrusted)
            event.currentTarget.setPointerCapture?.(event.pointerId)
          move(event)
        }}
        onPointerMove={move}
        onPointerUp={(event) => finish(event)}
        onPointerCancel={(event) => finish(event, true)}
        onLostPointerCapture={(event) => finish(event, true)}
      >
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent)]" />
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000]"
          style={{
            left: `clamp(8px,${color.s}%,calc(100% - 8px))`,
            top: `clamp(8px,${100 - color.b}%,calc(100% - 8px))`,
          }}
        />
      </div>
      <div className={cn('grid min-w-0 gap-1', classNames?.sliders)}>
        {[
          { key: 'h', text: '色相', max: 360 },
          { key: 's', text: '饱和度', max: 100 },
          { key: 'b', text: '亮度', max: 100 },
          ...(!disabledAlpha ? [{ key: 'a', text: '透明度', max: 100 }] : []),
        ].map((channel) => (
          <div key={channel.key} className="min-w-0">
            <div className="flex items-center justify-between text-sm">
              <span>{channel.text}</span>
              <span className="tabular-nums">
                {Math.round(
                  color[channel.key as keyof PickerColor] *
                    (channel.key === 'a' ? 100 : 1),
                )}
                {channel.key === 'h' ? '°' : '%'}
              </span>
            </div>
            <Slider
              ref={channel.key === 's' ? saturation : undefined}
              label={`${label}${channel.text}`}
              value={
                color[channel.key as keyof PickerColor] *
                (channel.key === 'a' ? 100 : 1)
              }
              max={channel.max}
              disabled={disabled}
              tooltip={false}
              included={channel.key !== 'h'}
              classNames={channel.key === 'h' ? { rail: hueRail } : undefined}
              onChange={(next) =>
                onChange({
                  ...color,
                  [channel.key]: channel.key === 'a' ? next / 100 : next,
                })
              }
              onChangeComplete={onComplete}
            />
          </div>
        ))}
      </div>
      <div className={cn('grid min-w-0 gap-2', classNames?.format)}>
        <label className="grid min-w-0 gap-1 text-sm">
          编码格式
          <span className="relative min-w-0">
            <select
              aria-label={`${label}编码格式`}
              value={format}
              disabled={disabled || disabledFormat}
              className="h-11 min-h-11 w-full min-w-0 appearance-none rounded-md border border-input bg-card px-2 pe-8 text-base! text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              onChange={(event) =>
                onFormatChange(event.currentTarget.value as ColorPickerFormat)
              }
            >
              <option value="hex">Hex</option>
              <option value="rgb">RGB</option>
              <option value="hsb">HSB</option>
            </select>
            <Icon
              name="arrowRight"
              size={16}
              className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground"
            />
          </span>
        </label>
        <label className="grid min-w-0 gap-1 text-sm">
          颜色值
          <input
            aria-label={`${label}颜色值`}
            dir="ltr"
            value={draft}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-11 w-full min-w-0 rounded-md border border-input bg-card px-2 text-base! text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:opacity-50"
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={() => {
              if (draft !== formatted) commitDraft()
            }}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229
              )
                return
              if (event.key === 'Enter') {
                event.preventDefault()
                commitDraft()
              }
              if (event.key === 'Escape' && (error || draft !== formatted)) {
                event.preventDefault()
                event.stopPropagation()
                setDraft(formatted)
              }
            }}
          />
        </label>
        {format !== 'hex' && (
          <div className="grid min-w-0 grid-cols-3 gap-2">
            {channels.map((channel) => (
              <label key={channel.key} className="grid min-w-0 gap-1 text-sm">
                {channel.text}
                <InputNumber
                  controls={false}
                  className="w-full px-1"
                  dir="ltr"
                  aria-label={`${label}${format.toUpperCase()} ${channel.text}`}
                  value={channel.value}
                  min={0}
                  max={channel.max}
                  precision={format === 'rgb' ? 0 : 2}
                  step={format === 'rgb' ? 1 : 0.01}
                  disabled={disabled}
                  onChange={(next) => {
                    if (next === undefined) return
                    const safe = Math.max(0, Math.min(channel.max, next))
                    onChange(
                      format === 'rgb'
                        ? rgbToColor({ ...rgb, [channel.key]: safe }, color.h)
                        : { ...color, [channel.key]: safe },
                    )
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
            ))}
          </div>
        )}
        {error && (
          <p
            role="alert"
            id={errorId}
            className={cn('text-sm text-destructive', classNames?.error)}
          >
            {error}
          </p>
        )}
      </div>
      {presets.length > 0 && (
        <div className={cn('grid gap-3', classNames?.presets)}>
          {presets.map((preset) => (
            <section
              key={preset.key}
              aria-label={
                typeof preset.label === 'string' ? preset.label : undefined
              }
              className="min-w-0 space-y-2"
            >
              <div className="text-sm font-semibold">{preset.label}</div>
              <div className="flex flex-wrap gap-2">
                {preset.colors.map((item, index) => {
                  const parsed = parsePickerColor(item.value)
                  if (!parsed) return null
                  const next = disabledAlpha ? { ...parsed, a: 1 } : parsed,
                    hex = colorToHex(next)
                  return (
                    <button
                      type="button"
                      key={`${hex}-${index}`}
                      aria-label={item.label ?? `选择 ${hex}`}
                      aria-pressed={value === hex}
                      disabled={disabled}
                      className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-md border border-border bg-card focus-visible:outline-2 focus-visible:outline-ring aria-pressed:outline-2 aria-pressed:outline-primary disabled:opacity-50"
                      onClick={(event) => {
                        event.currentTarget.focus({ preventScroll: true })
                        onChange(next)
                        onComplete()
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="relative size-7 overflow-hidden rounded-sm border border-border bg-[conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] bg-[length:12px_12px]"
                      >
                        <span
                          className="absolute inset-0"
                          style={{ backgroundColor: hex }}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      {allowClear && (
        <div className={cn('flex flex-wrap gap-2', classNames?.footer)}>
          <Button
            variant="outline"
            disabled={disabled || !value}
            onClick={() => {
              saturation.current?.focus({ preventScroll: true })
              onClear()
            }}
          >
            清除{label}
          </Button>
        </div>
      )}
    </div>
  )
}
