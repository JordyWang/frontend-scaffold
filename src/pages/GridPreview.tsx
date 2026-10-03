import { useState } from 'react'
import { Button, Card, CardContent, Grid, Typography } from '@/shared/ui'

const modules = ['任务', '文件', '媒体', '报表']
type PreviewWidth = 'wide' | 'medium' | 'narrow'
const previewWidths: Record<PreviewWidth, number> = {
  wide: 900,
  medium: 700,
  narrow: 360,
}

export function GridPreview() {
  const [width, setWidth] = useState<PreviewWidth>('wide')
  const [rtl, setRtl] = useState(false)
  const [action, setAction] = useState('尚未选择模块')

  return (
    <Card id="ds-grid" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
        <Typography as="h3" variant="title">
          Grid 栅格布局
        </Typography>
        <Typography variant="caption" tone="muted">
          24 列栅格按自身容器换列，间距与起始偏移跟随宽度和文字方向。
        </Typography>
        <div
          role="group"
          aria-label="栅格展示设置"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ['wide', '宽容器'],
              ['medium', '中容器'],
              ['narrow', '窄容器'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="outline"
              aria-pressed={width === value}
              onClick={() => setWidth(value)}
            >
              {label}
            </Button>
          ))}
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
          className="min-w-0 max-w-full transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: previewWidths[width] }}
        >
          <Grid.Row
            aria-label="响应式模块栅格"
            gutter={{ xs: [8, 12], sm: [16, 16], md: [24, 20] }}
          >
            {modules.map((name, index) => (
              <Grid.Col
                key={name}
                span={
                  index === 3
                    ? { xs: 0, sm: 12, md: 8 }
                    : { xs: 24, sm: 12, md: 8 }
                }
              >
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAction(`已打开${name}模块`)}
                >
                  {name}模块
                </Button>
              </Grid.Col>
            ))}
          </Grid.Row>
          <Grid.Row
            aria-label="起始偏移栅格"
            gutter={{ xs: [8, 8], sm: [16, 8] }}
            className="mt-3"
          >
            <Grid.Col span={{ xs: 24, sm: 8 }} offset={{ xs: 0, sm: 4 }}>
              <div className="rounded-[var(--radius-md)] bg-accent p-3 text-center text-accent-foreground">
                起始偏移
              </div>
            </Grid.Col>
            <Grid.Col span={{ xs: 24, sm: 12 }}>
              <div className="rounded-[var(--radius-md)] bg-muted p-3 text-center text-foreground">
                剩余空间
              </div>
            </Grid.Col>
          </Grid.Row>
          <Grid.Row
            aria-label="响应式行对齐栅格"
            gutter={{ xs: 8, sm: 16 }}
            align={{ xs: 'stretch', sm: 'center', md: 'end' }}
            justify={{ xs: 'start', sm: 'between', md: 'evenly' }}
            className="mt-3"
          >
            <Grid.Col span={6}>
              <div className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-primary/15 text-sm text-foreground">
                短项
              </div>
            </Grid.Col>
            <Grid.Col span={6}>
              <div className="flex h-20 items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm text-accent-foreground">
                高项
              </div>
            </Grid.Col>
          </Grid.Row>
        </div>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {action}
        </p>
      </CardContent>
    </Card>
  )
}
