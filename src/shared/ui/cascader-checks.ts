import type { CascaderEntry } from './cascader-state'
import { cascaderKey } from './cascader-state'

export type CascaderCheckedStrategy = 'parent' | 'leaf'

/** Checks are resolved against the full path index, independent of visible columns/search. */
export function cascaderChecks(
  entries: Map<string, CascaderEntry>,
  paths: string[][],
) {
  const targets = new Map<string, Set<string>>()
  const pendingTargets = new Set<string>()
  function collect(entry: CascaderEntry): Set<string> {
    const key = cascaderKey(entry.path)
    const result = new Set<string>()
    targets.set(key, result)
    for (const child of entry.option.children ?? []) {
      const childEntry = entries.get(cascaderKey([...entry.path, child.value]))!
      const childTargets = collect(childEntry)
      if (
        !entry.disabled &&
        !entry.option.disableCheckbox &&
        !child.disableCheckbox
      )
        childTargets.forEach((target) => result.add(target))
    }
    if (
      !entry.option.children?.length &&
      !entry.disabled &&
      !entry.option.disableCheckbox
    ) {
      result.add(key)
      if (entry.option.isLeaf === false) pendingTargets.add(key)
    }
    return result
  }
  for (const entry of entries.values())
    if (entry.path.length === 1) collect(entry)

  const leaves = new Set<string>()
  const retained: string[][] = []
  const retainedKeys = new Set<string>()
  const seen = new Set<string>()
  for (const path of paths) {
    if (!path.length) continue
    const key = cascaderKey(path)
    if (seen.has(key)) continue
    seen.add(key)
    const entry = entries.get(key)
    const branch = targets.get(key)
    if (
      !entry ||
      entry.disabled ||
      entry.option.disableCheckbox ||
      !branch?.size
    ) {
      retained.push(path)
      retainedKeys.add(key)
    } else branch.forEach((leaf) => leaves.add(leaf))
  }
  function state(key: string, selection = leaves): boolean | 'mixed' {
    if (retainedKeys.has(key)) return true
    const branch = targets.get(key)
    if (!branch?.size) return false
    let count = 0
    for (const leaf of branch) if (selection.has(leaf)) count += 1
    return count === branch.size ? true : count ? 'mixed' : false
  }
  function values(selection: Set<string>, strategy: CascaderCheckedStrategy) {
    const checked = [...entries.entries()].filter(
      ([key, entry]) =>
        !entry.disabled &&
        !entry.option.disableCheckbox &&
        Boolean(targets.get(key)?.size) &&
        state(key, selection) === true,
    )
    const result = checked
      .filter(([key, entry]) => {
        if (strategy === 'leaf') return selection.has(key)
        for (let depth = 1; depth < entry.path.length; depth += 1) {
          const ancestorKey = cascaderKey(entry.path.slice(0, depth))
          if (
            state(ancestorKey, selection) === true &&
            [...targets.get(key)!].every((leaf) =>
              targets.get(ancestorKey)?.has(leaf),
            )
          )
            return false
        }
        return true
      })
      .map(([, entry]) => entry.path)
    return [...result, ...retained]
  }
  function toggle(key: string, strategy: CascaderCheckedStrategy) {
    const next = new Set(leaves)
    const checked = state(key) === true
    for (const leaf of targets.get(key) ?? []) {
      if (checked) next.delete(leaf)
      else next.add(leaf)
    }
    return values(next, strategy)
  }
  function remove(path: string[], strategy: CascaderCheckedStrategy) {
    const key = cascaderKey(path)
    const next = new Set(leaves)
    for (const leaf of targets.get(key) ?? []) next.delete(leaf)
    return values(next, strategy).filter((value) => cascaderKey(value) !== key)
  }
  return { leaves, targets, pendingTargets, state, toggle, remove, values }
}
