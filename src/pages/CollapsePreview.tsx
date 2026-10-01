import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Collapse,
  ConfigProvider,
  FormField,
  Icon,
  Input,
  Typography,
  type ControlSize,
} from '@/shared/ui'

export function CollapsePreview() {
  const [size, setSize] = useState<ControlSize>('default')
  const [appearance, setAppearance] = useState<
    'bordered' | 'borderless' | 'ghost'
  >('bordered')
  const [placement, setPlacement] = useState<'start' | 'end'>('start')
  const [extraClicks, setExtraClicks] = useState(0)
  const [keys, setKeys] = useState(['draft'])
  const [showDraft, setShowDraft] = useState(true)
  const [draftDisabled, setDraftDisabled] = useState(false)

  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="折叠面板状态预览" className="space-y-4">
          <Typography as="h3" variant="title">
            折叠面板
          </Typography>
          <p className="text-sm text-muted-foreground">
            标题支持 Enter / 空格开合；上下方向键与 Home / End
            移动焦点。操作区独立响应。
          </p>
          <div
            role="group"
            aria-label="折叠面板尺寸"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ['small', '小号折叠'],
                ['default', '默认折叠'],
                ['large', '大号折叠'],
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
          </div>
          <div
            role="group"
            aria-label="折叠面板外观"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ['bordered', '有边框折叠'],
                ['borderless', '无边框折叠'],
                ['ghost', '透明折叠'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={appearance === value}
                onClick={() => setAppearance(value)}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setPlacement(placement === 'start' ? 'end' : 'start')
              }
            >
              {placement === 'start' ? '箭头放在末端' : '箭头放在起始'}
            </Button>
          </div>
          <Collapse
            label="完整折叠预览"
            size={size}
            bordered={appearance === 'bordered'}
            ghost={appearance === 'ghost'}
            expandIconPlacement={placement}
            defaultActiveKey={['description']}
            items={[
              {
                key: 'description',
                label: '带独立操作的说明与较长标题',
                extra: (
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setExtraClicks((value) => value + 1)}
                  >
                    查看面板记录
                  </Button>
                ),
                children:
                  '操作按钮不改变面板开合；窄屏时操作区换行，标题仍可完整阅读。',
              },
              {
                key: 'icon',
                label: '仅箭头触发展开',
                collapsible: 'icon',
                children: '点击文字不会展开；箭头按钮支持键盘和触控。',
              },
              {
                key: 'no-arrow',
                label: '隐藏箭头的面板',
                showArrow: false,
                children: '隐藏箭头后仍可通过整个标题按钮开合。',
              },
              {
                key: 'disabled',
                label: '禁用的完整面板',
                disabled: true,
                children: '无法通过用户操作展开。',
              },
              {
                key: 'nested',
                label: '嵌套折叠面板',
                children: (
                  <Collapse
                    label="内部折叠预览"
                    items={[
                      {
                        key: 'nested-a',
                        label: '内部第一项',
                        children: '嵌套面板独立导航。',
                      },
                      {
                        key: 'nested-b',
                        label: '内部第二项',
                        children: '方向键不会跳到外部面板。',
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
          <p
            role="status"
            aria-label="折叠操作状态"
            className="text-sm text-muted-foreground"
          >
            已查看面板记录 {extraClicks} 次
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-label="折叠内容生命周期" className="space-y-3">
              <Typography as="h4" className="font-semibold">
                内容保留与销毁
              </Typography>
              <Collapse
                label="保留内容预览"
                items={[
                  {
                    key: 'retained',
                    label: '保留草稿',
                    children: (
                      <FormField
                        label="保留的草稿"
                        control={<Input defaultValue="初始草稿" />}
                      />
                    ),
                  },
                ]}
              />
              <Collapse
                label="销毁内容预览"
                destroyOnHidden
                items={[
                  {
                    key: 'destroyed',
                    label: '关闭时销毁草稿',
                    children: (
                      <FormField
                        label="销毁的草稿"
                        control={<Input defaultValue="初始草稿" />}
                      />
                    ),
                  },
                ]}
              />
              <Collapse
                label="预渲染内容预览"
                destroyOnHidden
                items={[
                  {
                    key: 'forced',
                    label: '始终挂载的草稿',
                    forceRender: true,
                    children: (
                      <FormField
                        label="预渲染草稿"
                        control={<Input defaultValue="初始草稿" />}
                      />
                    ),
                  },
                ]}
              />
            </section>
            <section aria-label="动态折叠状态" className="space-y-3">
              <Typography as="h4" className="font-semibold">
                受控、动态与焦点恢复
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setKeys(keys.length ? [] : ['draft'])}
                >
                  {keys.length ? '外部关闭草稿' : '外部展开草稿'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDraft((value) => !value)}
                >
                  {showDraft ? '移除草稿面板' : '恢复草稿面板'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDraftDisabled((value) => !value)}
                >
                  {draftDisabled ? '启用草稿面板' : '禁用草稿面板'}
                </Button>
              </div>
              <Collapse
                label="受控草稿预览"
                activeKey={keys}
                onChange={setKeys}
                items={[
                  ...(showDraft
                    ? [
                        {
                          key: 'draft',
                          label: '动态草稿',
                          disabled: draftDisabled,
                          children: (
                            <div className="space-y-3">
                              <FormField
                                label="受控面板草稿"
                                control={<Input defaultValue="工作草稿" />}
                              />
                              <Button
                                variant="outline"
                                onClick={() => setKeys([])}
                              >
                                从内容中关闭草稿
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDraft(false)
                                  setKeys([])
                                }}
                              >
                                从内容中移除草稿
                              </Button>
                            </div>
                          ),
                        },
                      ]
                    : []),
                  {
                    key: 'backup',
                    label: '备用面板',
                    children: '动态移除当前面板后，焦点回到可用标题。',
                  },
                ]}
              />
              <p className="text-sm text-muted-foreground">
                当前展开：{keys.join('、') || '无'}
              </p>
              <ConfigProvider
                direction="rtl"
                componentSize="small"
                theme={{ mode: 'dark' }}
              >
                <Collapse
                  label="RTL 深色折叠"
                  defaultActiveKey={['rtl-a']}
                  expandIconPlacement="end"
                  items={[
                    {
                      key: 'rtl-a',
                      label: '深色与从右向左',
                      children: '继承全局小号尺寸和局部主题。',
                    },
                    {
                      key: 'rtl-b',
                      label: 'RTL 次要说明',
                      children: '默认箭头跟随展开状态与界面方向。',
                    },
                  ]}
                />
                <Collapse
                  label="自定义图标折叠"
                  ghost
                  items={[
                    {
                      key: 'custom',
                      label: '自定义展开图标',
                      children: '调用方按展开状态绘制图标。',
                    },
                  ]}
                  expandIcon={({ expanded }) => (
                    <Icon name={expanded ? 'close' : 'info'} size={16} />
                  )}
                />
              </ConfigProvider>
              <Collapse label="空折叠预览" items={[]} />
            </section>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
