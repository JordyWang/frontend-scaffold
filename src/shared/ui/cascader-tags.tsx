import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'
import type {
  CascaderMultipleProps,
  CascaderOption,
  CascaderPart,
} from './cascader'
import { cascaderKey, cascaderText, type CascaderEntry } from './cascader-state'

export function CascaderTags({
  paths,
  entries,
  disabled,
  maxTagCount,
  maxTagPlaceholder,
  tagRender,
  removeIcon,
  displayRender,
  classNames,
  onRemove,
}: {
  paths: string[][]
  entries: Map<string, CascaderEntry>
  disabled: boolean
  maxTagCount?: number
  maxTagPlaceholder?: CascaderMultipleProps['maxTagPlaceholder']
  tagRender?: CascaderMultipleProps['tagRender']
  removeIcon?: ReactNode
  displayRender?: (path: CascaderOption[]) => ReactNode
  classNames?: Partial<Record<CascaderPart, string>>
  onRemove: (path: string[]) => void
}) {
  const count =
    maxTagCount !== undefined && Number.isFinite(maxTagCount)
      ? Math.max(0, Math.floor(maxTagCount))
      : paths.length
  const omitted = paths.slice(count)
  return (
    <span
      className={cn(
        'mt-1 flex min-w-0 max-w-full flex-wrap gap-1',
        classNames?.tags,
      )}
    >
      {paths.slice(0, count).map((path) => {
        const entry = entries.get(cascaderKey(path))
        const blocked =
          disabled || Boolean(entry?.disabled || entry?.option.disableCheckbox)
        const text =
          entry?.options.map(cascaderText).join(' / ') ?? path.join(' / ')
        const label =
          entry && displayRender ? displayRender(entry.options) : text
        return (
          <span
            key={cascaderKey(path)}
            className={cn(
              'inline-flex min-w-0 max-w-full items-center rounded-[var(--radius-sm)] border border-border bg-muted ps-2 text-sm',
              blocked && 'opacity-50',
              classNames?.tag,
            )}
          >
            <span
              className={cn(
                'min-w-0 [overflow-wrap:anywhere]',
                classNames?.tagLabel,
              )}
            >
              {tagRender?.({
                path,
                options: entry?.options ?? [],
                label,
                disabled: blocked,
              }) ?? label}
            </span>
            {!blocked && (
              <button
                type="button"
                tabIndex={0}
                aria-label={'移除' + text}
                className={cn(
                  'inline-grid size-11 shrink-0 touch-manipulation place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                  classNames?.tagRemove,
                )}
                onClick={() => onRemove(path)}
              >
                {removeIcon ?? <Icon name="close" size={14} />}
              </button>
            )}
          </span>
        )
      })}
      {omitted.length > 0 && (
        <span
          aria-label={`另有 ${omitted.length} 项已选路径`}
          className={cn(
            'inline-flex min-h-11 min-w-0 items-center rounded-[var(--radius-sm)] border border-border bg-muted px-2 text-sm [overflow-wrap:anywhere]',
            classNames?.tagOverflow,
          )}
        >
          {typeof maxTagPlaceholder === 'function'
            ? maxTagPlaceholder(omitted)
            : (maxTagPlaceholder ?? '+' + omitted.length)}
        </span>
      )}
    </span>
  )
}
