import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import type { CascaderOption, CascaderPart } from './cascader'
import type { ControlSize } from './config-context'
import type { InputStatus, InputVariant } from './input'
import {
  cascaderLevels,
  cascaderText,
  validCascaderPath,
} from './cascader-state'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

export function CascaderNative({
  options,
  path,
  onChange,
  label,
  id,
  required,
  ariaDescribedBy,
  ariaInvalid,
  ariaLabelledBy,
  disabled,
  size,
  variant,
  status,
  classNames,
}: {
  options: CascaderOption[]
  path: string[]
  onChange: (value: string[]) => void
  label: string
  id: string
  required?: boolean
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaLabelledBy?: string
  disabled: boolean
  size: ControlSize
  variant: InputVariant
  status: InputStatus
  classNames?: Partial<Record<CascaderPart, string>>
}) {
  const levels = cascaderLevels(options, path)
  const validPath = validCascaderPath(options, path)
  return (
    <div className={cn('flex min-w-0 flex-wrap gap-2', classNames?.panel)}>
      {levels.map(({ choices, selected }, depth) => (
        <select
          key={depth}
          id={depth === 0 ? id : undefined}
          className={cn(
            inputStyles,
            inputSizeStyles[size],
            inputVariantStyles[variant],
            inputStatusStyles[status],
            'min-w-[min(100%,10rem)] flex-[1_1_10rem] cursor-pointer touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            size === 'large'
              ? 'h-[max(48px,var(--ui-control-height))]'
              : 'h-[max(44px,var(--ui-control-height))]',
            classNames?.column,
          )}
          required={required && depth === levels.length - 1}
          aria-describedby={ariaDescribedBy}
          aria-invalid={status === 'error' || ariaInvalid || undefined}
          aria-labelledby={depth === 0 ? ariaLabelledBy : undefined}
          aria-label={`${label}${depth ? `第${depth + 1}级` : ''}`}
          value={selected?.value ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const value = event.currentTarget.value
            onChange(
              value
                ? [...validPath.slice(0, depth), value]
                : validPath.slice(0, depth),
            )
          }}
        >
          <option value="">请选择</option>
          {choices.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {typeof option.label === 'string' ||
              typeof option.label === 'number'
                ? (option.label as ReactNode)
                : cascaderText(option)}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
