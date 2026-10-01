import { useLayoutEffect, useMemo, useRef } from 'react'
import type { CascaderLoadChildren, CascaderOption } from './cascader'
import { cascaderKey } from './cascader-state'
import type { TreeNode } from './tree'
import { useTreeLoader, type TreeLoadStatus } from './tree-loader'

function nodes(
  options: CascaderOption[],
  path: string[] = [],
  disabled = false,
): TreeNode[] {
  if (!Array.isArray(options)) throw new TypeError('子选项数据必须是数组')
  return options.map((option) => {
    if (!option || typeof option.value !== 'string' || !option.value)
      throw new TypeError('子选项必须提供非空字符串 value')
    const currentPath = [...path, option.value]
    const blocked = disabled || Boolean(option.disabled)
    return {
      key: cascaderKey(currentPath),
      title: option.label,
      textValue: option.searchText,
      disabled: blocked,
      disableCheckbox: option.disableCheckbox,
      isLeaf: option.isLeaf ?? !option.children?.length,
      children:
        option.children === undefined
          ? undefined
          : nodes(option.children, currentPath, blocked),
    }
  })
}
function optionsFromNodes(
  items: TreeNode[],
  statuses?: Map<string, TreeLoadStatus>,
): CascaderOption[] {
  return items.map((node) => ({
    value: (JSON.parse(node.key) as string[]).at(-1)!,
    label: node.title,
    searchText: node.textValue,
    disabled: node.disabled,
    disableCheckbox: node.disableCheckbox,
    isLeaf:
      statuses?.get(node.key) === 'loaded' && !node.children?.length
        ? true
        : node.isLeaf,
    children:
      node.children?.length || node.children !== undefined
        ? optionsFromNodes(node.children ?? [], statuses)
        : undefined,
  }))
}
function pathOptions(options: CascaderOption[], path: string[]) {
  const result: CascaderOption[] = []
  let choices = options
  for (const value of path) {
    const option = choices.find((option) => option.value === value)
    if (!option) break
    result.push(option)
    choices = option.children ?? []
  }
  return result
}

/** Reuses Tree's request ownership; JSON path keys allow repeated values in different columns. */
export function useCascaderLoader({
  options,
  loadChildren,
  loadVersion,
  disabled,
  onLoad,
  onLoadError,
}: {
  options: CascaderOption[]
  loadChildren?: CascaderLoadChildren
  loadVersion: string | number
  disabled: boolean
  onLoad?: (path: CascaderOption[], children: CascaderOption[]) => void
  onLoadError?: (error: unknown, path: CascaderOption[]) => void
}) {
  const currentOptions = useRef(options)
  const source = useMemo(() => nodes(options), [options])
  const loadNodes = useMemo(
    () =>
      loadChildren
        ? async (node: TreeNode, context: { signal: AbortSignal }) => {
            const path = JSON.parse(node.key) as string[]
            const selected = pathOptions(currentOptions.current, path)
            const children = await loadChildren(selected, context)
            return nodes(children, path, Boolean(node.disabled))
          }
        : undefined,
    [loadChildren],
  )
  const loader = useTreeLoader({
    treeData: source,
    loadChildren: loadNodes,
    loadVersion,
    disabled,
    onLoad: (node, children) =>
      onLoad?.(
        pathOptions(currentOptions.current, JSON.parse(node.key) as string[]),
        optionsFromNodes(children),
      ),
    onLoadError: (error, node) =>
      onLoadError?.(
        error,
        pathOptions(currentOptions.current, JSON.parse(node.key) as string[]),
      ),
  })
  const resolved = useMemo(
    () => optionsFromNodes(loader.treeData, loader.statuses),
    [loader.treeData, loader.statuses],
  )
  useLayoutEffect(() => {
    currentOptions.current = resolved
  }, [resolved])
  return {
    options: resolved,
    statuses: loader.statuses,
    expandable: (option: CascaderOption) =>
      Boolean(option.children?.length) ||
      Boolean(loadChildren && option.isLeaf === false),
    request: loader.request,
    cancel: loader.cancel,
  }
}
export type CascaderLoader = ReturnType<typeof useCascaderLoader>
