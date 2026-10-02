import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  Icon,
  Timeline,
  Typography,
  type TimelineItem,
  type TimelineMode,
} from '@/shared/ui'

export function TimelinePreview() {
  const [mode, setMode] = useState<TimelineMode>('start')
  const [horizontal, setHorizontal] = useState(false)
  const [filled, setFilled] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [labels, setLabels] = useState(true)
  const [wideLabel, setWideLabel] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('等待生成')
  const baseItems: TimelineItem[] = [
    {
      key: 'created',
      label: '2026-10-01 09:00',
      title: '提交任务',
      color: 'success',
      children: '输入已校验，任务进入处理队列。',
    },
    {
      key: 'uploaded',
      label: '2026-10-01 09:01',
      title: '上传素材',
      dot: <Icon name="check" />,
      statusText: '上传完成',
      children: '自定义图标只负责外观，状态由文字说明。',
    },
    {
      key: 'processing',
      label: '2026-10-01 09:02 至 09:05（预计）',
      title: loading ? '生成媒体' : '生成完成',
      color: loading ? 'primary' : 'success',
      loading,
      children: (
        <div className="space-y-2">
          <p>较长的说明和时间标签会自动换行，不挤出当前容器。</p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading((value) => !value)
              setStatus(loading ? '生成完成' : '等待生成')
            }}
          >
            {loading ? '完成时间轴任务' : '重启时间轴任务'}
          </Button>
        </div>
      ),
    },
    {
      key: 'review',
      label: '2026-10-01 09:06',
      title: '人工检查',
      color: 'warning',
      children: '待检查字幕和封面。',
    },
    {
      key: 'failed',
      label: '2026-10-01 09:07',
      title: '发布失败',
      color: 'error',
      children: (
        <div className="space-y-2">
          <p>错误状态保留详情和操作入口。</p>
          <Button variant="outline" onClick={() => setStatus('已请求重新发布')}>
            重试时间轴发布
          </Button>
        </div>
      ),
    },
  ]
  const items = baseItems.map((item) => ({
    ...item,
    label: labels ? item.label : undefined,
  }))

  return (
    <Card id="ds-timeline" className="col-span-full scroll-mt-6">
      <CardContent>
        <section aria-label="时间轴状态预览" className="space-y-4">
          <Typography as="h3" variant="title">
            时间轴
          </Typography>
          <p className="text-sm text-muted-foreground">
            时间标签与内容使用同一份阅读顺序。容器不足 640px
            时回退为单列；水平列表溢出时可用方向键或触控滚动。
          </p>
          <div
            role="group"
            aria-label="时间轴内容位置"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ['start', '内容在起始侧'],
                ['end', '内容在末端侧'],
                ['alternate', '内容交替排列'],
              ] as const
            ).map(([value, name]) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setHorizontal((value) => !value)}
            >
              {horizontal ? '使用竖向时间轴' : '使用水平时间轴'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={filled}
              onClick={() => setFilled((value) => !value)}
            >
              {filled ? '使用描边节点' : '使用填充节点'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={reverse}
              onClick={() => setReverse((value) => !value)}
            >
              {reverse ? '恢复时间轴顺序' : '倒序时间轴'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLabels((value) => !value)}
            >
              {labels ? '隐藏时间标签' : '显示时间标签'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setWideLabel((value) => !value)}
            >
              {wideLabel ? '使用比例标签宽度' : '使用固定标签宽度'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setNarrow((value) => !value)}
            >
              {narrow ? '恢复时间轴容器' : '收窄时间轴容器'}
            </Button>
          </div>
          <div
            data-timeline-preview-container=""
            className={narrow ? 'max-w-sm' : ''}
          >
            <Timeline
              label="完整时间轴预览"
              items={items}
              mode={mode}
              orientation={horizontal ? 'horizontal' : 'vertical'}
              reverse={reverse}
              variant={filled ? 'filled' : 'outlined'}
              labelWidth={wideLabel ? 180 : '28%'}
            />
          </div>
          <p
            role="status"
            aria-label="时间轴操作状态"
            className="text-sm text-muted-foreground"
          >
            {status}
          </p>
          <Typography as="h4" className="font-semibold">
            水平长时间轴
          </Typography>
          <Timeline
            label="水平长时间轴"
            orientation="horizontal"
            mode="alternate"
            items={Array.from({ length: 8 }, (_, index) => ({
              key: String(index),
              label: `2026-10-${String(index + 1).padStart(2, '0')}`,
              title: `里程碑 ${index + 1}`,
              children:
                index === 7 ? (
                  <Button
                    variant="outline"
                    onClick={() => setStatus('已查看最后一个里程碑')}
                  >
                    查看最后里程碑
                  </Button>
                ) : (
                  `第 ${index + 1} 阶段已完成。`
                ),
              color: 'success',
            }))}
          />
          <ConfigProvider direction="rtl" theme={{ mode: 'dark' }}>
            <div className="rounded-lg bg-card p-4" dir="rtl">
              <Typography as="h4" className="mb-4 font-semibold">
                RTL 与单项位置覆盖
              </Typography>
              <Timeline
                label="RTL 时间轴预览"
                orientation={horizontal ? 'horizontal' : 'vertical'}
                items={[
                  {
                    key: 'first',
                    label: '09:00',
                    title: '开始',
                    children: '按逻辑方向排列。',
                  },
                  {
                    key: 'second',
                    label: '09:05',
                    title: '检查',
                    placement: 'end',
                    color: 'warning',
                    children: '单项可覆写内容位置。',
                  },
                  {
                    key: 'last',
                    label: '09:10',
                    title: '完成',
                    color: 'success',
                    children: (
                      <Button
                        variant="outline"
                        onClick={() => setStatus('已查看 RTL 记录')}
                      >
                        查看 RTL 记录
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          </ConfigProvider>
          <div className="grid gap-4 md:grid-cols-2">
            <Timeline
              label="单项时间轴"
              items={[
                {
                  key: 'single',
                  title: '未开始',
                  color: 'gray',
                  children: '单项不显示连接线。',
                },
              ]}
            />
            <Timeline label="空时间轴" items={[]} />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
