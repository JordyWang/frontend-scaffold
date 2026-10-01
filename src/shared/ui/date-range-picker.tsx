import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type FocusEventHandler,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { DatePickerPanel } from './date-picker-panel'
import {
  DateTimeRangePicker,
  type DateTimeRangePickerProps,
} from './date-time-range-picker'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { addMonths, parseMonth, toMonth } from './date-picker-state'
import {
  parsePickerValue,
  pickerBoundMonth,
  pickerDefaultBounds,
  pickerFormats,
  pickerStepMatches,
  pickerUnitNames,
  pickerValueMonth,
  type DatePickerUnit,
  type DatePeriodUnit,
} from './date-unit-state'
import { Icon } from './icon'
import type { InputStatus, InputVariant } from './input'
import {
  focusAfterPicker,
  pickerFocusable,
  revealPickerTarget,
  usePickerPosition,
  type PickerPlacement,
} from './picker-popup'
import { Portal } from './portal'
import { usePickerPreview } from './picker-preview'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

export { TimeRangePicker } from './time-range-picker'
export type { TimeRange, TimeRangePickerProps } from './time-range-picker'

export type DateRange = [start: string, end: string]
export type DateRangeEndpoint = 'start' | 'end'
export type DateRangePreset = {
  key: string
  label: ReactNode
  value: DateRange | (() => DateRange)
}
export type DateRangePickerPart =
  | 'root'
  | 'fields'
  | 'input'
  | 'startInput'
  | 'endInput'
  | 'clear'
  | 'toggle'
  | 'popup'
  | 'panel'
  | 'endpoints'
  | 'presets'
  | 'footer'
  | 'error'
type DateRangePickerBaseProps = {
  showTime?: false
  value?: DateRange
  defaultValue?: DateRange
  onChange?: (value: DateRange) => void
  onCalendarChange?: (
    value: DateRange,
    info: { endpoint: DateRangeEndpoint },
  ) => void
  onBlur?: FocusEventHandler<HTMLFieldSetElement>
  onFocus?: (
    event: FocusEvent<HTMLInputElement>,
    info: { endpoint: DateRangeEndpoint },
  ) => void
  label?: string
  startLabel?: string
  endLabel?: string
  min?: string
  max?: string
  step?: number | string
  disabledDate?: (
    date: string,
    info: { endpoint: DateRangeEndpoint; from?: string },
  ) => boolean
  disabled?: boolean | [start: boolean, end: boolean]
  readOnly?: boolean
  inputReadOnly?: boolean
  allowEmpty?: [start: boolean, end: boolean]
  allowClear?: boolean
  onClear?: () => void
  needConfirm?: boolean
  previewValue?: false | 'hover'
  onOk?: (value: DateRange) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  activeEndpoint?: DateRangeEndpoint
  defaultActiveEndpoint?: DateRangeEndpoint
  onActiveEndpointChange?: (endpoint: DateRangeEndpoint) => void
  panelMonth?: string
  defaultPanelMonth?: string
  onPanelMonthChange?: (month: string) => void
  placement?: PickerPlacement
  presets?: DateRangePreset[]
  weekStartsOn?: 0 | 1
  locale?: string
  renderDate?: (date: string) => ReactNode
  getDateDescription?: (date: string) => string | undefined
  renderCell?: (value: string, picker: DatePickerUnit) => ReactNode
  getCellDescription?: (
    value: string,
    picker: DatePickerUnit,
  ) => string | undefined
  footer?: ReactNode
  separator?: ReactNode
  name?: string
  form?: string
  id?: string
  endRef?: Ref<HTMLInputElement>
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  required?: boolean
  placeholder?: [start: string, end: string]
  className?: string
  classNames?: Partial<Record<DateRangePickerPart, string>>
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}
type DateOnlyRangePickerProps = DateRangePickerBaseProps &
  (
    | { picker?: 'date'; mode?: 'popup' | 'panel' | 'native' }
    | { picker: DatePeriodUnit; mode?: 'popup' | 'panel' }
  )
export type DateRangeTimeOptions = Pick<
  DateTimeRangePickerProps,
  | 'precision'
  | 'use12Hours'
  | 'hourStep'
  | 'minuteStep'
  | 'secondStep'
  | 'millisecondStep'
  | 'defaultOpenTime'
  | 'hideDisabledOptions'
  | 'changeOnScroll'
  | 'previewValue'
  | 'disabledHours'
  | 'disabledMinutes'
  | 'disabledSeconds'
  | 'disabledMilliseconds'
  | 'disabledTime'
  | 'renderCell'
  | 'getCellDescription'
