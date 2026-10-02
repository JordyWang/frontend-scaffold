import { useState } from 'react'
import { Button, Dropdown, Select, type DropdownPlacement } from '@/shared/ui'

const placements: DropdownPlacement[] = [
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

const items = [
  { key: 'open', label: '打开项目' },
  { key: 'share', label: '分享项目' },
  { key: 'disabled', label: '不可用操作', disabled: true },
]

export function DropdownPreview() {
  const [placement, setPlacement] = useState<DropdownPlacement>('bottom-start')
  const [controlledOpen, setControlledOpen] = useState(false)
  const [selection, setSelection] = useState('尚未选择操作')

  const selectableItems = items.map((item) => ({
    ...item,
    onSelect: () => setSelection(item.label),
  }))

  return (
    <div
      role="group"
      aria-label="Dropdown 触发与位置预览"
      className="grid gap-3"
    >
      <p className="m-0 text-sm text-muted-foreground">
        菜单可点击、悬停或右键打开；触屏可轻触，键盘可用方向键与菜单键。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          label="悬停菜单"
          triggerMode="hover"
          placement="top-end"
          trigger={<Button variant="outline">悬停打开菜单</Button>}
          items={selectableItems}
        />
        <Dropdown
          label="右键菜单"
          triggerMode="contextMenu"
          placement="right-start"
          trigger={<Button variant="outline">右键打开菜单</Button>}
          items={selectableItems}
        />
        <Select
          label="菜单位置"
          aria-label="菜单位置"
          value={placement}
          onValueChange={(next) => setPlacement(next as DropdownPlacement)}
          options={placements.map((value) => ({ value, label: value }))}
        />
        <Dropdown
          label="位置菜单"
          placement={placement}
          trigger={<Button variant="outline">查看位置菜单</Button>}
          items={selectableItems}
        />
        <Dropdown
          label="受控菜单"
          open={controlledOpen}
          onOpenChange={setControlledOpen}
          trigger={<Button variant="outline">打开受控菜单</Button>}
          items={selectableItems}
        />
        <Button variant="ghost" onClick={() => setControlledOpen(true)}>
          外部打开菜单
        </Button>
        <Button variant="ghost" onClick={() => setControlledOpen(false)}>
          外部关闭菜单
        </Button>
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {selection}；受控菜单：{controlledOpen ? '已打开' : '已关闭'}
      </p>
    </div>
  )
}
