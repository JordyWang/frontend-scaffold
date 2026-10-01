import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { DatePickerPanel } from './date-picker-panel'
import { resolveComponentSize, useConfig } from './config-context'
import type { DatePickerPart, SingleDatePickerProps } from './date-picker'
import { parseMonth, toMonth } from './date-picker-state'
import {
  parsePickerValue,
  pickerBoundMonth,
  pickerDefaultBounds,
  pickerUnitNames,
  pickerStepMatches,
  pickerValueMonth,
  type DatePickerUnit,
} from './date-unit-state'
import { Icon } from './icon'
import {
  focusAfterPicker,
  pickerFocusable,
  revealPickerTarget,
  usePickerPosition,
} from './picker-popup'
import { Portal } from './portal'
import { usePickerPreview } from './picker-preview'
import { usePickerFormat } from './picker-format'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

export type DateMultiple = string[]
export type MultiDatePickerPreset = {
  key: string
  label: ReactNode
  value: string[] | (() => string[])
}
export type MultiDatePickerPart =
  DatePickerPart | 'tags' | 'tag' | 'tagRemove' | 'overflow' | 'summary'
export type MultiDatePickerProps = Omit<
  SingleDatePickerProps,
  | 'multiple'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onOk'
  | 'onBlur'
  | 'presets'
  | 'classNames'
  | 'mode'
  | 'picker'
> & {
  multiple?: true
  picker?: DatePickerUnit
  value?: DateMultiple
  defaultValue?: DateMultiple
  onChange?: (value: DateMultiple) => void
  onCalendarChange?: (value: DateMultiple) => void
  onOk?: (value: DateMultiple) => void
  onBlur?: FocusEventHandler<HTMLDivElement>
  presets?: MultiDatePickerPreset[]
  mode?: 'popup' | 'panel'
  order?: boolean
  maxCount?: number
  maxTagCount?: number
  renderTag?: (date: string) => ReactNode
  classNames?: Partial<Record<MultiDatePickerPart, string>>
}

/** A multiple-date session keeps pending selections out of the submitted JSON list. */
export const MultiDatePicker = forwardRef<
  HTMLInputElement,
  MultiDatePickerProps
