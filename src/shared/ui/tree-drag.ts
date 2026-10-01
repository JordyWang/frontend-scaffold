import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type RefObject,
} from 'react'
import type { TreeNode } from './tree'
import type { TreeEntry } from './tree-state'
import {
  treeDropError,
  type TreeDropInfo,
  type TreeDropPosition,
} from './tree-move'

type Session = {
  source: string
  target?: string
  position: TreeDropPosition
  input: 'native' | 'controls'
}
type Options = {
  treeData: TreeNode[]
  entries: Map<string, TreeEntry>
  visibleKeys: string[]
  disabled: boolean
  draggable: boolean | ((node: TreeNode) => boolean)
  loadChildren: boolean
  isUnloaded: (node: TreeNode) => boolean
  expanded: Set<string>
  expand: (key: string) => void
  focus: (key: string) => void
  rootRef: RefObject<HTMLDivElement | null>
  scopeRef: RefObject<HTMLDivElement | null>
  allowDrop?: (info: TreeDropInfo) => boolean
  onDrop?: (info: TreeDropInfo) => void
}

export function treeNodeText(node: TreeNode | undefined) {
  return (
    node?.textValue ??
    (typeof node?.title === 'string' || typeof node?.title === 'number'
      ? String(node.title)
      : '节点')
  )
}

