import { useState } from 'react'
import { Badge, Button, Icon, Typography } from '@/shared/ui'

export function BadgePreview() {
  const [count, setCount] = useState(0)
  const [customBadgeStatus, setCustomBadgeStatus] = useState('尚未查看任务')

  return (
    <div role="group" aria-label="徽标状态" className="space-y-3">
      <Typography as="h4" variant="caption">
        数量、状态与角标
      </Typography>
      <div className="flex max-w-full flex-wrap items-center gap-4 p-2">
        <Badge count={count} max={9}>
          <Button variant="outline">消息</Button>
        </Badge>
        <Badge count={count} showZero label={`${count} 条消息`} />
        <Badge count="NEW" size="small" tone="success" />
        <Badge dot label="有更新">
          <Button variant="outline">更新</Button>
        </Badge>
        <Badge count={3} offset={[4, 4]} tone="warning">
          <Button variant="outline">偏移徽标</Button>
        </Badge>
        <Badge
          id="preview-custom-badge"
          count={<Icon name="check" size={12} />}
          label="任务已完成"
          title="完成标记"
          classNames={{ indicator: 'bg-primary/85 ring-2 ring-card' }}
        >
          <Button
            variant="outline"
            onClick={() => setCustomBadgeStatus('已查看完成任务')}
          >
            自定义徽标
          </Button>
        </Badge>
        <Button variant="outline" onClick={() => setCount(12)}>
          设为 12
        </Button>
        <Button variant="outline" onClick={() => setCount(0)}>
          设为 0
        </Button>
        <span role="status" className="text-sm text-muted-foreground">
          {customBadgeStatus}
        </span>
      </div>
      <div className="flex max-w-full flex-wrap items-center gap-3">
        <Badge status="processing" text="处理中" />
        <Badge status="success" text="已完成" />
        <Badge status="warning" text="需注意" />
        <Badge status="error" text="处理失败" />
        <Badge status="default" />
      </div>
      <Badge.Ribbon
        text="蓝色角标"
        classNames={{ indicator: 'bg-primary', content: 'tracking-wide' }}
      >
        <div className="w-44 rounded-md border border-border bg-card p-4 pt-12 text-sm text-card-foreground">
          语义类名示例
        </div>
      </Badge.Ribbon>
      <div
        dir="rtl"
        role="group"
        aria-label="RTL 角标"
        className="flex max-w-full flex-wrap items-start gap-4"
      >
        <Badge count={3} offset={[4, 4]} tone="success">
          <Button variant="outline">RTL 偏移</Button>
        </Badge>
        <Badge.Ribbon text="推荐" tone="warning" placement="start">
          <div className="w-48 rounded-md border border-border bg-card p-4 pt-12 text-sm text-card-foreground">
            RTL 卡片角标
          </div>
        </Badge.Ribbon>
      </div>
    </div>
  )
}
