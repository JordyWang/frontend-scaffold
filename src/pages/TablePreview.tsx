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
const singleRows = [
  { id: 'plan', name: '制定计划' },
  { id: 'build', name: '实现组件' },
  { id: 'test', name: '测试组件' },
  { id: 'review', name: '验证交互' },
]
const scrollRows = Array.from({ length: 12 }, (_, index) => ({
  id: `stage-${index + 1}`,
  name: `任务 ${index + 1}`,
  status: index % 3 === 0 ? '进行中' : '待开始',
}))
const fixedRows = [
  {
    id: 'design',
    name: '设计评审',
    owner: '甲',
    team: '团队 A',
    status: '进行中',
    done: 3,
    pending: 1,
    updated: '10-03',
  },
  {
    id: 'media',
    name: '媒体能力',
    owner: '乙',
    team: '团队 B',
    status: '待开始',
    done: 5,
    pending: 2,
    updated: '10-02',
  },
  {
    id: 'forms',
    name: '表单完善',
    owner: '丙',
    team: '团队 A',
    status: '进行中',
    done: 1,
    pending: 3,
    updated: '10-01',
  },
]

export function TablePreview() {
  const [size, setSize] = useState<ControlSize>('default')
  const [bordered, setBordered] = useState(false)
  const [rowHoverable, setRowHoverable] = useState(true)
  const [singleStatus, setSingleStatus] = useState('已选择制定计划')

  return (
    <Card id="ds-table" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
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
        <Typography as="h4" variant="heading">
          长表格滚动
        </Typography>
        <Typography variant="caption" tone="muted">
          桌面限制表格区域高度，滚动时保留表头和汇总；手机继续按列表阅读。
        </Typography>
        <Table
          caption="纵向滚动任务表"
          rows={scrollRows}
          getRowKey={(row) => row.id}
          columns={[
            { key: 'name', header: '任务', render: (row) => row.name },
            {
              key: 'progress',
              header: '进度',
              children: [
                { key: 'status', header: '状态', render: (row) => row.status },
              ],
            },
          ]}
          scrollY={256}
          stickySummary
          summary={(visibleRows) => ({
            name: `共 ${visibleRows.length} 项`,
            status: `${visibleRows.filter((row) => row.status === '进行中').length} 项进行中`,
          })}
          renderMobileRow={(row) => (
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <strong>{row.name}</strong>
              <span className="text-muted-foreground">{row.status}</span>
            </div>
          )}
        />
        <Typography as="h4" variant="heading">
          固定列宽表
        </Typography>
        <Typography variant="caption" tone="muted">
          横向滚动时固定项目、成员组和更新时间；窄容器自动收起成员组。
        </Typography>
        <div className="min-w-0 max-w-full" style={{ width: 620 }}>
          <Table
            caption="固定列任务表"
            rows={fixedRows}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: 'name',
                header: '项目',
                rowScope: 'row',
                fixed: 'start',
                width: 110,
                render: (row) => row.name,
              },
              {
                key: 'people',
                header: '成员',
                fixed: 'start',
                minContainerWidth: 520,
                children: [
                  {
                    key: 'owner',
                    header: '负责人',
                    width: 110,
                    render: (row) => row.owner,
                  },
                  {
                    key: 'team',
                    header: '团队',
                    width: 100,
                    render: (row) => row.team,
                  },
                ],
              },
              {
                key: 'status',
                header: '状态',
                width: 140,
                render: (row) => row.status,
              },
              {
                key: 'done',
                header: '已完成',
                width: 100,
                render: (row) => row.done,
              },
              {
                key: 'pending',
                header: '待处理',
                width: 100,
                render: (row) => row.pending,
              },
              {
                key: 'updated',
                header: '更新于',
                fixed: 'end',
                width: 100,
                render: (row) => row.updated,
              },
            ]}
            selection={{ getLabel: (row) => row.name }}
            scrollY={220}
            stickySummary
            summary={(visibleRows) => ({
              name: '合计',
              done: visibleRows.reduce((total, row) => total + row.done, 0),
              pending: visibleRows.reduce(
                (total, row) => total + row.pending,
                0,
              ),
              updated: '最近更新',
            })}
          />
        </div>
        <Typography as="h4" variant="heading">
          单选与跨页
        </Typography>
        <Table
          caption="单选任务表"
          rows={singleRows}
          getRowKey={(row) => row.id}
          columns={[{ key: 'name', header: '任务', render: (row) => row.name }]}
          selection={{
            mode: 'single',
            defaultSelectedKeys: ['plan'],
            getLabel: (row) => row.name,
            disabled: (row) => row.id === 'build',
            onChange: (_keys, selectedRows) =>
              setSingleStatus(`已选择${selectedRows[0]?.name ?? '任务'}`),
          }}
          pagination={{ defaultPageSize: 3, showTotal: true }}
          renderMobileRow={(row) => <strong>{row.name}</strong>}
        />
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {singleStatus}
        </p>
      </CardContent>
    </Card>
  )
}
