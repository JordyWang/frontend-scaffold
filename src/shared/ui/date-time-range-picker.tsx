import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FocusEventHandler,
  type ReactNode,
  type Ref,
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
  parseDateTime,
  nativeDateTimeInput,
  dateTimeMilliseconds,
  dateTimeSelectable,
  type DateTimeConstraints,
} from './date-time-picker-state'
import {
  timeNow,
  defaultTimeStep,
  type TimePrecision,
  type TimeUnit,
} from './time-picker-state'

export type DateTimeRange = [start: string, end: string]
export type DateTimeRangeEndpoint = 'start' | 'end'
export type DateTimeRangeInfo = {
  endpoint: DateTimeRangeEndpoint
  from?: string
}
export type DateTimeRangePreset = {
  key: string
  label: ReactNode
  value: DateTimeRange | (() => DateTimeRange)
}
export type DateTimeRangePickerPart =
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
  | 'switcher'
  | 'calendar'
  | 'time'
  | 'columns'
  | 'column'
  | 'option'
  | 'footer'
  | 'error'
export type DateTimeRangePickerProps = Omit<
  DateTimeConstraints,
  | 'precision'
  | 'stepBase'
  | 'disabledDate'
  | 'disabledHours'
  | 'disabledMinutes'
  | 'disabledSeconds'
  | 'disabledMilliseconds'
  | 'disabledTime'
> &
  PickerFormatProps & {
    value?: DateTimeRange
    defaultValue?: DateTimeRange
    onChange?: (value: DateTimeRange) => void
    onCalendarChange?: (
      value: DateTimeRange,
      info: { endpoint: DateTimeRangeEndpoint; part: 'date' | 'time' },
    ) => void
    onBlur?: FocusEventHandler<HTMLFieldSetElement>
    onFocus?: (
      event: FocusEvent<HTMLInputElement>,
      info: { endpoint: DateTimeRangeEndpoint },
    ) => void
    label?: string
    startLabel?: string
    endLabel?: string
    mode?: 'popup' | 'panel' | 'native'
    precision?: TimePrecision
    use12Hours?: boolean
    disabledDate?: (date: string, info: DateTimeRangeInfo) => boolean
    disabledHours?: (date: string, info: DateTimeRangeInfo) => number[]
    disabledMinutes?: (
      hour: number,
      date: string,
      info: DateTimeRangeInfo,
    ) => number[]
    disabledSeconds?: (
      hour: number,
      minute: number,
      date: string,
      info: DateTimeRangeInfo,
    ) => number[]
    disabledMilliseconds?: (
      hour: number,
      minute: number,
      second: number,
      date: string,
      info: DateTimeRangeInfo,
    ) => number[]
    disabledTime?: (value: string, info: DateTimeRangeInfo) => boolean
    disabled?: boolean | [start: boolean, end: boolean]
    readOnly?: boolean
    inputReadOnly?: boolean
    hideDisabledOptions?: boolean
    changeOnScroll?: boolean
    previewValue?: false | 'hover'
    allowEmpty?: [start: boolean, end: boolean]
    allowClear?: boolean
    onClear?: () => void
    needConfirm?: boolean
    onOk?: (value: DateTimeRange) => void
    order?: 'clear' | 'sort'
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    activeEndpoint?: DateTimeRangeEndpoint
    defaultActiveEndpoint?: DateTimeRangeEndpoint
    onActiveEndpointChange?: (endpoint: DateTimeRangeEndpoint) => void
    defaultOpenTime?: [start: string, end: string]
    panelMonth?: string
    defaultPanelMonth?: string
    onPanelMonthChange?: (month: string) => void
    weekStartsOn?: 0 | 1
    locale?: string
    renderDate?: (date: string, info: DateTimeRangeInfo) => ReactNode
    getDateDescription?: (
      date: string,
      info: DateTimeRangeInfo,
    ) => string | undefined
    placement?: PickerPlacement
    presets?: DateTimeRangePreset[]
    showNow?: boolean
    renderCell?: (
      value: number,
      unit: TimeUnit,
      info: DateTimeRangeInfo,
    ) => ReactNode
    getCellDescription?: (
      value: number,
      unit: TimeUnit,
      info: DateTimeRangeInfo,
    ) => string | undefined
    footer?: ReactNode
    separator?: ReactNode
    suffixIcon?: ReactNode
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
    classNames?: Partial<Record<DateTimeRangePickerPart, string>>
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-label'?: string
    'aria-labelledby'?: string
  }
