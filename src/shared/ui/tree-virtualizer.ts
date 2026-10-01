import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'

export type TreeScrollOptions = {
  key: string
  align?: 'start' | 'center' | 'end' | 'auto'
  offset?: number
  autoExpand?: boolean
  focus?: boolean
}
type Slot = { key: string; start: number; size: number; index: number }
type Options = {
  keys: string[]
  enabled: boolean
  height: number
  estimate: number
  overscan: number
  keepKey?: string
  rootRef: RefObject<HTMLDivElement | null>
  nodeRefs: RefObject<Map<string, HTMLLIElement>>
}

/** Variable-height window; focused items remain mounted in their logical order. */
export function useTreeVirtualizer(options: Options) {
  const { keys, enabled, rootRef, nodeRefs, keepKey } = options
  const estimate = Number.isFinite(options.estimate)
    ? Math.max(44, options.estimate)
    : 44
  const overscan = Number.isFinite(options.overscan)
    ? Math.min(50, Math.max(0, Math.floor(options.overscan)))
    : 3
  const [sizes, setSizes] = useState(new Map<string, number>())
  const [, commitScroll] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(options.height)
  const width = useRef<number | undefined>(undefined)
  const anchor = useRef<{ key: string; delta: number } | null>(null)
  const target = useRef<{ request: TreeScrollOptions; top: number } | null>(
    null,
  )
  const expectedScroll = useRef<number | undefined>(undefined)
  const layout = useMemo(() => {
    let total = 0
    const slots: Slot[] = []
    for (const [index, key] of keys.entries()) {
      const slot = {
        key,
        index,
        start: total,
        size: sizes.get(key) ?? estimate,
      }
      total += slot.size
      slots.push(slot)
    }
    return {
      slots,
      total,
      byKey: new Map(slots.map((slot) => [slot.key, slot])),
    }
  }, [keys, estimate, sizes])
  const maxScroll = Math.max(0, layout.total - viewport)
  const effectiveTop = Math.min(scrollTop, maxScroll)
  const firstAt = (offset: number) => {
    let low = 0
    let high = layout.slots.length
    while (low < high) {
      const middle = (low + high) >>> 1
      const slot = layout.slots[middle]
      if (slot.start + slot.size <= offset) low = middle + 1
      else high = middle
    }
    return low
  }
  const first = Math.max(0, firstAt(effectiveTop) - overscan)
  const last = Math.min(
    layout.slots.length,
    firstAt(effectiveTop + viewport) + 1 + overscan,
  )
  const rendered = new Set(
    layout.slots.slice(first, last).map((slot) => slot.index),
  )
  const kept = keepKey ? layout.byKey.get(keepKey) : undefined
  if (kept) rendered.add(kept.index)
  const items = [...rendered]
    .sort((a, b) => a - b)
    .map((index) => layout.slots[index])

  function moveTo(next: number) {
    const safe = Math.min(maxScroll, Math.max(0, next))
    const root = rootRef.current
    if (root && Math.abs(root.scrollTop - safe) > 0.5) {
      expectedScroll.current = safe
      root.scrollTop = safe
    }
    setScrollTop(safe)
  }
  function alignSlot(
    slot: Slot,
    request: TreeScrollOptions,
    originalTop?: number,
  ) {
    const top = originalTop ?? rootRef.current?.scrollTop ?? scrollTop
    const align = request.align ?? 'auto'
    const offset = Number.isFinite(request.offset) ? request.offset! : 0
    const next =
      align === 'start'
        ? slot.start
        : align === 'center'
          ? slot.start - (viewport - slot.size) / 2
          : align === 'end'
            ? slot.start + slot.size - viewport
            : slot.start < top
              ? slot.start
              : slot.start + slot.size > top + viewport
                ? slot.size > viewport
                  ? slot.start
                  : slot.start + slot.size - viewport
                : top
    return next + offset
  }
  function scrollTo(request: TreeScrollOptions) {
    const slot = layout.byKey.get(request.key)
    if (!enabled || !slot) return
    anchor.current = null
    target.current = { request, top: rootRef.current?.scrollTop ?? scrollTop }
    moveTo(alignSlot(slot, request))
    // Also commit when a kept offscreen item is requested at the existing offset.
    commitScroll((value) => value + 1)
  }
  function onScroll() {
    const next = rootRef.current?.scrollTop ?? 0
    if (
      expectedScroll.current === undefined ||
      Math.abs(next - expectedScroll.current) > 1
    ) {
      target.current = null
      anchor.current = null
    }
    expectedScroll.current = undefined
    setScrollTop(next)
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !enabled) return
    const measure = () => {
      const style = getComputedStyle(root)
      const padding =
        (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0)
      setViewport(
        root.clientHeight
          ? Math.max(1, root.clientHeight - padding)
          : options.height,
      )
      setScrollTop(root.scrollTop)
      if (width.current !== undefined && width.current !== root.clientWidth) {
        setSizes(new Map())
      }
      width.current = root.clientWidth
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [enabled, options.height, rootRef])

  useLayoutEffect(() => {
    if (!enabled) return
    const currentKeys = new Set(keys)
    const elements = [...nodeRefs.current].filter(([key]) =>
      currentKeys.has(key),
    )
    const measure = () => {
      const top = rootRef.current?.scrollTop ?? 0
      const anchorSlot = layout.slots[firstAt(top)]
      const nextSizes = new Map(sizes)
      let changed = false
      for (const key of sizes.keys()) {
        if (!currentKeys.has(key)) {
          nextSizes.delete(key)
          changed = true
        }
      }
      for (const [key, element] of elements) {
        const size = element.getBoundingClientRect().height
        if (size <= 0 || Math.abs((sizes.get(key) ?? estimate) - size) < 0.5)
          continue
        nextSizes.set(key, size)
        changed = true
      }
      if (changed) {
        const focusedSlot = keepKey ? layout.byKey.get(keepKey) : undefined
        const focusedSize = focusedSlot
          ? (nextSizes.get(focusedSlot.key) ?? focusedSlot.size)
          : 0
        if (
          !target.current &&
          focusedSlot &&
          focusedSize <= viewport &&
          Math.abs(focusedSize - focusedSlot.size) > 0.5 &&
          focusedSlot.start >= top - 1 &&
          focusedSlot.start + focusedSlot.size <= top + viewport + 1 &&
          nodeRefs.current
            .get(focusedSlot.key)
            ?.contains(document.activeElement)
        ) {
          target.current = { request: { key: focusedSlot.key }, top }
        }
        if (!target.current && anchorSlot)
          anchor.current = {
            key: anchorSlot.key,
            delta: top - anchorSlot.start,
          }
        setSizes(nextSizes)
      }
      return changed
    }
    const changed = measure()
    if (!changed) {
      const intent = target.current
      const request = intent?.request
      const slot = request ? layout.byKey.get(request.key) : undefined
      if (request && slot) {
        moveTo(alignSlot(slot, request, intent?.top))
        target.current = null
      } else if (anchor.current) {
        const anchored = layout.byKey.get(anchor.current.key)
        if (anchored) moveTo(anchored.start + anchor.current.delta)
        else moveTo(Math.min(scrollTop, maxScroll))
        anchor.current = null
      } else if ((rootRef.current?.scrollTop ?? scrollTop) > maxScroll)
        moveTo(maxScroll)
    }
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    for (const [, element] of elements) observer.observe(element)
    return () => observer.disconnect()
  })

  return { items, totalHeight: layout.total, scrollTo, onScroll }
}
