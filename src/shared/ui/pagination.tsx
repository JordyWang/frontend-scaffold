import { Button } from './button'

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
  const safePageSize = Math.max(1, pageSize)
  const pages = Math.max(1, Math.ceil(total / safePageSize))
  const current = Math.min(Math.max(page, 1), pages)
  if (total <= safePageSize) return null

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
    <nav aria-label="分页" className={`ui-pagination ${className ?? ''}`}>
      <Button
        variant="outline"
        size="small"
        disabled={current <= 1 || loading}
        onClick={() => onPageChange(current - 1)}
      >
        上一页
      </Button>
      <span aria-live="polite" className="ui-pagination__status">
        第 {current} / {pages} 页
      </span>
      <Button
        variant="outline"
        size="small"
        disabled={current >= pages || loading}
        onClick={() => onPageChange(current + 1)}
      >
        下一页
      </Button>
    </nav>
  )
}
