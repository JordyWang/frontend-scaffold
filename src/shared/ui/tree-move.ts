import type { TreeNode } from './tree'
import { indexTree, type TreeEntry } from './tree-state'

export type TreeDropPosition = 'before' | 'inside' | 'after'
export type TreeMove = {
  dragKey: string
  dropKey: string
  position: TreeDropPosition
}
export type TreeDropInfo = TreeMove & {
  dragNode: TreeNode
  dropNode: TreeNode
  dragKeys: string[]
  treeData: TreeNode[]
}

export function treeDropError(entries: Map<string, TreeEntry>, move: TreeMove) {
  const source = entries.get(move.dragKey)
  const target = entries.get(move.dropKey)
  if (!source || !target) return '节点已不存在'
  if (!['before', 'inside', 'after'].includes(move.position))
    return '移动位置无效'
  if (source.node.draggable === false) return '此节点不可移动'
  if (
    [
      ...source.ancestors,
      source.node.key,
      ...target.ancestors,
      target.node.key,
    ].some((key) => entries.get(key)?.node.disabled)
  )
    return '禁用分支不可移动或接收节点'
  if (move.dragKey === move.dropKey || target.ancestors.includes(move.dragKey))
    return '不能将节点移动到自身或其后代'
  if (move.position === 'inside' && target.node.isLeaf === true)
    return '叶节点不能接收子节点'
  if (source.parent === target.parent) {
    if (move.position === 'before' && source.position === target.position - 1)
      return '节点已位于目标之前'
    if (move.position === 'after' && source.position === target.position + 1)
      return '节点已位于目标之后'
  }
  if (
    move.position === 'inside' &&
    source.parent === move.dropKey &&
    source.position === (target.node.children?.length ?? 0) - 1
  )
    return '节点已位于该目录末尾'
  return undefined
}

/** Moves the whole subtree; unchanged branches retain identity and invalid moves retain the root. */
export function moveTreeNode(treeData: TreeNode[], move: TreeMove): TreeNode[] {
  const entries = indexTree(treeData)
  if (treeDropError(entries, move)) return treeData
  const moving = entries.get(move.dragKey)!.node
  function remove(nodes: TreeNode[]): TreeNode[] {
    let changed = false
    const result: TreeNode[] = []
    for (const node of nodes) {
      if (node.key === move.dragKey) {
        changed = true
        continue
      }
      const children = node.children ? remove(node.children) : undefined
      if (children !== node.children) {
        changed = true
        // An explicitly supplied empty branch is now known, so it must not reload stale children.
        result.push({
          ...node,
          children,
          isLeaf:
            children?.length === 0 && node.isLeaf === false
              ? undefined
              : node.isLeaf,
        })
      } else result.push(node)
    }
    return changed ? result : nodes
  }
  function insert(nodes: TreeNode[]): TreeNode[] {
    let changed = false
    const result: TreeNode[] = []
    for (const node of nodes) {
      if (node.key === move.dropKey) {
        changed = true
        if (move.position === 'before') result.push(moving, node)
        else if (move.position === 'after') result.push(node, moving)
        else
          result.push({ ...node, children: [...(node.children ?? []), moving] })
      } else {
        const children = node.children ? insert(node.children) : undefined
        if (children !== node.children) {
          changed = true
          result.push({ ...node, children })
        } else result.push(node)
      }
    }
    return changed ? result : nodes
  }
  return insert(remove(treeData))
}
