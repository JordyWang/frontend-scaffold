import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  Tree,
  Typography,
  type TreeLoadChildren,
  type TreeNode,
} from '@/shared/ui'

function delayWithSignal(signal: AbortSignal, onAbort: () => void) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer)
      onAbort()
      reject(new DOMException('请求已取消', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 1500)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

export function TreeAsyncPreview() {
  const [version, setVersion] = useState(0)
  const [expanded, setExpanded] = useState<string[]>([])
  const [failed, setFailed] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [requests, setRequests] = useState(0)
  const [status, setStatus] = useState('尚未加载')
  const [rtl, setRtl] = useState(false)
  const nodes = useMemo<TreeNode[]>(
    () => [
      ...(!removed
        ? [{ key: 'remote', title: '远程目录', isLeaf: false }]
        : []),
      { key: 'empty', title: '空目录', isLeaf: false },
      { key: 'fixed', title: '固定叶节点', isLeaf: true },
      { key: 'disabled', title: '禁用远程目录', isLeaf: false, disabled: true },
    ],
    [removed],
  )
  const loadChildren = useCallback<TreeLoadChildren>(
    async (node, { signal }) => {
      setRequests((count) => count + 1)
      setStatus(`正在读取${node.title}`)
      await delayWithSignal(signal, () => setStatus('请求已取消'))
      if (failed) throw new Error('模拟读取失败')
      if (node.key === 'empty') return []
      if (node.key === 'remote')
        return [
          { key: 'remote-file', title: '远程文件', isLeaf: true },
          { key: 'remote-folder', title: '远程子目录', isLeaf: false },
        ]
      return [{ key: `${node.key}-file`, title: '嵌套远程文件', isLeaf: true }]
    },
    [failed],
  )

  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="树异步加载预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树的异步加载
          </Typography>
          <p className="text-sm text-muted-foreground">
            展开未知目录后读取子节点。加载时可取消，失败后可用按钮或展开方向键重试；完成后再次展开使用缓存。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setExpanded(['remote'])}>
              外部展开远程目录
            </Button>
            <Button variant="outline" onClick={() => setExpanded([])}>
              外部收起远程目录
            </Button>
            <Button
              variant="outline"
              aria-pressed={failed}
              onClick={() => setFailed((value) => !value)}
            >
              {failed ? '恢复正常树响应' : '模拟树加载失败'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setVersion((value) => value + 1)}
            >
              刷新异步树缓存
            </Button>
            <Button
              variant="outline"
              onClick={() => setDisabled((value) => !value)}
            >
              {disabled ? '启用异步树' : '禁用异步树'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRemoved((value) => !value)}
            >
              {removed ? '恢复远程目录' : '删除远程目录'}
            </Button>
            <Button variant="outline" onClick={() => setRtl((value) => !value)}>
              {rtl ? '使用 LTR 异步树' : '使用 RTL 异步树'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <Tree
              label="异步目录树"
              treeData={nodes}
              loadChildren={loadChildren}
              loadVersion={version}
              expandedKeys={expanded}
              onExpand={setExpanded}
              onLoad={(node) => setStatus(`完成读取${node.title}`)}
              onLoadError={() => setStatus('读取失败，可重试')}
              disabled={disabled}
              checkable
              defaultCheckedKeys={['remote']}
              showIcon
              showLine
            />
          </ConfigProvider>
          <p
            role="status"
            aria-label="异步树请求次数"
            className="text-sm text-muted-foreground"
          >
            已发起 {requests} 次请求
          </p>
          <p
            role="status"
            aria-label="异步树读取结果"
            className="text-sm text-muted-foreground"
          >
            {status}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
