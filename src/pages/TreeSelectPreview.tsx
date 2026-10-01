import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  FormField,
  Icon,
  Input,
  TreeSelect,
  Typography,
  type TreeSelectCheckedStrategy,
  type TreeSelectOption,
} from '@/shared/ui'

const teams: TreeSelectOption[] = [
  {
    value: 'team',
    label: '产品团队',
    children: [
      { value: 'design', label: '设计团队' },
      { value: 'engineering', label: '研发团队' },
      { value: 'archived', label: '已归档团队', disabled: true },
    ],
  },
  { value: 'operations', label: '运营团队' },
  {
    value: 'restricted',
    label: '仅可展开目录',
    checkable: false,
    selectable: false,
    children: [{ value: 'research', label: '研究团队' }],
  },
  { value: 'readonly', label: '不可勾选团队', disableCheckbox: true },
]
const departments: TreeSelectOption[] = Array.from(
  { length: 1000 },
  (_, index) => ({
    value: 'department-' + index,
    label: '部门 ' + String(index).padStart(4, '0'),
  }),
)

export function TreeSelectPreview() {
  const [checked, setChecked] = useState<string[]>(['design'])
  const [strategy, setStrategy] = useState<TreeSelectCheckedStrategy>('leaf')
  const [strict, setStrict] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [virtual, setVirtual] = useState(true)
  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="树选择完整预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树选择的勾选、状态与大数据
          </Typography>
          <p className="text-sm text-muted-foreground">
            搜索仅过滤展示，勾选继续按完整树计算。关联模式支持父级、叶级或全部节点回填；
            严格模式独立勾选。打开后可用方向键、Home / End、字符查找，Escape
            返回触发器，Tab 继续表单。
          </p>
          <div className="flex flex-wrap gap-2">
            {(['leaf', 'parent', 'all'] as const).map((value) => (
              <Button
                key={value}
                size="small"
                variant="outline"
                aria-pressed={strategy === value}
                onClick={() => setStrategy(value)}
              >
                {value === 'leaf'
                  ? '回填叶节点'
                  : value === 'parent'
                    ? '回填父节点'
                    : '回填全部节点'}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setStrict(!strict)
                setChecked([])
              }}
            >
              {strict ? '使用关联勾选' : '使用严格勾选'}
            </Button>
            <Button variant="outline" onClick={() => setChecked([])}>
              设置受控空选择
            </Button>
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用关联树选择' : '禁用关联树选择'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 树选择' : '使用 RTL 树选择'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                label="关联勾选团队"
                description="禁用、不可勾选与仅展开目录各自保留边界。"
                control={
                  <TreeSelect
                    label="关联勾选团队"
                    treeData={teams}
                    checkable
                    checkStrictly={strict}
                    checkedStrategy={strategy}
                    value={checked}
                    onChange={(value) =>
                      setChecked(Array.isArray(value) ? value : [])
                    }
                    disabled={disabled}
                    showSearch
                    allowClear
                    treeDefaultExpandAll
                    showLine
                    classNames={{ popup: 'border-primary', tag: 'font-medium' }}
                  />
                }
              />
              <FormField
                label="最多两个团队"
                description="数量按实际勾选的叶节点计算，父级回填也遵守限制。"
                control={
                  <TreeSelect
                    label="最多两个团队"
                    treeData={teams}
                    checkable
                    maxCount={2}
                    checkedStrategy="parent"
                    defaultValue={['design']}
                    showSearch
                    allowClear
                    treeDefaultExpandAll
                  />
                }
              />
              <FormField
                label="折叠多选标签"
                description="保留所有选中值，只展示一个标签和剩余数量。"
                control={
                  <TreeSelect
                    label="折叠多选标签"
                    treeData={teams}
                    multiple
                    maxTagCount={1}
                    defaultValue={['design', 'engineering', 'operations']}
                    allowClear
                    treeDefaultExpandAll
                  />
                }
              />
              <FormField
                label="搜索后继续输入"
                description="Tab 从搜索进入树，从树前往下一个表单控件。"
                control={
                  <TreeSelect
                    label="搜索后继续输入"
                    treeData={teams}
                    showSearch
                    clearSearchOnSelect
                    multiple
                    allowClear
                  />
                }
              />
              <FormField
                label="树选择后的输入"
                control={<Input aria-label="树选择后的输入" />}
              />
              <p
                role="status"
                aria-label="关联团队值"
                className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
              >
                {JSON.stringify(checked)}
              </p>
            </div>
          </ConfigProvider>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FormField
                label="一千个部门"
                description="共享 Tree 的可变高度窗口，End 可直接定位最后一项。"
                control={
                  <TreeSelect
                    label="一千个部门"
                    treeData={departments}
                    listHeight={220}
                    virtual={virtual}
                    allowClear
                  />
                }
              />
              <Button variant="outline" onClick={() => setVirtual(!virtual)}>
                {virtual ? '关闭树选择虚拟窗口' : '开启树选择虚拟窗口'}
              </Button>
            </div>
            <FormField
              label="空树选择"
              control={
                <TreeSelect
                  label="空树选择"
                  treeData={[]}
                  showSearch
                  emptyText="没有可选的团队"
                />
              }
            />
            {(['outlined', 'filled', 'borderless', 'underlined'] as const).map(
              (variant) => (
                <FormField
                  key={variant}
                  label={variant + ' 树选择'}
                  description={
                    variant === 'filled'
                      ? '警告状态'
                      : variant === 'underlined'
                        ? '错误状态'
                        : undefined
                  }
                  control={
                    <TreeSelect
                      label={variant + ' 树选择'}
                      treeData={teams}
                      variant={variant}
                      status={
                        variant === 'filled'
                          ? 'warning'
                          : variant === 'underlined'
                            ? 'error'
                            : 'default'
                      }
                      prefix={<Icon name="folder" size={16} />}
                      size={variant === 'outlined' ? 'large' : 'default'}
                    />
                  }
                />
              ),
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
