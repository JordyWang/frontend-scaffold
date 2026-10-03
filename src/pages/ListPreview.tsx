import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  List,
  Typography,
  type ControlSize,
} from '@/shared/ui'

const tasks = [
  { id: 'design', name: '设计评审', status: '进行中' },
  { id: 'media', name: '媒体能力', status: '待开始' },
  { id: 'forms', name: '表单完善', status: '进行中' },
  { id: 'files', name: '文件上传', status: '已完成' },
  { id: 'video', name: '视频预览', status: '待开始' },
  { id: 'audio', name: '音频控制', status: '进行中' },
  { id: 'mock', name: 'Mock 流程', status: '已完成' },
]

type PreviewState = 'ready' | 'loading' | 'error' | 'empty'

export function ListPreview() {
  const [state, setState] = useState<PreviewState>('ready')
  const [grid, setGrid] = useState(true)
  const [narrow, setNarrow] = useState(false)
  const [size, setSize] = useState<ControlSize>('default')
  const [bordered, setBordered] = useState(true)
  const [split, setSplit] = useState(true)
  const [action, setAction] = useState('尚未选择任务')

  return (
    <Card id="ds-list" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
        <Typography as="h3" variant="title">
          List 列表布局
        </Typography>
        <Typography variant="caption" tone="muted">
          同一数据可切换普通列表与按容器宽度换列的卡片网格；分页、标题、页脚和状态反馈保持一致。
        </Typography>
        <div
          role="group"
          aria-label="列表展示设置"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            aria-pressed={grid}
            onClick={() => setGrid((current) => !current)}
          >
            网格布局
          </Button>
          <Button
            variant="outline"
            aria-pressed={narrow}
            onClick={() => setNarrow((current) => !current)}
          >
            窄容器
          </Button>
          <Button
            variant="outline"
            aria-pressed={bordered}
            onClick={() => setBordered((current) => !current)}
          >
            外边框
          </Button>
          <Button
            variant="outline"
            aria-pressed={split}
            onClick={() => setSplit((current) => !current)}
          >
            列表分隔线
          </Button>
          <Button
            variant="outline"
            aria-pressed={size === 'small'}
            onClick={() =>
              setSize((current) => (current === 'small' ? 'default' : 'small'))
            }
          >
            紧凑尺寸
          </Button>
        </div>
        <div
          role="group"
          aria-label="列表数据状态"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ['ready', '有数据'],
              ['loading', '加载中'],
              ['error', '错误'],
              ['empty', '空数据'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={state === value ? 'primary' : 'outline'}
              aria-pressed={state === value}
              onClick={() => setState(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div
          className="min-w-0 max-w-full transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: narrow ? 380 : 900 }}
        >
          <List
            label="任务卡片列表"
            items={state === 'empty' ? [] : tasks}
            getKey={(item) => item.id}
            renderItem={(item, index) => (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <strong className="block break-words">{item.name}</strong>
                  <span className="text-sm text-muted-foreground">
                    #{index + 1} · {item.status}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setAction(`已查看${item.name}`)}
                >
                  查看{item.name}
                </Button>
              </div>
            )}
            header={(visibleItems) => `本页任务 · ${visibleItems.length} 项`}
            footer={(visibleItems) =>
              `当前页展示 ${visibleItems.length} / ${tasks.length} 项`
            }
            size={size}
            bordered={bordered}
            split={split}
            grid={grid ? { minItemWidth: 220, gap: 12 } : undefined}
            pagination={{
              defaultPageSize: 3,
              showSizeChanger: true,
              pageSizeOptions: [3, 4, 6],
              showTotal: true,
            }}
            loading={state === 'loading'}
            error={state === 'error' ? '任务列表加载失败' : undefined}
            onRetry={() => setState('ready')}
            classNames={({ state: displayState }) => ({
              header: displayState === 'error' ? 'text-destructive' : undefined,
              item: 'focus-within:bg-accent/50',
            })}
            styles={{ item: { minHeight: 88 } }}
          />
        </div>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {action}
        </p>
      </CardContent>
    </Card>
  )
}
