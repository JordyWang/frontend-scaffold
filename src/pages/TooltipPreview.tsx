import { useState } from 'react'
import {
  Button,
  Select,
  Tooltip,
  Typography,
  type TooltipPlacement,
} from '@/shared/ui'

const placements: TooltipPlacement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
]

export function TooltipPreview() {
  const [controlledOpen, setControlledOpen] = useState(false)
  const [placement, setPlacement] = useState<TooltipPlacement>('top-start')

  return (
    <div role="group" aria-label="提示状态" className="space-y-2">
      <Typography as="h4" variant="caption">
        延迟、空内容与受控提示
      </Typography>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Tooltip
          title="悬停稍后显示，聚焦或触控立即显示"
          mouseEnterDelay={0.25}
          mouseLeaveDelay={0.1}
        >
          <Button variant="outline">延迟提示</Button>
        </Tooltip>
        <Tooltip title="">
          <Button variant="outline">空内容提示</Button>
        </Tooltip>
        <Tooltip title="禁用状态不显示" disabled>
          <Button variant="outline">禁用提示</Button>
        </Tooltip>
        <Tooltip
          title="由外部管理的提示"
          open={controlledOpen}
          onOpenChange={setControlledOpen}
        >
          <Button variant="outline">受控提示</Button>
        </Tooltip>
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {controlledOpen ? '受控提示已打开' : '受控提示已关闭'}
      </p>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Select
          label="提示位置"
          aria-label="提示位置"
          value={placement}
          onValueChange={(next) => setPlacement(next as TooltipPlacement)}
          options={placements.map((value) => ({ value, label: value }))}
        />
        <Tooltip title={`当前请求位置：${placement}`} placement={placement}>
          <Button variant="outline">查看位置提示</Button>
        </Tooltip>
      </div>
    </div>
  )
}