>
export type DateRangePickerDateTimeProps = DateTimeRangePickerProps & {
  picker?: 'date'
  showTime: true | DateRangeTimeOptions
}
export type DateRangePickerProps =
  DateOnlyRangePickerProps | DateRangePickerDateTimeProps

const asRange = (value?: DateRange): DateRange => [
  value?.[0] ?? '',
  value?.[1] ?? '',
]
const equalRange = (left: DateRange, right: DateRange) =>
  left[0] === right[0] && left[1] === right[1]

/** Pending endpoints remain separate from the submitted unit-string tuple. */
const DateRangePickerControl = forwardRef<
  HTMLInputElement,
  DateOnlyRangePickerProps
>(function DateRangePickerControl(allProps, ref) {
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const {
    value,
    picker = 'date',
    defaultValue,
    onChange,
    onCalendarChange,
    onBlur,
    onFocus,
    label = '日期范围',
    startLabel = '开始' + pickerUnitNames[picker],
    endLabel = '结束' + pickerUnitNames[picker],
    min,
    max,
    step,
    disabledDate,
    disabled = false,
    readOnly = false,
    inputReadOnly = false,
    allowEmpty = [false, false],
    allowClear = true,
    onClear,
    needConfirm = false,
    previewValue = 'hover',
    onOk,
    mode = 'popup',
    open,
    defaultOpen = false,
    onOpenChange,
    activeEndpoint,
    defaultActiveEndpoint = 'start',
    onActiveEndpointChange,
    panelMonth,
    defaultPanelMonth,
    onPanelMonthChange,
    placement = 'bottomStart',
    presets = [],
    weekStartsOn = 1,
    locale,
    renderDate,
    getDateDescription,
    renderCell,
    getCellDescription,
    footer,
    separator = '–',
    name,
    form,
    id,
    endRef,
    size,
    variant = 'outlined',
    status = 'default',
    required = false,
    placeholder = [pickerFormats[picker], pickerFormats[picker]],
    className,
    classNames,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  } = allProps
  const { direction, componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const generated = useId()
  const ids = [id ?? generated + '-start', generated + '-end']
  const labelIds = [generated + '-start-label', generated + '-end-label']
  const popupId = generated + '-popup',
    errorId = generated + '-error'
  const rootRef = useRef<HTMLFieldSetElement>(null)
  const fieldsRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const finishRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const calendarsRef = useRef<HTMLDivElement>(null)
  const initial = useRef(asRange(defaultValue))
  const [internal, setInternal] = useState(initial.current)
  const current = asRange(controlled ? value : internal)
  const currentKey = JSON.stringify(current)
  const [previous, setPrevious] = useState(currentKey)
  const [candidate, setCandidate] = useState(current)
  const [draft, setDraft] = useState(current)
  const [dirty, setDirty] = useState(false)
  const lastEdited = useRef<0 | 1>(0)
  const [internalEndpoint, setInternalEndpoint] = useState(
    defaultActiveEndpoint,
  )
  const endpoint = activeEndpoint ?? internalEndpoint
  const index = endpoint === 'start' ? 0 : 1
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<string>()
  const focusRequested = useRef<DateRangeEndpoint | null>(null)
  const ownedFocus = useRef(false)
  const wasOpen = useRef(false)
  const isDisabled = (part: 0 | 1) =>
    readOnly || (Array.isArray(disabled) ? disabled[part] : disabled)
  const inactive = isDisabled(0) && isDisabled(1)
  const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen)
  const showing = mode === 'panel' || isOpen
  if (inactive && open === undefined && internalOpen) setInternalOpen(false)
  const bounds = pickerDefaultBounds(picker)
  const minDate = parsePickerValue(min, picker) ? min! : bounds[0]
  const maxDate = parsePickerValue(max, picker) ? max! : bounds[1]
  const minMonth = pickerBoundMonth(minDate, picker, 0)
  const maxMonth = pickerBoundMonth(maxDate, picker, 1)
  function selectable(date: string, part: 0 | 1, range: DateRange) {
    const other = part === 0 ? 1 : 0,
      from = range[other] || undefined
    return (
      Boolean(parsePickerValue(date, picker)) &&
      date >= minDate &&
      date <= maxDate &&
      pickerStepMatches(date, picker, min, step) &&
      !(
        isDisabled(other) &&
        from &&
        (part === 0 ? date > from : date < from)
      ) &&
      !disabledDate?.(date, { endpoint: part === 0 ? 'start' : 'end', from })
    )
  }
  function validRange(range: DateRange, complete = false) {
    return (
      range.every((date, part) =>
        date
          ? selectable(date, part as 0 | 1, range)
          : !complete || allowEmpty[part],
      ) &&
      (!range[0] || !range[1] || range[0] <= range[1]) &&
      (!complete || range.some(Boolean))
    )
  }
  function monthFor(date?: string, useDefault = false) {
    const proposed = toMonth(
      (useDefault ? parseMonth(defaultPanelMonth) : undefined) ??
        parseMonth(pickerValueMonth(date, picker)) ??
        parseMonth(defaultPanelMonth) ??
        new Date(),
    )
    return proposed < minMonth
      ? minMonth
      : proposed > maxMonth
        ? maxMonth
        : proposed
  }
  const [internalMonth, setInternalMonth] = useState(() =>
    monthFor(current[index] || current[index === 0 ? 1 : 0], true),
  )
  const month = parseMonth(panelMonth) ? panelMonth! : internalMonth
  const panelSpan =
    picker === 'date' || picker === 'week' ? 1 : picker === 'year' ? 120 : 12
  const nextMonth = toMonth(addMonths(parseMonth(month)!, panelSpan))
  if (previous !== currentKey) {
    setPrevious(currentKey)
    setCandidate(current)
    setDraft(current)
    setDirty(false)
    setError('')
  }
  usePickerPosition(fieldsRef, popupRef, isOpen, placement, direction)
  const inside = (target: EventTarget | null) =>
    target instanceof Node &&
    (rootRef.current?.contains(target) || popupRef.current?.contains(target))
  function setOpen(next: boolean) {
    if (mode !== 'popup' || next === isOpen || (next && inactive)) return
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  function setEndpoint(next: DateRangeEndpoint) {
    onPreview()
    if (next === endpoint) return
    if (activeEndpoint === undefined) setInternalEndpoint(next)
    onActiveEndpointChange?.(next)
    setHovered(undefined)
  }
  function changeMonth(next: string) {
    if (panelMonth === undefined) setInternalMonth(next)
    if (next !== month) onPanelMonthChange?.(next)
  }
  function focusCalendar() {
    const calendars = calendarsRef.current
    if (!calendars) return
    const elements = pickerFocusable(calendars)
    const target =
      elements.find(
        (element) =>
          (element.dataset.calendarDate ?? element.dataset.pickerValue) ===
          candidate[index],
      ) ??
      elements.find(
        (element) =>
          element.hasAttribute('data-calendar-date') ||
          element.hasAttribute('data-picker-value'),
      ) ??
      elements[0]
    if (target) revealPickerTarget(target)
  }
  function begin(part: 0 | 1, focus = false) {
    onPreview()
    if (isDisabled(part) || mode !== 'popup') return
    setError('')
    setEndpoint(part === 0 ? 'start' : 'end')
    if (!isOpen) {
      setCandidate(dirty && validRange(draft) ? draft : current)
      if (panelMonth === undefined) {
        const range = dirty ? draft : current
        setInternalMonth(
          monthFor(range[part] || range[part === 0 ? 1 : 0], true),
        )
      }
      focusRequested.current = focus ? (part === 0 ? 'start' : 'end') : null
      setOpen(true)
    } else if (focus) {
      focusRequested.current = part === 0 ? 'start' : 'end'
      if (part === index) {
        focusRequested.current = null
        focusCalendar()
      }
    }
  }
  function restoreFocus(part: 0 | 1 = index) {
    ;(part === 0 ? startRef.current : finishRef.current)?.focus({
      preventScroll: true,
    })
  }
  function cancel(restore = false) {
    onPreview()
    setCandidate(current)
    setDraft(current)
    setDirty(false)
    setError('')
    setHovered(undefined)
    focusRequested.current = null
    setOpen(false)
    if (restore) restoreFocus()
  }
  function normalize(raw: DateRange, part: 0 | 1): DateRange {
    const next = asRange(raw)
    if (
      next[0] &&
      next[1] &&
      next[0] > next[1] &&
      !isDisabled(part === 0 ? 1 : 0)
    )
      next[part === 0 ? 1 : 0] = ''
    return next
  }
  function publish(next: DateRange) {
    onPreview()
    if (
      inactive ||
      !validRange(next) ||
      next.some(
        (date, part) => isDisabled(part as 0 | 1) && date !== current[part],
      )
    )
      return false
    if (!controlled) setInternal(asRange(next))
    setCandidate(controlled ? current : next)
    setDraft(controlled ? current : next)
    setDirty(false)
    setError('')
    if (!equalRange(next, current)) onChange?.(asRange(next))
    return true
  }
  function commitInput(confirm = false) {
    if (!dirty) return true
    const next = normalize(draft, lastEdited.current)
    if (!validRange(next)) {
      setError('请输入可选的日期范围（' + pickerFormats[picker] + '）')
      return false
    }
    if (needConfirm && !confirm && mode !== 'native') {
      setCandidate(next)
      return true
    }
    if (needConfirm && confirm && !validRange(next, true)) {
      setError('请选择完整的可用日期范围')
      return false
    }
    if (!publish(next)) return false
    if (next[lastEdited.current])
      changeMonth(monthFor(next[lastEdited.current]))
    if (needConfirm && confirm) onOk?.(asRange(next))
    return true
  }
  function leave() {
    onPreview()
    if (dirty && !needConfirm && !commitInput()) {
      setDraft(current)
      setDirty(false)
      setError('日期范围不可选，已恢复原范围')
    } else {
      setCandidate(current)
      if (needConfirm) {
        setDraft(current)
        setDirty(false)
        setError('')
      }
    }
    setHovered(undefined)
    focusRequested.current = null
    setOpen(false)
  }
  function choose(date: string) {
    onPreview()
    if (isDisabled(index) || !selectable(date, index, candidate)) return
    const next = normalize(
      index === 0 ? [date, candidate[1]] : [candidate[0], date],
      index,
    )
    setCandidate(next)
    setDraft(next)
    setDirty(false)
    setError('')
    setHovered(undefined)
    onCalendarChange?.(asRange(next), { endpoint })
    if (
      !needConfirm &&
      validRange(next, true) &&
      (index === 1 || isDisabled(1))
    ) {
      if (publish(next) && mode === 'popup') {
        setOpen(false)
        restoreFocus()
      }
    } else {
      const other = index === 0 ? 1 : 0
      if (!isDisabled(other) && (index === 0 || !next[0])) {
        const nextEndpoint = other === 0 ? 'start' : 'end'
        focusRequested.current = nextEndpoint
        setEndpoint(nextEndpoint)
        changeMonth(monthFor(next[other] || date))
      }
    }
  }
  function confirm() {
    const next = dirty ? normalize(draft, lastEdited.current) : candidate
    if (!validRange(next, true) || !publish(next)) return
    onOk?.(asRange(next))
    if (mode === 'popup') {
      setOpen(false)
      restoreFocus()
    }
  }
  useLayoutEffect(() => {
    if (wasOpen.current && !isOpen && needConfirm) {
      setCandidate(current)
      setDraft(current)
      setDirty(false)
      setHovered(undefined)
      setError('')
    }
    wasOpen.current = isOpen
  }, [isOpen, current, needConfirm])
  useLayoutEffect(() => {
    if (showing && focusRequested.current === endpoint) {
      focusRequested.current = null
      focusCalendar()
    }
    const shown = dirty ? draft : showing ? candidate : current
    for (const [part, field] of [
      startRef.current,
      finishRef.current,
    ].entries()) {
      field?.setCustomValidity(
        inputPreview && part === index && field.required && !shown[part]
          ? '请选择日期'
          : !validRange(shown)
            ? '请选择有效且可选的日期范围'
            : showing && !equalRange(candidate, current)
              ? '请完成或确认日期范围选择'
              : '',
      )
      if (isDisabled(part as 0 | 1)) field?.setCustomValidity('')
    }
    if (
      inactive &&
      ownedFocus.current &&
      document.activeElement === document.body
    ) {
      const next = pickerFocusable(document.body).find((element) =>
        Boolean(
          (finishRef.current?.compareDocumentPosition(element) ?? 0) &
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
    const associatedForm = startRef.current?.form
    if (!associatedForm) return
    const reset = () => {
      if (!controlled) setInternal(initial.current)
      cancel()
    }
    const submit = () => {
      if (dirty && !needConfirm) commitInput()
    }
    associatedForm.addEventListener('reset', reset)
    associatedForm.addEventListener('submit', submit, true)
    return () => {
      associatedForm.removeEventListener('reset', reset)
      associatedForm.removeEventListener('submit', submit, true)
    }
  })
  const shown = dirty ? draft : showing ? candidate : current
  const { preview: inputPreview, onPreview } = usePickerPreview(
    JSON.stringify([
      currentKey,
      candidate,
      showing,
      picker,
      mode,
      endpoint,
      month,
      dirty,
    ]),
    previewValue === 'hover' && showing && !dirty && !isDisabled(index),
    (date) => selectable(date, index, candidate),
  )
  const displayed = inputPreview ? asRange(shown) : shown
  if (inputPreview) displayed[index] = inputPreview
  const invalid =
    status === 'error' ||
    ariaInvalid ||
    Boolean(error) ||
    !validRange(shown) ||
    undefined
  const description =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined
  const preview: DateRange | undefined =
    hovered && !isDisabled(index) && selectable(hovered, index, candidate)
      ? normalize(
          index === 0 ? [hovered, candidate[1]] : [candidate[0], hovered],
          index,
        )
      : undefined
  const panel = (
    <div className={cn('@container min-w-0 space-y-2', classNames?.panel)}>
      <div
        role="group"
        aria-label={label + '选择端点'}
        className={cn('flex flex-wrap gap-2', classNames?.endpoints)}
      >
        {([startLabel, endLabel] as const).map((text, part) => (
          <Button
            key={part}
            tabIndex={0}
            variant={index === part ? 'primary' : 'outline'}
            aria-pressed={index === part}
            disabled={isDisabled(part as 0 | 1)}
            onClick={() => {
              focusRequested.current = part === 0 ? 'start' : 'end'
              setEndpoint(part === 0 ? 'start' : 'end')
              changeMonth(
                monthFor(candidate[part] || candidate[part === 0 ? 1 : 0]),
              )
            }}
          >
            {text}：{candidate[part] || '未选择'}
          </Button>
        ))}
      </div>
      {presets.length > 0 && (
        <div
          role="group"
          aria-label={label + '快捷范围'}
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
                  (!validRange(preset.value, true) ||
                    preset.value.some(
                      (date, part) =>
                        isDisabled(part as 0 | 1) && date !== current[part],
                    )))
              }
              onClick={() => {
                const next = asRange(
                  typeof preset.value === 'function'
                    ? preset.value()
                    : preset.value,
                )
                if (
                  !validRange(next, true) ||
                  next.some(
                    (date, part) =>
                      isDisabled(part as 0 | 1) && date !== current[part],
                  )
                ) {
                  setError('快捷范围当前不可选，请选择其他日期')
                  return
                }
                setCandidate(next)
                setDraft(next)
                setDirty(false)
                setError('')
                setHovered(undefined)
                changeMonth(monthFor(next[0] || next[1]))
                onCalendarChange?.(asRange(next), { endpoint })
                if (!needConfirm && publish(next) && mode === 'popup') {
                  setOpen(false)
                  restoreFocus()
                }
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
      <div
        ref={calendarsRef}
        className="grid min-w-0 gap-4 @min-[660px]:grid-cols-2"
      >
        {[month, nextMonth].map(
          (visibleMonth, offset) =>
            parseMonth(visibleMonth) && (
              <div
                key={offset}
                className={
                  offset === 1 ? 'hidden min-w-0 @min-[660px]:block' : 'min-w-0'
                }
              >
                <DatePickerPanel
                  picker={picker}
                  key={endpoint}
                  label={
                    label +
                    (picker === 'date'
                      ? offset === 0
                        ? '月份'
                        : '后续月份'
                      : offset === 0
                        ? '面板'
                        : '后续面板')
                  }
                  value={candidate[index] || candidate[index === 0 ? 1 : 0]}
                  range={candidate}
                  previewRange={preview}
                  month={visibleMonth}
                  onMonthChange={(next) =>
                    changeMonth(
                      offset === 0
                        ? next
                        : toMonth(addMonths(parseMonth(next)!, -panelSpan)),
                    )
                  }
                  onChange={choose}
                  minDate={minDate}
                  maxDate={maxDate}
                  disabled={isDisabled(index)}
                  disabledDate={(date) => !selectable(date, index, candidate)}
                  showOutsideDays={false}
                  weekStartsOn={weekStartsOn}
                  locale={locale}
                  renderDate={
                    renderCell
                      ? (value) => renderCell(value, picker)
                      : renderDate
                  }
                  getDateDescription={
                    getCellDescription
                      ? (value) => getCellDescription(value, picker)
                      : getDateDescription
                  }
                  onDateHover={setHovered}
                  onDateFocus={setHovered}
                  onPreview={previewValue === 'hover' ? onPreview : undefined}
                  classNames={{
                    root: 'border-0 p-0 sm:p-0 rounded-none',
                    header: 'mb-2 px-1',
                    grid: 'min-w-[308px]',
                    cell: 'p-0',
                  }}
                />
              </div>
            ),
        )}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        请选择{index === 0 ? startLabel : endLabel}；
        {candidate[0] || '未选开始'} → {candidate[1] || '未选结束'}
      </p>
      {(needConfirm || allowEmpty.some(Boolean) || footer) && (
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
              inactive ||
              !validRange(
                dirty ? normalize(draft, lastEdited.current) : candidate,
                true,
              )
            }
            onClick={confirm}
          >
            {needConfirm ? '确定' : '应用范围'}
          </Button>
        </div>
      )}
    </div>
  )
  return (
    <fieldset
      ref={rootRef}
      role="group"
      dir={direction}
      disabled={
        disabled === true ||
        (Array.isArray(disabled) && disabled.every(Boolean))
      }
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? label)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={description}
      aria-invalid={invalid}
      aria-required={required || undefined}
      data-status={status === 'default' ? undefined : status}
      data-daterange-unit={picker}
      className={cn(
        'm-0 grid min-w-0 gap-2 border-0 p-0',
        className,
        classNames?.root,
      )}
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
      <div ref={fieldsRef} className={cn('@container', classNames?.fields)}>
        <div className="grid min-w-0 grid-cols-1 items-end gap-2 @min-[440px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {([startLabel, endLabel] as const).map((text, part) => (
            <div
              key={part}
              className={cn(
                'grid min-w-0 gap-1',
                part === 1 && '@min-[440px]:col-start-3',
              )}
            >
              <label
                id={labelIds[part]}
                htmlFor={ids[part]}
                className="text-sm text-muted-foreground"
              >
                {text}
              </label>
              <span className="relative flex min-w-0">
                <input
                  id={ids[part]}
                  aria-labelledby={labelIds[part]}
                  ref={(element) => {
                    if (part === 0) {
                      startRef.current = element
                      if (typeof ref === 'function') ref(element)
                      else if (ref) ref.current = element
                    } else {
                      finishRef.current = element
                      if (typeof endRef === 'function') endRef(element)
                      else if (endRef) endRef.current = element
                    }
                  }}
                  type={mode === 'native' ? 'date' : 'text'}
                  role={mode === 'popup' ? 'combobox' : undefined}
                  form={form}
                  aria-haspopup={mode === 'popup' ? 'dialog' : undefined}
                  aria-expanded={
                    mode === 'popup' ? isOpen && index === part : undefined
                  }
                  aria-controls={showing ? popupId : undefined}
                  aria-invalid={invalid}
                  aria-describedby={description}
                  min={min}
                  max={max}
                  step={step}
                  required={required && !allowEmpty[part]}
                  disabled={Array.isArray(disabled) ? disabled[part] : disabled}
                  readOnly={readOnly || (mode !== 'native' && inputReadOnly)}
                  autoComplete="off"
                  placeholder={placeholder[part]}
                  value={displayed[part]}
                  data-picker-preview={
                    inputPreview && part === index ? 'hover' : undefined
                  }
                  className={cn(
                    inputStyles,
                    inputVariantStyles[variant],
                    inputStatusStyles[status],
                    inputSizeStyles[resolvedSize],
                    'min-w-0 touch-manipulation focus-visible:border-ring',
                    mode === 'popup' && 'pe-12',
                    allowClear &&
                      shown[part] &&
                      !isDisabled(part as 0 | 1) &&
                      (mode === 'popup' ? 'pe-24' : 'pe-12'),
                    classNames?.input,
                    part === 0 ? classNames?.startInput : classNames?.endInput,
                  )}
                  onFocus={(event) => {
                    setEndpoint(part === 0 ? 'start' : 'end')
                    if (isOpen)
                      changeMonth(
                        monthFor(shown[part] || shown[part === 0 ? 1 : 0]),
                      )
                    onFocus?.(event, { endpoint: part === 0 ? 'start' : 'end' })
                  }}
                  onClick={() => begin(part as 0 | 1)}
                  onChange={(event) => {
                    onPreview()
                    const next = asRange(draft)
                    next[part] = event.currentTarget.value
                    lastEdited.current = part as 0 | 1
                    setError('')
                    if (mode === 'native')
                      publish(normalize(next, part as 0 | 1))
                    else {
                      setDraft(next)
                      setDirty(true)
                    }
                  }}
                  onKeyDown={(event) => {
                    onPreview()
                    if (isDisabled(part as 0 | 1) || mode === 'native') return
                    if (event.key === 'ArrowDown' && mode === 'popup') {
                      event.preventDefault()
                      begin(part as 0 | 1, true)
                    } else if (event.key === 'Escape' && isOpen) {
                      event.preventDefault()
                      event.stopPropagation()
                      cancel(true)
                    } else if (event.key === 'Enter') {
                      event.preventDefault()
                      if (dirty) {
                        if (commitInput(true) && mode === 'popup') {
                          setOpen(false)
                          restoreFocus(part as 0 | 1)
                        }
                      } else begin(part as 0 | 1, true)
                    }
                  }}
                />
                {allowClear && shown[part] && !isDisabled(part as 0 | 1) && (
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label={'清空' + text}
                    data-range-clear={part}
                    className={cn(
                      'absolute inset-y-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                      mode === 'popup' ? 'end-11' : 'end-0',
                      classNames?.clear,
                    )}
                    onClick={() => {
                      const next = asRange(current)
                      next[part] = ''
                      publish(next)
                      setOpen(false)
                      onClear?.()
                      restoreFocus(part as 0 | 1)
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
                {mode === 'popup' && (
                  <button
                    type="button"
                    tabIndex={0}
                    disabled={isDisabled(part as 0 | 1)}
                    aria-label={'打开' + text + '面板'}
                    aria-expanded={isOpen && index === part}
                    aria-controls={isOpen ? popupId : undefined}
                    className={cn(
                      'absolute inset-y-0 end-0 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
                      classNames?.toggle,
                    )}
                    onClick={() =>
                      isOpen && index === part
                        ? cancel(true)
                        : begin(part as 0 | 1, true)
                    }
                  >
                    <Icon name="calendar" size={16} />
                  </button>
                )}
              </span>
            </div>
          ))}
          <span
            aria-hidden="true"
            className="hidden min-h-11 items-center justify-center text-muted-foreground @min-[440px]:col-start-2 @min-[440px]:row-start-1 @min-[440px]:flex"
          >
            {separator}
          </span>
        </div>
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          form={form}
          value={JSON.stringify(current)}
          disabled={
            disabled === true ||
            (Array.isArray(disabled) && disabled.every(Boolean))
          }
          readOnly
        />
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className={cn('block text-sm text-destructive', classNames?.error)}
        >
          {error}
        </span>
      )}
      {mode === 'panel' && <div id={popupId}>{panel}</div>}
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
                  cancel()
                  focusAfterPicker(
                    finishRef.current!,
                    popup,
                    (element) =>
                      element.hasAttribute('data-range-clear') &&
                      !current[Number(element.dataset.rangeClear)],
                  )
                }
              }
            }}
          >
            {panel}
          </div>
        </Portal>
      )}
    </fieldset>
  )
})

export const DateRangePicker = forwardRef<
  HTMLInputElement,
  DateRangePickerProps
>(function DateRangePicker(props, ref) {
  if (props.showTime) {
    const { showTime, picker, ...dateTimeProps } = props
    void picker
    return (
      <DateTimeRangePicker
        {...dateTimeProps}
        {...(typeof showTime === 'object' ? showTime : {})}
        ref={ref}
      />
    )
  }
  const { showTime, ...dateProps } = props
  void showTime
  return (
    <DateRangePickerControl
      {...dateProps}
      key={dateProps.picker ?? 'date'}
      ref={ref}
    />
  )
})
