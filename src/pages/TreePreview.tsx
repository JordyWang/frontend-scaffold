import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  Icon,
  Tree,
  Typography,
  type TreeNode,
} from '@/shared/ui'

export function TreePreview() {
  const [checked, setChecked] = useState<string[]>(['button'])
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>(['components', 'fields'])
  const [strict, setStrict] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [multiple, setMultiple] = useState(true)
  const [checkable, setCheckable] = useState(true)
  const [lines, setLines] = useState(true)
  const [icons, setIcons] = useState(true)
  const [block, setBlock] = useState(true)
  const [narrow, setNarrow] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [halfChecked, setHalfChecked] = useState<string[]>([])
  const data: TreeNode[] = [
    {
      key: 'components',
      title: '基础组件',
      icon: <Icon name="folder" />,
      children: [
        { key: 'button', title: 'Button', icon: <Icon name="check" /> },
        {
          key: 'fields',
          title: '表单字段',
          icon: <Icon name="folder" />,
          children: [
            { key: 'input', title: 'Input' },
            ...(!removed
              ? [
                  {
                    key: 'textarea',
                    title:
                      'Textarea：很长的节点说明会在窄容器里自动换行，不需要横向滚动',
                  },
                ]
              : []),
            { key: 'locked', title: '锁定字段', disableCheckbox: true },
          ],
        },
        {
          key: 'disabled',
          title: '禁用分支',
          disabled: true,
          children: [{ key: 'independent', title: '独立子节点' }],
        },
        { key: 'check-only', title: '仅勾选节点', selectable: false },
        { key: 'select-only', title: '仅选择节点', checkable: false },
      ],
    },
    { key: 'media', title: '媒体能力', icon: <Icon name="file" /> },
  ]

  return (
    <Card id="ds-tree" className="col-span-full scroll-mt-6">
      <CardContent>
        <section aria-label="树形控件状态预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树形控件
          </Typography>
          <p className="text-sm text-muted-foreground">
            方向键浏览与展开，Home / End 到首尾；空格勾选、Enter
            选择。勾选和选择相互独立，禁用分支阻止父子勾选传导。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              aria-pressed={strict}
              onClick={() => setStrict((value) => !value)}
            >
              {strict ? '关联父子勾选' : '独立节点勾选'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={disabled}
              onClick={() => setDisabled((value) => !value)}
            >
              {disabled ? '启用整棵树' : '禁用整棵树'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={multiple}
              onClick={() => setMultiple((value) => !value)}
            >
              {multiple ? '改为树单选' : '改为树多选'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCheckable((value) => !value)}
            >
              {checkable ? '隐藏树复选框' : '显示树复选框'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLines((value) => !value)}
            >
              {lines ? '隐藏树连接线' : '显示树连接线'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIcons((value) => !value)}
            >
              {icons ? '隐藏树节点图标' : '显示树节点图标'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setBlock((value) => !value)}
            >
              {block ? '树标题按内容宽度' : '树标题占据整行'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setExpanded(
                  expanded.length ? [] : ['components', 'fields', 'disabled'],
                )
              }
            >
              {expanded.length ? '收起完整树' : '展开完整树'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setChecked([])
                setSelected([])
                setHalfChecked([])
              }}
            >
              清空树状态
            </Button>
            <Button
              variant="outline"
              onClick={() => setNarrow((value) => !value)}
            >
              {narrow ? '恢复树容器' : '收窄树容器'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRemoved((value) => !value)}
            >
              {removed ? '恢复树节点' : '删除树节点'}
            </Button>
          </div>
          <div className={narrow ? 'max-w-xs' : ''}>
            <Tree
              label="完整树形控件"
              treeData={data}
              expandedKeys={expanded}
              onExpand={setExpanded}
              selectedKeys={selected}
              onSelectionChange={setSelected}
              checkedKeys={checked}
              onCheck={(keys, info) => {
                setChecked(keys)
                setHalfChecked(info.halfCheckedKeys)
              }}
              checkable={checkable}
              checkStrictly={strict}
              multiple={multiple}
              disabled={disabled}
              showLine={lines}
              showIcon={icons}
              blockNode={block}
            />
          </div>
          <p
            role="status"
            aria-label="树勾选状态"
            className="text-sm text-muted-foreground"
          >
            已勾选：{checked.join('、') || '无'}；本次半选：
            {halfChecked.join('、') || '无'}
          </p>
          <p
            role="status"
            aria-label="树选择状态"
            className="text-sm text-muted-foreground"
          >
            已选择：{selected.join('、') || '无'}
          </p>
          <ConfigProvider direction="rtl" theme={{ mode: 'dark' }}>
            <div className="rounded-lg bg-card p-4" dir="rtl">
              <Typography as="h4" className="mb-3 font-semibold">
                RTL 深色树
              </Typography>
              <Tree
                label="RTL 勾选树"
                checkable
                showLine
                defaultExpandedKeys={['rtl']}
                treeData={[
                  {
                    key: 'rtl',
                    title: 'RTL 根节点',
                    children: [
                      { key: 'rtl-a', title: 'Alpha' },
                      { key: 'rtl-b', title: 'Beta' },
                      {
                        key: 'rtl-disabled',
                        title: 'RTL 禁用项',
                        disabled: true,
                      },
                    ],
                  },
                ]}
              />
            </div>
          </ConfigProvider>
          <div className="grid gap-4 md:grid-cols-2">
            <Tree
              label="默认展开父级树"
              checkable
              defaultExpandedKeys={['deep']}
              treeData={[
                {
                  key: 'top',
                  title: '根目录',
                  children: [
                    {
                      key: 'deep',
                      title: '子目录',
                      children: [{ key: 'file', title: '文件' }],
                    },
                  ],
                },
              ]}
            />
            <Tree label="空树" treeData={[]} />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