/** A shared move command for native drag, keyboard and touch controls. */
export function useTreeDrag(options: Options) {
  const [session, setSession] = useState<Session | null>(null)
  const [message, setMessage] = useState('')
  const active = useRef<Session | null>(null)
  const latest = useRef(options)
  const hover = useRef<{ key: string; timer: number } | null>(null)
  const frame = useRef<number | null>(null)
  const point = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(0)
  useLayoutEffect(() => {
    latest.current = options
  }, [options])

  function canDrag(key: string, config = options) {
    const entry = config.entries.get(key)
    return Boolean(
      entry &&
      !config.disabled &&
      config.draggable &&
      entry.node.draggable !== false &&
      ![...entry.ancestors, key].some(
        (key) => config.entries.get(key)?.node.disabled,
      ) &&
      (typeof config.draggable !== 'function' || config.draggable(entry.node)),
    )
  }
  function info(
    target: string,
    position: TreeDropPosition,
    source = session?.source,
    config = options,
  ): TreeDropInfo | undefined {
    const dragNode = source ? config.entries.get(source)?.node : undefined
    const dropNode = config.entries.get(target)?.node
    if (!source || !dragNode || !dropNode) return undefined
    return {
      dragKey: source,
      dropKey: target,
      position,
      dragNode,
      dropNode,
      dragKeys: [...config.entries.values()]
        .filter(
          (entry) =>
            entry.node.key === source || entry.ancestors.includes(source),
        )
        .map((entry) => entry.node.key),
      treeData: config.treeData,
    }
  }
  function error(
    target: string,
    position: TreeDropPosition,
    source = session?.source,
    config = options,
  ) {
    if (!source || !canDrag(source, config)) return '来源节点不可移动'
    const move = info(target, position, source, config)
    if (!move) return '节点已不存在'
    const invalid = treeDropError(config.entries, move)
    if (invalid) return invalid
    if (config.allowDrop && !config.allowDrop(move)) return '此位置不允许放置'
    if (position === 'inside' && config.isUnloaded(move.dropNode))
      return '请先展开并完成目录加载'
    return undefined
  }
  function stopHover() {
    if (hover.current) window.clearTimeout(hover.current.timer)
    hover.current = null
  }
  function stop() {
    stopHover()
    if (frame.current !== null) window.cancelAnimationFrame(frame.current)
    frame.current = null
    point.current = null
  }
  function update(next: Session | null) {
    active.current = next
    setSession(next)
  }
  function cancel(restore = true, reason = '已取消节点移动') {
    const previous = active.current
    if (!previous) return
    stop()
    update(null)
    setMessage(reason)
    if (restore) latest.current.focus(previous.source)
  }
  function choose(
    target: string,
    position = active.current?.position ?? 'after',
  ) {
    const previous = active.current
    if (!previous) return
    if (previous.target !== target || previous.position !== position)
      update({ ...previous, target, position })
    const invalid = error(target, position, previous.source, latest.current)
    setMessage(
      invalid ??
        `目标：${treeNodeText(latest.current.entries.get(target)?.node)}，位置：${position === 'before' ? '之前' : position === 'after' ? '之后' : '内部'}`,
    )
  }
  function begin(key: string, input: Session['input'] = 'controls') {
    if (!canDrag(key, latest.current)) return
    stop()
    update({ source: key, position: 'after', input })
    setMessage(
      `正在移动${treeNodeText(latest.current.entries.get(key)?.node)}。选择目标和位置，Enter 确认，Escape 取消。`,
    )
    latest.current.focus(key)
  }
  function commit(
    target: string,
    position = active.current?.position ?? 'after',
  ) {
    const previous = active.current
    if (!previous) return
    const invalid = error(target, position, previous.source, latest.current)
    if (invalid) {
      choose(target, position)
      return
    }
    const move = info(target, position, previous.source, latest.current)!
    stop()
    update(null)
    setMessage(`已提交${treeNodeText(move.dragNode)}的移动请求`)
    if (position === 'inside' && !latest.current.expanded.has(target))
      latest.current.expand(target)
    latest.current.onDrop?.(move)
    latest.current.focus(previous.source)
  }
  function nativePosition(element: HTMLElement, y: number): TreeDropPosition {
    const box = element.getBoundingClientRect()
    const ratio = box.height > 0 ? (y - box.top) / box.height : 0.5
    return ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside'
  }
  function candidate(key: string, element: HTMLElement, y: number) {
    const position = nativePosition(element, y)
    choose(key, position)
    const config = latest.current
    const entry = config.entries.get(key)
    const move = info(key, 'inside', active.current?.source, config)
    const canExpand =
      position === 'inside' &&
      entry &&
      move &&
      !config.expanded.has(key) &&
      (Boolean(entry.node.children?.length) ||
        (config.loadChildren && entry.node.isLeaf !== true)) &&
      !treeDropError(config.entries, move) &&
      (!config.allowDrop || config.allowDrop(move))
    if (canExpand && hover.current?.key !== key) {
      stopHover()
      hover.current = {
        key,
        timer: window.setTimeout(() => {
          if (
            active.current?.target === key &&
            active.current.position === 'inside'
          )
            latest.current.expand(key)
        }, 600),
      }
    } else if (!canExpand) stopHover()
    return position
  }
  function rowAt(x: number, y: number) {
    const root = latest.current.rootRef.current
    const row = document
      .elementFromPoint?.(x, y)
      ?.closest<HTMLElement>('[data-ui-tree-row]')
    const item = row?.closest<HTMLElement>('[data-tree-key]')
    return row && item && root?.contains(item)
      ? { row, key: item.dataset.treeKey! }
      : undefined
  }
  function autoScroll() {
    frame.current = null
    const current = point.current
    const root = latest.current.rootRef.current
    if (!current || !root || active.current?.input !== 'native') return
    const box = root.getBoundingClientRect()
    if (current.x >= box.left && current.x <= box.right) {
      const speed =
        current.y < box.top + 36 ? -14 : current.y > box.bottom - 36 ? 14 : 0
      if (speed) {
        const previousTop = root.scrollTop
        root.scrollTop += speed
        const hit = rowAt(current.x, current.y)
        if (hit) candidate(hit.key, hit.row, current.y)
        if (root.scrollTop === previousTop) return
      } else return
    }
    frame.current = window.requestAnimationFrame(autoScroll)
  }
  function nativeStart(event: DragEvent<HTMLElement>, key: string) {
    if (!canDrag(key, latest.current)) {
      event.preventDefault()
      return
    }
    begin(key, 'native')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-ui-tree-node', key)
    event.dataTransfer.setData(
      'text/plain',
      treeNodeText(latest.current.entries.get(key)?.node),
    )
  }
  function nativeOver(event: DragEvent<HTMLElement>, key: string) {
    if (active.current?.input !== 'native') return
    const position = candidate(key, event.currentTarget, event.clientY)
    if (!error(key, position, active.current.source, latest.current)) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    } else event.dataTransfer.dropEffect = 'none'
    point.current = { x: event.clientX, y: event.clientY }
    if (frame.current === null)
      frame.current = window.requestAnimationFrame(autoScroll)
  }
  function nativeDrop(event: DragEvent<HTMLElement>, key: string) {
    if (active.current?.input !== 'native') return
    event.preventDefault()
    commit(key, nativePosition(event.currentTarget, event.clientY))
  }
  function nativeEnd() {
    suppressClick.current = performance.now() + 100
    cancel()
  }
  function nativeLeave(event: DragEvent<HTMLElement>) {
    const root = latest.current.rootRef.current
    const next = event.relatedTarget
    if (next instanceof Node && root?.contains(next)) return
    const box = root?.getBoundingClientRect()
    if (
      box &&
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom &&
      (!next || rowAt(event.clientX, event.clientY))
    )
      return
    stop()
    if (active.current?.input === 'native' && active.current.target)
      update({ ...active.current, target: undefined })
  }
  function clickHandle(key: string) {
    if (performance.now() > suppressClick.current) begin(key)
  }
  function track(x: number, y: number) {
    if (active.current?.input !== 'native') return
    const root = latest.current.rootRef.current
    const box = root?.getBoundingClientRect()
    if (
      !box ||
      x < box.left ||
      x > box.right ||
      y < box.top ||
      y > box.bottom
    ) {
      stop()
      if (active.current.target)
        update({ ...active.current, target: undefined })
      return
    }
    // Virtual rows can move or unmount underneath a stationary native drag.
    // Resolve the current hit on document dragover instead of relying only on row enter events.
    const hit = rowAt(x, y)
    if (hit) candidate(hit.key, hit.row, y)
    point.current = { x, y }
    if (frame.current === null)
      frame.current = window.requestAnimationFrame(autoScroll)
  }

  useLayoutEffect(() => {
    if (
      session &&
      (!canDrag(session.source, latest.current) ||
        !options.visibleKeys.includes(session.source))
    )
      cancel(false, '来源节点已删除、禁用或隐藏，移动已取消')
  })
  useEffect(() => {
    if (!session) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
      }
    }
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !latest.current.scopeRef.current?.contains(event.target)
      )
        cancel(false)
    }
    const blur = () => cancel(false)
    const dragOver = (event: globalThis.DragEvent) =>
      track(event.clientX, event.clientY)
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', outside, true)
    window.addEventListener('blur', blur)
    document.addEventListener('dragover', dragOver)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', outside, true)
      window.removeEventListener('blur', blur)
      document.removeEventListener('dragover', dragOver)
    }
  })
  useEffect(() => {
    const hoverRef = hover
    const frameRef = frame
    return () => {
      if (hoverRef.current) window.clearTimeout(hoverRef.current.timer)
      if (frameRef.current !== null)
        window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return {
    session,
    message,
    canDrag,
    error,
    begin,
    choose,
    commit,
    cancel,
    clickHandle,
    nativeStart,
    nativeOver,
    nativeDrop,
    nativeEnd,
    nativeLeave,
  }
}
