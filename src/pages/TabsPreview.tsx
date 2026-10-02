import { cloneElement, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  FormField,
  Icon,
  Input,
  Tabs,
  Typography,
  type TabItem,
  type TabsBarItemRender,
  type TabsProps,
} from '@/shared/ui'

function DraftPanel({ title }: { title: string }) {
  const [text, setText] = useState('尚未修改')
  return (
    <FormField
      label={title + '正文'}
      control={<Input value={text} onValueChange={setText} />}
      description="切换标签后草稿仍保留。"
    />
  )
}
function workspace(): TabItem[] {
  return [
    {
      value: 'summary',
      label: '项目概览',
      content: '概览不可关闭。',
      closable: false,
      icon: <Icon name="home" />,
    },
    {
      value: 'note1',
      label: <span>草稿 1 · 项目使用说明与实现记录</span>,
      ariaLabel: '草稿 1',
      content: <DraftPanel title="草稿 1" />,
      icon: <Icon name="file" />,
    },
    { value: 'note2', label: '草稿 2', content: <DraftPanel title="草稿 2" /> },
    {
      value: 'disabled',
      label: '不可用文档',
      content: '不可用内容',
      disabled: true,
    },
  ]
}
function DeferredTabs() {
  const [items, setItems] = useState<TabItem[]>([
    { value: 'one', label: '受控一', content: '受控第一面板' },
    { value: 'two', label: '受控二', content: '受控第二面板' },
  ])
  const [value, setValue] = useState('two')
  const [pending, setPending] = useState<{
    kind: 'add' | 'remove'
    value: string
  }>()
  const [nextValue, setNextValue] = useState<string>()
  const sequence = useRef(2)
  return (
    <section aria-label="受控标签更新预览" className="min-w-0 space-y-3">
      <Typography as="h3" variant="title">
        受控更新
      </Typography>
      <Typography tone="muted">
        先请求增删，再接受数据和选择更新；外部按钮保持自己的焦点。
      </Typography>
      <Tabs
        label="受控编辑标签"
        items={items}
        value={value}
        variant="editable-card"
        onAdd={() =>
          setPending({ kind: 'add', value: 'new' + ++sequence.current })
        }
        onRemove={(key) => setPending({ kind: 'remove', value: key })}
        onValueChange={setNextValue}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!pending}
          onClick={(event) => {
            event.currentTarget.focus()
            if (!pending) return
            setItems((current) =>
              pending.kind === 'remove'
                ? current.filter((item) => item.value !== pending.value)
                : [
                    ...current,
                    {
                      value: pending.value,
                      label: '受控新增 ' + pending.value.slice(3),
                      content: '受控新增面板 ' + pending.value,
                    },
                  ],
            )
            setPending(undefined)
          }}
        >
          接受标签数据
        </Button>
        <Button
          variant="outline"
          disabled={nextValue === undefined}
          onClick={(event) => {
            event.currentTarget.focus()
            if (nextValue !== undefined) setValue(nextValue)
            setNextValue(undefined)
          }}
        >
          接受标签选择
        </Button>
      </div>
      <p
        role="status"
        aria-label="受控标签状态"
        className="text-sm text-muted-foreground"
      >
        当前 {value} · 请求{' '}
        {pending ? pending.kind + ':' + pending.value : '无'} · 待选择{' '}
        {nextValue ?? '无'}
      </p>
    </section>
  )
}

