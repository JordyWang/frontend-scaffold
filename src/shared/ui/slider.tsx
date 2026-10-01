import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import type { InputStatus } from './input'
import { Tooltip } from './overlay'
import {
  createSliderScale,
  insertSliderValue,
  moveSliderThumb,
  nextSliderValue,
  normalizeSliderValues,
  sameSliderValues,
  shiftSliderRange,
  sliderCoordinateReversed,
  sliderDots,
  sliderPercent,
  suggestSliderValue,
} from './slider-state'

export type SliderMark = { value: number; label: ReactNode; className?: string }
export type SliderPart =
  'root' | 'rail' | 'track' | 'thumb' | 'dot' | 'mark' | 'editor'
export type SliderEditable = { minCount?: number; maxCount?: number }
export type SliderTooltip = {
  open?: boolean
  formatter?: ((value: number, index: number) => ReactNode) | null
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

type SliderCommonProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
  | 'disabled'
  | 'size'
> & {
  min?: number
  max?: number
  step?: number | null
  marks?: SliderMark[]
  dots?: boolean
  included?: boolean
  orientation?: 'horizontal' | 'vertical'
  reverse?: boolean
  keyboard?: boolean
  disabled?: boolean | boolean[]
  label?: string
  handleLabels?: string[]
  size?: ControlSize
  status?: InputStatus
  tooltip?: false | SliderTooltip
  classNames?: Partial<Record<SliderPart, string>>
}
export type SingleSliderProps = SliderCommonProps & {
  range?: false
  draggableTrack?: never
  editable?: never
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  onChangeComplete?: (value: number) => void
}
export type RangeSliderProps = SliderCommonProps & {
  range: true
  draggableTrack?: boolean
  editable?: boolean | SliderEditable
  value?: number[]
  defaultValue?: number[]
  onChange?: (value: number[]) => void
  onChangeComplete?: (value: number[]) => void
}
export type SliderProps = SingleSliderProps | RangeSliderProps

type DragSession = {
  pointerId: number
  index: number | null
  start: number
  grabOffset: number
  initial: number[]
  latest: number[]
  changed: boolean
  remove: boolean
}
type KeySession = { index: number; latest: number[]; changed: boolean }
const navigationKeys = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])
const emptyMarks: SliderMark[] = []

