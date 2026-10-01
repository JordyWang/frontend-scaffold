import type { CascaderOption } from './cascader'

export type CascaderEntry = {
  option: CascaderOption
  path: string[]
  options: CascaderOption[]
  disabled: boolean
}
export const cascaderKey = (path: string[]) => JSON.stringify(path)
export function cascaderText(option: CascaderOption) {
  return (
    option.searchText ??
    (typeof option.label === 'string' || typeof option.label === 'number'
      ? String(option.label)
      : option.value)
  )
}
export function cascaderLevels(options: CascaderOption[], path: string[]) {
  const levels: { choices: CascaderOption[]; selected?: CascaderOption }[] = []
  let choices = options
  let depth = 0
  while (true) {
    const selected = choices.find(
      (option) => option.value === path[depth] && !option.disabled,
    )
    levels.push({ choices, selected })
    if (!selected?.children?.length) break
    choices = selected.children
    depth += 1
  }
  return levels
}
export function validCascaderPath(options: CascaderOption[], path: string[]) {
  return cascaderLevels(options, path).flatMap(({ selected }) =>
    selected ? [selected.value] : [],
  )
}
export function indexCascader(options: CascaderOption[]) {
  const entries = new Map<string, CascaderEntry>()
  function visit(
    items: CascaderOption[],
    ancestors: CascaderOption[],
    blocked: boolean,
  ) {
    for (const option of items) {
      const pathOptions = [...ancestors, option]
      const path = pathOptions.map((item) => item.value)
      const disabled = blocked || Boolean(option.disabled)
      entries.set(cascaderKey(path), {
        option,
        path,
        options: pathOptions,
        disabled,
      })
      visit(option.children ?? [], pathOptions, disabled)
    }
  }
  visit(options, [], false)
  return entries
}
export function searchCascader(
  entries: Map<string, CascaderEntry>,
  query: string,
  changeOnSelect: boolean,
  filter: ((query: string, options: CascaderOption[]) => boolean) | undefined,
  limit: number,
) {
  const text = query.trim().toLocaleLowerCase()
  return [...entries.values()]
    .filter(
      (entry) =>
        (changeOnSelect || !entry.option.children?.length) &&
        (filter
          ? filter(query, entry.options)
          : entry.options.some((option) =>
              cascaderText(option).toLocaleLowerCase().includes(text),
            )),
    )
    .slice(0, limit)
}
