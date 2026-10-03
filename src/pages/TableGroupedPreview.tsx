import { Card, CardContent, Table, Typography } from '@/shared/ui'

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

export function TableGroupedPreview() {
  return (
    <Card id="ds-table-grouped" className="col-span-full scroll-mt-6">
      <CardContent className="grid gap-4">
        <Typography as="h3" variant="title">
          Table 分组表头
        </Typography>
        <Typography variant="caption" tone="muted">
          项目列跨三层表头；成员和任务各自成组，排序、筛选和汇总仍按实际数据列处理。
        </Typography>
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
                      render: (row) => row.reviewer,
                    },
                  ],
                },
                {
                  key: 'tasks',
                  header: '任务',
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
              <span>
                {row.owner} · {row.reviewer}评审
              </span>
              <span>
                完成 {row.done} · 待处理 {row.pending}
              </span>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
