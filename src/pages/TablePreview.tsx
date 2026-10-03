import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Table,
  Typography,
  type ControlSize,
} from '@/shared/ui'

const rows = [
  { id: 'review', name: '设计评审', status: '进行中' },
  { id: 'release', name: '组件发布', status: '待开始' },
]

export function TablePreview() {
  const [size, setSize] = useState<ControlSize>('default')
  const [bordered, setBordered] = useState(false)
  const [rowHoverable, setRowHoverable] = useState(true)

  return (
    <Card id="ds-table" className="col-span-full scroll-mt-6">
      <CardContent className="grid gap-4">
        <Typography as="h3" variant="title">
          Table 展示状态
        </Typography>
        <div
          role="group"
          aria-label="表格展示设置"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ['small', '紧凑尺寸'],
              ['default', '默认尺寸'],
              ['large', '宽松尺寸'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="outline"
              aria-pressed={size === value}
              onClick={() => setSize(value)}
            >
              {label}
            </Button>
          ))}
          <Button
            variant="outline"
            aria-pressed={bordered}
            onClick={() => setBordered((current) => !current)}
          >
            网格边框
          </Button>
          <Button
            variant="outline"
            aria-pressed={rowHoverable}
            onClick={() => setRowHoverable((current) => !current)}
          >
            行悬停
          </Button>
        </div>
        <Table
          caption="展示状态任务表"
          title="任务清单"
          footer={(visibleRows) => `当前显示 ${visibleRows.length} 条任务`}
          summary={(visibleRows) => ({
            name: '当前页汇总',
            status: `${visibleRows.length} 项`,
          })}
          size={size}
          bordered={bordered}
          rowHoverable={rowHoverable}
          classNames={({ props, state }) => ({
            headerCell: props.bordered ? 'text-primary' : undefined,
            selectionSummary: state === 'ready' ? 'font-medium' : undefined,
            summaryCell: props.bordered ? 'bg-primary/5' : undefined,
          })}
          styles={({ size: currentSize }) => ({
            headerCell: {
              letterSpacing: currentSize === 'large' ? '0.04em' : undefined,
            },
          })}
          rowClassName={(row) =>
            row.status === '进行中' ? 'bg-primary/5' : undefined
          }
          rows={rows}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: '任务',
              rowScope: 'row',
              sorter: (left, right) => left.name.localeCompare(right.name),
              render: (row) => row.name,
            },
            {
              key: 'status',
              header: '状态',
              render: (row) => row.status,
            },
          ]}
          selection={{ getLabel: (row) => row.name }}
          expandable={{
            getLabel: (row) => row.name,
            expandedRowRender: (row) => `${row.name}：${row.status}`,
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
        <Typography variant="caption" tone="muted">
          桌面显示表格，窄屏切换为卡片行；选择、排序和展开状态共用。
        </Typography>
      </CardContent>
    </Card>
  )
}
