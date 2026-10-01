import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  FormField,
  TreeSelect,
  Typography,
  type TreeSelectLoadChildren,
  type TreeSelectOption,
} from '@/shared/ui'

function waitForResponse(signal: AbortSignal, onAbort: () => void) {
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

export function TreeSelectAsyncPreview() {
  const [version, setVersion] = useState(0)
  const [failed, setFailed] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [value, setValue] = useState<string[]>(['remote-file'])
  const [requests, setRequests] = useState(0)
  const [status, setStatus] = useState('尚未加载')
  const data = useMemo<TreeSelectOption[]>(
    () => [
      ...(!removed
        ? [{ value: 'remote', label: '远程团队', isLeaf: false }]
        : []),
      { value: 'empty', label: '空远程目录', isLeaf: false },
      { value: 'local', label: '本地团队', isLeaf: true },
      {
        value: 'blocked',
        label: '禁用远程团队',
        disabled: true,
        isLeaf: false,
      },
    ],
    [removed],
  )
  const loadChildren = useCallback<TreeSelectLoadChildren>(
    async (node, { signal }) => {
      setRequests((count) => count + 1)
      setStatus('正在读取' + node.label)
      await waitForResponse(signal, () => setStatus('请求已取消'))
      if (failed) throw new Error('模拟读取失败')
      if (node.value === 'empty') return []
      if (node.value === 'remote')
        return [
          { value: 'remote-file', label: '远程设计组', isLeaf: true },
          { value: 'remote-folder', label: '远程研发目录', isLeaf: false },
        ]
      return [{ value: 'nested-file', label: '嵌套研发团队', isLeaf: true }]
    },
    [failed],
  )

  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="树选择异步加载预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树选择的异步选项
          </Typography>
          <p className="text-sm text-muted-foreground">
            展开目录读取选项，关闭后保留成功缓存。加载可取消、失败可重试；搜索已知选项时不发起读取，未解析值在载入后回填标签。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setFailed(!failed)}>
              {failed ? '恢复树选择响应' : '模拟树选择加载失败'}
            </Button>
            <Button variant="outline" onClick={() => setVersion(version + 1)}>
              刷新异步树选择缓存
            </Button>
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用异步树选择' : '禁用异步树选择'}
            </Button>
            <Button variant="outline" onClick={() => setRemoved(!removed)}>
              {removed ? '恢复树选择远程团队' : '删除树选择远程团队'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 异步树选择' : '使用 RTL 异步树选择'}
            </Button>
            <Button variant="outline" onClick={() => setValue(['remote'])}>
              回填远程父团队
            </Button>
            <Button variant="outline" onClick={() => setValue(['remote-file'])}>
              回填待加载团队
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="w-full max-w-xl">
              <FormField
                label="异步团队选择"
                description="可取消、重试、刷新缓存；搜索只查看已知选项。"
                control={
                  <TreeSelect
                    label="异步团队选择"
                    treeData={data}
                    loadChildren={loadChildren}
                    loadVersion={version}
                    onLoad={(node) => setStatus('完成读取' + node.label)}
                    onLoadError={() => setStatus('读取失败，可重试')}
                    value={value}
                    onChange={(next) =>
                      setValue(Array.isArray(next) ? next : [])
                    }
                    checkable
                    showSearch
                    allowClear
                    showLine
                    maxCount={3}
                    disabled={disabled}
                  />
                }
              />
            </div>
          </ConfigProvider>
          <p
            role="status"
            aria-label="异步树选择请求次数"
            className="text-sm text-muted-foreground"
          >
            已发起 {requests} 次请求
          </p>
          <p
            role="status"
            aria-label="异步树选择读取结果"
            className="text-sm text-muted-foreground"
          >
            {status}
          </p>
          <p
            role="status"
            aria-label="异步树选择值"
            className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
          >
            {JSON.stringify(value)}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
