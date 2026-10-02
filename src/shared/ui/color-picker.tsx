import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import type { InputStatus, InputVariant } from './input'
import {
  ColorPickerPanel,
  type ColorPickerPart,
  type ColorPickerPreset,
} from './color-picker-panel'
import {
  colorToHex,
  displayPickerColor,
  normalizePickerColor,
  parsePickerColor,
  type ColorPickerFormat,
  type PickerColor,
} from './color-picker-state'
import {
  focusAfterPicker,
  pickerFocusable,
  revealPickerTarget,
  usePickerPosition,
  type PickerPlacement,
} from './picker-popup'
import { Portal } from './portal'
import { inputStatusStyles, inputVariantStyles } from './tailwind-styles'

export type { ColorPickerPart, ColorPickerPreset, ColorPickerFormat }
export type ColorPickerHandle = {
  focus: (options?: FocusOptions) => void
  blur: () => void
}
export type ColorPickerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'color'
> & {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onChangeComplete?: (value: string) => void
  showText?: boolean | ((value: string, format: ColorPickerFormat) => ReactNode)
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  label?: string
  invalid?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  form?: string
  autoFocus?: boolean
  mode?: 'popup' | 'panel' | 'native'
  disabledAlpha?: boolean
  disabledFormat?: boolean
  format?: ColorPickerFormat
  defaultFormat?: ColorPickerFormat
  onFormatChange?: (format: ColorPickerFormat) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: PickerPlacement
  allowClear?: boolean
  onClear?: () => void
  presets?: ColorPickerPreset[]
  panelRender?: (panel: ReactNode) => ReactNode
  classNames?: Partial<Record<ColorPickerPart, string>>
}
const emptyPresets: ColorPickerPreset[] = []

