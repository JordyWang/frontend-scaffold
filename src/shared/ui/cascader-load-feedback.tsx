import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Icon } from './icon'
import type { CascaderEntry } from './cascader-state'
import { cascaderKey, cascaderText } from './cascader-state'
import type { CascaderLoader } from './cascader-loader'
import type { CascaderPart } from './cascader'

export function CascaderLoadFeedback({
  entry,
  loader,
  classNames,
  loadingIcon,
  className,
  disabled = false,
  onRequest,
  onReturn,
  returnKey,
}: {
  entry: CascaderEntry
  loader: CascaderLoader
  classNames?: Partial<Record<CascaderPart, string>>
  loadingIcon?: ReactNode
  className?: string
  disabled?: boolean
  onRequest?: () => void
  onReturn?: () => void
  returnKey?: string
}) {
  const key = cascaderKey(entry.path)
  const state = loader.statuses.get(key)
  const loading = state === 'loading'
  return (
    <div
      role="group"
      aria-label={cascaderText(entry.option) + '加载状态'}
      className={cn(
        'flex min-w-0 flex-col items-start gap-2 p-3 text-sm',
        classNames?.[state === 'error' ? 'error' : 'loading'],
        className,
      )}
    >
      <p
        role={state === 'error' ? 'alert' : 'status'}
        className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]"
      >
        {loading && (
          <span aria-hidden="true" className="shrink-0">
            {loadingIcon ?? (
              <Icon
                name="reset"
                size={16}
                className="animate-spin motion-reduce:animate-none"
              />
            )}
          </span>
        )}
        {loading
          ? '正在加载子选项'
          : state === 'error'
            ? '加载失败，请重试'
            : state === 'cancelled'
              ? '加载已取消'
              : '等待加载子选项'}
      </p>
      <Button
        type="button"
        disabled={disabled || entry.disabled}
        tabIndex={0}
        variant="outline"
        data-cascader-load-action
        aria-label={
          (loading ? '取消加载' : state === 'error' ? '重试加载' : '继续加载') +
          cascaderText(entry.option)
        }
        className={cn('max-w-full whitespace-normal', classNames?.loadAction)}
        onClick={() => {
          if (loading) loader.cancel(key, true)
          else {
            onRequest?.()
            void loader.request(key)
          }
        }}
        onKeyDown={(event) => {
          if (onReturn && event.key === returnKey) {
            event.preventDefault()
            onReturn()
          }
        }}
      >
        {loading ? '取消加载' : state === 'error' ? '重试加载' : '继续加载'}
      </Button>
    </div>
  )
}