const asRange = (value?: DateTimeRange): DateTimeRange => [
  value?.[0] ?? '',
  value?.[1] ?? '',
]
const equalRange = (left: DateTimeRange, right: DateTimeRange) =>
  left[0] === right[0] && left[1] === right[1]
const reversed = (range: DateTimeRange) =>
  Boolean(
    parseDateTime(range[0]) &&
    parseDateTime(range[1]) &&
    dateTimeMilliseconds(range[0]) > dateTimeMilliseconds(range[1]),
  )

const DateTimeRangePickerControl = forwardRef<
  HTMLInputElement,
  DateTimeRangePickerProps & { precision: TimePrecision }
>(function DateTimeRangePickerControl(allProps, ref) {
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const {
    value,
    defaultValue,
    onChange,
    onCalendarChange,
    onBlur,
    onFocus,
    label = '日期时间范围',
    startLabel = '开始日期时间',
    endLabel = '结束日期时间',
    min,
    max,
    step,
    hourStep,
    minuteStep,
    secondStep,
    millisecondStep,
    precision,
    disabledDate,
    disabledHours,
    disabledMinutes,
    disabledSeconds,
    disabledMilliseconds,
    disabledTime,
    disabled = false,
    readOnly = false,
    inputReadOnly = false,
    hideDisabledOptions = false,
    changeOnScroll = false,
    previewValue = 'hover',
    allowEmpty = [false, false],
    allowClear = true,
    onClear,
    needConfirm = true,
    onOk,
    order = 'clear',
    mode = 'popup',
    use12Hours = false,
    format,
    parseInput,
    open,
    defaultOpen = false,
    onOpenChange,
    activeEndpoint,
    defaultActiveEndpoint = 'start',
    onActiveEndpointChange,
    defaultOpenTime,
    panelMonth,
    defaultPanelMonth,
    onPanelMonthChange,
    weekStartsOn = 1,
    locale,
    renderDate,
    getDateDescription,
    placement = 'bottomStart',
    presets = [],
    showNow = false,
    renderCell,
    getCellDescription,
    footer,
    separator = '–',
    suffixIcon,
    name,
    form,
    id,
    endRef,
    size,
    variant = 'outlined',
    status = 'default',
    required = false,
    placeholder,
    className,
    classNames,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
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
  const generated = useId(),
    ids = [id ?? generated + '-start', generated + '-end'],
    labelIds = [generated + '-start-label', generated + '-end-label'],
    popupId = generated + '-popup',
    errorId = generated + '-error'
  const rootRef = useRef<HTMLFieldSetElement>(null),
    fieldsRef = useRef<HTMLDivElement>(null),
    startRef = useRef<HTMLInputElement>(null),
    finishRef = useRef<HTMLInputElement>(null),
    popupRef = useRef<HTMLDivElement>(null),
    panelRef = useRef<HTMLDivElement>(null)
  const pointerInside = useRef(false)
  const initial = useRef(asRange(defaultValue))
  const [internal, setInternal] = useState(initial.current)
  const current = useMemo(
    () => asRange(controlled ? value : internal),
    [controlled, value, internal],
  )
  const currentKey = JSON.stringify(current)
  const display = useCallback(
    (range: DateTimeRange): DateTimeRange => [
      presentation.display(range[0]),
      presentation.display(range[1]),
    ],
    [presentation],
  )
  const [previous, setPrevious] = useState(currentKey),
    [candidate, setCandidate] = useState(current),
    [draft, setDraft] = useState(display(current)),
    [dirty, setDirty] = useState(false),
    [internalEndpoint, setInternalEndpoint] = useState(defaultActiveEndpoint),
    [internalOpen, setInternalOpen] = useState(defaultOpen),
    [error, setError] = useState('')
  const lastEdited = useRef<0 | 1>(0),
    focusRequested = useRef<DateTimeRangeEndpoint | null>(null),
    ownedFocus = useRef(false),
    wasOpen = useRef(false)
  const isDisabled = (part: 0 | 1) =>
    readOnly || (Array.isArray(disabled) ? disabled[part] : disabled)
  const endpoint =
      activeEndpoint ??
      (isDisabled(internalEndpoint === 'start' ? 0 : 1) &&
      !isDisabled(internalEndpoint === 'start' ? 1 : 0)
        ? internalEndpoint === 'start'
          ? 'end'
          : 'start'
        : internalEndpoint),
    index = endpoint === 'start' ? 0 : 1
  const inactive = isDisabled(0) && isDisabled(1)
  const isOpen = mode === 'popup' && !inactive && (open ?? internalOpen),
    showing = mode === 'panel' || isOpen
  if (inactive && open === undefined && internalOpen) setInternalOpen(false)
  const [previousPresentation, setPreviousPresentation] = useState(presentation)
  if (previousPresentation !== presentation) {
    setPreviousPresentation(presentation)
    setDraft(display(showing ? candidate : current))
    setDirty(false)
    setError('')
  }
  if (previous !== currentKey) {
    setPrevious(currentKey)
    setCandidate(current)
    setDraft(display(current))
    setDirty(false)
    setError('')
  }
  function initialMonth(range: DateTimeRange, part: 0 | 1) {
    const proposed = toMonth(
      parseMonth(defaultPanelMonth) ??
        parseMonth((range[part] || range[part === 0 ? 1 : 0]).slice(0, 7)) ??
        new Date(),
    )
    const lower = parseDateTime(min)?.date.slice(0, 7) ?? '0001-01',
      upper = parseDateTime(max)?.date.slice(0, 7) ?? '9999-12'
    return proposed < lower ? lower : proposed > upper ? upper : proposed
  }
  const [internalMonth, setInternalMonth] = useState(() =>
    initialMonth(current, index),
  )
  const [previousEndpoint, setPreviousEndpoint] = useState(endpoint)
  if (previousEndpoint !== endpoint) {
    setPreviousEndpoint(endpoint)
    if (panelMonth === undefined)
      setInternalMonth(initialMonth(candidate, index))
  }
  const month = parseMonth(panelMonth) ? panelMonth! : internalMonth
  function changeMonth(next: string) {
    if (panelMonth === undefined) setInternalMonth(next)
    onPanelMonthChange?.(next)
  }
  const infoFor = (part: 0 | 1, range: DateTimeRange): DateTimeRangeInfo => ({
    endpoint: part === 0 ? 'start' : 'end',
    from: range[part === 0 ? 1 : 0] || undefined,
  })
  function constraintsFor(
    part: 0 | 1,
    range: DateTimeRange,
  ): DateTimeConstraints {
    const info = infoFor(part, range),
      other = part === 0 ? 1 : 0
    return {
      precision,
      stepBase: parseDateTime(min) ? min : '1970-01-01T00:00',
      min:
        isDisabled(other) &&
        parseDateTime(info.from) &&
        part === 1 &&
        (!parseDateTime(min) ||
          dateTimeMilliseconds(info.from!) > dateTimeMilliseconds(min!))
          ? info.from
          : min,
      max:
        isDisabled(other) &&
        parseDateTime(info.from) &&
        part === 0 &&
        (!parseDateTime(max) ||
          dateTimeMilliseconds(info.from!) < dateTimeMilliseconds(max!))
          ? info.from
          : max,
      step,
      hourStep,
      minuteStep,
      secondStep,
      millisecondStep,
      disabledDate: disabledDate
        ? (date) => disabledDate(date, info)
        : undefined,
      disabledHours: disabledHours
        ? (date) => disabledHours(date, info)
        : undefined,
      disabledMinutes: disabledMinutes
        ? (hour, date) => disabledMinutes(hour, date, info)
        : undefined,
      disabledSeconds: disabledSeconds
        ? (hour, minute, date) => disabledSeconds(hour, minute, date, info)
        : undefined,
      disabledMilliseconds: disabledMilliseconds
        ? (hour, minute, second, date) =>
            disabledMilliseconds(hour, minute, second, date, info)
        : undefined,
      disabledTime: (time) =>
        Boolean(
          disabledTime?.(time, info) ||
          (isDisabled(other) &&
            info.from &&
            reversed(part === 0 ? [time, info.from] : [info.from, time])),
        ),
    }
  }
  const canSort = order === 'sort' && !isDisabled(0) && !isDisabled(1)
  function validRange(range: DateTimeRange, complete = false) {
    return (
      range.every((time, part) =>
        time
          ? dateTimeSelectable(time, constraintsFor(part as 0 | 1, range))
          : !complete || allowEmpty[part],
      ) &&
      (canSort || !reversed(range)) &&
      (!complete || range.some(Boolean))
    )
  }
  function normalized(
    raw: DateTimeRange,
    part: 0 | 1,
    commit = false,
  ): DateTimeRange {
    const next = asRange(raw)
    if (reversed(next)) {
      if (canSort) return commit ? [next[1], next[0]] : next
      if (!isDisabled(part === 0 ? 1 : 0)) next[part === 0 ? 1 : 0] = ''
    }
    return next
  }
  const lockedChanged = (range: DateTimeRange) =>
    range.some(
      (time, part) => isDisabled(part as 0 | 1) && time !== current[part],
    )
  function parsedInput(raw: DateTimeRange = draft): DateTimeRange | undefined {
    const start = raw[0] ? presentation.parse(raw[0]) : '',
      end = raw[1] ? presentation.parse(raw[1]) : ''
    return start === undefined || end === undefined
      ? undefined
      : normalized([start, end], lastEdited.current)
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
  function setEndpoint(next: DateTimeRangeEndpoint) {
    if (next === endpoint) return
    if (activeEndpoint === undefined) {
      setInternalEndpoint(next)
      if (panelMonth === undefined)
        setInternalMonth(initialMonth(candidate, next === 'start' ? 0 : 1))
    }
    onActiveEndpointChange?.(next)
  }
  function focusPanel() {
    if (!isDisabled(index)) focusDateTimePanel(panelRef.current)
    else
      (popupRef.current ?? rootRef.current)
        ?.querySelector<HTMLElement>('button:not(:disabled)')
        ?.focus({ preventScroll: true })
  }
  function begin(part: 0 | 1, focus = false) {
    if (isDisabled(part) || mode !== 'popup') return
    setError('')
    setEndpoint(part === 0 ? 'start' : 'end')
    if (!isOpen) {
      const typed = dirty ? parsedInput() : undefined
      const next = typed && validRange(typed) ? typed : current
      setCandidate(next)
      if (panelMonth === undefined)
        setInternalMonth(
          initialMonth(next, activeEndpoint === undefined ? part : index),
        )
      focusRequested.current = focus ? (part === 0 ? 'start' : 'end') : null
      setOpen(true)
    } else if (focus) {
      focusRequested.current = part === 0 ? 'start' : 'end'
      if (part === index) {
        focusRequested.current = null
        focusPanel()
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
    setDraft(display(current))
    setDirty(false)
    setError('')
    focusRequested.current = null
    setOpen(false)
    if (restore) restoreFocus()
  }
  function publish(raw: DateTimeRange, sort = true) {
    const next = sort ? normalized(raw, lastEdited.current, true) : raw
    if (inactive || !validRange(next) || lockedChanged(next)) return false
    if (!controlled) setInternal(asRange(next))
    setCandidate(controlled ? current : next)
    setDraft(display(controlled ? current : next))
    setDirty(false)
    setError('')
    if (!equalRange(next, current)) onChange?.(asRange(next))
    return true
  }
  function commitInput(confirm = false) {
    if (!dirty) return true
    const parsed = parsedInput(),
      next = parsed ? normalized(parsed, lastEdited.current, true) : undefined
    if (!next || !validRange(next) || lockedChanged(next)) {
      setError('请输入可选的日期时间范围（' + presentation.hint + '）')
      return false
    }
    if (needConfirm && confirm && !validRange(next, true)) {
      setError('请选择完整的可用日期时间范围')
      return false
    }
    if (needConfirm && !confirm && mode !== 'native') {
      setCandidate(parsed!)
      return true
    }
    if (!publish(next)) return false
    if (needConfirm && confirm) onOk?.(asRange(next))
    return true
  }
  function leave() {
    if (needConfirm) cancel()
    else {
      if (dirty) {
        if (!commitInput()) {
          setDraft(display(current))
          setDirty(false)
          setError('日期时间范围不可选，已恢复原范围')
        }
      } else if (validRange(candidate, true) && !equalRange(candidate, current))
        publish(candidate)
      else {
        setCandidate(current)
        setDraft(display(current))
      }
      focusRequested.current = null
      setOpen(false)
    }
  }
  function choose(time: string, part: 'date' | 'time' = 'date') {
    if (
      isDisabled(index) ||
      !dateTimeSelectable(time, constraintsFor(index, candidate))
    )
      return
    const next = normalized(
      index === 0 ? [time, candidate[1]] : [candidate[0], time],
      index,
    )
    lastEdited.current = index
    setCandidate(next)
    setDraft(display(next))
    setDirty(false)
    setError('')
    onCalendarChange?.(asRange(next), { endpoint, part })
    if (time.slice(0, 7) !== month) changeMonth(time.slice(0, 7))
    if (!needConfirm && validRange(normalized(next, index, true), true))
      publish(next)
  }
  function confirm() {
    onPreview()
    const parsed = dirty ? parsedInput() : candidate
    const next = parsed
      ? normalized(parsed, lastEdited.current, true)
      : undefined
    if (!next || !validRange(next, true) || !publish(next)) return
    onOk?.(asRange(next))
    if (mode === 'popup') {
      setOpen(false)
      restoreFocus()
    }
  }
  useLayoutEffect(() => {
    if (wasOpen.current && !isOpen && needConfirm) {
      setCandidate(current)
      setDraft(display(current))
      setDirty(false)
      setError('')
    }
    wasOpen.current = isOpen
  }, [isOpen, needConfirm, current, display])
  useLayoutEffect(() => {
    if (showing && focusRequested.current === endpoint) {
      focusRequested.current = null
      focusPanel()
    }
    const shown = dirty ? parsedInput() : showing ? candidate : current
    for (const [part, field] of [
      startRef.current,
      finishRef.current,
    ].entries()) {
      field?.setCustomValidity(
        isDisabled(part as 0 | 1)
          ? ''
          : preview && part === index && field.required && !shown?.[part]
            ? '请选择日期时间'
            : !shown || !validRange(shown)
              ? '请选择有效且可选的日期时间范围'
              : (needConfirm && dirty && !equalRange(shown, current)) ||
                  (showing && !equalRange(candidate, current))
                ? '请完成或确认日期时间范围选择'
                : '',
      )
    }
    if (
      inactive &&
      ownedFocus.current &&
      (document.activeElement === document.body ||
        inside(document.activeElement))
    ) {
      focusAfterPicker(finishRef.current!, rootRef.current!)
      ownedFocus.current = false
    } else if (
      showing &&
      ownedFocus.current &&
      document.activeElement === document.body
    )
      focusPanel()
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
      },
      submit = () => {
        if (dirty && !needConfirm) commitInput()
      }
    associatedForm.addEventListener('reset', reset)
    associatedForm.addEventListener('submit', submit, true)
    return () => {
      associatedForm.removeEventListener('reset', reset)
      associatedForm.removeEventListener('submit', submit, true)
    }
  })
  const shown = dirty ? parsedInput() : showing ? candidate : current
  const { preview, onPreview } = usePickerPreview(
    JSON.stringify([
      currentKey,
      candidate,
      showing,
      mode,
      month,
      dirty,
      endpoint,
    ]),
    previewValue === 'hover' && showing && !dirty && !isDisabled(index),
    (value) => dateTimeSelectable(value, constraintsFor(index, candidate)),
  )
  const previewRange = preview ? asRange(candidate) : undefined
  if (previewRange) previewRange[index] = preview!
  const displayed =
    mode === 'native'
      ? current
      : dirty
        ? draft
        : display(previewRange ?? (showing ? candidate : current))
  const invalid =
    status === 'error' ||
    ariaInvalid ||
    Boolean(error) ||
    !shown ||
    !validRange(shown) ||
    undefined
  const description =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined
  const ready = shown ? normalized(shown, lastEdited.current, true) : undefined
  const info = infoFor(index, candidate)
  const panel = (
    <div className={cn('min-w-0 space-y-2', classNames?.panel)}>
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
            }}
          >
            {text}：{presentation.display(candidate[part]) || '未选择'}
          </Button>
        ))}
      </div>
      {presets.length > 0 && (
        <div
          role="group"
          aria-label={label + '快捷范围'}
          className={cn('flex flex-wrap gap-2', classNames?.presets)}
        >
          {presets.map((preset) => {
            const staticRange =
              typeof preset.value === 'function'
                ? undefined
                : normalized(preset.value, index, true)
            return (
              <Button
                key={preset.key}
                tabIndex={0}
                variant="outline"
                disabled={
                  inactive ||
                  Boolean(
                    staticRange &&
                    (!validRange(staticRange, true) ||
                      lockedChanged(staticRange)),
                  )
                }
                onClick={() => {
                  const next = normalized(
                    asRange(
                      typeof preset.value === 'function'
                        ? preset.value()
                        : preset.value,
                    ),
                    index,
                    true,
                  )
                  if (!validRange(next, true) || lockedChanged(next)) {
                    setError('快捷范围当前不可选，请选择其他时间')
                    return
                  }
                  setCandidate(next)
                  setDraft(display(next))
                  setDirty(false)
                  setError('')
                  onCalendarChange?.(asRange(next), { endpoint, part: 'date' })
                  if (panelMonth === undefined)
                    setInternalMonth(initialMonth(next, index))
                  if (!needConfirm) publish(next)
                }}
              >
                {preset.label}
              </Button>
            )
          })}
        </div>
      )}
      <DateTimePickerPanel
        key={endpoint}
        ref={panelRef}
        label={index === 0 ? startLabel : endLabel}
        value={candidate[index]}
        range={[
          parseDateTime(candidate[0])?.date ?? '',
          parseDateTime(candidate[1])?.date ?? '',
        ]}
        month={month}
        onMonthChange={changeMonth}
        defaultOpenTime={
          defaultOpenTime?.[index] ??
          parseDateTime(candidate[index === 0 ? 1 : 0])?.time
        }
        constraints={constraintsFor(index, candidate)}
        onChange={(next, info) => choose(next, info.part)}
        onError={setError}
        disabled={isDisabled(index)}
        use12Hours={use12Hours}
        hideDisabledOptions={hideDisabledOptions}
        changeOnScroll={changeOnScroll}
        onPreview={previewValue === 'hover' ? onPreview : undefined}
        weekStartsOn={weekStartsOn}
        locale={locale}
        renderDate={renderDate ? (date) => renderDate(date, info) : undefined}
        getDateDescription={
          getDateDescription
            ? (date) => getDateDescription(date, info)
            : undefined
        }
        renderCell={
          renderCell
            ? (number, unit) => renderCell(number, unit, info)
            : undefined
        }
        getCellDescription={
          getCellDescription
            ? (number, unit) => getCellDescription(number, unit, info)
            : undefined
        }
        classNames={classNames}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {needConfirm ? '待确认范围' : '已选范围'}：
        {presentation.display(candidate[0]) || '未选开始'} →{' '}
        {presentation.display(candidate[1]) || '未选结束'}
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
            disabled={isDisabled(index)}
            onClick={() => {
              const now = new Date(),
                next = toISO(now) + 'T' + timeNow(now, precision)
              if (dateTimeSelectable(next, constraintsFor(index, candidate)))
                choose(next)
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
            inactive ||
            !ready ||
            !validRange(ready, true) ||
            lockedChanged(ready)
          }
          onClick={confirm}
        >
          {needConfirm ? '确定' : '完成'}
        </Button>
      </div>
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
      data-datetimerange=""
      className={cn(
        'm-0 grid min-w-0 gap-2 border-0 p-0',
        className,
        classNames?.root,
      )}
      onFocusCapture={() => {
        ownedFocus.current = true
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
          ownedFocus.current = false
      }}
      onBlur={(event) => {
        if (inside(event.relatedTarget)) return
        if (
          !event.relatedTarget &&
          (pointerInside.current ||
            (ownedFocus.current &&
              event.target instanceof HTMLElement &&
              panelRef.current?.contains(event.target) &&
              (!event.target.getClientRects().length ||
                event.target.matches(':disabled'))))
        )
          return
        if (mode !== 'native') leave()
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
                  type={mode === 'native' ? 'datetime-local' : 'text'}
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
                  step={step ?? defaultTimeStep(precision)}
                  required={required && !allowEmpty[part]}
                  disabled={Array.isArray(disabled) ? disabled[part] : disabled}
                  readOnly={readOnly || (mode !== 'native' && inputReadOnly)}
                  autoComplete="off"
                  placeholder={placeholder?.[part] ?? presentation.hint}
                  value={displayed[part]}
                  data-picker-preview={
                    preview && part === index ? 'hover' : undefined
                  }
                  className={cn(
                    inputStyles,
                    inputVariantStyles[variant],
                    inputStatusStyles[status],
                    inputSizeStyles[resolvedSize],
                    'min-w-0 touch-manipulation focus-visible:border-ring',
                    mode === 'popup' && 'pe-12',
                    allowClear &&
                      displayed[part] &&
                      !isDisabled(part as 0 | 1) &&
                      (mode === 'popup' ? 'pe-24' : 'pe-12'),
                    classNames?.input,
                    part === 0 ? classNames?.startInput : classNames?.endInput,
                  )}
                  onFocus={(event) => {
                    setEndpoint(part === 0 ? 'start' : 'end')
                    onFocus?.(event, { endpoint: part === 0 ? 'start' : 'end' })
                  }}
                  onClick={() => begin(part as 0 | 1)}
                  onChange={(event) => {
                    setError('')
                    lastEdited.current = part as 0 | 1
                    if (mode === 'native') {
                      const next = asRange(current),
                        raw = event.currentTarget.value,
                        parsed = raw ? nativeDateTimeInput(raw, precision) : ''
                      if (parsed !== undefined) next[part] = parsed
                      else {
                        setError('日期时间不可选或精度不符，已恢复原值')
                        return
                      }
                      if (!publish(normalized(next, part as 0 | 1)))
                        setError('日期时间范围不可选，已恢复原范围')
                    } else {
                      const next = asRange(draft)
                      next[part] = event.currentTarget.value
                      setDraft(next)
                      setDirty(true)
                      const parsed = parsedInput(next)
                      if (
                        parsed &&
                        validRange(parsed) &&
                        !lockedChanged(parsed)
                      )
                        setCandidate(parsed)
                    }
                  }}
                  onKeyDown={(event) => {
                    onPreview()
                    if (isDisabled(part as 0 | 1) || mode === 'native') return
                    if (event.key === 'ArrowDown' && mode === 'popup') {
                      event.preventDefault()
                      begin(part as 0 | 1, true)
                    } else if (event.key === 'Escape' && (isOpen || dirty)) {
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
                {allowClear &&
                  displayed[part] &&
                  !isDisabled(part as 0 | 1) && (
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
                        publish(next, false)
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
                    {suffixIcon ?? <Icon name="clock" size={16} />}
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
                  leave()
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

export const DateTimeRangePicker = forwardRef<
  HTMLInputElement,
  DateTimeRangePickerProps
>(function DateTimeRangePicker(props, ref) {
  const { locale: configuredLocale } = useConfig()
  const locale = props.locale ?? configuredLocale
  const precision = usePickerTimePrecision(
    { ...props, locale },
    [
      ...(props.value ?? []),
      ...(props.defaultValue ?? []),
      ...(props.defaultOpenTime ?? []),
      props.min,
      props.max,
    ],
    (props.value ?? props.defaultValue ?? []).some(Boolean),
  )
  return (
    <DateTimeRangePickerControl
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
})
