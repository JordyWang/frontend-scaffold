import { useState } from 'react'
import {
  Card,
  CardContent,
  Table,
  Typography,
  type TableFilters,
  type TableSort,
} from '@/shared/ui'

const records = [
  { id: 'c', name: '任务 C', status: '待处理' },
  { id: 'a', name: '任务 A', status: '已完成' },
  { id: 'f', name: '任务 F', status: '待处理' },
  { id: 'b', name: '任务 B', status: '已完成' },
  { id: 'e', name: '任务 E', status: '待处理' },
  { id: 'd', name: '任务 D', status: '已完成' },
]

export function TableManualPreview() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(2)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<TableFilters>({})
  const filtered = records.filter(
    (row) =>
      !filters.status?.length ||
      filters.status.includes(row.status === '已完成' ? 'done' : 'pending'),
  )
  const ordered = sort
    ? [...filtered].sort((left, right) =>
        sort.direction === 'asc'
          ? left.name.localeCompare(right.name)
          : right.name.localeCompare(left.name),
      )
    : filtered
  const currentRows = ordered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <Card id="ds-table-manual" className="col-span-full scroll-mt-6">
      <CardContent className="grid gap-4">
        <Typography as="h3" variant="title">
          Table 手动数据模式
        </Typography>
        <Typography variant="caption" tone="muted">
          页面模拟 API 返回当前页和总数；Table
          只管理交互状态，不重复筛选、排序或分页。
        </Typography>
        <Table
          caption="手动数据任务表"
          title="服务端任务"
          footer={(visibleRows) => `当前页返回 ${visibleRows.length} 条`}
          summary={(visibleRows) => ({
            name: '当前页汇总',
            status: `${visibleRows.length} 项`,
          })}
          dataMode="manual"
          rows={currentRows}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: '任务',
              rowScope: 'row',
              sorter: true,
              render: (row) => row.name,
            },
            {
              key: 'status',
              header: '状态',
              render: (row) => row.status,
              filterOptions: [
                { value: 'done', label: '已完成' },
                { value: 'pending', label: '待处理' },
              ],
            },
          ]}
          sort={sort}
          onSortChange={(next) => {
            setSort(next)
            setPage(1)
          }}
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
          pagination={{
            page,
            pageSize,
            total: ordered.length,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
            showSizeChanger: true,
            pageSizeOptions: [2, 3],
            showTotal: true,
          }}
          renderMobileRow={(row) => (
            <div className="grid gap-1">
              <strong>{row.name}</strong>
              <span className="text-sm text-muted-foreground">
                {row.status}
              </span>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
