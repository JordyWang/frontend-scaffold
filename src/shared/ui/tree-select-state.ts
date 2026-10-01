import type { TreeSelectOption } from './tree-select'
import type { TreeNode } from './tree'
import { checkBoundary, type TreeEntry } from './tree-state'

export type TreeSelectCheckedStrategy = 'all' | 'parent' | 'leaf'

export function treeSelectText(option: TreeSelectOption) {
  return (
    option.searchText ??
    (typeof option.label === 'string' || typeof option.label === 'number'
      ? String(option.label)
      : option.value)
  )
}

export function treeSelectNodes(options: TreeSelectOption[]): TreeNode[] {
  return options.map((option) => ({
    key: option.value,
    title: option.label,
    textValue: treeSelectText(option),
    disabled: option.disabled,
    selectable: option.selectable,
    checkable: option.checkable,
    disableCheckbox: option.disableCheckbox,
    isLeaf: option.isLeaf,
    icon: option.icon,
    children: option.children ? treeSelectNodes(option.children) : undefined,
  }))
}

export function filterTreeSelect(nodes: TreeNode[], query: string): TreeNode[] {
  const text = query.trim().toLocaleLowerCase()
  if (!text) return nodes
  return nodes.flatMap((node) => {
    const children = filterTreeSelect(node.children ?? [], query)
    return node.textValue?.toLocaleLowerCase().includes(text) || children.length
      ? [{ ...node, children }]
      : []
  })
}

/** Compress conducted checks without crossing disabled/checkable boundaries. */
export function treeSelectCheckedValues(
  checked: Set<string>,
  entries: Map<string, TreeEntry>,
  strategy: TreeSelectCheckedStrategy,
  strict: boolean,
) {
  return [...entries.values()]
    .filter(({ node, ancestors }) => {
      if (!checked.has(node.key)) return false
      if (strict || strategy === 'all') return true
      if (strategy === 'leaf')
        return (
          checkBoundary(node) ||
          !(node.children ?? []).some((child) => !checkBoundary(child))
        )
      if (checkBoundary(node)) return true
      for (const key of [...ancestors].reverse()) {
        const parent = entries.get(key)!.node
        if (checkBoundary(parent)) break
        if (checked.has(key)) return false
      }
      return true
    })
    .map(({ node }) => node.key)
}

/** Compute pending leaf additions once per tree, then keep blocked branches expandable. */
export function limitTreeSelectNodes(
  nodes: TreeNode[],
  entries: Map<string, TreeEntry>,
  selected: Set<string>,
  checked: Set<string>,
  count: number,
  limit: number | undefined,
  checkable: boolean,
  strict: boolean,
): TreeNode[] {
  if (limit === undefined) return nodes
  const additions = new Map<string, number>()
  for (const { node } of [...entries.values()].reverse()) {
    const children = (node.children ?? []).filter(
      (child) => !checkBoundary(child),
    )
    additions.set(
      node.key,
      strict || children.length === 0
        ? Number(!checked.has(node.key))
        : children.reduce(
            (sum, child) => sum + (additions.get(child.key) ?? 0),
            0,
          ),
    )
  }
  function visit(items: TreeNode[]): TreeNode[] {
    return items.map((node) => {
      const addition = checkable
        ? (additions.get(node.key) ?? 0)
        : Number(!selected.has(node.key))
      const blocked = addition > 0 && count + addition > limit!
      return {
        ...node,
        selectable: checkable
          ? node.selectable
          : node.selectable !== false && !blocked,
        disableCheckbox: node.disableCheckbox || (checkable && blocked),
        children: node.children ? visit(node.children) : undefined,
      }
    })
  }
  return visit(nodes)
}
