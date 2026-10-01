import type { TreeNode } from './tree'

export type TreeEntry = {
  node: TreeNode
  parent?: string
  ancestors: string[]
}

export function indexTree(nodes: TreeNode[]) {
  const entries = new Map<string, TreeEntry>()
  function visit(children: TreeNode[], ancestors: string[]) {
    for (const node of children) {
      entries.set(node.key, { node, parent: ancestors.at(-1), ancestors })
      visit(node.children ?? [], [...ancestors, node.key])
    }
  }
  visit(nodes, [])
  return entries
}

export function checkBoundary(node: TreeNode) {
  return node.disabled || node.disableCheckbox || node.checkable === false
}

/** Conduct only within enabled branches; disabled nodes retain their explicit state. */
export function conductChecks(
  keys: string[],
  entries: Map<string, TreeEntry>,
  strict: boolean,
  halfKeys: string[] = [],
) {
  const checked = new Set(keys.filter((key) => entries.has(key)))
  const halfChecked = new Set<string>()
  if (strict) {
    for (const key of halfKeys)
      if (entries.has(key) && !checked.has(key)) halfChecked.add(key)
    return { checked, halfChecked }
  }
  function checkDescendants(node: TreeNode) {
    for (const child of node.children ?? []) {
      if (checkBoundary(child)) continue
      checked.add(child.key)
      checkDescendants(child)
    }
  }
  for (const key of keys) {
    const node = entries.get(key)?.node
    if (node && !checkBoundary(node)) checkDescendants(node)
  }
  for (const { node } of [...entries.values()].reverse()) {
    if (checkBoundary(node)) continue
    const children = (node.children ?? []).filter(
      (child) => !checkBoundary(child),
    )
    if (children.length === 0) continue
    if (children.every((child) => checked.has(child.key))) checked.add(node.key)
    else if (
      children.some(
        (child) => checked.has(child.key) || halfChecked.has(child.key),
      )
    )
      halfChecked.add(node.key)
  }
  return { checked, halfChecked }
}

export function changeCheck(
  key: string,
  checked: Set<string>,
  entries: Map<string, TreeEntry>,
  strict: boolean,
) {
  const entry = entries.get(key)!
  const next = new Set(checked)
  if (!checked.has(key)) next.add(key)
  else {
    next.delete(key)
    if (!strict) {
      function removeChildren(node: TreeNode) {
        for (const child of node.children ?? []) {
          if (checkBoundary(child)) continue
          next.delete(child.key)
          removeChildren(child)
        }
      }
      removeChildren(entry.node)
      for (const ancestor of [...entry.ancestors].reverse()) {
        if (checkBoundary(entries.get(ancestor)!.node)) break
        next.delete(ancestor)
      }
    }
  }
  return next
}

export function treeOrderedKeys(
  keys: Set<string>,
  entries: Map<string, TreeEntry>,
) {
  return [...entries.keys()].filter((key) => keys.has(key))
}
