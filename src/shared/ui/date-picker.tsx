import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import {
  dateStepMatches,
  parseDate,
  parseMonth,
  toMonth,
} from './date-picker-state'
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

export type DatePickerPart =
  | 'root'
  | 'input'
  | 'toggle'
  | 'clear'
  | 'popup'
  | 'panel'
  | 'presets'
  | 'footer'
  | 'error'
export type DatePickerPreset = {
  key: string
  label: ReactNode
  value: string | (() => string)
}
export type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onBlur'
  | 'size'
  | 'min'
  | 'max'
> & {
  value?: string
  defaultValue?: string
  min?: string
  max?: string
  onChange?: (value: string) => void
  /** Fires when focus leaves the entire field and its portalled panel. */
  onBlur?: FocusEventHandler<HTMLSpanElement>
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  label?: string
  mode?: 'popup' | 'panel' | 'native'
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  allowClear?: boolean
  onClear?: () => void
  needConfirm?: boolean
  onOk?: (value: string) => void
  disabledDate?: (date: string) => boolean
  panelMonth?: string
  defaultPanelMonth?: string
  onPanelMonthChange?: (month: string) => void
  placement?: PickerPlacement
  presets?: DatePickerPreset[]
  weekStartsOn?: 0 | 1
  locale?: string
  inputReadOnly?: boolean
  renderDate?: (date: string) => ReactNode
  getDateDescription?: (date: string) => string | undefined
  footer?: ReactNode
  suffixIcon?: ReactNode
  classNames?: Partial<Record<DatePickerPart, string>>
}
export type DatePickerPlacement = PickerPlacement

