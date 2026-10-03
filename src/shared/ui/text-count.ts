import type { ReactNode } from 'react'

export type TextCountInfo = {
  value: string
  count: number
  max?: number
}

export type TextCount =
  | boolean
  | {
      max?: number
      strategy?: (value: string) => number
      render?: (info: TextCountInfo) => ReactNode
    }

function validLimit(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined
}

export function resolveTextCount(
  value: string,
  setting: TextCount | undefined,
  nativeMaxLength: number | undefined,
) {
  if (!setting) return null
  const options = typeof setting === 'object' ? setting : undefined
  const calculated = options?.strategy?.(value) ?? value.length
  const count =
    Number.isFinite(calculated) && calculated >= 0
      ? Math.floor(calculated)
      : value.length
  const max = validLimit(options?.max) ?? validLimit(nativeMaxLength)
  const info: TextCountInfo = { value, count, max }
  const exceeded = max !== undefined && count > max
  return {
    content: options?.render
      ? options.render(info)
      : `${count}${max === undefined ? '' : ` / ${max}`}`,
    description:
      max === undefined
        ? `已输入 ${count} 个字符`
        : exceeded
          ? `已输入 ${count} 个字符，超过上限 ${max} 个字符`
          : `已输入 ${count} 个字符，上限 ${max} 个字符`,
    exceeded,
  }
}