/** Canonical Hex strings and project controls keep color values independent from presentation. */
export const ColorPicker = forwardRef<ColorPickerHandle, ColorPickerProps>(
  function ColorPicker(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue,
      onChange,
      onChangeComplete,
      showText = false,
      size,
      variant = 'outlined',
      status = 'default',
      label = '颜色',
      invalid,
      disabled = false,
      readOnly = false,
      required,
      name,
      form,
      autoFocus,
      mode = 'popup',
      disabledAlpha = false,
      disabledFormat = false,
      format: controlledFormat,
      defaultFormat = 'hex',
      onFormatChange,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      placement = 'bottomStart',
      allowClear = false,
      onClear,
      presets = emptyPresets,
      panelRender,
      classNames,
      className,
      style,
      id,
      tabIndex,
      onKeyDown,
      onBlur,
      'aria-label': ariaLabel,
      'aria-labelledby': labelledBy,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
      ...rootProps
    } = allProps
    const { direction, componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const rootRef = useRef<HTMLDivElement>(null),
      popupRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null),
      fieldRef = useRef<HTMLInputElement>(null)
    const generatedId = useId(),
      controlId = id ?? `color-${generatedId}`,
      popupId = `${controlId}-popup`
    const effectiveAlphaDisabled = disabledAlpha || mode === 'native'
    const [internal, setInternal] = useState(() =>
      normalizePickerColor(defaultValue, effectiveAlphaDisabled),
    )
    const normalized = normalizePickerColor(
      controlled ? value : internal,
      effectiveAlphaDisabled,
    )
    const current = mode === 'native' && !normalized ? '#000000' : normalized
    const [remembered, setRemembered] = useState(() => ({
      value: current,
      color: parsePickerColor(current || '#000000')!,
    }))
    const color =
      remembered.value === current
        ? remembered.color
        : parsePickerColor(current || '#000000', remembered.color.h)!
    const [internalFormat, setInternalFormat] = useState(defaultFormat)
    const format = controlledFormat ?? internalFormat
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const requestedOpen = controlledOpen ?? internalOpen
    const inactive = disabled || readOnly
    const isOpen = mode === 'popup' && requestedOpen && !inactive
    const [nativeError, setNativeError] = useState('')
    const latest = useRef(current),
      changed = useRef(false),
      previous = useRef({ current, inactive, mode, effectiveAlphaDisabled })
    const focusRequested = useRef(false),
      blurFrame = useRef(0),
      notifiedInactive = useRef(false)
    const detachedFocus = useRef(false)
    const attachPopup = useCallback((element: HTMLDivElement | null) => {
      if (!element && popupRef.current?.contains(document.activeElement))
        detachedFocus.current = true
      popupRef.current = element
    }, [])
    const nameText = ariaLabel ?? label
    const showPanel = mode === 'panel' || isOpen
    const invalidState =
      invalid ||
      status === 'error' ||
      ariaInvalid ||
      Boolean(nativeError) ||
      undefined
    const descriptions =
      [
        describedBy,
        required && mode !== 'native' ? `${controlId}-required` : undefined,
        nativeError ? `${controlId}-error` : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined
    usePickerPosition(rootRef, popupRef, isOpen, placement, direction)

    const setOpen = useCallback(
      (next: boolean) => {
        if (mode !== 'popup' || next === requestedOpen || (next && inactive))
          return
        if (controlledOpen === undefined) setInternalOpen(next)
        onOpenChange?.(next)
      },
      [mode, requestedOpen, inactive, controlledOpen, onOpenChange],
    )
    const cancelSession = useCallback(() => {
      changed.current = false
      latest.current = current
    }, [current])
    const focus = useCallback(
      (options?: FocusOptions) => {
        const target =
          mode === 'native'
            ? fieldRef.current
            : mode === 'panel'
              ? ((rootRef.current && pickerFocusable(rootRef.current)[0]) ??
                rootRef.current)
              : triggerRef.current
        target?.focus(options)
      },
      [mode],
    )
    useImperativeHandle(
      ref,
      () => ({
        focus,
        blur: () => {
          const active = document.activeElement
          if (
            active instanceof HTMLElement &&
            (rootRef.current?.contains(active) ||
              popupRef.current?.contains(active))
          )
            active.blur()
        },
      }),
      [focus],
    )
    useLayoutEffect(() => {
      if (mode === 'panel' && autoFocus && !disabled)
        focus({ preventScroll: true })
    }, [mode, autoFocus, disabled, focus])

    useLayoutEffect(() => {
      const state = previous.current
      if (
        (state.current !== current && latest.current !== current) ||
        state.inactive !== inactive ||
        state.mode !== mode ||
        state.effectiveAlphaDisabled !== effectiveAlphaDisabled
      )
        cancelSession()
      previous.current = { current, inactive, mode, effectiveAlphaDisabled }
      if (isOpen && focusRequested.current) {
        focusRequested.current = false
        const first = popupRef.current && pickerFocusable(popupRef.current)[0]
        if (first) revealPickerTarget(first)
      }
      if (requestedOpen && inactive && !notifiedInactive.current) {
        notifiedInactive.current = true
        setOpen(false)
      }
      if (!inactive) notifiedInactive.current = false
    }, [
      current,
      inactive,
      mode,
      effectiveAlphaDisabled,
      isOpen,
      requestedOpen,
      cancelSession,
      setOpen,
    ])
    const owned = useCallback(
      (target: Node | null) =>
        Boolean(
          target &&
          (rootRef.current?.contains(target) ||
            popupRef.current?.contains(target)),
        ),
      [],
    )
    useLayoutEffect(() => {
      const lost = detachedFocus.current
      detachedFocus.current = false
      const active = document.activeElement
      const released =
        lost && (!active || active === document.body || !active.isConnected)
      if (showPanel || (!released && !owned(active))) return
      if (
        document.activeElement !== triggerRef.current &&
        document.activeElement !== fieldRef.current
      ) {
        if (disabled) rootRef.current?.focus({ preventScroll: true })
        else focus({ preventScroll: true })
      }
    }, [showPanel, disabled, focus, owned])
    useEffect(() => () => cancelAnimationFrame(blurFrame.current), [])
    useEffect(() => {
      if (!isOpen) return
      const outside = (event: globalThis.PointerEvent) => {
        if (!owned(event.target as Node)) {
          cancelSession()
          setOpen(false)
        }
      }
      const escape = (event: globalThis.KeyboardEvent) => {
        if (
          event.defaultPrevented ||
          event.key !== 'Escape' ||
          !owned(event.target as Node)
        )
          return
        event.preventDefault()
        cancelSession()
        setOpen(false)
        focus({ preventScroll: true })
      }
      document.addEventListener('pointerdown', outside)
      document.addEventListener('keydown', escape)
      return () => {
        document.removeEventListener('pointerdown', outside)
        document.removeEventListener('keydown', escape)
      }
    }, [isOpen, owned, setOpen, focus, cancelSession])
    useEffect(() => {
      if (controlled) return
      const nativeForm = fieldRef.current?.form
      if (!nativeForm) return
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented) return
          const next = normalizePickerColor(
            defaultValue,
            effectiveAlphaDisabled,
          )
          changed.current = false
          latest.current = next
          setInternal(next)
          setRemembered({
            value: next,
            color: parsePickerColor(next || '#000000')!,
          })
          setNativeError('')
          focusRequested.current = false
          setOpen(false)
        })
      }
      nativeForm.addEventListener('reset', reset)
      return () => nativeForm.removeEventListener('reset', reset)
    }, [controlled, defaultValue, effectiveAlphaDisabled, form, mode, setOpen])

    function publish(next: PickerColor) {
      if (inactive || fieldRef.current?.matches(':disabled')) return
      const candidate = effectiveAlphaDisabled ? { ...next, a: 1 } : next
      const canonical = colorToHex(candidate)
      setRemembered({ value: canonical, color: candidate })
      if (!controlled) setInternal(canonical)
      setNativeError('')
      if (canonical !== latest.current) {
        changed.current = true
        latest.current = canonical
        onChange?.(canonical)
      }
    }
    function complete() {
      const finalValue = latest.current
      if (changed.current) {
        changed.current = false
        onChangeComplete?.(finalValue)
      }
      latest.current = controlled ? current : finalValue
    }
    function clear() {
      if (
        !allowClear ||
        inactive ||
        !current ||
        fieldRef.current?.matches(':disabled')
      )
        return
      changed.current = false
      latest.current = ''
      if (!controlled) setInternal('')
      onChange?.('')
      onChangeComplete?.('')
      onClear?.()
      setNativeError('')
      latest.current = controlled ? current : ''
    }
    function begin() {
      if (inactive || triggerRef.current?.matches(':disabled')) return
      if (isOpen) {
        const first = popupRef.current && pickerFocusable(popupRef.current)[0]
        if (first) revealPickerTarget(first)
        return
      }
      changed.current = false
      latest.current = current
      focusRequested.current = true
      setOpen(true)
    }
    function changeFormat(next: ColorPickerFormat) {
      if (inactive || disabledFormat || next === format) return
      if (controlledFormat === undefined) setInternalFormat(next)
      onFormatChange?.(next)
    }
    const panel = (
      <ColorPickerPanel
        color={color}
        value={current}
        label={nameText}
        disabled={inactive}
        disabledAlpha={effectiveAlphaDisabled}
        disabledFormat={disabledFormat}
        allowClear={allowClear}
        format={format}
        presets={presets}
        classNames={classNames}
        onChange={publish}
        onComplete={complete}
        onCancel={cancelSession}
        onFormatChange={changeFormat}
        onClear={clear}
      />
    )
    const text =
      typeof showText === 'function'
        ? showText(current, format)
        : current
          ? displayPickerColor(current, format, color)
          : '未选择颜色'
    return (
      <div
        {...rootProps}
        ref={rootRef}
        dir={direction}
        tabIndex={-1}
        role={mode === 'panel' ? 'group' : undefined}
        id={mode === 'panel' ? controlId : undefined}
        aria-label={mode === 'panel' && !labelledBy ? nameText : undefined}
        aria-labelledby={mode === 'panel' ? labelledBy : undefined}
        aria-describedby={mode === 'panel' ? descriptions : undefined}
        aria-invalid={mode === 'panel' ? invalidState : undefined}
        data-color-root=""
        data-color-value={current}
        className={cn(
          mode === 'panel'
            ? 'w-80 max-w-full rounded-lg border border-border bg-card p-3 text-foreground'
            : 'relative inline-flex max-w-full items-center gap-2',
          classNames?.root,
          className,
        )}
        style={style}
        onBlur={(event) => {
          const target = event.relatedTarget as Node | null
          if (owned(target)) return
          const leave = () => {
            if (owned(document.activeElement)) return
            cancelSession()
            setOpen(false)
            onBlur?.(event)
          }
          if (target) leave()
          else {
            cancelAnimationFrame(blurFrame.current)
            blurFrame.current = requestAnimationFrame(leave)
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (
            event.defaultPrevented ||
            event.target !== triggerRef.current ||
            mode !== 'popup'
          )
            return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            begin()
          }
          if (event.key === 'Tab' && isOpen) {
            if (event.shiftKey) {
              cancelSession()
              setOpen(false)
            } else {
              event.preventDefault()
              begin()
            }
          }
          if (
            allowClear &&
            (event.key === 'Delete' || event.key === 'Backspace') &&
            !event.repeat &&
            !event.nativeEvent.isComposing &&
            event.nativeEvent.keyCode !== 229
          ) {
            event.preventDefault()
            clear()
          }
        }}
      >
        {mode === 'native' ? (
          <input
            ref={fieldRef}
            type="color"
            id={controlId}
            value={current}
            name={name}
            form={form}
            disabled={disabled || readOnly}
            required={required}
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            aria-label={!labelledBy ? nameText : undefined}
            aria-labelledby={labelledBy}
            aria-describedby={descriptions}
            aria-invalid={invalidState}
            className={cn(
              'size-11 shrink-0 cursor-pointer touch-manipulation rounded-[var(--ui-field-radius)] border border-input bg-card p-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]',
              resolvedSize === 'large' && 'size-12',
              classNames?.trigger,
            )}
            onChange={(event) => {
              const parsed = parsePickerColor(event.currentTarget.value)
              if (parsed) {
                publish(parsed)
                complete()
              }
            }}
          />
        ) : (
          <>
            {mode === 'popup' && (
              <button
                ref={triggerRef}
                type="button"
                id={controlId}
                value={current}
                form={form}
                disabled={disabled}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                aria-label={!labelledBy ? nameText : undefined}
                aria-labelledby={labelledBy}
                aria-describedby={descriptions}
                aria-invalid={invalidState}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? popupId : undefined}
                aria-disabled={readOnly || undefined}
                className={cn(
                  'flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-input bg-card p-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]',
                  inputVariantStyles[variant],
                  inputStatusStyles[status],
                  resolvedSize === 'large' && 'size-12',
                  classNames?.trigger,
                )}
                onClick={() => {
                  if (isOpen) {
                    cancelSession()
                    setOpen(false)
                  } else begin()
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative size-full overflow-hidden rounded-sm border border-border bg-[conic-gradient(var(--border)_25%,var(--card)_0_50%,var(--border)_0_75%,var(--card)_0)] bg-[length:12px_12px]',
                    classNames?.swatch,
                  )}
                >
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: current || 'transparent' }}
                  />
                </span>
              </button>
            )}
            <input
              ref={fieldRef}
              type="text"
              value={current}
              onChange={() => {}}
              tabIndex={-1}
              aria-hidden="true"
              required={required}
              disabled={disabled}
              readOnly={readOnly}
              name={name}
              form={form}
              className="pointer-events-none absolute h-px w-px opacity-0"
              onInvalid={(event) => {
                event.preventDefault()
                setNativeError('请选择颜色')
                focus({ preventScroll: true })
              }}
            />
          </>
        )}
        {mode !== 'panel' && showText && (
          <span
            aria-hidden="true"
            className={cn(
              'min-w-0 text-sm leading-6 text-foreground wrap-anywhere tabular-nums',
              classNames?.description,
            )}
          >
            {text}
          </span>
        )}
        {mode === 'panel' && (panelRender ? panelRender(panel) : panel)}
        {isOpen && (
          <Portal>
            <div
              ref={attachPopup}
              id={popupId}
              role="dialog"
              aria-label={`${nameText}选择面板`}
              dir={direction}
              data-color-popup=""
              data-picker-scroll=""
              className={cn(
                'invisible fixed z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-auto overscroll-contain rounded-[var(--ui-overlay-radius)] border border-border bg-card p-3 text-card-foreground shadow-lg',
                classNames?.popup,
              )}
              onKeyDown={(event) => {
                if (event.defaultPrevented || event.key !== 'Tab') return
                const items = pickerFocusable(event.currentTarget)
                if (event.shiftKey && event.target === items[0]) {
                  event.preventDefault()
                  focus({ preventScroll: true })
                } else if (!event.shiftKey && event.target === items.at(-1)) {
                  event.preventDefault()
                  cancelSession()
                  setOpen(false)
                  if (triggerRef.current)
                    focusAfterPicker(triggerRef.current, event.currentTarget)
                }
              }}
            >
              {panelRender ? panelRender(panel) : panel}
            </div>
          </Portal>
        )}
        {required && mode !== 'native' && (
          <span id={`${controlId}-required`} className="sr-only">
            颜色为必填项
          </span>
        )}
        {nativeError && (
          <p
            role="alert"
            id={`${controlId}-error`}
            className={cn('text-sm text-destructive', classNames?.error)}
          >
            {nativeError}
          </p>
        )}
      </div>
    )
  },
)
