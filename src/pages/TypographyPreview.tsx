import { useCallback, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  Typography,
} from '@/shared/ui'

const longText =
  '组件库统一文字、复制和编辑操作。长内容按容器宽度省略，展开后可以完整阅读，复制始终保留完整内容。'.repeat(
    5,
  )
export function TypographyPreview() {
  const [value, setValue] = useState('可以编辑的项目说明')
  const [editing, setEditing] = useState(false)
  const [count, setCount] = useState(0)
  const [disabled, setDisabled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [short, setShort] = useState(false)
  const [wide, setWide] = useState(false)
  const copyAttempt = useRef(0)
  const requestText = useCallback(async () => {
    const attempt = ++copyAttempt.current
    await new Promise((resolve) => setTimeout(resolve, 300))
    if (attempt === 1) throw new Error('示例请求失败')
    return '异步取得的完整任务说明'
  }, [])
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>文字交互与省略</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="Typography 能力预览" className="min-w-0 space-y-6">
          <Typography tone="muted">
            复制支持等待、失败和重试；编辑可按 Enter 保存、Shift+Enter
            换行、Escape 取消。操作按钮保持触控尺寸。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用文字操作' : '禁用文字操作'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setValue('外部更新的项目说明')}
            >
              外部更新文字
            </Button>
            <Button variant="outline" onClick={() => setShort(!short)}>
              {short ? '恢复长文字' : '切换短文字'}
            </Button>
            <Button variant="outline" onClick={() => setWide(!wide)}>
              {wide ? '收窄文字容器' : '放宽文字容器'}
            </Button>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Typography as="h3" variant="title">
                复制与受控编辑
              </Typography>
              <Typography
                label="项目说明"
                disabled={disabled}
                copyable
                editable={{
                  value,
                  editing,
                  onEditingChange: setEditing,
                  onChange: setValue,
                  maxLength: 120,
                  autoSize: { minRows: 1, maxRows: 4 },
                  onEnd: () => setCount((n) => n + 1),
                }}
                classNames={{ root: 'rounded-md border border-border p-3' }}
              >
                {value}
              </Typography>
              <p
                role="status"
                aria-label="文字提交状态"
                className="text-sm text-muted-foreground"
              >
                完成 {count} 次 · {value}
              </p>
              <Typography
                label="异步说明"
                copyable={{ text: requestText, successLabel: '异步说明已复制' }}
              >
                从异步请求取文案，首次失败后可重试。
              </Typography>
              <Typography
                label="纯文本编辑"
                editable={{
                  trigger: 'text',
                  defaultValue: '点击这段文字或按 Enter 编辑',
                  submitOnBlur: false,
                }}
              >
                文字编辑入口
              </Typography>
              <Typography label="禁用说明" copyable editable disabled>
                禁用状态仍显示完整说明。
              </Typography>
            </div>
            <div className="space-y-3">
              <Typography as="h3" variant="title">
                省略与展开
              </Typography>
              <div
                role="group"
                aria-label="文字容器预览"
                className={wide ? 'w-full min-w-0' : 'w-60 max-w-full min-w-0'}
              >
                <Typography
                  label="任务描述"
                  ellipsis={{
                    rows: 2,
                    expandable: 'collapsible',
                    expanded,
                    onExpandedChange: setExpanded,
                  }}
                  copyable
                  classNames={{ root: 'rounded-md border border-border p-3' }}
                >
                  {short ? '简短说明。' : longText}
                </Typography>
              </div>
              <Typography
                label="文件名称"
                ellipsis={{
                  rows: 1,
                  expandable: 'collapsible',
                  suffix: '.mp4',
                  tooltip: true,
                }}
                copyable
              >
                年度项目成果与产品使用说明视频文件名称_abcdefghijklmnopqrstuvwxyz_0123456789
              </Typography>
              <Typography
                label="富文本说明"
                ellipsis={{ rows: 2, expandable: 'collapsible' }}
                copyable
              >
                <strong>富文本内容保留语义。</strong>
                {longText}
                <a
                  href="#typography-details"
                  className="text-primary underline"
                >
                  查看文字约定
                </a>
              </Typography>
              <Typography as="h4" variant="title" id="typography-details">
                格式与状态
              </Typography>
              <div className="flex flex-wrap gap-3">
                <Typography as="span" strong>
                  加粗
                </Typography>
                <Typography as="span" italic>
                  斜体
                </Typography>
                <Typography as="span" underline>
                  下划线
                </Typography>
                <Typography as="span" strike>
                  删除线
                </Typography>
                <Typography as="span" mark>
                  标记
                </Typography>
                <Typography as="span" code>
                  const blue = true
                </Typography>
                <Typography as="span" keyboard>
                  Shift + Enter
                </Typography>
              </div>
              <Typography tone="success">成功：文字已保存。</Typography>
              <Typography tone="warning">警告：请检查文字内容。</Typography>
              <Typography tone="danger">错误：提交失败。</Typography>
            </div>
          </div>
          <ConfigProvider
            direction="rtl"
            componentSize="small"
            theme={{ mode: 'dark' }}
          >
            <div
              role="group"
              aria-label="窄容器 RTL 文字预览"
              className="w-60 max-w-full min-w-0 rounded-lg border border-border bg-card p-3 text-card-foreground"
            >
              <Typography
                label="RTL 说明"
                actions={{ placement: 'start' }}
                copyable
                editable={{ autoSize: { minRows: 1, maxRows: 3 } }}
                ellipsis={{ rows: 2, expandable: 'collapsible' }}
              >
                {longText}
              </Typography>
            </div>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
