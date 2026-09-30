import { useId, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'

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
  onPageSizeChange?: (pageSize: number, page: number) => void
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: boolean
  mode?: 'pages' | 'load-more'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showQuickJumper = false,
  showTotal = false,
  mode = 'pages',
  loading,
  disabled = false,
  className,
}: PaginationProps) {
  const jumpId = useId()
  const [jumpValue, setJumpValue] = useState('')
  const [jumpError, setJumpError] = useState(false)
  const inactive = disabled || Boolean(loading)
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 1
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0
  const pages = Math.max(1, Math.ceil(safeTotal / safePageSize))
  const current = Number.isFinite(page)
    ? Math.min(Math.max(Math.floor(page), 1), pages)
    : 1
  const sizeOptions = [safePageSize, ...pageSizeOptions]
    .filter((size) => Number.isFinite(size) && size >= 1)
    .map((size) => Math.floor(size))
    .filter((size, index, all) => all.indexOf(size) === index)
    .sort((left, right) => left - right)
  const requestedPage = Number(jumpValue)
  const validJump =
    /^\d+$/.test(jumpValue.trim()) &&
    Number.isSafeInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= pages

  function changePage(next: number) {
    if (inactive) return
    setJumpValue('')
    setJumpError(false)
    if (next !== current) onPageChange(next)
  }

  function jumpToPage() {
    if (inactive) return
    if (!validJump) {
      setJumpError(true)
      return
    }
    changePage(requestedPage)
  }

  if (
    safeTotal <= safePageSize &&
    (mode === 'load-more' || (!onPageSizeChange && !showTotal))
  )
    return null

  if (mode === 'load-more') {
    return (
      <div
        aria-busy={loading || undefined}
        aria-disabled={inactive || undefined}
        className={className}
      >
        <Button
          variant="outline"
          loading={loading}
          disabled={current >= pages || inactive}
          onClick={() => changePage(current + 1)}
        >
          加载更多
        </Button>
      </div>
    )
  }

  return (
    <nav
      aria-label="分页"
      aria-busy={loading || undefined}
      aria-disabled={inactive || undefined}
      className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}
    >
      <div className="flex w-full min-w-0 items-center gap-2 sm:flex-1">
        <Button
          variant="outline"
          size="small"
          className="shrink-0"
          disabled={current <= 1 || inactive}
          onClick={() => changePage(current - 1)}
        >
          上一页
        </Button>
        <div className="flex min-w-0 flex-1 touch-pan-x items-center justify-center gap-2 overflow-x-auto py-1">
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
                disabled={inactive}
                onClick={() => changePage(item)}
              >
                {item}
              </Button>
            ),
          )}
        </div>
        <Button
          variant="outline"
          size="small"
          className="shrink-0"
          disabled={current >= pages || inactive}
          onClick={() => changePage(current + 1)}
        >
          下一页
        </Button>
      </div>
      <span aria-live="polite" className="sr-only">
        第 {current} / {pages} 页
      </span>
      {(showTotal || onPageSizeChange || (showQuickJumper && pages > 1)) && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {showTotal && (
            <span className="text-sm text-muted-foreground">
              {safeTotal === 0
                ? '共 0 条'
                : `第 ${(current - 1) * safePageSize + 1}–${Math.min(current * safePageSize, safeTotal)} 条，共 ${safeTotal} 条`}
            </span>
          )}
          {onPageSizeChange && (
            <div className="w-32">
              <Select
                aria-label="每页条数"
                value={String(safePageSize)}
                disabled={inactive}
                options={sizeOptions.map((size) => ({
                  value: String(size),
                  label: `${size} 条/页`,
                }))}
                onValueChange={(next) => {
                  if (inactive) return
                  const nextSize = Number(next)
                  const firstItem = (current - 1) * safePageSize
                  const nextPage = Math.floor(firstItem / nextSize) + 1
                  setJumpValue('')
                  setJumpError(false)
                  onPageSizeChange(nextSize, nextPage)
                }}
              />
            </div>
          )}
          {showQuickJumper && pages > 1 && (
            <div
              role="group"
              aria-label="快速跳转"
              className="flex items-center gap-2"
            >
              <label htmlFor={jumpId} className="text-sm text-muted-foreground">
                跳至
              </label>
              <Input
                id={jumpId}
                aria-label="目标页码"
                aria-invalid={jumpError || undefined}
                aria-describedby={jumpError ? `${jumpId}-error` : undefined}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-20 text-center"
                value={jumpValue}
                disabled={inactive}
                onChange={(event) => {
                  setJumpValue(event.currentTarget.value)
                  setJumpError(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    jumpToPage()
                  }
                }}
              />
              <Button
                variant="outline"
                size="small"
                disabled={inactive}
                onClick={jumpToPage}
              >
                前往
              </Button>
              {jumpError && (
                <span
                  id={`${jumpId}-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  请输入 1–{pages} 页
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