/** A project ISO date field with a shared calendar, independent browsing and optional confirmation. */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue = '',
      onChange,
      size,
      variant = 'outlined',
      status = 'default',
      label = '日期',
      mode = 'popup',
      open,
      defaultOpen = false,
      onOpenChange,
      allowClear = true,
      onClear,
      needConfirm = false,
      onOk,
      disabledDate,
      panelMonth,
      defaultPanelMonth,
      onPanelMonthChange,
      placement = 'bottomStart',
      presets = [],
      weekStartsOn = 1,
      locale,
      inputReadOnly = false,
      renderDate,
      getDateDescription,
      footer,
      suffixIcon,
      classNames,
      className,
      disabled = false,
      readOnly = false,
      min,
      max,
      step,
      onBlur,
      onFocus,
      onClick,
      onKeyDown,
      name,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...inputProps
    } = allProps
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const id = useId()
    const popupId = id + '-popup'
    const errorId = id + '-error'
    const rootRef = useRef<HTMLSpanElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)
    const calendarRef = useRef<HTMLDivElement>(null)
    const focusRequested = useRef(false)
    const ownedFocus = useRef(false)
    const [internal, setInternal] = useState(defaultValue)
    useNativeFormReset(inputRef, controlled, defaultValue, setInternal)
    const current = controlled ? (value ?? '') : internal
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(current)
    const [candidate, setCandidate] = useState(current)
    const [previous, setPrevious] = useState(current)
    const [error, setError] = useState('')
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const inactive = disabled || readOnly
    const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen)
    if (inactive && open === undefined && internalOpen) setInternalOpen(false)
    const showingPanel = mode === 'panel' || isOpen
    const minDate = parseDate(min) ? min! : '0001-01-01'
    const maxDate = parseDate(max) ? max! : '9999-12-31'
    function selectable(date: string) {
      return (
        Boolean(parseDate(date)) &&
        date >= minDate &&
        date <= maxDate &&
        dateStepMatches(date, parseDate(min) ? min! : '1970-01-01', step) &&
        !disabledDate?.(date)
      )
    }
    function initialMonth(date: string) {
      const proposed = toMonth(
        parseMonth(defaultPanelMonth) ?? parseDate(date) ?? new Date(),
      )
      return proposed < minDate.slice(0, 7)
        ? minDate.slice(0, 7)
        : proposed > maxDate.slice(0, 7)
          ? maxDate.slice(0, 7)
          : proposed
    }
    const [internalMonth, setInternalMonth] = useState(() =>
      initialMonth(current),
    )
    const month = parseMonth(panelMonth) ? panelMonth! : internalMonth
    if (previous !== current) {
      setPrevious(current)
      setCandidate(current)
      setDraft(current)
      setError('')
    }
    usePickerPosition(inputRef, popupRef, isOpen, placement, direction)

    function inside(target: EventTarget | null) {
      return (
        target instanceof Node &&
        (rootRef.current?.contains(target) ||
          popupRef.current?.contains(target))
      )
    }

    function setOpen(next: boolean) {
      if (mode !== 'popup' || next === isOpen || (next && inactive)) return
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    }
    function changeMonth(next: string) {
      if (panelMonth === undefined) setInternalMonth(next)
      onPanelMonthChange?.(next)
    }
    function focusCalendar() {
      const panel = calendarRef.current
      const target =
        panel?.querySelector<HTMLElement>(
          '[data-calendar-date][tabindex="0"]',
        ) ?? (panel ? pickerFocusable(panel)[0] : undefined)
      target?.focus({ preventScroll: true })
    }
    function begin(focus = false) {
      if (inactive) return
      setError('')
      if (!isOpen) {
        setCandidate(editing && selectable(draft) ? draft : current)
        if (panelMonth === undefined)
          setInternalMonth(initialMonth(editing ? draft : current))
        focusRequested.current = focus
        setOpen(true)
      } else if (focus) focusCalendar()
    }
    function restoreFocus() {
      inputRef.current?.focus({ preventScroll: true })
    }
    function cancel(restore = false) {
      setCandidate(current)
      setDraft(current)
      setEditing(false)
      setError('')
      focusRequested.current = false
      setOpen(false)
      if (restore) restoreFocus()
    }
    function publish(next: string) {
      if (inactive || (next && !selectable(next))) return false
      if (!controlled) setInternal(next)
      setEditing(false)
      setDraft(controlled ? current : next)
      setError('')
      if (next !== current) onChange?.(next)
      return true
    }
    function finishInput(confirm = false) {
      if (!editing) return true
      if (draft && !selectable(draft)) {
        setError('请输入可选日期（YYYY-MM-DD）')
        return false
      }
      if (needConfirm && !confirm) {
        setCandidate(draft)
        return true
      }
      const accepted = publish(draft)
      if (accepted && draft && draft.slice(0, 7) !== month)
        changeMonth(draft.slice(0, 7))
      if (accepted && confirm && needConfirm) onOk?.(draft)
      return accepted
    }
    function leave() {
      if (needConfirm) {
        setCandidate(current)
        setDraft(current)
        setEditing(false)
        setError('')
      } else if (editing && !finishInput()) {
        setDraft(current)
        setEditing(false)
        setError(
          current ? '日期不可选，已恢复原日期' : '日期不可选，已清空输入',
        )
      }
      focusRequested.current = false
      setOpen(false)
    }
    function choose(date: string) {
      if (inactive || !selectable(date)) return
      setError('')
      if (needConfirm) {
        setCandidate(date)
        setDraft(date)
        setEditing(false)
      } else {
        publish(date)
        if (mode === 'popup') {
          setOpen(false)
          restoreFocus()
        }
      }
    }
    function confirm() {
      const next = editing ? draft : candidate
      if (!selectable(next) || !publish(next)) return
      onOk?.(next)
      if (mode === 'popup') {
        setOpen(false)
        restoreFocus()
      }
    }
    useLayoutEffect(() => {
      if (isOpen && focusRequested.current) {
        focusRequested.current = false
        focusCalendar()
      }
      const displayed = editing
        ? draft
        : needConfirm && showingPanel
          ? candidate
          : current
      inputRef.current?.setCustomValidity(
        displayed && !selectable(displayed)
          ? '请选择有效且可选的日期'
          : needConfirm && showingPanel && candidate !== current
            ? '请先确认日期'
            : '',
      )
      if (
        !isOpen &&
        inactive &&
        ownedFocus.current &&
        document.activeElement === document.body
      ) {
        const next = pickerFocusable(document.body).find((element) =>
          Boolean(
            (inputRef.current?.compareDocumentPosition(element) ?? 0) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        )
        next?.focus({ preventScroll: true })
        ownedFocus.current = false
      }
    })
    useEffect(() => {
      if (!isOpen) return
      const outside = (event: Event) => {
        if (inside(event.target)) return
        ownedFocus.current = false
        leave()
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
      const reset = () => cancel()
      const submit = () => {
        if (editing && !needConfirm) finishInput()
      }
      form.addEventListener('reset', reset)
      form.addEventListener('submit', submit, true)
      return () => {
        form.removeEventListener('reset', reset)
        form.removeEventListener('submit', submit, true)
      }
    })

    const panel = (
      <div
        id={mode === 'panel' ? popupId : undefined}
        className={cn('min-w-0 space-y-2', classNames?.panel)}
      >
        {presets.length > 0 && (
          <div
            className={cn('flex flex-wrap gap-2', classNames?.presets)}
            role="group"
            aria-label={label + '快捷日期'}
          >
            {presets.map((preset) => (
              <Button
                key={preset.key}
                tabIndex={0}
                variant="outline"
                disabled={
                  inactive ||
                  (typeof preset.value === 'string' &&
                    !selectable(preset.value))
                }
                onClick={() => {
                  const date =
                    typeof preset.value === 'function'
                      ? preset.value()
                      : preset.value
                  if (!selectable(date)) {
                    setError('快捷日期当前不可选，请选择其他日期')
                    return
                  }
                  if (date.slice(0, 7) !== month) changeMonth(date.slice(0, 7))
                  setError('')
                  choose(date)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar
          key={isOpen ? 'open' : 'inline'}
          ref={calendarRef}
          label={label}
          value={needConfirm ? candidate : current}
          month={month}
          onMonthChange={changeMonth}
          onChange={choose}
          minDate={minDate}
          maxDate={maxDate}
          disabledDate={(date) => !selectable(date)}
          disabled={inactive}
          weekStartsOn={weekStartsOn}
          locale={locale}
          renderDate={renderDate}
          getDateDescription={getDateDescription}
          classNames={{
            root: 'border-0 p-0 sm:p-0 rounded-none',
            header: 'mb-2 px-1',
            grid: 'min-w-[308px]',
            cell: 'p-0',
          }}
        />
        {(needConfirm || footer) && (
          <div
            className={cn(
              'flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2',
              classNames?.footer,
            )}
          >
            {footer}
            {needConfirm && (
              <>
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
                    inactive || !selectable(editing ? draft : candidate)
                  }
                  onClick={confirm}
                >
                  确定
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    )
    const displayed = editing
      ? draft
      : needConfirm && showingPanel
        ? candidate
        : current
    const invalid =
      status === 'error' ||
      ariaInvalid ||
      Boolean(error) ||
      (Boolean(displayed) && !selectable(displayed)) ||
      undefined
    return (
      <span
        ref={rootRef}
        dir={direction}
        className={cn(
          'inline-flex w-full min-w-0 flex-col gap-2',
          classNames?.root,
        )}
        onFocusCapture={() => {
          ownedFocus.current = true
        }}
        onBlurCapture={(event) => {
          const target = event.relatedTarget
          if (
            target instanceof Node &&
            !rootRef.current?.contains(target) &&
            !popupRef.current?.contains(target)
          )
            ownedFocus.current = false
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
            name={mode === 'native' ? name : undefined}
            ref={(element) => {
              inputRef.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            type={mode === 'native' ? 'date' : 'text'}
            role={mode === 'popup' ? 'combobox' : undefined}
            aria-label={
              ariaLabel ?? (inputProps['aria-labelledby'] ? undefined : label)
            }
            aria-haspopup={mode === 'popup' ? 'dialog' : undefined}
            aria-expanded={mode === 'popup' ? isOpen : undefined}
            aria-controls={showingPanel ? popupId : undefined}
            aria-invalid={invalid}
            aria-describedby={
              [ariaDescribedBy, error ? errorId : undefined]
                .filter(Boolean)
                .join(' ') || undefined
            }
            data-status={status === 'default' ? undefined : status}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            readOnly={readOnly || (mode !== 'native' && inputReadOnly)}
            autoComplete={inputProps.autoComplete ?? 'off'}
            placeholder={inputProps.placeholder ?? 'YYYY-MM-DD'}
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
            value={displayed}
            onFocus={(event) => {
              onFocus?.(event)
            }}
            onClick={(event) => {
              onClick?.(event)
              if (!event.defaultPrevented && mode === 'popup') begin()
            }}
            onChange={(event) => {
              const next = event.currentTarget.value
              setError('')
              if (mode === 'native') publish(next)
              else {
                setDraft(next)
                setEditing(true)
                if (needConfirm && (!next || selectable(next)))
                  setCandidate(next)
              }
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (event.defaultPrevented || inactive || mode === 'native')
                return
              if (event.key === 'ArrowDown' && mode === 'popup') {
                event.preventDefault()
                begin(true)
              } else if (event.key === 'Escape' && isOpen) {
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
                } else if (mode === 'popup') begin(true)
              }
            }}
          />
          {allowClear && displayed && !inactive && (
            <button
              type="button"
              tabIndex={0}
              aria-label={'清空' + label}
              className={cn(
                'absolute inset-y-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                mode === 'popup' ? 'end-11' : 'end-0',
                classNames?.clear,
              )}
              onClick={() => {
                publish('')
                setCandidate('')
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
                'absolute inset-y-0 end-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
                classNames?.toggle,
              )}
              onClick={() => (isOpen ? cancel(true) : begin(true))}
            >
              {suffixIcon ?? <Icon name="calendar" size={16} />}
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
                  const popup = popupRef.current!
                  const elements = pickerFocusable(popup)
                  const target = event.target as HTMLElement
                  if (event.shiftKey && target === elements[0]) {
                    event.preventDefault()
                    cancel()
                    restoreFocus()
                  } else if (!event.shiftKey && target === elements.at(-1)) {
                    event.preventDefault()
                    setOpen(false)
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
  },
)
