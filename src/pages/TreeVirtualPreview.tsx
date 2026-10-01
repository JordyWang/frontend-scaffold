import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  ConfigProvider,
  Tree,
  Typography,
  type TreeHandle,
  type TreeLoadChildren,
  type TreeNode,
} from '@/shared/ui'

export function TreeVirtualPreview() {
  const treeRef = useRef<TreeHandle>(null)
  const [short, setShort] = useState(false)
  const [virtual, setVirtual] = useState(true)
  const [narrow, setNarrow] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [detail, setDetail] = useState(false)
  const [small, setSmall] = useState(false)
  const [selection, setSelection] = useState<string[]>([])
  const [path, setPath] = useState('尚未定位节点')
  const [failure, setFailure] = useState(false)
  const [version, setVersion] = useState(0)
  const data = useMemo<TreeNode[]>(
    () => [
      {
        key: 'catalog',
        title: '资源库',
        children: Array.from({ length: short ? 1 : 20 }, (_, folder) => ({
          key: `folder-${folder}`,
          title: `目录 ${String(folder + 1).padStart(2, '0')}`,
          children: Array.from({ length: short ? 3 : 50 }, (_, file) => ({
            key: `folder-${folder}-file-${file}`,
            textValue: `文件 ${String(folder + 1).padStart(2, '0')}-${String(file + 1).padStart(2, '0')}`,
            title:
              folder === 0 && file === 0 ? (
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="block">
                    文件
                    01-01：这个标题用于检查窄屏换行、动态内容高度和虚拟窗口之间的衔接。
                  </span>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setDetail((value) => !value)}
                  >
                    {detail ? '收起文件说明' : '展开文件说明'}
                  </Button>
                  {detail && (
                    <span className="block">
                      文件说明会增加这一行的实际高度，后续节点应重新排列，保留当前滚动位置并继续支持键盘浏览。
                    </span>
                  )}
                </span>
              ) : (
                `文件 ${String(folder + 1).padStart(2, '0')}-${String(file + 1).padStart(2, '0')}`
              ),
            isLeaf: true,
            disabled: folder === 0 && file === 1,
          })),
        })),
      },
      { key: 'virtual-remote', title: '远程虚拟目录', isLeaf: false },
    ],
    [short, detail],
  )
  const allExpanded = useMemo(
    () => [
      'catalog',
      ...Array.from(
        { length: short ? 1 : 20 },
        (_, folder) => `folder-${folder}`,
      ),
    ],
    [short],
  )
  const [expanded, setExpanded] = useState<string[]>(() => [
    'catalog',
    ...Array.from({ length: 20 }, (_, folder) => `folder-${folder}`),
  ])
  const loadChildren = useCallback<TreeLoadChildren>(
    async (_, { signal }) => {
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          window.clearTimeout(timer)
          reject(new DOMException('请求已取消', 'AbortError'))
        }
        const timer = window.setTimeout(() => {
          signal.removeEventListener('abort', abort)
          resolve()
        }, 1200)
        if (signal.aborted) abort()
        else signal.addEventListener('abort', abort, { once: true })
      })
      if (failure) throw new Error('模拟读取失败')
      return [
        { key: 'virtual-remote-file', title: '虚拟窗口远程文件', isLeaf: true },
      ]
    },
    [failure],
  )

  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="树虚拟滚动预览" className="space-y-4">
          <Typography as="h3" variant="title">
            树的虚拟滚动
          </Typography>
          <p className="text-sm text-muted-foreground">
            展开后包含 1000
            个文件，窗口只挂载附近节点。长标题、交互内容和异步反馈按实际高度排列；方向键与
            Home / End 可跨越窗口。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const key = 'folder-12-file-40'
                const nodes = treeRef.current?.getNodePath(key) ?? []
                setPath(
                  nodes.map((node) => node.title).join(' / ') ||
                    '目标不在当前数据中',
                )
                treeRef.current?.scrollTo({
                  key,
                  align: 'center',
                  autoExpand: true,
                })
              }}
            >
              定位文件 13-41
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                treeRef.current?.scrollTo({
                  key: 'folder-19-file-49',
                  align: 'end',
                  autoExpand: true,
                  focus: true,
                })
              }
            >
              聚焦末尾文件
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                treeRef.current?.scrollTo({
                  key: 'catalog',
                  align: 'start',
                  focus: true,
                })
              }
            >
              回到虚拟树首项
            </Button>
            <Button variant="outline" onClick={() => setExpanded([])}>
              收起虚拟树
            </Button>
            <Button variant="outline" onClick={() => setExpanded(allExpanded)}>
              展开虚拟树
            </Button>
            <Button
              variant="outline"
              onClick={() => setShort((value) => !value)}
            >
              {short ? '恢复虚拟树数据' : '缩减虚拟树数据'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setVirtual((value) => !value)}
            >
              {virtual ? '关闭树虚拟化' : '开启树虚拟化'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setNarrow((value) => !value)}
            >
              {narrow ? '恢复虚拟树宽度' : '收窄虚拟树容器'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSmall((value) => !value)}
            >
              {small ? '恢复虚拟树高度' : '降低虚拟树高度'}
            </Button>
            <Button variant="outline" onClick={() => setRtl((value) => !value)}>
              {rtl ? '使用 LTR 虚拟树' : '使用 RTL 虚拟树'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                treeRef.current?.scrollTo({
                  key: 'virtual-remote',
                  align: 'end',
                  focus: true,
                })
              }
            >
              定位远程虚拟目录
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFailure((value) => !value)
                setVersion((value) => value + 1)
              }}
            >
              {failure ? '恢复虚拟树响应' : '模拟虚拟树失败'}
            </Button>
          </div>
          <div className={narrow ? 'max-w-80' : 'w-full'}>
            <ConfigProvider
              direction={rtl ? 'rtl' : 'ltr'}
              theme={{ mode: rtl ? 'dark' : 'light' }}
            >
              <Tree
                ref={treeRef}
                label="虚拟资源树"
                treeData={data}
                height={small ? 200 : 320}
                virtual={virtual}
                expandedKeys={expanded}
                onExpand={setExpanded}
                selectedKeys={selection}
                onSelectionChange={setSelection}
                loadChildren={loadChildren}
                loadVersion={version}
                checkable
                showIcon
                showLine
              />
            </ConfigProvider>
          </div>
          <p
            role="status"
            aria-label="虚拟树定位路径"
            className="text-sm text-muted-foreground"
          >
            {path}
          </p>
          <p
            role="status"
            aria-label="虚拟树选择结果"
            className="text-sm text-muted-foreground"
          >
            已选择：{selection.join('、') || '无'}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
