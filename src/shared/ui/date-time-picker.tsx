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
import { DateTimePickerPanel } from './date-time-picker-panel'
import { focusDateTimePanel } from './date-time-panel-focus'
import { usePickerPreview } from './picker-preview'
import {
  usePickerFormat,
  usePickerTimePrecision,
  formatUses12Hours,
  type PickerFormatProps,
} from './picker-format'
import { parseMonth, toISO, toMonth } from './date-picker-state'
import {
  dateTimeSelectable,
  parseDateTime,
  nativeDateTimeInput,
  type DateTimeConstraints,
} from './date-time-picker-state'
import {
  timeNow,
  defaultTimeStep,
  type TimePrecision,
  type TimeUnit,
} from './time-picker-state'

export type DateTimePickerPart =
  | 'root'
  | 'input'
  | 'toggle'
  | 'clear'
  | 'popup'
  | 'panel'
  | 'presets'
  | 'switcher'
  | 'calendar'
  | 'time'
  | 'columns'
  | 'column'
  | 'option'
  | 'footer'
  | 'error'
export type DateTimePickerPreset = {
  key: string
  label: ReactNode
  value: string | (() => string)
}
export type DateTimePickerProps = Omit<
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
  PickerFormatProps &
  Omit<DateTimeConstraints, 'precision' | 'stepBase'> & {
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
    defaultOpenTime?: string
    panelMonth?: string
    defaultPanelMonth?: string
    onPanelMonthChange?: (month: string) => void
    weekStartsOn?: 0 | 1
    locale?: string
    renderDate?: (date: string) => ReactNode
    getDateDescription?: (date: string) => string | undefined
    onCalendarChange?: (value: string, info: { part: 'date' | 'time' }) => void
    needConfirm?: boolean
    onOk?: (value: string) => void
    allowClear?: boolean
    onClear?: () => void
    inputReadOnly?: boolean
    placement?: PickerPlacement
    use12Hours?: boolean
    hideDisabledOptions?: boolean
    changeOnScroll?: boolean
    previewValue?: false | 'hover'
    showNow?: boolean
    presets?: DateTimePickerPreset[]
    renderCell?: (value: number, unit: TimeUnit) => ReactNode
    getCellDescription?: (value: number, unit: TimeUnit) => string | undefined
    footer?: ReactNode
    suffixIcon?: ReactNode
    classNames?: Partial<Record<DateTimePickerPart, string>>
  }

const DateTimePickerControl = forwardRef<
  HTMLInputElement,
  DateTimePickerProps & { precision: TimePrecision }
