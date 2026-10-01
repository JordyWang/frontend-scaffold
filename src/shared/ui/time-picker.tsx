import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Icon } from './icon'
import type { InputStatus, InputVariant } from './input'
import { useNativeFormReset } from './native-form-reset'
import {
  focusAfterPicker,
  pickerFocusable,
  revealPickerTarget,
  usePickerPosition,
  type PickerPlacement,
} from './picker-popup'
import { Portal } from './portal'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'
import { TimePickerPanel } from './time-picker-panel'
import {
  parseTime,
  timeDisplay,
  timeInput,
  timeSelectable,
  timeString,
  type TimeConstraints,
  type TimePrecision,
  type TimeUnit,
} from './time-picker-state'

export type TimePickerPart =
  | 'root'
  | 'input'
  | 'toggle'
  | 'clear'
  | 'popup'
  | 'panel'
  | 'presets'
  | 'columns'
  | 'column'
  | 'option'
  | 'footer'
  | 'error'
export type TimePickerPreset = {
  key: string
  label: ReactNode
  value: string | (() => string)
}
export type TimePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onBlur'
  | 'size'
  | 'min'
  | 'max'
  | 'multiple'
> &
  Omit<TimeConstraints, 'precision'> & {
    value?: string
    defaultValue?: string
    precision?: TimePrecision
    onChange?: (value: string) => void
    onBlur?: FocusEventHandler<HTMLSpanElement>
    size?: ControlSize
    variant?: InputVariant
    status?: InputStatus
    label?: string
    mode?: 'popup' | 'panel' | 'native'
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpenValue?: string
    needConfirm?: boolean
    onOk?: (value: string) => void
    allowClear?: boolean
    onClear?: () => void
    inputReadOnly?: boolean
    placement?: PickerPlacement
    use12Hours?: boolean
    hideDisabledOptions?: boolean
    showNow?: boolean
    presets?: TimePickerPreset[]
    renderCell?: (value: number, unit: TimeUnit) => ReactNode
    getCellDescription?: (value: number, unit: TimeUnit) => string | undefined
    footer?: ReactNode
    suffixIcon?: ReactNode
    classNames?: Partial<Record<TimePickerPart, string>>
  }

const TimePickerControl = forwardRef<
  HTMLInputElement,
  TimePickerProps & { precision: TimePrecision }
