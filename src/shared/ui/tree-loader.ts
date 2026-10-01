import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TreeNode } from './tree'
import { indexTree } from './tree-state'

export type TreeLoadChildren = (
  node: TreeNode,
  options: { signal: AbortSignal },
) => Promise<TreeNode[]>
export type TreeLoadStatus = 'loading' | 'loaded' | 'error' | 'cancelled'
type LoadRecord = {
  version: string | number
  status: TreeLoadStatus
  children?: TreeNode[]
}
type Request = { controller: AbortController; promise: Promise<void> }
type LoaderOptions = {
  treeData: TreeNode[]
  loadChildren?: TreeLoadChildren
  loadVersion: string | number
  disabled: boolean
  onLoad?: (node: TreeNode, children: TreeNode[]) => void
  onLoadError?: (error: unknown, node: TreeNode) => void
}

function acceptsChildren(node: TreeNode) {
  return (
    node.isLeaf !== true &&
    (node.children === undefined ||
      (node.isLeaf === false && node.children.length === 0))
  )
}

function resolveTree(
  treeData: TreeNode[],
  records: Map<string, LoadRecord>,
  version: string | number,
) {
  const sources = new Map<string, TreeNode>()
  function visit(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node) => {
      sources.set(node.key, node)
      const record = records.get(node.key)
      const cached =
        record?.version === version &&
        record.status === 'loaded' &&
        acceptsChildren(node)
      const children = cached ? record.children : node.children
      return children === undefined
        ? node
        : { ...node, children: visit(children) }
    })
  }
  return { treeData: visit(treeData), sources }
}

function validateChildren(children: TreeNode[], existing: Set<string>) {
  function visit(nodes: TreeNode[]) {
    if (!Array.isArray(nodes)) throw new TypeError('子节点数据必须是数组')
    for (const node of nodes) {
      if (
        !node ||
        typeof node !== 'object' ||
        typeof node.key !== 'string' ||
        !node.key ||
        existing.has(node.key)
      )
        throw new TypeError('子节点键必须在整棵树中唯一')
      existing.add(node.key)
      if (node.children !== undefined) visit(node.children)
    }
  }
  visit(children)
}

/** Owns lazy children without mutating source data; every request has a cancellable identity. */
export function useTreeLoader(options: LoaderOptions) {
  const [records, setRecords] = useState(new Map<string, LoadRecord>())
  const recordsRef = useRef(records)
  const requests = useRef(new Map<string, Request>())
  const latest = useRef(options)
  const mounted = useRef(false)
  const resolved = useMemo(
    () => resolveTree(options.treeData, records, options.loadVersion),
    [options.treeData, options.loadVersion, records],
  )

  const cancel = useCallback((key: string, preserveStatus = false) => {
    const request = requests.current.get(key)
    if (!request) return
    requests.current.delete(key)
    if (preserveStatus)
      recordsRef.current.set(key, {
        version: latest.current.loadVersion,
        status: 'cancelled',
      })
    else recordsRef.current.delete(key)
    request.controller.abort()
    if (mounted.current) setRecords(new Map(recordsRef.current))
  }, [])

  useLayoutEffect(() => {
    mounted.current = true
    const pending = requests.current
    const cache = recordsRef.current
    return () => {
      mounted.current = false
      for (const request of pending.values()) request.controller.abort()
      pending.clear()
      cache.clear()
    }
  }, [])

  useLayoutEffect(() => {
    latest.current = options
    const snapshot = resolveTree(
      options.treeData,
      recordsRef.current,
      options.loadVersion,
    )
    let changed = false
    for (const [key, record] of recordsRef.current) {
      const source = snapshot.sources.get(key)
      const invalid =
        record.version !== options.loadVersion ||
        !source ||
        !acceptsChildren(source)
      if (
        invalid ||
        (record.status === 'loading' &&
          (options.disabled || source?.disabled || !options.loadChildren))
      ) {
        const request = requests.current.get(key)
        requests.current.delete(key)
        recordsRef.current.delete(key)
        request?.controller.abort()
        changed = true
      }
    }
    if (changed) setRecords(new Map(recordsRef.current))
  }, [options])

  const request = useCallback(
    (key: string): Promise<void> => {
      const current = latest.current
      const snapshot = resolveTree(
        current.treeData,
        recordsRef.current,
        current.loadVersion,
      )
      const node = snapshot.sources.get(key)
      if (
        !mounted.current ||
        current.disabled ||
        !current.loadChildren ||
        !node ||
        node.disabled ||
        !acceptsChildren(node)
      )
        return Promise.resolve()
      const existing = requests.current.get(key)
      if (existing) return existing.promise
      if (recordsRef.current.get(key)?.status === 'loaded')
        return Promise.resolve()
      const controller = new AbortController()
      const entry: Request = { controller, promise: Promise.resolve() }
      recordsRef.current.set(key, {
        version: current.loadVersion,
        status: 'loading',
      })
      requests.current.set(key, entry)
      setRecords(new Map(recordsRef.current))

      const active = () =>
        mounted.current &&
        requests.current.get(key) === entry &&
        !controller.signal.aborted
      entry.promise = Promise.resolve().then(async () => {
        if (!active()) return
        let children: TreeNode[]
        let loadedNode: TreeNode
        try {
          children = await current.loadChildren!(node, {
            signal: controller.signal,
          })
          if (!active()) return
          const config = latest.current
          const live = resolveTree(
            config.treeData,
            recordsRef.current,
            config.loadVersion,
          )
          const source = live.sources.get(key)
          if (
            config.loadVersion !== current.loadVersion ||
            !source ||
            !acceptsChildren(source) ||
            config.disabled ||
            source.disabled ||
            !config.loadChildren
          ) {
            cancel(key)
            return
          }
          validateChildren(children, new Set(indexTree(live.treeData).keys()))
          loadedNode = source
        } catch (error) {
          if (!active()) return
          requests.current.delete(key)
          recordsRef.current.set(key, {
            version: current.loadVersion,
            status: 'error',
          })
          setRecords(new Map(recordsRef.current))
          latest.current.onLoadError?.(error, node)
          return
        }
        requests.current.delete(key)
        recordsRef.current.set(key, {
          version: latest.current.loadVersion,
          status: 'loaded',
          children,
        })
        setRecords(new Map(recordsRef.current))
        // Consumer callback errors must not become a failed load or be swallowed.
        latest.current.onLoad?.(loadedNode, children)
      })
      return entry.promise
    },
    [cancel],
  )

  const statuses = new Map<string, TreeLoadStatus>()
  for (const [key, record] of records) {
    const source = resolved.sources.get(key)
    if (
      record.version === options.loadVersion &&
      source &&
      acceptsChildren(source)
    )
      statuses.set(key, record.status)
  }
  const expandable = (node: TreeNode) =>
    Boolean(node.children?.length) ||
    Boolean(
      options.loadChildren &&
      node.isLeaf !== true &&
      acceptsChildren(resolved.sources.get(node.key) ?? node) &&
      statuses.get(node.key) !== 'loaded',
    )

  return { treeData: resolved.treeData, statuses, expandable, request, cancel }
}