/** Native inputs provide slider semantics; project controls own all coordinates and gestures. */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  function Slider(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      range = false,
      draggableTrack = false,
      editable = false,
      value,
      defaultValue,
      onChange,
      onChangeComplete,
      min = 0,
      max = 100,
      step = 1,
      marks = emptyMarks,
      dots = false,
      included = true,
      orientation = 'horizontal',
      reverse = false,
      keyboard = true,
      disabled = false,
      label = '数值',
      handleLabels,
      size,
      status = 'default',
      tooltip,
      classNames,
      className,
      id,
      name,
      style,
      onKeyDown,
      onKeyUp,
      onFocus,
      onBlur,
      autoFocus,
      readOnly,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...inputProps
    } = allProps
    const isRange = Boolean(range)
    const editRequested = isRange && Boolean(editable)
    const editConfig = typeof editable === 'object' ? editable : undefined
    const minCount = Number.isFinite(editConfig?.minCount)
      ? Math.max(0, Math.floor(editConfig!.minCount!))
      : 0
    const maxCount = Number.isFinite(editConfig?.maxCount)
      ? Math.max(minCount, Math.floor(editConfig!.maxCount!))
      : Infinity
    const { direction, componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const generatedId = useId()
    const inputId = id ?? `slider-${generatedId}`
    const scale = useMemo(
      () =>
        createSliderScale(
          min,
          max,
          step,
          marks.map((mark) => mark.value),
        ),
      [min, max, step, marks],
    )
    const [internal, setInternal] = useState(() =>
      normalizeSliderValues(
        defaultValue ?? (isRange ? undefined : 0),
        isRange,
        scale,
        editRequested,
      ),
    )
    const current = useMemo(
      () =>
        normalizeSliderValues(
          controlled ? value : isRange ? internal : internal[0],
          isRange,
          scale,
          editRequested,
        ),
      [controlled, value, isRange, internal, scale, editRequested],
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const railRef = useRef<HTMLDivElement>(null)
    const inputs = useRef<(HTMLInputElement | null)[]>([])
    const drag = useRef<DragSession | null>(null)
    const keySession = useRef<KeySession | null>(null)
    const [focused, setFocused] = useState<number | null>(null)
    const [hovered, setHovered] = useState<number | null>(null)
    const [dragging, setDragging] = useState<number | 'track' | null>(null)
    const [removing, setRemoving] = useState(false)
    const [selected, setSelected] = useState<number | null>(null)
    const [editDraft, setEditDraft] = useState<string | null>(null)
    const [editMessage, setEditMessage] = useState('')
    const addButtonRef = useRef<HTMLButtonElement>(null)
    const pendingFocus = useRef<{
      values: number[]
      index: number | null
      source: Element | null
    } | null>(null)
    const [dismissedTooltip, setDismissedTooltip] = useState<number | null>(
      null,
    )
    const vertical = orientation === 'vertical'
    const coordinateReversed = sliderCoordinateReversed(
      orientation,
      reverse,
      direction,
    )
    const handleDisabled = current.map((_, index) =>
      Array.isArray(disabled) ? Boolean(disabled[index]) : disabled,
    )
    const unavailable =
      disabled === true ||
      (handleDisabled.length > 0 && handleDisabled.every(Boolean)) ||
      scale.min === scale.max ||
      Boolean(readOnly)
    const configSignature = JSON.stringify([
      scale,
      orientation,
      reverse,
      direction,
      disabled,
      readOnly,
      isRange,
      draggableTrack,
      included,
      keyboard,
      editRequested,
      minCount,
      maxCount,
    ])
    const valueSignature = JSON.stringify(current)
    const previous = useRef({ configSignature, valueSignature })
    const hasFrozenHandle = Array.isArray(disabled) && disabled.some(Boolean)
    const rangeDraggable =
      isRange &&
      draggableTrack &&
      !editRequested &&
      !hasFrozenHandle &&
      !unavailable &&
      included
    const canEdit = editRequested && !unavailable && !hasFrozenHandle
    const suggested = editRequested ? suggestSliderValue(current, scale) : null
    const canAdd = canEdit && current.length < maxCount && suggested !== null
    const selectedIndex =
      selected === null
        ? current.length
          ? 0
          : null
        : current.length
          ? Math.min(selected, current.length - 1)
          : null
    const canRemove =
      canEdit && current.length > minCount && selectedIndex !== null

    useLayoutEffect(() => {
      const changedConfig = previous.current.configSignature !== configSignature
      const changedValue =
        controlled && previous.current.valueSignature !== valueSignature
      previous.current = { configSignature, valueSignature }
      const activeDrag = drag.current
      const activeKeys = keySession.current
      if (
        changedConfig ||
        (activeDrag && current.length !== activeDrag.latest.length) ||
        (changedValue &&
          activeDrag &&
          !sameSliderValues(current, activeDrag.latest))
      ) {
        drag.current = null
        setDragging(null)
        setRemoving(false)
        if (
          activeDrag &&
          rootRef.current?.hasPointerCapture?.(activeDrag.pointerId)
        )
          rootRef.current.releasePointerCapture(activeDrag.pointerId)
      }
      if (
        changedConfig ||
        (activeKeys && current.length !== activeKeys.latest.length) ||
        (changedValue &&
          activeKeys &&
          !sameSliderValues(current, activeKeys.latest))
      )
        keySession.current = null
    }, [configSignature, controlled, current, valueSignature])

    useLayoutEffect(() => {
      const pending = pendingFocus.current
      if (!pending || !sameSliderValues(current, pending.values)) return
      pendingFocus.current = null
      const active = document.activeElement
      if (
        active !== document.body &&
        active !== pending.source &&
        !rootRef.current?.contains(active)
      )
        return
      const preferred =
        pending.index === null
          ? (addButtonRef.current ?? rootRef.current)
          : inputs.current[pending.index]
      const target = preferred?.matches(':disabled')
        ? (inputs.current.find(
            (input) => input && !input.matches(':disabled'),
          ) ?? rootRef.current)
        : preferred
      target?.focus({ preventScroll: true })
    }, [current])

    useLayoutEffect(() => {
      if (
        focused === null ||
        (focused < current.length && !handleDisabled[focused])
      )
        return
      const active = document.activeElement
      if (active !== document.body && active !== inputs.current[focused]) return
      const available = handleDisabled
        .map((blocked, index) => ({ blocked, index }))
        .filter(({ blocked }) => !blocked)
        .sort(
          (left, right) =>
            Math.abs(left.index - focused) - Math.abs(right.index - focused),
        )
      const nextIndex = available[0]?.index
      const target = nextIndex === undefined ? null : inputs.current[nextIndex]
      if (target) target.focus({ preventScroll: true })
      else {
        setFocused(null)
        rootRef.current?.focus({ preventScroll: true })
      }
    }, [current.length, focused, handleDisabled])

    const defaultsSignature = JSON.stringify(defaultValue)
    useEffect(() => {
      if (controlled) return
      const form = inputs.current[0]?.form ?? addButtonRef.current?.form
      if (!form) return
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented) return
          drag.current = null
          keySession.current = null
          setDragging(null)
          setRemoving(false)
          pendingFocus.current = null
          setSelected(null)
          setEditDraft(null)
          setEditMessage('')
          setInternal(
            normalizeSliderValues(
              defaultValue ?? (isRange ? undefined : 0),
              isRange,
              scale,
              editRequested,
            ),
          )
        })
      }
      form.addEventListener('reset', reset)
      return () => form.removeEventListener('reset', reset)
    }, [
      controlled,
      defaultValue,
      defaultsSignature,
      isRange,
      editRequested,
      scale,
      inputProps.form,
    ])

    function publish(next: number[], before = current) {
      if (sameSliderValues(next, before)) return false
      if (!controlled) setInternal(next)
      if (onChange) {
        if (allProps.range) allProps.onChange?.([...next])
        else allProps.onChange?.(next[0])
      }
      return true
    }
    function complete(next: number[]) {
      if (!onChangeComplete) return
      if (allProps.range) allProps.onChangeComplete?.([...next])
      else allProps.onChangeComplete?.(next[0])
    }
    function addHandle(desired: number) {
      if (!canAdd || addButtonRef.current?.matches(':disabled')) return null
      const inserted = insertSliderValue(current, desired, scale)
      if (!inserted) {
        setEditMessage('此位置已有节点')
        return null
      }
      pendingFocus.current = {
        values: inserted.values,
        index: inserted.index,
        source: document.activeElement,
      }
      setSelected(inserted.index)
      setEditDraft(null)
      setEditMessage(`已添加节点 ${inserted.values[inserted.index]}`)
      publish(inserted.values)
      return inserted
    }
    function removeHandle(index: number, values = current) {
      if (
        !canEdit ||
        values.length <= minCount ||
        index < 0 ||
        index >= values.length ||
        inputs.current[index]?.matches(':disabled')
      )
        return false
      const next = values.filter((_, position) => position !== index)
      const nextIndex = next.length ? Math.min(index, next.length - 1) : null
      pendingFocus.current = {
        values: next,
        index: nextIndex,
        source: document.activeElement,
      }
      setSelected(nextIndex)
      setEditDraft(null)
      setEditMessage(`已移除节点 ${values[index]}`)
      publish(next, values)
      complete(next)
      return true
    }
    function submitAddedValue() {
      const raw = editDraft ?? String(suggested ?? '')
      if (
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()) ||
        !Number.isFinite(Number(raw))
      ) {
        setEditMessage('请输入有效的节点值')
        return
      }
      const inserted = addHandle(Number(raw))
      if (inserted) complete(inserted.values)
    }
    function closestHandle(desired: number) {
      let closest = -1
      for (let index = 0; index < current.length; index++) {
        if (
          handleDisabled[index] ||
          inputs.current[index]?.matches(':disabled')
        )
          continue
        if (
          desired < (current[index - 1] ?? scale.min) ||
          desired > (current[index + 1] ?? scale.max)
        )
          continue
        const distance = Math.abs(current[index] - desired)
        if (
          closest < 0 ||
          distance < Math.abs(current[closest] - desired) ||
          (distance === Math.abs(current[closest] - desired) &&
            (index === focused || focused === null))
        )
          closest = index
      }
      return closest
    }
    function pointerValue(event: PointerEvent<HTMLDivElement>) {
      const box = railRef.current?.getBoundingClientRect()
      if (!box) return scale.min
      const length = vertical ? box.height : box.width
      const coordinate = vertical
        ? event.clientY - box.top
        : event.clientX - box.left
      const ratio =
        length > 0 ? Math.max(0, Math.min(1, coordinate / length)) : 0
      return (
        scale.min +
        (coordinateReversed ? 1 - ratio : ratio) * (scale.max - scale.min)
      )
    }
    function startPointer(event: PointerEvent<HTMLDivElement>) {
      if (
        event.defaultPrevented ||
        unavailable ||
        drag.current ||
        event.button !== 0 ||
        event.isPrimary === false
      )
        return
      const target = event.target instanceof Element ? event.target : null
      if (!target || !railRef.current?.contains(target)) return
      if (target?.closest('[data-slider-mark]')) return
      const requested = target?.closest<HTMLElement>(
        '[data-slider-thumb-index]',
      )
      const requestedIndex = requested
        ? Number(requested.dataset.sliderThumbIndex)
        : undefined
      if (
        requestedIndex !== undefined &&
        (handleDisabled[requestedIndex] ||
          inputs.current[requestedIndex]?.matches(':disabled'))
      )
        return
      const point = pointerValue(event)
      const inserted =
        canEdit && requestedIndex === undefined ? addHandle(point) : null
      if (canEdit && requestedIndex === undefined && !inserted) return
      const sessionValues = inserted?.values ?? current
      const index =
        rangeDraggable && target?.closest('[data-slider-draggable-track]')
          ? null
          : (inserted?.index ?? requestedIndex ?? closestHandle(point))
      if (index === -1) return
      event.preventDefault()
      if (event.nativeEvent.isTrusted)
        event.currentTarget.setPointerCapture?.(event.pointerId)
      keySession.current = null
      drag.current = {
        pointerId: event.pointerId,
        index,
        start: point,
        grabOffset:
          requestedIndex !== undefined && index !== null
            ? sessionValues[index] - point
            : 0,
        initial: [...sessionValues],
        latest: [...sessionValues],
        changed: Boolean(inserted),
        remove: false,
      }
      setDragging(index === null ? 'track' : index)
      setDismissedTooltip(null)
      if (!inserted) inputs.current[index ?? 0]?.focus({ preventScroll: true })
      if (index !== null && requestedIndex === undefined && !inserted)
        movePointer(event)
    }
    function movePointer(event: PointerEvent<HTMLDivElement>) {
      const session = drag.current
      if (!session || session.pointerId !== event.pointerId || unavailable)
        return
      const box = railRef.current?.getBoundingClientRect()
      const crossPosition = vertical ? event.clientX : event.clientY
      const crossStart = vertical ? box?.left : box?.top
      const crossEnd = vertical ? box?.right : box?.bottom
      session.remove = Boolean(
        canEdit &&
        session.index !== null &&
        session.latest.length > minCount &&
        crossStart !== undefined &&
        crossEnd !== undefined &&
        (crossPosition < crossStart - 48 || crossPosition > crossEnd + 48),
      )
      setRemoving(session.remove)
      if (session.remove) return
      const point = pointerValue(event)
      const next =
        session.index === null
          ? shiftSliderRange(session.initial, point - session.start, scale)
          : moveSliderThumb(
              session.latest,
              session.index,
              point + session.grabOffset,
              scale,
            )
      if (publish(next, session.latest)) session.changed = true
      session.latest = next
      if (pendingFocus.current?.index === session.index)
        pendingFocus.current.values = [...next]
    }
    function finishPointer(
      event: PointerEvent<HTMLDivElement>,
      cancelled = false,
    ) {
      const session = drag.current
      if (!session || session.pointerId !== event.pointerId) return
      if (!cancelled) movePointer(event)
      drag.current = null
      setDragging(null)
      setRemoving(false)
      if (event.currentTarget.hasPointerCapture?.(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId)
      if (!cancelled && session.remove && session.index !== null)
        removeHandle(session.index, session.latest)
      else if (!cancelled && session.changed) complete(session.latest)
    }
    function finishKeys() {
      const session = keySession.current
      keySession.current = null
      if (session?.changed) complete(session.latest)
    }
    function navigate(event: KeyboardEvent<HTMLInputElement>, index: number) {
      onKeyDown?.(event)
      if (
        keyboard &&
        canEdit &&
        !event.defaultPrevented &&
        !event.repeat &&
        !event.nativeEvent.isComposing &&
        event.nativeEvent.keyCode !== 229 &&
        (event.key === 'Delete' || event.key === 'Backspace')
      ) {
        event.preventDefault()
        finishKeys()
        removeHandle(index)
        return
      }
      if (event.defaultPrevented || !navigationKeys.has(event.key)) return
      event.preventDefault()
      if (!keyboard || unavailable || handleDisabled[index]) return
      const session =
        keySession.current?.index === index
          ? keySession.current
          : { index, latest: [...current], changed: false }
      keySession.current = session
      const values = session.latest
      const lower = values[index - 1] ?? scale.min
      const upper = values[index + 1] ?? scale.max
      let offset = 0
      if (event.key === 'ArrowRight')
        offset = vertical ? 1 : coordinateReversed ? -1 : 1
      if (event.key === 'ArrowLeft')
        offset = vertical ? -1 : coordinateReversed ? 1 : -1
      if (event.key === 'ArrowUp') offset = vertical && reverse ? -1 : 1
      if (event.key === 'ArrowDown') offset = vertical && reverse ? 1 : -1
      if (event.key === 'PageUp') offset = 10
      if (event.key === 'PageDown') offset = -10
      const desired =
        event.key === 'Home'
          ? lower
          : event.key === 'End'
            ? upper
            : nextSliderValue(values[index], offset, scale, lower, upper)
      const next = moveSliderThumb(values, index, desired, scale)
      if (publish(next, session.latest)) session.changed = true
      session.latest = next
    }
    function selectMark(markValue: number) {
      if (unavailable) return
      if (canEdit) {
        const inserted = addHandle(markValue)
        if (inserted) complete(inserted.values)
        return
      }
      const index = closestHandle(markValue)
      if (index < 0) return
      inputs.current[index]?.focus({ preventScroll: true })
      const next = moveSliderThumb(current, index, markValue, scale)
      if (publish(next)) complete(next)
    }

    const markByValue = new Map(marks.map((mark) => [mark.value, mark]))
    const validMarks = scale.marks.map((markValue) =>
      markByValue.get(markValue)!,
    )
    const positions = current.map((item) =>
      sliderPercent(item, scale, coordinateReversed),
    )
    const origin = sliderPercent(scale.min, scale, coordinateReversed)
    const trackStart = positions.length
      ? Math.min(...positions, ...(isRange ? [] : [origin]))
      : 0
    const trackEnd = positions.length
      ? Math.max(...positions, ...(isRange ? [] : [origin]))
      : 0
    const invalid = status === 'error' || ariaInvalid || undefined
    const discrete = step === null || validMarks.length > 0
    const nativeStep = discrete ? 'any' : (scale.step ?? 'any')
    const allDots = sliderDots(scale, dots)
    const describedBy =
      [ariaDescribedBy, editRequested ? `${inputId}-edit-help` : undefined]
        .filter(Boolean)
        .join(' ') || undefined
    const endpointTransform = (percent: number) =>
      percent === 0 ? '-22px' : percent === 100 ? 'calc(-100% + 22px)' : '-50%'

    return (
      <div
        ref={rootRef}
        role="group"
        tabIndex={-1}
        aria-label={!ariaLabelledBy ? (ariaLabel ?? label) : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-disabled={unavailable || undefined}
        dir={direction}
        data-slider-root=""
        data-slider-orientation={orientation}
        data-slider-reverse={reverse || undefined}
        data-status={status === 'default' ? undefined : status}
        className={cn(
          'relative min-w-0 text-foreground',
          vertical
            ? editRequested
              ? 'inline-grid w-40 shrink-0 py-[22px] ps-[22px]'
              : 'inline-flex h-64 w-40 shrink-0 py-[22px] ps-[22px]'
            : 'w-full px-[22px]',
          unavailable && 'opacity-[0.55]',
          classNames?.root,
          className,
        )}
        style={style}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onLostPointerCapture={(event) => finishPointer(event, true)}
      >
        <div
          ref={railRef}
          data-slider-rail=""
          className={cn(
            'relative touch-none',
            vertical
              ? editRequested
                ? 'h-64 w-11'
                : 'h-full w-11'
              : 'h-11 w-full',
            classNames?.rail,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute rounded-full bg-muted',
              vertical
                ? 'inset-y-0 left-1/2 w-1.5 -translate-x-1/2'
                : 'inset-x-0 top-1/2 h-1.5 -translate-y-1/2',
            )}
          />
          {included && (!isRange || current.length > 1) && (
            <span
              aria-hidden="true"
              data-slider-track=""
              data-slider-draggable-track={rangeDraggable || undefined}
              className={cn(
                'absolute',
                vertical ? 'left-0 w-11' : 'top-0 h-11',
                rangeDraggable
                  ? 'cursor-grab active:cursor-grabbing'
                  : 'pointer-events-none',
                classNames?.track,
              )}
              style={
                vertical
                  ? {
                      top: `${trackStart}%`,
                      height: `${trackEnd - trackStart}%`,
                    }
                  : {
                      left: `${trackStart}%`,
                      width: `${trackEnd - trackStart}%`,
                    }
              }
            >
              <span
                className={cn(
                  'pointer-events-none absolute rounded-full',
                  status === 'error'
                    ? 'bg-destructive'
                    : status === 'warning'
                      ? 'bg-warning'
                      : 'bg-primary',
                  vertical
                    ? 'inset-y-0 left-1/2 w-1.5 -translate-x-1/2'
                    : 'inset-x-0 top-1/2 h-1.5 -translate-y-1/2',
                )}
              />
            </span>
          )}
          {allDots.map((dot) => {
            const percent = sliderPercent(dot, scale, coordinateReversed)
            const selected = included
              ? dot >= (isRange ? current[0] : scale.min) &&
                dot <= current[current.length - 1]
              : current.includes(dot)
            return (
              <span
                key={dot}
                data-slider-dot={dot}
                data-active={selected || undefined}
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-border bg-card data-[active=true]:border-primary',
                  classNames?.dot,
                )}
                style={
                  vertical
                    ? { top: `${percent}%`, left: '50%' }
                    : { left: `${percent}%`, top: '50%' }
                }
              />
            )
          })}
          {current.map((item, index) => {
            const suffix =
              handleLabels?.[index] ??
              (current.length === 2
                ? index === 0
                  ? '下限'
                  : '上限'
                : `第 ${index + 1} 个滑块`)
            const handleLabel = `${ariaLabel ?? label}${isRange ? suffix : ''}`
            const handleLabelId = `${inputId}-handle-label-${index}`
            const formatted =
              tooltip === false || tooltip?.formatter === null
                ? null
                : tooltip?.formatter
                  ? tooltip.formatter(item, index)
                  : String(item)
            const forcedTooltip = tooltip !== false ? tooltip?.open : false
            const showTooltip =
              forcedTooltip ??
              (dismissedTooltip !== index &&
                (focused === index ||
                  hovered === index ||
                  dragging === index ||
                  dragging === 'track'))
            const thumb = (
              <span
                data-slider-thumb-index={index}
                className={cn(
                  'relative flex size-11 items-center justify-center rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card',
                  unavailable || handleDisabled[index]
                    ? 'cursor-not-allowed'
                    : dragging === index || dragging === 'track'
                      ? 'cursor-grabbing'
                      : 'cursor-grab',
                  classNames?.thumb,
                  removing && dragging === index && 'opacity-40',
                )}
                onMouseEnter={() => {
                  setHovered(index)
                  setDismissedTooltip(null)
                }}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none rounded-full border-2 bg-card shadow-sm transition-colors',
                    resolvedSize === 'large'
                      ? 'size-6'
                      : resolvedSize === 'small'
                        ? 'size-4'
                        : 'size-5',
                    status === 'error'
                      ? 'border-destructive'
                      : status === 'warning'
                        ? 'border-warning'
                        : 'border-primary',
                    handleDisabled[index] && 'border-muted-foreground',
                  )}
                />
                {isRange && (
                  <span id={handleLabelId} className="sr-only">
                    {suffix}
                  </span>
                )}
                <input
                  {...inputProps}
                  ref={(element) => {
                    inputs.current[index] = element
                    if (index === 0) {
                      if (typeof ref === 'function') ref(element)
                      else if (ref) ref.current = element
                    }
                  }}
                  type="range"
                  id={index === 0 ? inputId : `${inputId}-${index}`}
                  name={isRange ? undefined : name}
                  autoFocus={autoFocus && index === 0}
                  readOnly={readOnly}
                  aria-readonly={readOnly || undefined}
                  disabled={handleDisabled[index]}
                  tabIndex={inputProps.tabIndex ?? 0}
                  value={item}
                  min={current[index - 1] ?? scale.min}
                  max={current[index + 1] ?? scale.max}
                  step={nativeStep}
                  aria-orientation={orientation}
                  aria-label={ariaLabelledBy ? undefined : handleLabel}
                  aria-labelledby={
                    ariaLabelledBy
                      ? [ariaLabelledBy, isRange ? handleLabelId : undefined]
                          .filter(Boolean)
                          .join(' ')
                      : undefined
                  }
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  aria-valuenow={item}
                  aria-valuetext={
                    inputProps['aria-valuetext'] ??
                    (typeof formatted === 'string' ||
                    typeof formatted === 'number'
                      ? String(formatted)
                      : undefined)
                  }
                  className="pointer-events-none absolute inset-0 size-11 cursor-grab touch-none opacity-0 disabled:cursor-not-allowed"
                  onFocus={(event) => {
                    setFocused(index)
                    setSelected(index)
                    setDismissedTooltip(null)
                    onFocus?.(event)
                  }}
                  onBlur={(event) => {
                    setFocused(null)
                    finishKeys()
                    if (
                      event.relatedTarget instanceof Node &&
                      rootRef.current?.contains(event.relatedTarget)
                    )
                      return
                    onBlur?.(event)
                  }}
                  onKeyDown={(event) => navigate(event, index)}
                  onKeyUp={(event) => {
                    onKeyUp?.(event)
                    if (navigationKeys.has(event.key)) finishKeys()
                  }}
                  onChange={(event) => {
                    if (
                      unavailable ||
                      handleDisabled[index] ||
                      drag.current ||
                      keySession.current
                    )
                      return
                    const next = moveSliderThumb(
                      current,
                      index,
                      Number(event.currentTarget.value),
                      scale,
                    )
                    if (publish(next) && !drag.current && !keySession.current)
                      complete(next)
                  }}
                />
              </span>
            )
            return (
              <span
                key={index}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2',
                  focused === index || dragging === index ? 'z-20' : 'z-10',
                )}
                style={
                  vertical
                    ? { top: `${positions[index]}%`, left: '50%' }
                    : { left: `${positions[index]}%`, top: '50%' }
                }
              >
                {formatted === null ||
                formatted === undefined ||
                formatted === false ? (
                  thumb
                ) : (
                  <Tooltip
                    title={formatted}
                    open={showTooltip}
                    onOpenChange={(next) => {
                      if (!next && !drag.current) setDismissedTooltip(index)
                    }}
                    placement={
                      tooltip !== false
                        ? (tooltip?.placement ?? (vertical ? 'left' : 'top'))
                        : 'top'
                    }
                  >
                    {thumb}
                  </Tooltip>
                )}
              </span>
            )
          })}
        </div>
        {validMarks.length > 0 && (
          <div
            dir={vertical ? direction : 'ltr'}
            className={cn(
              'grid',
              vertical
                ? editRequested
                  ? 'absolute top-[22px] start-[66px] h-64 w-20'
                  : 'absolute inset-y-[22px] start-[66px] w-20'
                : 'relative w-full',
            )}
          >
            {validMarks.map((mark) => {
              const percent = sliderPercent(
                mark.value,
                scale,
                coordinateReversed,
              )
              const active = included
                ? mark.value >= (isRange ? current[0] : scale.min) &&
                  mark.value <= current[current.length - 1]
                : current.includes(mark.value)
              return (
                <span
                  key={mark.value}
                  className="relative col-start-1 row-start-1 h-max w-max max-w-full justify-self-start"
                  style={
                    vertical
                      ? {
                          top: `${percent}%`,
                          transform: `translateY(${endpointTransform(percent)})`,
                        }
                      : {
                          left: `${percent}%`,
                          transform: `translateX(${endpointTransform(percent)})`,
                        }
                  }
                >
                  <button
                    type="button"
                    dir={direction}
                    data-slider-mark={mark.value}
                    data-active={active || undefined}
                    disabled={
                      canEdit
                        ? !canAdd || current.includes(mark.value)
                        : unavailable ||
                          !current.some(
                            (_, index) =>
                              !handleDisabled[index] &&
                              mark.value >= (current[index - 1] ?? scale.min) &&
                              mark.value <= (current[index + 1] ?? scale.max),
                          )
                    }
                    className={cn(
                      'min-h-11 min-w-11 max-w-[min(8rem,100%)] touch-manipulation rounded-[var(--radius-sm)] px-1 py-2 text-sm leading-5 text-muted-foreground wrap-anywhere hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[active=true]:font-semibold data-[active=true]:text-foreground disabled:cursor-not-allowed',
                      classNames?.mark,
                      mark.className,
                    )}
                    onClick={() => selectMark(mark.value)}
                  >
                    {mark.label}
                  </button>
                </span>
              )
            })}
          </div>
        )}
        {editRequested && (
          <div
            className={cn('mt-3 space-y-2', classNames?.editor)}
            data-slider-editor=""
          >
            <p
              id={`${inputId}-edit-help`}
              className="text-sm leading-5 text-muted-foreground"
            >
              点击轨道添加节点。选中后可用移除按钮、Delete /
              Backspace，或拖离轨道并松开删除。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                aria-label={`${ariaLabel ?? label}新增节点值`}
                value={
                  editDraft ?? (suggested === null ? '' : String(suggested))
                }
                disabled={!canAdd}
                className="min-h-11 w-24 min-w-0 rounded-md border border-input bg-card px-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                onChange={(event) => setEditDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (
                    event.key !== 'Enter' ||
                    event.nativeEvent.isComposing ||
                    event.nativeEvent.keyCode === 229
                  )
                    return
                  event.preventDefault()
                  submitAddedValue()
                }}
              />
              <button
                ref={addButtonRef}
                type="button"
                form={inputProps.form}
                aria-label={`${ariaLabel ?? label}添加节点`}
                disabled={!canAdd}
                className="min-h-11 min-w-11 touch-manipulation rounded-md border border-border bg-card px-3 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                onClick={submitAddedValue}
              >
                添加节点
              </button>
              <button
                type="button"
                aria-label={`${ariaLabel ?? label}移除选中节点`}
                disabled={!canRemove}
                className="min-h-11 min-w-11 touch-manipulation rounded-md border border-border bg-card px-3 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (selectedIndex !== null) removeHandle(selectedIndex)
                }}
              >
                移除
                {selectedIndex === null
                  ? '节点'
                  : `节点 ${current[selectedIndex]}`}
              </button>
            </div>
            <p
              role="status"
              aria-label={`${ariaLabel ?? label}节点编辑状态`}
              className="text-sm text-muted-foreground"
            >
              {removing ? '松开后移除节点' : editMessage} · {current.length}{' '}
              个节点
              {Number.isFinite(maxCount)
                ? `（${minCount}–${maxCount}）`
                : `（至少 ${minCount}）`}
            </p>
          </div>
        )}
        {isRange && name && (
          <input
            type="hidden"
            name={name}
            form={inputProps.form}
            value={JSON.stringify(current)}
            disabled={
              disabled === true ||
              (handleDisabled.length > 0 && handleDisabled.every(Boolean))
            }
          />
        )}
      </div>
    )
  },
)
