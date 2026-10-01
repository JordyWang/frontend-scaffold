import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Cascader,
  ConfigProvider,
  FormField,
  Input,
  Typography,
  type CascaderLoadChildren,
  type CascaderOption,
} from '@/shared/ui'

function waitForResponse(
  signal: AbortSignal,
  ignoreAbort: boolean,
  onAbort: () => void,
) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      onAbort()
      if (!ignoreAbort) {
        window.clearTimeout(timer)
        reject(new DOMException('请求已取消', 'AbortError'))
      }
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 1500)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

export function CascaderAsyncPreview() {
  const [value, setValue] = useState<string[]>(['remote', 'file'])
  const [multipleValue, setMultipleValue] = useState<string[][]>([['remote']])
  const [version, setVersion] = useState(0)
  const [failed, setFailed] = useState(false)
  const [ignoreAbort, setIgnoreAbort] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [requests, setRequests] = useState(0)
  const [responses, setResponses] = useState(0)
  const [status, setStatus] = useState('尚未加载')
  const options = useMemo<CascaderOption[]>(
    () => [
      ...(!removed
        ? [{ value: 'remote', label: '远程地区', isLeaf: false }]
        : []),
      { value: 'other', label: '其他远程地区', isLeaf: false },
      { value: 'empty', label: '空远程地区', isLeaf: false },
      { value: 'local', label: '本地地区' },
      {
        value: 'blocked',
        label: '禁用远程地区',
        isLeaf: false,
        disabled: true,
      },
    ],
    [removed],
  )
  const loadChildren = useCallback<CascaderLoadChildren>(
    async (path, { signal }) => {
      setRequests((count) => count + 1)
      const last = path.at(-1)!
      setStatus('正在读取' + last.label)
      await waitForResponse(signal, ignoreAbort, () => setStatus('请求已取消'))
      setResponses((count) => count + 1)
      if (failed) throw new Error('模拟读取失败')
      if (last.value === 'empty') return []
      if (last.value === 'remote')
        return [
          { value: 'file', label: '远程中心城区' },
          { value: 'folder', label: '远程街道目录', isLeaf: false },
        ]
      if (last.value === 'other')
        return [{ value: 'file', label: '其他中心城区' }]
      return [
        {
          value: 'street',
          label: '覆盖长名称与多行显示的上海浦东新区街道服务区域',
        },
      ]
    },
    [failed, ignoreAbort],
  )
  const shared = {
    options,
    loadChildren,
    loadVersion: version,
    disabled,
    onLoad: (path: CascaderOption[]) =>
      setStatus('完成读取' + path.at(-1)!.label),
    onLoadError: () => setStatus('读取失败，可重试'),
  }
  return (
    <section aria-label="级联选择异步加载预览" className="space-y-4">
      <Typography as="h4" variant="title">
        级联选项的异步加载
      </Typography>
      <p className="text-sm text-muted-foreground">
        完整路径传给加载函数，成功缓存跨弹层保留。取消、关闭、切换列、搜索和刷新会忽略过期响应；搜索只查询已载入的完整叶路径。显式空目录载入后可以作为终点选择。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setFailed(!failed)}>
          {failed ? '恢复级联响应' : '模拟级联加载失败'}
        </Button>
        <Button variant="outline" onClick={() => setIgnoreAbort(!ignoreAbort)}>
          {ignoreAbort ? '恢复级联取消响应' : '模拟忽略级联取消'}
        </Button>
        <Button variant="outline" onClick={() => setVersion(version + 1)}>
          刷新异步级联缓存
        </Button>
        <Button variant="outline" onClick={() => setDisabled(!disabled)}>
          {disabled ? '启用异步级联' : '禁用异步级联'}
        </Button>
        <Button variant="outline" onClick={() => setRemoved(!removed)}>
          {removed ? '恢复远程地区' : '删除远程地区'}
        </Button>
        <Button variant="outline" onClick={() => setRtl(!rtl)}>
          {rtl ? '使用 LTR 异步级联' : '使用 RTL 异步级联'}
        </Button>
        <Button variant="outline" onClick={() => setValue([])}>
          清空待载入级联路径
        </Button>
        <Button variant="outline" onClick={() => setValue(['remote', 'file'])}>
          回填待加载地区
        </Button>
        <Button
          variant="outline"
          onClick={() => setMultipleValue([['remote']])}
        >
          回填远程多选父路径
        </Button>
      </div>
      <ConfigProvider
        direction={rtl ? 'rtl' : 'ltr'}
        theme={{ mode: rtl ? 'dark' : 'light' }}
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <FormField
            label="异步地区级联"
            control={
              <Cascader
                {...shared}
                label="异步地区级联"
                value={value}
                onChange={setValue}
                showSearch
                allowClear
              />
            }
          />
          <FormField
            label="异步级联后的输入"
            control={<Input aria-label="异步级联后的输入" />}
          />
          <FormField
            label="异步多选地区"
            control={
              <Cascader
                {...shared}
                multiple
                label="异步多选地区"
                value={multipleValue}
                onChange={setMultipleValue}
                showSearch
                allowClear
                maxTagCount={2}
              />
            }
          />
          <FormField
            label="异步原生分级地区"
            description="未加载的目录不通过原生 required 校验。"
            control={
              <Cascader
                {...shared}
                mode="inline"
                label="异步原生分级地区"
                required
              />
            }
          />
          <div className="min-w-0 space-y-2 md:col-span-2">
            <h5 className="text-lg font-semibold">异步内嵌列式面板</h5>
            <Cascader
              {...shared}
              mode="panel"
              label="异步内嵌地区"
              listHeight={220}
            />
          </div>
        </div>
      </ConfigProvider>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p role="status" aria-label="异步级联请求次数">
          已发起 {requests} 次请求
        </p>
        <p role="status" aria-label="异步级联响应次数">
          已返回 {responses} 次响应
        </p>
        <p role="status" aria-label="异步级联读取结果">
          {status}
        </p>
        <p
          role="status"
          aria-label="异步级联值"
          className="[overflow-wrap:anywhere]"
        >
          {JSON.stringify(value)}
        </p>
        <p
          role="status"
          aria-label="异步级联多选值"
          className="[overflow-wrap:anywhere]"
        >
          {JSON.stringify(multipleValue)}
        </p>
      </div>
    </section>
  )
}