function SortableTabsDemo() {
  const [items, setItems] = useState<TabItem[]>([
    { value: 'overview', label: '概览', content: '概览内容' },
    {
      value: 'draft-a',
      label: '草稿甲',
      content: <DraftPanel title="草稿甲" />,
    },
    {
      value: 'draft-b',
      label: '草稿乙',
      content: <DraftPanel title="草稿乙" />,
    },
  ])
  const [selected, setSelected] = useState('draft-a')
  const dragging = useRef<string | null>(null)
  const selectionBeforeDrag = useRef<string | null>(null)

  const move = (source: string, target: string) => {
    if (source === target) return
    const sourceIndex = items.findIndex((item) => item.value === source)
    const targetIndex = items.findIndex((item) => item.value === target)
    if (sourceIndex < 0 || targetIndex < 0) return
    const next = [...items]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    setItems(next)
  }
  const moveSelected = (offset: -1 | 1) => {
    const index = items.findIndex((item) => item.value === selected)
    const target = items[index + offset]
    if (target) move(selected, target.value)
  }
  const renderTabBarItem: TabsBarItemRender = (item, defaultItem) =>
    cloneElement(defaultItem, {
      draggable: true,
      onPointerDownCapture: () => {
        selectionBeforeDrag.current = selected
      },
      onPointerUpCapture: () => {
        if (!dragging.current) selectionBeforeDrag.current = null
      },
      onDragStart: (event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('button:not([role="tab"])')
        ) {
          event.preventDefault()
          return
        }
        dragging.current = item.value
        selectionBeforeDrag.current ??= selected
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', item.value)
      },
      onDragOver: (event) => {
        if (dragging.current && dragging.current !== item.value)
          event.preventDefault()
      },
      onDrop: (event) => {
        event.preventDefault()
        const source = dragging.current
        dragging.current = null
        if (source) move(source, item.value)
      },
      onDragEnd: () => {
        dragging.current = null
        if (selectionBeforeDrag.current !== null)
          setSelected(selectionBeforeDrag.current)
        selectionBeforeDrag.current = null
      },
    })

  const index = items.findIndex((item) => item.value === selected)
  return (
    <section aria-label="标签拖拽组合预览" className="min-w-0 space-y-3">
      <Typography as="h3" variant="title">
        外部排序组合
      </Typography>
      <Typography tone="muted">
        桌面可拖动标签标题；键盘和手机可选中标签后使用前移、后移按钮。排序数据由示例维护。
      </Typography>
      <Tabs
        label="可排序标签"
        variant="editable-card"
        addable={false}
        items={items}
        value={selected}
        onValueChange={setSelected}
        renderTabBarItem={renderTabBarItem}
      />
      <div
        role="group"
        aria-label="标签排序操作"
        className="flex flex-wrap gap-2"
      >
        <Button
          variant="outline"
          disabled={index <= 0}
          onClick={() => moveSelected(-1)}
        >
          前移当前标签
        </Button>
        <Button
          variant="outline"
          disabled={index < 0 || index >= items.length - 1}
          onClick={() => moveSelected(1)}
        >
          后移当前标签
        </Button>
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        当前：{selected}；顺序：{items.map((item) => item.value).join(' → ')}
      </p>
    </section>
  )
}
export function TabsPreview() {
  const [items, setItems] = useState(workspace)
  const [rtlItems, setRtlItems] = useState(() => workspace().slice(0, 3))
  const [generation, setGeneration] = useState(0)
  const [changes, setChanges] = useState(0)
  const [chosen, setChosen] = useState('note1')
  const [disabled, setDisabled] = useState(false)
  const [destroy, setDestroy] = useState(false)
  const [size, setSize] = useState<TabsProps['size']>('default')
  const [placement, setPlacement] =
    useState<NonNullable<TabsProps['placement']>>('start')
  const [narrow, setNarrow] = useState(false)
  const [indicatorAlign, setIndicatorAlign] =
    useState<NonNullable<TabsProps['indicator']>['align']>('center')
  const [moreValue, setMoreValue] = useState('more-1')
  const sequence = useRef(2)
  const moreItems: TabItem[] = Array.from({ length: 7 }, (_, index) => ({
    value: 'more-' + (index + 1),
    label: '数据标签 ' + (index + 1),
    content: '数据标签 ' + (index + 1) + ' 的内容',
  }))
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>标签页形态与编辑</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="Tabs 能力预览" className="min-w-0 space-y-6">
          <Typography tone="muted">
            方向键浏览，Enter / Space 激活，Delete
            关闭可编辑标签。关闭按钮与标签按钮独立，保留 44px 触控目标。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setSize(
                  size === 'default'
                    ? 'small'
                    : size === 'small'
                      ? 'large'
                      : 'default',
                )
              }
            >
              切换标签尺寸
            </Button>
            <Button variant="outline" onClick={() => setDestroy(!destroy)}>
              {destroy ? '保留隐藏面板' : '销毁隐藏面板'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDisabled(!disabled)
                setItems((current) =>
                  current.map((item) =>
                    item.value === 'note1'
                      ? { ...item, disabled: !disabled }
                      : item,
                  ),
                )
              }}
            >
              {disabled ? '启用草稿 1' : '禁用草稿 1'}
            </Button>
            <Button variant="outline" onClick={() => setItems([])}>
              清空工作区标签
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setItems(workspace())
                setDisabled(false)
                setChosen('note1')
                setChanges(0)
                setGeneration((value) => value + 1)
              }}
            >
              恢复工作区标签
            </Button>
          </div>
          <section aria-label="编辑工作区预览" className="min-w-0 space-y-3">
            <Typography as="h3" variant="title">
              可编辑卡片
            </Typography>
            <Tabs
              key={generation}
              items={items}
              label="编辑工作区"
              defaultValue="note1"
              variant="editable-card"
              size={size}
              destroyOnHidden={destroy}
              classNames={{
                root: 'rounded-md border border-border p-3',
                content: 'rounded-md bg-card',
              }}
              onAdd={() => {
                const index = ++sequence.current
                setItems((current) => [
                  ...current,
                  {
                    value: 'note' + index,
                    label: '草稿 ' + index,
                    content: <DraftPanel title={'草稿 ' + index} />,
                  },
                ])
              }}
              onRemove={(key) =>
                setItems((current) =>
                  current.filter((item) => item.value !== key),
                )
              }
              onValueChange={(key) => {
                setChosen(key)
                setChanges((count) => count + 1)
              }}
            />
            <p
              role="status"
              aria-label="工作区标签状态"
              className="text-sm text-muted-foreground"
            >
              选择 {chosen} · 变化 {changes} 次 · 标签 {items.length} 项
            </p>
          </section>
          <section aria-label="卡片与位置预览" className="min-w-0 space-y-3">
            <Typography as="h3" variant="title">
              卡片与逻辑位置
            </Typography>
            <Tabs
              label="底部卡片标签"
              variant="card"
              placement="bottom"
              size={size}
              items={workspace().slice(0, 3)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setPlacement(
                    placement === 'start'
                      ? 'end'
                      : placement === 'end'
                        ? 'bottom'
                        : placement === 'bottom'
                          ? 'top'
                          : 'start',
                  )
                }
              >
                切换标签位置
              </Button>
              <Button variant="outline" onClick={() => setNarrow(!narrow)}>
                {narrow ? '放宽标签容器' : '收窄标签容器'}
              </Button>
            </div>
            <div
              role="group"
              aria-label="响应式标签容器"
              className={narrow ? 'w-60 max-w-full min-w-0' : 'w-full min-w-0'}
            >
              <Tabs
                label="逻辑位置标签"
                placement={placement}
                size={size}
                activationMode="manual"
                items={workspace().slice(0, 3)}
              />
            </div>
          </section>
          <section aria-label="标签栏扩展预览" className="min-w-0 space-y-3">
            <Typography as="h3" variant="title">
              指示条、更多标签与附加操作
            </Typography>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setIndicatorAlign((current) =>
                    current === 'start'
                      ? 'center'
                      : current === 'center'
                        ? 'end'
                        : 'start',
                  )
                }
              >
                指示条对齐：{indicatorAlign}
              </Button>
            </div>
            <div className="w-[min(100%,32rem)] min-w-0 max-w-full rounded-md border border-border p-3">
              <Tabs
                label="扩展标签"
                items={moreItems}
                value={moreValue}
                onValueChange={setMoreValue}
                centered
                indicator={{
                  align: indicatorAlign,
                  size: (origin) => Math.max(32, origin * 0.55),
                }}
                tabBarExtraContent={{
                  start: (
                    <span className="px-2 text-sm text-muted-foreground">
                      工作区
                    </span>
                  ),
                  end: (
                    <Button
                      size="small"
                      variant="ghost"
                      aria-label="扩展标签设置"
                    >
                      设置
                    </Button>
                  ),
                }}
                more={{
                  searchable: true,
                  searchPlaceholder: '搜索数据标签',
                }}
                classNames={{
                  root: 'min-w-0',
                  header: 'rounded-md bg-muted/40',
                  popup: 'min-w-0',
                }}
              />
            </div>
          </section>
          <DeferredTabs />
          <SortableTabsDemo />
          <ConfigProvider
            direction="rtl"
            componentSize="small"
            theme={{ mode: 'dark' }}
          >
            <div
              role="group"
              aria-label="窄容器 RTL 标签预览"
              className="w-60 max-w-full min-w-0 rounded-lg border border-border bg-card p-3 text-card-foreground"
            >
              <Tabs
                items={rtlItems}
                label="RTL 编辑标签"
                variant="editable-card"
                onRemove={(key) =>
                  setRtlItems((current) =>
                    current.filter((item) => item.value !== key),
                  )
                }
                addable={false}
              />
            </div>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