>(function TimePickerControl(allProps, ref) {
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const {
    value,
    defaultValue = '',
    precision,
    onChange,
    onBlur,
    size,
    variant = 'outlined',
    status = 'default',
    label = '时间',
    mode = 'popup',
    open,
    defaultOpen = false,
    onOpenChange,
    defaultOpenValue,
    needConfirm = true,
    onOk,
    allowClear = true,
    onClear,
    inputReadOnly = false,
    placement = 'bottomStart',
    use12Hours = false,
    hideDisabledOptions = false,
    showNow = true,
    presets = [],
    renderCell,
    getCellDescription,
    footer,
    suffixIcon,
    classNames,
    min,
    max,
    step,
    hourStep,
    minuteStep,
    secondStep,
    disabledHours,
    disabledMinutes,
    disabledSeconds,
    disabledTime,
    disabled = false,
    readOnly = false,
    name,
    className,
    onFocus,
    onClick,
    onKeyDown,
    'aria-label': ariaLabel,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...inputProps
  } = allProps
  const { direction, componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const id = useId(),
    popupId = id + '-popup',
    errorId = id + '-error'
  const rootRef = useRef<HTMLSpanElement>(null),
    inputRef = useRef<HTMLInputElement>(null),
    popupRef = useRef<HTMLDivElement>(null),
    panelRef = useRef<HTMLDivElement>(null)
  const owned = useRef(false),
    requested = useRef(false),
    wasOpen = useRef(false)
  const [internal, setInternal] = useState(defaultValue)
  useNativeFormReset(inputRef, controlled, defaultValue, setInternal)
  const current = controlled ? (value ?? '') : internal
  const [previous, setPrevious] = useState(current),
    [candidate, setCandidate] = useState(current),
    [draft, setDraft] = useState(timeDisplay(current, precision, use12Hours)),
    [editing, setEditing] = useState(false),
    [error, setError] = useState(''),
    [internalOpen, setInternalOpen] = useState(defaultOpen)
  const inactive = disabled || readOnly
  const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen)
  const showing = mode === 'panel' || isOpen
  if (inactive && open === undefined && internalOpen) setInternalOpen(false)
  if (previous !== current) {
    setPrevious(current)
    setCandidate(current)
    setDraft(timeDisplay(current, precision, use12Hours))
    setEditing(false)
    setError('')
  }
  const constraints = useMemo<TimeConstraints>(
    () => ({
      precision,
      min,
      max,
      step,
      hourStep,
      minuteStep,
      secondStep,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      disabledTime,
    }),
    [
      precision,
      min,
      max,
      step,
      hourStep,
      minuteStep,
      secondStep,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      disabledTime,
    ],
  )
  const selectable = (time: string) => timeSelectable(time, constraints)
  const inside = (target: EventTarget | null) =>
    target instanceof Node &&
    (rootRef.current?.contains(target) || popupRef.current?.contains(target))
  usePickerPosition(inputRef, popupRef, isOpen, placement, direction)
  function setOpen(next: boolean) {
    if (mode !== 'popup' || next === isOpen || (next && inactive)) return
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  function restoreFocus() {
    inputRef.current?.focus({ preventScroll: true })
  }
  function focusPanel() {
    const target =
      panelRef.current?.querySelector<HTMLElement>(
        '[data-time-unit][tabindex="0"]',
      ) ?? (panelRef.current ? pickerFocusable(panelRef.current)[0] : undefined)
    if (target) revealPickerTarget(target)
    else
      popupRef.current
        ?.querySelector<HTMLElement>('button:not(:disabled)')
        ?.focus({ preventScroll: true })
  }
  function begin(focus = false) {
    if (inactive || mode !== 'popup') return
    setError('')
    if (!isOpen) {
      const typed = timeInput(draft, precision, use12Hours)
      setCandidate(editing && typed && selectable(typed) ? typed : current)
      requested.current = focus
      setOpen(true)
    } else if (focus) focusPanel()
  }
  function cancel(restore = false) {
    setCandidate(current)
    setDraft(timeDisplay(current, precision, use12Hours))
    setEditing(false)
    setError('')
    requested.current = false
    setOpen(false)
    if (restore) restoreFocus()
  }
  function publish(next: string) {
    if (inactive || (next && !selectable(next))) return false
    if (!controlled) setInternal(next)
    setCandidate(controlled ? current : next)
    setDraft(timeDisplay(controlled ? current : next, precision, use12Hours))
    setEditing(false)
    setError('')
    if (next !== current) onChange?.(next)
    return true
  }
  function finishInput(confirm = false) {
    if (!editing) return true
    const next = draft ? timeInput(draft, precision, use12Hours) : ''
    if (next === undefined || (next && !selectable(next))) {
      setError(
        '请输入可选时间（' +
          (use12Hours
            ? 'hh:mm' + (precision === 'second' ? ':ss' : '') + ' AM/PM'
            : precision === 'second'
              ? 'HH:mm:ss'
              : 'HH:mm') +
          '）',
      )
      return false
    }
    if (needConfirm && !confirm && mode !== 'native') {
      setCandidate(next)
      return true
    }
    const accepted = publish(next)
    if (accepted && confirm && needConfirm) onOk?.(next)
    return accepted
  }
  function leave() {
    if (needConfirm) cancel()
    else {
      if (editing && !finishInput()) {
        setDraft(timeDisplay(current, precision, use12Hours))
        setEditing(false)
        setError('时间不可选，已恢复原时间')
      }
      requested.current = false
      setOpen(false)
    }
  }
  function choose(time: string) {
    if (inactive || !selectable(time)) return
    setError('')
    setEditing(false)
    if (needConfirm) {
      setCandidate(time)
      setDraft(timeDisplay(time, precision, use12Hours))
    } else publish(time)
  }
  function confirm() {
    const next = editing ? timeInput(draft, precision, use12Hours) : candidate
    if (!next || !selectable(next) || !publish(next)) return
    if (needConfirm) onOk?.(next)
    if (mode === 'popup') {
      setOpen(false)
      restoreFocus()
    }
  }
  useLayoutEffect(() => {
    if (wasOpen.current && !isOpen && needConfirm) {
      setCandidate(current)
      setDraft(timeDisplay(current, precision, use12Hours))
      setEditing(false)
      setError('')
    }
    wasOpen.current = isOpen
  }, [isOpen, current, needConfirm, precision, use12Hours])
  useLayoutEffect(() => {
    if (isOpen && requested.current) {
      requested.current = false
      focusPanel()
    }
    const shown = editing
      ? draft
        ? timeInput(draft, precision, use12Hours)
        : ''
      : needConfirm && showing
        ? candidate
        : current
    inputRef.current?.setCustomValidity(
      shown === undefined || (shown && !selectable(shown))
        ? '请选择有效且可选的时间'
        : needConfirm && showing && candidate !== current
          ? '请先确认时间'
          : '',
    )
    if (inactive && owned.current && document.activeElement === document.body) {
      focusAfterPicker(inputRef.current!, rootRef.current!)
      owned.current = false
    }
  })
  useEffect(() => {
    if (!isOpen) return
    const outside = (event: Event) => {
      if (!inside(event.target)) {
        owned.current = false
        leave()
      }
    }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside, true)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', outside, true)
    }
  })
  useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const reset = () => cancel(),
      submit = () => {
        if (editing && !needConfirm) finishInput()
      }
    form.addEventListener('reset', reset)
    form.addEventListener('submit', submit, true)
    return () => {
      form.removeEventListener('reset', reset)
      form.removeEventListener('submit', submit, true)
    }
  })
  const parsedDraft = editing
    ? draft
      ? timeInput(draft, precision, use12Hours)
      : ''
    : undefined
  const shown = editing
    ? parsedDraft
    : needConfirm && showing
      ? candidate
      : current
  const displayed = editing
    ? draft
    : timeDisplay(shown ?? '', precision, use12Hours)
  const invalid =
    status === 'error' ||
    ariaInvalid ||
    Boolean(error) ||
    shown === undefined ||
    Boolean(shown && !selectable(shown)) ||
    undefined
  const panel = (
    <div
      id={mode === 'panel' ? popupId : undefined}
      className={cn('min-w-0 space-y-2', classNames?.panel)}
    >
      {presets.length > 0 && (
        <div
          role="group"
          aria-label={label + '快捷时间'}
          className={cn('flex flex-wrap gap-2', classNames?.presets)}
        >
          {presets.map((preset) => (
            <Button
              key={preset.key}
              tabIndex={0}
              variant="outline"
              disabled={
                inactive ||
                (typeof preset.value === 'string' && !selectable(preset.value))
              }
              onClick={() => {
                const next =
                  typeof preset.value === 'function'
                    ? preset.value()
                    : preset.value
                if (!selectable(next)) {
                  setError('快捷时间当前不可选，请选择其他时间')
                  return
                }
                choose(next)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
      <TimePickerPanel
        ref={panelRef}
        label={label}
        value={needConfirm ? candidate : current}
        defaultOpenValue={defaultOpenValue}
        constraints={constraints}
        disabled={inactive}
        onChange={choose}
        use12Hours={use12Hours}
        hideDisabledOptions={hideDisabledOptions}
        renderCell={renderCell}
        getCellDescription={getCellDescription}
        classNames={classNames}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {needConfirm ? '待确认时间' : '已选时间'}：
        {timeDisplay(candidate, precision, use12Hours) || '未选择'}
      </p>
      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2',
          classNames?.footer,
        )}
      >
        {footer}
        {showNow && (
          <Button
            tabIndex={0}
            variant="outline"
            disabled={inactive}
            onClick={() => {
              const now = new Date(),
                next = timeString(
                  [
                    now.getHours(),
                    now.getMinutes(),
                    precision === 'second' ? now.getSeconds() : 0,
                  ],
                  precision,
                )
              if (selectable(next)) choose(next)
              else setError('当前时间不可选，请选择其他时间')
            }}
          >
            此刻
          </Button>
        )}
        <Button
          tabIndex={0}
          variant="outline"
          disabled={inactive}
          onClick={() => cancel(mode === 'popup')}
        >
          取消
        </Button>
        <Button
          tabIndex={0}
          disabled={
            inactive || !selectable(editing ? (parsedDraft ?? '') : candidate)
          }
          onClick={confirm}
        >
          {needConfirm ? '确定' : '完成'}
        </Button>
      </div>
    </div>
  )
  return (
    <span
      ref={rootRef}
      dir={direction}
      data-timepicker=""
      className={cn(
        'inline-flex w-full min-w-0 flex-col gap-2',
        classNames?.root,
      )}
      onFocusCapture={() => {
        owned.current = true
      }}
      onBlurCapture={(event) => {
        if (event.relatedTarget && !inside(event.relatedTarget))
          owned.current = false
      }}
      onBlur={(event) => {
        if (inside(event.relatedTarget)) return
        if (mode !== 'native') leave()
        onBlur?.(event)
      }}
    >
      <span className="relative inline-flex min-w-0">
        <input
          {...inputProps}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type={mode === 'native' ? 'time' : 'text'}
          name={mode === 'native' ? name : undefined}
          role={mode === 'popup' ? 'combobox' : undefined}
          aria-label={
            ariaLabel ?? (inputProps['aria-labelledby'] ? undefined : label)
          }
          aria-haspopup={mode === 'popup' ? 'dialog' : undefined}
          aria-expanded={mode === 'popup' ? isOpen : undefined}
          aria-controls={showing ? popupId : undefined}
          aria-invalid={invalid}
          aria-describedby={
            [ariaDescribedBy, error ? errorId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          data-status={status === 'default' ? undefined : status}
          min={min}
          max={max}
          step={step ?? (precision === 'minute' ? 60 : 1)}
          disabled={disabled}
          readOnly={readOnly || (mode !== 'native' && inputReadOnly)}
          autoComplete={inputProps.autoComplete ?? 'off'}
          placeholder={
            inputProps.placeholder ??
            (precision === 'second' ? 'HH:mm:ss' : 'HH:mm') +
              (use12Hours ? ' AM/PM' : '')
          }
          value={mode === 'native' ? current : displayed}
          className={cn(
            inputStyles,
            inputVariantStyles[variant],
            inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            'min-w-0 touch-manipulation',
            mode === 'popup' && 'pe-12',
            allowClear &&
              displayed &&
              !inactive &&
              (mode === 'popup' ? 'pe-24' : 'pe-12'),
            className,
            classNames?.input,
          )}
          onFocus={onFocus}
          onClick={(event) => {
            onClick?.(event)
            if (!event.defaultPrevented) begin()
          }}
          onChange={(event) => {
            const next = event.currentTarget.value
            setError('')
            if (mode === 'native') {
              const parts = parseTime(next)
              publish(parts ? timeString(parts, precision) : '')
            } else {
              setDraft(next)
              setEditing(true)
              const parsed = timeInput(next, precision, use12Hours)
              if (needConfirm && parsed && selectable(parsed))
                setCandidate(parsed)
            }
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented || inactive || mode === 'native') return
            if (event.key === 'ArrowDown' && mode === 'popup') {
              event.preventDefault()
              begin(true)
            } else if (event.key === 'Escape' && (isOpen || editing)) {
              event.preventDefault()
              event.stopPropagation()
              cancel(true)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              if (editing) {
                if (finishInput(true)) {
                  setOpen(false)
                  restoreFocus()
                }
              } else begin(true)
            }
          }}
        />
        {allowClear && displayed && !inactive && (
          <button
            type="button"
            tabIndex={0}
            aria-label={'清空' + label}
            className={cn(
              'absolute inset-y-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
              mode === 'popup' ? 'end-11' : 'end-0',
              classNames?.clear,
            )}
            onClick={() => {
              publish('')
              setOpen(false)
              onClear?.()
              restoreFocus()
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
        {mode === 'popup' && (
          <button
            type="button"
            tabIndex={0}
            disabled={inactive}
            aria-label={'打开' + label + '面板'}
            aria-expanded={isOpen}
            aria-controls={isOpen ? popupId : undefined}
            className={cn(
              'absolute inset-y-0 end-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
              classNames?.toggle,
            )}
            onClick={() => (isOpen ? cancel(true) : begin(true))}
          >
            {suffixIcon ?? <Icon name="clock" size={16} />}
          </button>
        )}
      </span>
      {name && mode !== 'native' && (
        <input
          type="hidden"
          name={name}
          form={inputProps.form}
          value={current}
          disabled={disabled}
          readOnly
        />
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className={cn('text-sm text-destructive', classNames?.error)}
        >
          {error}
        </span>
      )}
      {mode === 'panel' && panel}
      {isOpen && (
        <Portal>
          <div
            ref={popupRef}
            data-picker-scroll
            id={popupId}
            role="dialog"
            aria-label={label + '选择面板'}
            dir={direction}
            className={cn(
              'invisible fixed z-[90] w-[22rem] min-w-0 overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-2 text-card-foreground shadow-xl transition-none',
              classNames?.popup,
            )}
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                cancel(true)
              } else if (event.key === 'Tab') {
                const popup = popupRef.current!,
                  elements = pickerFocusable(popup)
                if (event.shiftKey && event.target === elements[0]) {
                  event.preventDefault()
                  restoreFocus()
                } else if (
                  !event.shiftKey &&
                  event.target === elements.at(-1)
                ) {
                  event.preventDefault()
                  leave()
                  focusAfterPicker(inputRef.current!, popup)
                }
              }
            }}
          >
            {panel}
          </div>
        </Portal>
      )}
    </span>
  )
})

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  function TimePicker(props, ref) {
    const precision =
      props.precision ??
      ([
        props.value,
        props.defaultValue,
        props.min,
        props.max,
        props.defaultOpenValue,
      ].some((value) => value?.length === 8) || Number(props.step) % 60 > 0
        ? 'second'
        : 'minute')
    return (
      <TimePickerControl
        {...props}
        precision={precision}
        key={precision}
        ref={ref}
      />
    )
  },
)
