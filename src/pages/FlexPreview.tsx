import { useState } from 'react'
import { Button, Card, CardContent, Flex, Typography } from '@/shared/ui'

const sections = ['概览', '任务', '文件', '设置']

export function FlexPreview() {
  const [direction, setDirection] = useState<'row' | 'column'>('row')
  const [wrap, setWrap] = useState(true)
  const [wide, setWide] = useState(true)
  const [rtl, setRtl] = useState(false)
  const [selected, setSelected] = useState('尚未选择')

  return (
    <Card id="ds-flex" className="col-span-full min-w-0 scroll-mt-6">
      <CardContent className="grid min-w-0 grid-cols-1 gap-4">
        <Typography as="h3" variant="title">
          Flex 弹性布局
        </Typography>
        <Typography variant="caption" tone="muted">
          Flex 默认水平排列；可切换方向、换行、容器宽度和文字方向。
        </Typography>
        <div
          role="group"
          aria-label="Flex 展示设置"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant="outline"
            aria-pressed={direction === 'column'}
            onClick={() =>
              setDirection((current) => (current === 'row' ? 'column' : 'row'))
            }
          >
            纵向排列
          </Button>
          <Button
            variant="outline"
            aria-pressed={wrap}
            onClick={() => setWrap((current) => !current)}
          >
            自动换行
          </Button>
          <Button
            variant="outline"
            aria-pressed={!wide}
            onClick={() => setWide((current) => !current)}
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
          style={{ width: wide ? 520 : 244 }}
        >
          <Flex
            aria-label="Flex 示例项目"
            direction={direction}
            wrap={wrap}
            align="center"
            gap="lg"
          >
            {sections.map((section) => (
              <Button
                key={section}
                variant="outline"
                className="w-24 shrink-0"
                onClick={() => setSelected(`已选择${section}`)}
              >
                {section}
              </Button>
            ))}
          </Flex>
        </div>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {selected}
        </p>
      </CardContent>
    </Card>
  )
}