>(function DateTimePickerControl(allProps, ref) {
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
    label = '日期时间',
    mode = 'popup',
    open,
    defaultOpen = false,
    onOpenChange,
    defaultOpenTime,
    panelMonth,
    defaultPanelMonth,
    onPanelMonthChange,
    weekStartsOn = 1,
    locale,
    renderDate,
    getDateDescription,
    onCalendarChange,
    disabledDate,
    needConfirm = true,
    onOk,
    allowClear = true,
    onClear,
    inputReadOnly = false,
    placement = 'bottomStart',
    use12Hours = false,
    format,
    parseInput,
    hideDisabledOptions = false,
    changeOnScroll = false,
    previewValue = 'hover',
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
    millisecondStep,
    disabledHours,
    disabledMinutes,
    disabledSeconds,
    disabledMilliseconds,
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
  const presentation = usePickerFormat({
    kind: 'dateTime',
    precision,
    use12Hours,
    format,
    parseInput,
    locale,
    native: mode === 'native',
  })
  const id = useId(),
    popupId = id + '-popup',
    errorId = id + '-error'
  const rootRef = useRef<HTMLSpanElement>(null),
    inputRef = useRef<HTMLInputElement>(null),
    popupRef = useRef<HTMLDivElement>(null),
    panelRef = useRef<HTMLDivElement>(null)
  const pointerInside = useRef(false)
  const owned = useRef(false),
    requested = useRef(false),
    wasOpen = useRef(false)
  const [internal, setInternal] = useState(defaultValue)
  useNativeFormReset(inputRef, controlled, defaultValue, setInternal)
  const current = controlled ? (value ?? '') : internal
  const [previous, setPrevious] = useState(current),
    [candidate, setCandidate] = useState(current),
    [draft, setDraft] = useState(presentation.display(current)),
    [editing, setEditing] = useState(false),
    [error, setError] = useState(''),
    [internalOpen, setInternalOpen] = useState(defaultOpen)
  function initialMonth(next: string) {
    const proposed = toMonth(
      parseMonth(defaultPanelMonth) ??
        parseMonth(next.slice(0, 7)) ??
        new Date(),
    )
    const lower = parseDateTime(min)?.date.slice(0, 7) ?? '0001-01'
    const upper = parseDateTime(max)?.date.slice(0, 7) ?? '9999-12'
    return proposed < lower ? lower : proposed > upper ? upper : proposed
  }
  const [internalMonth, setInternalMonth] = useState(() =>
    initialMonth(current),
  )
  const month = parseMonth(panelMonth) ? panelMonth! : internalMonth
  const inactive = disabled || readOnly
  const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen)
  const showing = mode === 'panel' || isOpen
  if (inactive && open === undefined && internalOpen) setInternalOpen(false)
  const [previousPresentation, setPreviousPresentation] = useState(presentation)
  if (previousPresentation !== presentation) {
    setPreviousPresentation(presentation)
    setDraft(presentation.display(showing ? candidate : current))
    setEditing(false)
    setError('')
  }
  if (previous !== current) {
    setPrevious(current)
    setCandidate(current)
    setDraft(presentation.display(current))
    setEditing(false)
    setError('')
  }
  const constraints = useMemo<DateTimeConstraints>(
    () => ({
      precision,
      min,
      max,
      step,
      hourStep,
      minuteStep,
      secondStep,
      millisecondStep,
      disabledDate,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      disabledMilliseconds,
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
      millisecondStep,
      disabledDate,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      disabledMilliseconds,
      disabledTime,
    ],
  )
  const selectable = (next: string) => dateTimeSelectable(next, constraints)
  function changeMonth(next: string) {
    if (panelMonth === undefined) setInternalMonth(next)
    onPanelMonthChange?.(next)
  }
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
    focusDateTimePanel(panelRef.current)
  }
  function begin(focus = false) {
    if (inactive || mode !== 'popup') return
    setError('')
    if (!isOpen) {
      const typed = presentation.parse(draft)
      const next = editing && typed && selectable(typed) ? typed : current
      setCandidate(next)
      if (panelMonth === undefined) setInternalMonth(initialMonth(next))
      requested.current = focus
      setOpen(true)
    } else if (focus) focusPanel()
  }
  function cancel(restore = false) {
    onPreview()
    setCandidate(current)
    setDraft(presentation.display(current))
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
    setDraft(presentation.display(controlled ? current : next))
    setEditing(false)
    setError('')
    if (next !== current) onChange?.(next)
    return true
  }
  function finishInput(confirm = false) {
    if (!editing) return true
    const next = draft ? presentation.parse(draft) : ''
    if (next === undefined || (next && !selectable(next))) {
      setError('请输入可选日期时间（' + presentation.hint + '）')
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
        setDraft(presentation.display(current))
        setEditing(false)
        setError('日期时间不可选，已恢复原值')
      }
      requested.current = false
      setOpen(false)
    }
  }
  function choose(next: string, part: 'date' | 'time' = 'date') {
    if (inactive || !selectable(next)) return
    setError('')
    setEditing(false)
    if (needConfirm) {
      setCandidate(next)
      setDraft(presentation.display(next))
    } else publish(next)
    onCalendarChange?.(next, { part })
    if (next.slice(0, 7) !== month) changeMonth(next.slice(0, 7))
  }
  function confirm() {
    onPreview()
    const next = editing ? presentation.parse(draft) : candidate
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
      setDraft(presentation.display(current))
      setEditing(false)
      setError('')
    }
    wasOpen.current = isOpen
  }, [isOpen, current, needConfirm, presentation])
  useLayoutEffect(() => {
    if (isOpen && requested.current) {
      requested.current = false
      focusPanel()
    }
    const shown = editing
      ? draft
        ? presentation.parse(draft)
        : ''
      : needConfirm && showing
        ? candidate
        : current
    inputRef.current?.setCustomValidity(
      preview && inputRef.current.required && !shown
        ? '请选择日期时间'
        : shown === undefined || (shown && !selectable(shown))
          ? '请选择有效且可选的日期时间'
          : needConfirm &&
              (editing ? shown !== current : showing && candidate !== current)
            ? '请先确认日期时间'
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
      ? presentation.parse(draft)
      : ''
    : undefined
  const shown = editing
    ? parsedDraft
    : needConfirm && showing
      ? candidate
      : current
  const { preview, onPreview } = usePickerPreview(
    JSON.stringify([current, candidate, showing, mode, month, editing]),
    previewValue === 'hover' && showing && !editing && !inactive,
    selectable,
  )
  const displayed = editing
    ? draft
    : presentation.display(preview ?? shown ?? '')
  const invalid =
    status === 'error' ||
    ariaInvalid ||
    Boolean(error) ||
    shown === undefined ||
    Boolean(shown && !selectable(shown)) ||
    undefined
  const panelValue =
    editing && parsedDraft && selectable(parsedDraft)
      ? parsedDraft
      : needConfirm
        ? candidate
        : current
  const panel = (
    <div
      id={mode === 'panel' ? popupId : undefined}
      className={cn('@container min-w-0 space-y-2', classNames?.panel)}
    >
      {presets.length > 0 && (
        <div
          role="group"
          aria-label={label + '快捷日期时间'}
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
                  setError('快捷日期时间当前不可选，请选择其他值')
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
      <DateTimePickerPanel
        ref={panelRef}
        label={label}
        value={panelValue}
        month={month}
        onMonthChange={changeMonth}
        onChange={(next, info) => choose(next, info.part)}
        onError={setError}
        constraints={constraints}
        disabled={inactive}
        defaultOpenTime={defaultOpenTime}
        use12Hours={use12Hours}
        hideDisabledOptions={hideDisabledOptions}
        changeOnScroll={changeOnScroll}
        onPreview={previewValue === 'hover' ? onPreview : undefined}
        weekStartsOn={weekStartsOn}
        locale={locale}
        renderDate={renderDate}
        getDateDescription={getDateDescription}
        renderCell={renderCell}
        getCellDescription={getCellDescription}
        classNames={classNames}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {needConfirm ? '待确认日期时间' : '已选日期时间'}：
        {presentation.display(panelValue) || '未选择'}
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
                next = toISO(now) + 'T' + timeNow(now, precision)
              if (selectable(next)) choose(next)
              else setError('当前日期时间不可选，请选择其他值')
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
      data-datetimepicker=""
      className={cn(
        'inline-flex w-full min-w-0 flex-col gap-2',
        classNames?.root,
      )}
      onFocusCapture={() => {
        owned.current = true
      }}
      onPointerDownCapture={() => {
        pointerInside.current = true
      }}
      onPointerUpCapture={() => {
        setTimeout(() => {
          pointerInside.current = false
        }, 0)
      }}
      onPointerCancelCapture={() => {
        pointerInside.current = false
      }}
      onBlurCapture={(event) => {
        if (event.relatedTarget && !inside(event.relatedTarget))
          owned.current = false
      }}
      onBlur={(event) => {
        if (inside(event.relatedTarget)) return
        // Safari touch buttons can blur the previous control before click without
        // focusing the button. Keep the composite session through that gesture.
        if (!event.relatedTarget && pointerInside.current) return
        // Hiding a part or disabling a boundary navigation button can blur it.
        // Panel effects move focus to an available visible control.
        if (
          !event.relatedTarget &&
          event.target instanceof HTMLElement &&
          panelRef.current?.contains(event.target) &&
          (!event.target.getClientRects().length ||
            (owned.current && event.target.matches(':disabled')))
        )
          return
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
          type={mode === 'native' ? 'datetime-local' : 'text'}
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
          step={step ?? defaultTimeStep(precision)}
          disabled={disabled}
          readOnly={readOnly || (mode !== 'native' && inputReadOnly)}
          autoComplete={inputProps.autoComplete ?? 'off'}
          placeholder={inputProps.placeholder ?? presentation.hint}
          value={mode === 'native' ? current : displayed}
          data-picker-preview={preview ? 'hover' : undefined}
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
            if (!event.defaultPrevented) {
              begin()
              if (presentation.isMask) {
                const range = presentation.selectSegment(
                  event.currentTarget.value,
                  event.currentTarget.selectionStart ?? 0,
                )
                if (range)
                  event.currentTarget.setSelectionRange(range[0], range[1])
              }
            }
          }}
          onChange={(event) => {
            const next = presentation.maskInput(event.currentTarget.value)
            setError('')
            if (mode === 'native') {
              const parsed = next ? nativeDateTimeInput(next, precision) : ''
              if (parsed === undefined || !publish(parsed))
                setError('日期时间不可选或精度不符，已恢复原值')
            } else {
              setDraft(next)
              setEditing(true)
              const parsed = presentation.parse(next)
              if (needConfirm && parsed && selectable(parsed)) {
                setCandidate(parsed)
                if (showing)
                  onCalendarChange?.(parsed, {
                    part:
                      parseDateTime(candidate)?.date === parsed.slice(0, 10)
                        ? 'time'
                        : 'date',
                  })
                if (parsed.slice(0, 7) !== month)
                  changeMonth(parsed.slice(0, 7))
              }
            }
          }}
          onKeyDown={(event) => {
            onPreview()
            onKeyDown?.(event)
            if (
              presentation.isMask &&
              (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey
            ) {
              const input = event.currentTarget,
                next = presentation.adjustSegment(
                  input.value,
                  input.selectionStart ?? 0,
                  event.key === 'ArrowUp' ? 1 : -1,
                )
              if (next !== undefined) {
                event.preventDefault()
                setDraft(next)
                setEditing(true)
                const parsed = presentation.parse(next)
                if (needConfirm && parsed && selectable(parsed))
                  setCandidate(parsed)
                return
              }
            }
            if (
              presentation.isMask &&
              (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey
            ) {
              event.preventDefault()
              const input = event.currentTarget,
                position = input.selectionStart ?? 0
              const next = presentation.moveCaret(
                input.value,
                position,
                event.key === 'ArrowLeft' ? -1 : 1,
              )
              input.setSelectionRange(next, next)
              return
            }
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
              'invisible fixed z-[90] w-[44rem] min-w-0 overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-2 text-card-foreground shadow-xl transition-none',
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

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  function DateTimePicker(props, ref) {
    const { locale: configuredLocale } = useConfig()
    const locale = props.locale ?? configuredLocale
    const precision = usePickerTimePrecision(
      { ...props, locale },
      [
        props.value,
        props.defaultValue,
        props.min,
        props.max,
        props.defaultOpenTime,
      ],
      Boolean(props.value ?? props.defaultValue),
    )
    return (
      <DateTimePickerControl
        {...props}
        precision={precision}
        use12Hours={
          props.use12Hours ??
          (props.mode !== 'native' && formatUses12Hours(props.format, locale))
        }
        key={precision}
        ref={ref}
      />
    )
  },
)
