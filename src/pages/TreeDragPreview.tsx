import { useCallback, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  Tree,
  Typography,
  moveTreeNode,
  type TreeHandle,
  type TreeLoadChildren,
  type TreeNode,
} from '@/shared/ui'

const initialData: TreeNode[] = [
  {
    key: 'work',
    title: '工作目录',
    isLeaf: false,
    children: [
      { key: 'alpha', title: '文档 Alpha', isLeaf: true },
      { key: 'beta', title: '文档 Beta', isLeaf: true },
      {
        key: 'nested',
        title: '子目录',
        children: [{ key: 'charlie', title: '文档 Charlie', isLeaf: true }],
      },
    ],
  },
  {
    key: 'target',
    title: '目标目录',
    children: [{ key: 'delta', title: '文档 Delta', isLeaf: true }],
  },
  { key: 'empty', title: '空接收目录', children: [] },
  { key: 'remote', title: '异步接收目录', isLeaf: false },
  {
    key: 'locked',
    title: '禁用目录',
    disabled: true,
    children: [{ key: 'locked-child', title: '禁用分支文件', isLeaf: true }],
  },
  { key: 'readonly', title: '不可移动文件', draggable: false, isLeaf: true },
]

export function TreeDragPreview() {
  const ref = useRef<TreeHandle>(null)
  const [data, setData] = useState(initialData)
  const [expanded, setExpanded] = useState(['work', 'nested', 'locked'])
  const [disabled, setDisabled] = useState(false)
  const [restricted, setRestricted] = useState(false)
  const [virtual, setVirtual] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [result, setResult] = useState('尚未移动节点')
  const loadChildren = useCallback<TreeLoadChildren>(async (_, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        window.clearTimeout(timer)
        reject(new DOMException('已取消', 'AbortError'))
      }
      const timer = window.setTimeout(() => {
        signal.removeEventListener('abort', abort)
        resolve()
      }, 900)
      if (signal.aborted) abort()
      else signal.addEventListener('abort', abort, { once: true })
    })
    return [{ key: 'remote-file', title: '远程目录文件', isLeaf: true }]
  }, [])
  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="树节点移动预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树的节点移动
          </Typography>
          <p className="text-sm text-muted-foreground">
            桌面拖动六点手柄，将整棵分支放在目标之前、内部或之后。H5
            点击移动手柄再选目标和位置；键盘 Ctrl+Space
            开始，方向键选目标，Enter 确认，Escape
            取消。禁用分支、自身及后代不接收移动。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setData(initialData)
                setExpanded(['work', 'nested', 'locked'])
                setVirtual(false)
                setResult('尚未移动节点')
              }}
            >
              重置可移动树
            </Button>
            <Button
              variant="outline"
              onClick={() => setDisabled((value) => !value)}
            >
              {disabled ? '启用树节点移动' : '禁用树节点移动'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRestricted((value) => !value)}
            >
              {restricted ? '允许全部有效位置' : '仅允许目标目录内部'}
            </Button>
            <Button variant="outline" onClick={() => setRtl((value) => !value)}>
              {rtl ? '使用 LTR 移动树' : '使用 RTL 移动树'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const bulk: TreeNode = {
                  key: 'bulk',
                  title: '归档目录',
                  children: Array.from({ length: 60 }, (_, index) => ({
                    key: `archive-${index}`,
                    title: `档案 ${String(index + 1).padStart(3, '0')}`,
                    isLeaf: true,
                  })),
                }
                setData([initialData[0], bulk, ...initialData.slice(1)])
                setExpanded(['work', 'nested', 'bulk', 'locked'])
                setVirtual(true)
              }}
            >
              启用虚拟拖动预览
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                ref.current?.scrollTo({
                  key: 'alpha',
                  autoExpand: true,
                  focus: true,
                })
              }
            >
              定位移动来源
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                ref.current?.scrollTo({ key: 'target', align: 'start' })
              }
            >
              定位移动目标
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <Tree
              ref={ref}
              label="可移动目录树"
              treeData={data}
              expandedKeys={expanded}
              onExpand={setExpanded}
              draggable
              disabled={disabled}
              allowDrop={(info) =>
                !restricted ||
                (info.dropKey === 'target' && info.position === 'inside')
              }
              onDrop={(info) => {
                setData(moveTreeNode(info.treeData, info))
                setResult(
                  `${info.dragNode.title} → ${info.dropNode.title}（${info.position === 'before' ? '之前' : info.position === 'after' ? '之后' : '内部'}）`,
                )
              }}
              loadChildren={loadChildren}
              height={virtual ? 320 : undefined}
              defaultSelectedKeys={['alpha']}
              defaultCheckedKeys={['alpha']}
              checkable
              showIcon
              showLine
            />
          </ConfigProvider>
          <p
            role="status"
            aria-label="树节点移动结果"
            className="text-sm text-muted-foreground"
          >
            {result}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
