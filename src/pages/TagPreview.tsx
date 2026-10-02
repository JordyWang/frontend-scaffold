import { useState } from 'react'
import { Button, Tag, Typography } from '@/shared/ui'

export function TagPreview() {
  const [selected, setSelected] = useState(false)
  const [open, setOpen] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [status, setStatus] = useState('选择或关闭标签')

  return (
    <div role="group" aria-label="标签交互" className="space-y-2">
      <Typography as="h4" variant="caption">
        可选与可关闭标签
      </Typography>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Tag
          selectable
          selected={selected}
          onSelectedChange={(next) => {
            setSelected(next)
            setStatus(next ? '已选择受控筛选' : '已取消受控筛选')
          }}
        >
          受控筛选
        </Tag>
        <Tag
          key={`select-${resetKey}`}
          selectable
          defaultSelected
          tone="success"
          onSelectedChange={(next) =>
            setStatus(next ? '已选择非受控筛选' : '已取消非受控筛选')
          }
        >
          非受控筛选
        </Tag>
        <Tag selectable disabled>
          禁用筛选
        </Tag>
        <Tag
          closable
          open={open}
          tone="warning"
          onOpenChange={setOpen}
          onClose={() => setStatus('已关闭受控标签')}
        >
          受控关闭
        </Tag>
        <Tag
          key={`close-${resetKey}`}
          closable
          defaultOpen
          tone="error"
          onOpenChange={() => setStatus('已关闭非受控标签')}
        >
          非受控关闭
        </Tag>
        <Button
          variant="outline"
          size="small"
          onClick={() => {
            setSelected(false)
            setOpen(true)
            setResetKey((current) => current + 1)
            setStatus('标签已恢复')
          }}
        >
          恢复标签
        </Button>
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {status}
      </p>
      <div
        role="group"
        aria-label="RTL 标签"
        dir="rtl"
        className="flex max-w-full flex-wrap items-center gap-2"
      >
        <Tag selectable defaultSelected>
          RTL 筛选
        </Tag>
        <Tag key={`rtl-${resetKey}`} closable tone="success">
          RTL 关闭
        </Tag>
      </div>
    </div>
  )
}
