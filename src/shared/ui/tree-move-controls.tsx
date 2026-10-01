import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { treeNodeText, type useTreeDrag } from './tree-drag'
import type { TreeNode } from './tree'
import type { TreeDropPosition } from './tree-move'

export function TreeMoveControls({
  drag,
  source,
  target,
  direction,
  className,
}: {
  drag: ReturnType<typeof useTreeDrag>
  source?: TreeNode
  target?: TreeNode
  direction: 'ltr' | 'rtl'
  className?: string
}) {
  const session = drag.session
  if (!session || session.input !== 'controls') return null
  const error = session.target
    ? drag.error(session.target, session.position)
    : '请选择目标节点'
  const positions: { value: TreeDropPosition; label: string }[] = [
    { value: 'before', label: '目标之前' },
    { value: 'inside', label: '目标内部' },
    { value: 'after', label: '目标之后' },
  ]
  return (
    <section
      aria-label="节点移动操作"
      dir={direction}
      className={cn(
        'sticky top-2 z-10 space-y-2 rounded-[var(--radius-md)] border border-border bg-card p-3 text-card-foreground shadow-sm',
        className,
      )}
    >
      <p className="text-sm [overflow-wrap:anywhere]">
        移动：{treeNodeText(source)}；目标：
        {target ? treeNodeText(target) : '未选择'}
      </p>
      <div
        role="group"
        aria-label="节点放置位置"
        className="flex flex-wrap gap-2"
      >
        {positions.map(({ value, label }) => (
          <Button
            key={value}
            variant="outline"
            size="small"
            aria-pressed={session.position === value}
            disabled={
              !session.target || Boolean(drag.error(session.target, value))
            }
            onClick={() => session.target && drag.choose(session.target, value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {error ?? '按 Enter 或确认按钮提交移动，Escape 取消。'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="small"
          disabled={Boolean(error)}
          onClick={() => session.target && drag.commit(session.target)}
        >
          确认移动节点
        </Button>
        <Button variant="outline" size="small" onClick={() => drag.cancel()}>
          取消移动节点
        </Button>
      </div>
    </section>
  )
}
