import { useState } from 'react'
import { Button, Card, CardContent, Space, Typography } from '@/shared/ui'

const actions = ['查看', '编辑', '分享']

export function SpacePreview() {
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  )
  const [separateGaps, setSeparateGaps] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [selected, setSelected] = useState('尚未选择操作')

  return (
    <Card id="ds-space" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
        <Typography as="h3" variant="title">
          Space 间距与分隔
        </Typography>
        <Typography variant="caption" tone="muted">
          水平与垂直间距可以独立设置；分隔符始终跟随前一个项目。
        </Typography>
        <div
          role="group"
          aria-label="Space 展示设置"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            aria-pressed={direction === 'vertical'}
            onClick={() =>
              setDirection((current) =>
                current === 'horizontal' ? 'vertical' : 'horizontal',
              )
            }
          >
            纵向排列
          </Button>
          <Button
            variant="outline"
            aria-pressed={separateGaps}
            onClick={() => setSeparateGaps((current) => !current)}
          >
            分别设置间距
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
            aria-pressed={rtl}
            onClick={() => setRtl((current) => !current)}
          >
            RTL 方向
          </Button>
        </div>
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          className="min-w-0 max-w-full overflow-x-auto rounded-[var(--radius-md)] border border-border bg-muted/40 p-3"
          style={{ width: narrow ? 220 : 440 }}
        >
          <Space
            aria-label="Space 示例操作"
            direction={direction}
            size={separateGaps ? [24, 8] : 'middle'}
            split={<span data-space-separator="">|</span>}
            wrap
            align="start"
          >
            {actions.map((action) => (
              <Button
                key={action}
                variant="outline"
                className="w-24 shrink-0"
                onClick={() => setSelected(`已选择${action}`)}
              >
                {action}
              </Button>
            ))}
          </Space>
        </div>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {selected}
        </p>
      </CardContent>
    </Card>
  )
}
