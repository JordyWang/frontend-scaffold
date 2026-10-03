import { useState } from 'react'
import { Button, Card, CardContent, Table, Typography } from '@/shared/ui'

const rows = [
  {
    id: 'design',
    name: '设计系统',
    owner: '团队 A',
    reviewer: '甲',
    done: 3,
    pending: 1,
  },
  {
    id: 'media',
    name: '媒体能力',
    owner: '团队 B',
    reviewer: '乙',
    done: 5,
    pending: 2,
  },
  {
    id: 'forms',
    name: '表单完善',
    owner: '团队 A',
    reviewer: '丙',
    done: 1,
    pending: 3,
  },
]

const visibilityButtonStyles =
  'aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary'

export function TableGroupedPreview() {
  const [showPeople, setShowPeople] = useState(true)
  const [showReviewer, setShowReviewer] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [containerWidth, setContainerWidth] = useState(820)

  return (
    <Card id="ds-table-grouped" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
        <Typography as="h3" variant="title">
          Table 分组表头
        </Typography>
        <Typography variant="caption" tone="muted">
          项目列跨三层表头；切换列或整组时，跨度、排序、筛选和汇总按可见数据列调整。
        </Typography>
        <div
          role="group"
          aria-label="可见列设置"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            className={visibilityButtonStyles}
            aria-pressed={showPeople}
            onClick={() => setShowPeople((current) => !current)}
          >
            成员组
          </Button>
          <Button
            variant="outline"
            className={visibilityButtonStyles}
            aria-pressed={showReviewer}
            onClick={() => setShowReviewer((current) => !current)}
          >
            评审列
          </Button>
          <Button
            variant="outline"
            className={visibilityButtonStyles}
            aria-pressed={showTasks}
            onClick={() => setShowTasks((current) => !current)}
          >
            任务组
          </Button>
        </div>
        <Table
          caption="交付概览表"
          rows={rows}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: '项目',
              rowScope: 'row',
              render: (row) => row.name,
            },
            {
              key: 'delivery',
              header: '交付信息',
              children: [
                {
                  key: 'people',
                  header: '成员',
                  hidden: !showPeople,
                  children: [
                    {
                      key: 'owner',
                      header: '负责人',
                      render: (row) => row.owner,
                      filterOptions: [
                        {
                          value: 'team-a',
                          label: '团队 A',
                          matches: (row) => row.owner === '团队 A',
                        },
                      ],
                    },
                    {
                      key: 'reviewer',
                      header: '评审人',
                      hidden: !showReviewer,
                      render: (row) => row.reviewer,
                    },
                  ],
                },
                {
                  key: 'tasks',
                  header: '任务',
                  hidden: !showTasks,
                  children: [
                    {
                      key: 'done',
                      header: '已完成',
                      render: (row) => row.done,
                      sorter: (left, right) => left.done - right.done,
                    },
                    {
                      key: 'pending',
                      header: '待处理',
                      render: (row) => row.pending,
                    },
                  ],
                },
              ],
            },
          ]}
          selection={{
            defaultSelectedKeys: ['design'],
            getLabel: (row) => row.name,
          }}
          expandable={{
            getLabel: (row) => row.name,
            expandedRowRender: (row) =>
              `${row.name}由${row.owner}负责，${row.reviewer}评审。`,
          }}
          summary={(visibleRows) => ({
            name: '当前汇总',
            done: visibleRows.reduce((total, row) => total + row.done, 0),
            pending: visibleRows.reduce((total, row) => total + row.pending, 0),
          })}
          renderMobileRow={(row) => (
            <div className="grid gap-1 text-sm">
              <strong className="text-base">{row.name}</strong>
              {showPeople && (
                <span>
                  {row.owner}
                  {showReviewer && ` · ${row.reviewer}评审`}
                </span>
              )}
              {showTasks && (
                <span>
                  完成 {row.done} · 待处理 {row.pending}
                </span>
              )}
            </div>
          )}
        />
        <Typography as="h4" variant="title">
          按容器宽度显示列
        </Typography>
        <Typography variant="caption" tone="muted">
          缩窄表格所在容器后，交付信息组及其排序、筛选会暂停；恢复宽度后状态继续生效。手机卡片按同一份可见列结果渲染。
        </Typography>
        <div
          role="group"
          aria-label="表格容器宽度"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            aria-pressed={containerWidth === 820}
            className={visibilityButtonStyles}
            onClick={() => setContainerWidth(820)}
          >
            宽容器
          </Button>
          <Button
            variant="outline"
            aria-pressed={containerWidth === 640}
            className={visibilityButtonStyles}
            onClick={() => setContainerWidth(640)}
          >
            中容器
          </Button>
          <Button
            variant="outline"
            aria-pressed={containerWidth === 380}
            className={visibilityButtonStyles}
            onClick={() => setContainerWidth(380)}
          >
            窄容器
          </Button>
        </div>
        <div
          className="min-w-0 max-w-full transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: containerWidth }}
        >
          <Table
            caption="响应式交付表"
            rows={rows}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: 'name',
                header: '项目',
                rowScope: 'row',
                render: (row) => row.name,
              },
              {
                key: 'delivery',
                header: '交付信息',
                minContainerWidth: 520,
                children: [
                  {
                    key: 'owner',
                    header: '负责人',
                    render: (row) => row.owner,
                    filterOptions: [
                      {
                        value: 'team-a',
                        label: '团队 A',
                        matches: (row) => row.owner === '团队 A',
                      },
                    ],
                  },
                  {
                    key: 'done',
                    header: '已完成',
                    render: (row) => row.done,
                    sorter: (left, right) => left.done - right.done,
                  },
                  {
                    key: 'reviewer',
                    header: '评审人',
                    minContainerWidth: 700,
                    render: (row) => row.reviewer,
                  },
                  {
                    key: 'pending',
                    header: '待处理',
                    minContainerWidth: 760,
                    render: (row) => row.pending,
                  },
                ],
              },
            ]}
            summary={(visibleRows) => ({
              name: '当前汇总',
              done: visibleRows.reduce((total, row) => total + row.done, 0),
              pending: visibleRows.reduce(
                (total, row) => total + row.pending,
                0,
              ),
            })}
            renderMobileRow={(row, { visibleColumnKeys }) => (
              <div className="grid gap-1 text-sm">
                <strong className="text-base">{row.name}</strong>
                {visibleColumnKeys.includes('owner') && (
                  <span>{row.owner}</span>
                )}
                {visibleColumnKeys.includes('done') && (
                  <span>完成 {row.done}</span>
                )}
                {visibleColumnKeys.includes('reviewer') && (
                  <span>{row.reviewer}评审</span>
                )}
                {visibleColumnKeys.includes('pending') && (
                  <span>待处理 {row.pending}</span>
                )}
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