>(function MultiDatePicker(allProps, ref) {
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const {
    multiple = true,
    picker = 'date',
    value,
    defaultValue = [],
    onChange,
    onCalendarChange,
    onOk,
    onBlur,
    order = true,
    maxCount,
    maxTagCount = 3,
    renderTag,
    mode = 'popup',
    label = '多选' + pickerUnitNames[picker],
    size,
    variant = 'outlined',
    status = 'default',
    open,
    defaultOpen = false,
    onOpenChange,
    allowClear = true,
    onClear,
    needConfirm = false,
    previewValue = 'hover',
    disabledDate,
    panelMonth,
    defaultPanelMonth,
    onPanelMonthChange,
    placement = 'bottomStart',
    presets = [],
    weekStartsOn = 1,
    locale,
    format,
    parseInput,
    inputReadOnly = false,
    renderDate,
    getDateDescription,
    renderCell,
    getCellDescription,
    footer,
    suffixIcon,
    classNames,
    className,
    disabled = false,
    readOnly = false,
    min,
    max,
    step,
    required = false,
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
  const presentation = usePickerFormat({
    kind: 'date',
    picker,
    format,
    parseInput,
    locale,
  })
  const generated = useId(),
    popupId = generated + '-popup',
    errorId = generated + '-error',
    summaryId = generated + '-summary'
  const rootRef = useRef<HTMLDivElement>(null),
    inputRef = useRef<HTMLInputElement>(null),
    popupRef = useRef<HTMLDivElement>(null),
    calendarRef = useRef<HTMLDivElement>(null)
  const focusRequested = useRef(false),
    ownedFocus = useRef(false)
  const endingSession = useRef(false),
    wasOpen = useRef(false)
  function normalize(dates?: string[]) {
    const unique = [...new Set(Array.isArray(dates) ? dates : [])]
    return order ? unique.sort() : unique
  }
  const initial = useRef(normalize(defaultValue))
  const [internal, setInternal] = useState(initial.current)
  const current = normalize(controlled ? value : internal),
    currentKey = JSON.stringify(current)
  const [previous, setPrevious] = useState(currentKey)
  const [candidate, setCandidate] = useState(current)
  const [draft, setDraft] = useState(''),
    [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const inactive = disabled || readOnly
  const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen)
  const showing = mode === 'panel' || isOpen
  if (inactive && open === undefined && internalOpen) setInternalOpen(false)
  const [previousPresentation, setPreviousPresentation] = useState(presentation)
  if (previousPresentation !== presentation) {
    setPreviousPresentation(presentation)
    setDraft('')
    setError('')
  }
  if (previous !== currentKey) {
    setPrevious(currentKey)
    setCandidate(current)
    setDraft('')
    setError('')
  }
  const bounds = pickerDefaultBounds(picker)
  const minDate = parsePickerValue(min, picker) ? min! : bounds[0],
    maxDate = parsePickerValue(max, picker) ? max! : bounds[1]
  const minMonth = pickerBoundMonth(minDate, picker, 0),
    maxMonth = pickerBoundMonth(maxDate, picker, 1)
  const limit =
    maxCount !== undefined && Number.isFinite(maxCount)
      ? Math.max(0, Math.floor(maxCount))
      : Infinity
  const tagLimit = Number.isFinite(maxTagCount)
    ? Math.max(0, Math.floor(maxTagCount))
    : Infinity
  function selectable(date: string) {
    return (
      Boolean(parsePickerValue(date, picker)) &&
      date >= minDate &&
      date <= maxDate &&
      pickerStepMatches(date, picker, min, step) &&
      !disabledDate?.(date)
    )
  }
  const valid = (dates: string[]) =>
    dates.every(selectable) && dates.length <= limit
  const equal = (left: string[], right: string[]) =>
    JSON.stringify(normalize(left)) === JSON.stringify(normalize(right))
  function initialMonth(dates: string[]) {
    const proposed = toMonth(
      parseMonth(defaultPanelMonth) ??
        dates
          .map((date) => parseMonth(pickerValueMonth(date, picker)))
          .find(Boolean) ??
        new Date(),
    )
    return proposed < minMonth
      ? minMonth
      : proposed > maxMonth
        ? maxMonth
        : proposed
  }
  const [internalMonth, setInternalMonth] = useState(() =>
    initialMonth(current),
  )
  const month = parseMonth(panelMonth) ? panelMonth! : internalMonth
  const displayed = showing ? candidate : current
  usePickerPosition(inputRef, popupRef, isOpen, placement, direction)
  function inside(target: EventTarget | null) {
    return (
      target instanceof Node &&
      (rootRef.current?.contains(target) || popupRef.current?.contains(target))
    )
  }
  function setOpen(next: boolean) {
    if (mode !== 'popup' || next === isOpen || (next && inactive)) return
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  function changeMonth(next: string) {
    if (panelMonth === undefined) setInternalMonth(next)
    if (next !== month) onPanelMonthChange?.(next)
  }
  function focusCalendar() {
    const calendar = calendarRef.current
    const target =
      calendar?.querySelector<HTMLElement>(
        '[data-calendar-date][tabindex="0"],[data-picker-value][tabindex="0"]',
      ) ?? (calendar ? pickerFocusable(calendar)[0] : undefined)
    if (target) revealPickerTarget(target)
  }
  function begin(focus = false) {
    if (inactive || mode !== 'popup') return
    endingSession.current = false
    if (!isOpen) {
      setCandidate(current)
      setError('')
      if (panelMonth === undefined) setInternalMonth(initialMonth(current))
      focusRequested.current = focus
      setOpen(true)
    } else if (focus) focusCalendar()
  }
  const restoreFocus = () => inputRef.current?.focus({ preventScroll: true })
  function cancel(restore = false) {
    onPreview()
    endingSession.current = true
    setCandidate(current)
    setDraft('')
    setError('')
    focusRequested.current = false
    setOpen(false)
    if (restore) restoreFocus()
  }
  function pending(next: string[]) {
    endingSession.current = false
    const dates = normalize(next)
    setCandidate(dates)
    setDraft('')
    setError('')
    onCalendarChange?.([...dates])
  }
  function publish(next: string[], removing = false) {
    const dates = normalize(next)
    const removesExisting =
      removing &&
      dates.length < current.length &&
      dates.every((date) => current.includes(date))
    if (inactive || (!valid(dates) && !removesExisting)) return false
    if (!controlled) setInternal(dates)
    setCandidate(controlled ? current : dates)
    setDraft('')
    setError('')
    if (!equal(dates, current)) onChange?.([...dates])
    return true
  }
  function addDraft() {
    const base = showing ? candidate : current
    if (!draft.trim()) return base
    const date = presentation.parse(draft)
    if (!date || !selectable(date)) {
      setError('请输入可选日期（' + presentation.hint + '）')
      return undefined
    }
    const next = normalize([...base, date])
    if (next.length > limit) {
      setError('最多选择 ' + limit + (picker === 'date' ? ' 个日期' : ' 项'))
      return undefined
    }
    return next
  }
  function finish() {
    onPreview()
    const dates = addDraft()
    if (!dates || !valid(dates) || (required && dates.length === 0)) {
      if (dates)
        setError(
          required && dates.length === 0
            ? '请选择至少一个日期'
            : '已选日期当前不可用，请移除或调整选择',
        )
      return
    }
    if (!publish(dates)) return
    endingSession.current = true
    onOk?.([...dates])
    setOpen(false)
    if (mode === 'popup') restoreFocus()
  }
  function leave() {
    onPreview()
    // React composite blur and document focusin can finish the same session.
    if (endingSession.current) return
    endingSession.current = true
    if (needConfirm) cancel()
    else {
      const dates = addDraft()
      if (!dates || !publish(dates)) {
        setCandidate(current)
        setDraft('')
        setError('日期不可选，已恢复已选日期')
      }
      setOpen(false)
      focusRequested.current = false
    }
  }
  function choose(date: string) {
    onPreview()
    if (inactive || !selectable(date)) return
    if (!candidate.includes(date) && candidate.length >= limit) {
      setError('最多选择 ' + limit + (picker === 'date' ? ' 个日期' : ' 项'))
      return
    }
    pending(
      candidate.includes(date)
        ? candidate.filter((item) => item !== date)
        : [...candidate, date],
    )
  }
  function remove(date: string) {
    if (inactive) return
    const next = displayed.filter((item) => item !== date)
    if (showing) pending(next)
    else publish(next, true)
    restoreFocus()
  }
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) endingSession.current = false
    if (!isOpen && wasOpen.current && !endingSession.current) {
      // An external close discards the session before it can be reopened.
      endingSession.current = true
      setCandidate(current)
      setDraft('')
      setError('')
      focusRequested.current = false
    }
    wasOpen.current = isOpen
  }, [isOpen, current])
  useLayoutEffect(() => {
    if (isOpen && focusRequested.current) {
      focusRequested.current = false
      focusCalendar()
    }
    inputRef.current?.setCustomValidity(
      draft &&
        (!presentation.parse(draft) || !selectable(presentation.parse(draft)!))
        ? '请输入有效且可选的日期'
        : !valid(displayed)
          ? '已选日期当前不可用'
          : showing && !equal(candidate, current)
            ? '请完成或确认日期选择'
            : required && !current.length
              ? '请选择至少一个日期'
              : '',
    )
    if (ownedFocus.current && document.activeElement === document.body) {
      if (inactive) {
        const next = pickerFocusable(document.body).find((element) =>
          Boolean(
            (inputRef.current?.compareDocumentPosition(element) ?? 0) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        )
        next?.focus({ preventScroll: true })
        ownedFocus.current = false
      } else restoreFocus()
    }
  })
  useEffect(() => {
    if (!isOpen) return
    const outside = (event: Event) => {
      if (!inside(event.target)) {
        ownedFocus.current = false
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
    const reset = () => {
      if (!controlled) setInternal(initial.current)
      cancel()
    }
    const submit = () => {
      if (!needConfirm) leave()
    }
    form.addEventListener('reset', reset)
    form.addEventListener('submit', submit, true)
    return () => {
      form.removeEventListener('reset', reset)
      form.removeEventListener('submit', submit, true)
    }
  })
  const description = [ariaDescribedBy, summaryId, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ')
  const invalid =
    status === 'error' ||
    ariaInvalid === true ||
    (typeof ariaInvalid === 'string' && ariaInvalid !== 'false') ||
    Boolean(error) ||
    !valid(displayed) ||
    undefined
  const { preview, onPreview } = usePickerPreview(
    JSON.stringify([currentKey, candidate, showing, picker, month, draft]),
    previewValue === 'hover' && showing && !draft && !inactive,
    (date) =>
      selectable(date) &&
      (candidate.includes(date) || candidate.length < limit),
  )
  const panel = (
    <div
      id={mode === 'panel' ? popupId : undefined}
      className={cn('min-w-0 space-y-2', classNames?.panel)}
    >
      {presets.length > 0 && (
        <div
          role="group"
          aria-label={label + '快捷日期'}
          className={cn('flex flex-wrap gap-2', classNames?.presets)}
        >
          {presets.map((preset) => (
            <Button
              key={preset.key}
              tabIndex={0}
              variant="outline"
              disabled={
                inactive ||
                (typeof preset.value !== 'function' &&
                  !valid(normalize(preset.value)))
              }
              onClick={() => {
                const dates = normalize(
                  typeof preset.value === 'function'
                    ? preset.value()
                    : preset.value,
                )
                if (!valid(dates)) {
                  setError('快捷日期当前不可选，请选择其他日期')
                  return
                }
                pending(dates)
                if (dates.length)
                  changeMonth(
                    pickerValueMonth(
                      dates.find((date) => selectable(date)),
                      picker,
                    )!,
                  )
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
      <DatePickerPanel
        picker={picker}
        ref={calendarRef}
        key={isOpen ? 'open' : 'inline'}
        label={label}
        value={candidate.find((date) => selectable(date)) ?? ''}
        selectedDates={candidate}
        month={month}
        onMonthChange={changeMonth}
        onChange={choose}
        onPreview={previewValue === 'hover' ? onPreview : undefined}
        minDate={minDate}
        maxDate={maxDate}
        disabledDate={(date) =>
          !selectable(date) ||
          (candidate.length >= limit && !candidate.includes(date))
        }
        disabled={inactive}
        weekStartsOn={weekStartsOn}
        locale={locale}
        renderDate={
          renderCell ? (date) => renderCell(date, picker) : renderDate
        }
        getDateDescription={
          getCellDescription
            ? (date) => getCellDescription(date, picker)
            : getDateDescription
        }
        classNames={{
          root: 'border-0 p-0 sm:p-0 rounded-none',
          header: 'mb-2 px-1',
          grid: 'min-w-[308px]',
          cell: 'p-0',
        }}
      />
      <p role="status" className="text-sm text-muted-foreground">
        已选 {candidate.length}
        {picker === 'date' ? ' 个日期' : ' 项'}
        {Number.isFinite(limit) ? '，最多 ' + limit + ' 个' : ''}
      </p>
      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2',
          classNames?.footer,
        )}
      >
        {footer}
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
            inactive || !valid(candidate) || (required && !candidate.length)
          }
          onClick={finish}
        >
          {needConfirm ? '确定' : '完成'}
        </Button>
      </div>
    </div>
  )
  return (
    <div
      ref={rootRef}
      dir={direction}
      data-datepicker-multiple={multiple}
      data-datepicker-unit={picker}
      className={cn('flex w-full min-w-0 flex-col gap-2', classNames?.root)}
      onFocusCapture={() => {
        ownedFocus.current = true
      }}
      onBlurCapture={(event) => {
        if (event.relatedTarget && !inside(event.relatedTarget))
          ownedFocus.current = false
      }}
      onBlur={(event) => {
        if (inside(event.relatedTarget)) return
        leave()
        onBlur?.(event)
      }}
    >
      <span className="relative inline-flex min-w-0">
        <input
          {...inputProps}
          id={inputProps.id ?? generated + '-input'}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type="text"
          role={mode === 'popup' ? 'combobox' : undefined}
          aria-label={
            ariaLabel ?? (inputProps['aria-labelledby'] ? undefined : label)
          }
          aria-haspopup={mode === 'popup' ? 'dialog' : undefined}
          aria-expanded={mode === 'popup' ? isOpen : undefined}
          aria-controls={showing ? popupId : undefined}
          aria-invalid={invalid}
          aria-describedby={description}
          aria-required={required || undefined}
          autoComplete={inputProps.autoComplete ?? 'off'}
          placeholder={
            inputProps.placeholder ??
            (inputReadOnly
              ? '选择多个' + pickerUnitNames[picker]
              : presentation.hint + '，Enter 添加')
          }
          disabled={disabled}
          readOnly={readOnly || inputReadOnly}
          value={preview ? presentation.display(preview) : draft}
          data-picker-preview={preview ? 'hover' : undefined}
          className={cn(
            inputStyles,
            inputVariantStyles[variant],
            inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            'min-w-0 touch-manipulation',
            mode === 'popup' && 'pe-12',
            allowClear &&
              displayed.length > 0 &&
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
            onPreview()
            endingSession.current = false
            setDraft(presentation.maskInput(event.currentTarget.value))
            setError('')
          }}
          onKeyDown={(event) => {
            onPreview()
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
                endingSession.current = false
                setError('')
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
            onKeyDown?.(event)
            if (event.defaultPrevented || inactive) return
            if (event.key === 'ArrowDown' && mode === 'popup') {
              event.preventDefault()
              begin(true)
            } else if (event.key === 'Escape' && (isOpen || Boolean(draft))) {
              event.preventDefault()
              event.stopPropagation()
              cancel(true)
            } else if (
              (event.key === 'Backspace' || event.key === 'Delete') &&
              !draft &&
              displayed.length
            ) {
              event.preventDefault()
              remove(displayed.at(-1)!)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              if (draft.trim()) {
                const dates = addDraft()
                if (dates) {
                  if (mode === 'popup' && !isOpen) {
                    setOpen(true)
                  }
                  changeMonth(
                    pickerValueMonth(presentation.parse(draft), picker)!,
                  )
                  pending(dates)
                }
              } else if (showing) finish()
              else begin(true)
            }
          }}
        />
        {allowClear && displayed.length > 0 && !inactive && (
          <button
            type="button"
            aria-label={'清空' + label}
            data-multi-clear
            className={cn(
              'absolute inset-y-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
              mode === 'popup' ? 'end-11' : 'end-0',
              classNames?.clear,
            )}
            onClick={() => {
              publish([])
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
            aria-label={'打开' + label + '面板'}
            disabled={inactive}
            aria-expanded={isOpen}
            aria-controls={isOpen ? popupId : undefined}
            className={cn(
              'absolute inset-y-0 end-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
              classNames?.toggle,
            )}
            onClick={() => (isOpen ? cancel(true) : begin(true))}
          >
            <span aria-hidden="true">
              {suffixIcon ?? <Icon name="calendar" size={16} />}
            </span>
          </button>
        )}
      </span>
      {displayed.length > 0 && (
        <ul
          aria-label={label + '已选日期'}
          className={cn(
            'm-0 flex min-w-0 list-none flex-wrap gap-2 p-0',
            classNames?.tags,
          )}
        >
          {(expanded ? displayed : displayed.slice(0, tagLimit)).map((date) => (
            <li
              key={date}
              className={cn(
                'flex min-h-11 max-w-full items-center rounded-[var(--ui-field-radius)] border border-border bg-muted text-muted-foreground',
                classNames?.tag,
              )}
            >
              <span className="min-w-0 break-words px-3 py-2 text-sm">
                {renderTag?.(date) ?? presentation.display(date)}
              </span>
              {!inactive && (
                <button
                  type="button"
                  aria-label={
                    '移除' +
                    pickerUnitNames[picker] +
                    ' ' +
                    presentation.display(date)
                  }
                  data-multi-remove={date}
                  className={cn(
                    'flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                    classNames?.tagRemove,
                  )}
                  onClick={() => remove(date)}
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </li>
          ))}
          {displayed.length > tagLimit && (
            <li>
              <Button
                variant="outline"
                size="small"
                aria-expanded={expanded}
                className={classNames?.overflow}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded
                  ? picker === 'date'
                    ? '收起日期'
                    : '收起选择'
                  : '另外 ' +
                    (displayed.length - tagLimit) +
                    (picker === 'date' ? ' 个日期' : ' 项')}
              </Button>
            </li>
          )}
        </ul>
      )}
      <span
        id={summaryId}
        role="status"
        className={cn('text-sm text-muted-foreground', classNames?.summary)}
      >
        {showing && !equal(candidate, current) ? '待提交' : '已选'}{' '}
        {displayed.length}
        {picker === 'date' ? ' 个日期' : ' 项'}
      </span>
      {name && (
        <input
          type="hidden"
          name={name}
          form={inputProps.form}
          value={JSON.stringify(current)}
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
                  focusAfterPicker(
                    inputRef.current!,
                    popup,
                    (element) =>
                      needConfirm &&
                      element.hasAttribute('data-multi-clear') &&
                      !current.length,
                  )
                }
              }
            }}
          >
            {panel}
          </div>
        </Portal>
      )}
    </div>
  )
})
