import { cn } from '@/shared/lib/utils'
import { Button } from './button'

function pageItems(current: number, pages: number): Array<number | 'gap'> {
  const visible = [1, current - 1, current, current + 1, pages]
    .filter((page) => page >= 1 && page <= pages)
    .filter((page, index, all) => all.indexOf(page) === index)
    .sort((left, right) => left - right)
  const items: Array<number | 'gap'> = []
  for (const page of visible) {
    const previous = items.at(-1)
    if (typeof previous === 'number' && page - previous === 2)
      items.push(previous + 1)
    else if (typeof previous === 'number' && page - previous > 2)
      items.push('gap')
    items.push(page)
  }
  return items
}

export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  mode?: 'pages' | 'load-more'
  loading?: boolean
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  mode = 'pages',
  loading,
  className,
}: PaginationProps) {
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 1
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0
  const pages = Math.max(1, Math.ceil(safeTotal / safePageSize))
  const current = Number.isFinite(page)
    ? Math.min(Math.max(Math.floor(page), 1), pages)
    : 1
  if (safeTotal <= safePageSize) return null

  if (mode === 'load-more') {
    return (
      <div className={className}>
        <Button
          variant="outline"
          loading={loading}
          disabled={current >= pages}
          onClick={() => onPageChange(current + 1)}
        >
          加载更多
        </Button>
      </div>
    )
  }

  return (
    <nav
      aria-label="分页"
      className={cn('flex min-w-0 items-center gap-2', className)}
    >
      <Button
        variant="outline"
        size="small"
        className="shrink-0"
        disabled={current <= 1 || loading}
        onClick={() => onPageChange(current - 1)}
      >
        上一页
      </Button>
      <div className="flex min-w-0 flex-1 touch-pan-x items-center justify-center gap-1 overflow-x-auto py-1">
        {pageItems(current, pages).map((item, index) =>
          item === 'gap' ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="inline-flex min-w-7 shrink-0 justify-center text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === current ? 'primary' : 'outline'}
              size="small"
              className="shrink-0 px-2"
              aria-label={`前往第 ${item} 页`}
              aria-current={item === current ? 'page' : undefined}
              disabled={loading}
              onClick={() => {
                if (item !== current) onPageChange(item)
              }}
            >
              {item}
            </Button>
          ),
        )}
      </div>
      <span aria-live="polite" className="sr-only">
        第 {current} / {pages} 页
      </span>
      <Button
        variant="outline"
        size="small"
        className="shrink-0"
        disabled={current >= pages || loading}
        onClick={() => onPageChange(current + 1)}
      >
        下一页
      </Button>
    </nav>
  )
}
