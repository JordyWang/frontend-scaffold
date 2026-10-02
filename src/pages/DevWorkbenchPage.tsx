import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  pageShellStyles,
  skipLinkStyles,
  textLinkStyles,
} from '@/shared/ui/tailwind-styles'
import { apiGet } from '@/shared/api/request'
import {
  FileDropzone,
  FilePicker,
  FilePreview,
  UploadProgress,
  useFileUpload,
  type UploadTransport,
  type FileValidationResult,
} from '@/capabilities/files'
import {
  AiChatWorkbench,
  createMockAiChatClient,
  createMockAiTaskClient,
  PromptInput,
  TaskActions,
  TaskProgress,
  TaskStatus,
  useAiTask,
} from '@/capabilities/ai'
import { VideoPlayer, VideoPoster } from '@/capabilities/video'
import { AudioPlayer } from '@/capabilities/audio'
import { MockWorkflowDemo } from './MockWorkflowDemo'
import { DesignSystemPreview } from './DesignSystemPreview'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  Empty,
  FormField,
  Input,
  List,
  Pagination,
  Select,
  Sheet,
  Table,
  Tabs,
  Textarea,
  toast,
} from '@/shared/ui'

type FixtureResponse = {
  status: string
  examples: { id: string; label: string }[]
}
type DemoRow = { id: string; name: string; status: string; owner: string }

const swatches = [
  { name: '背景', variable: 'background' },
  { name: '表面', variable: 'card' },
  { name: '主色', variable: 'primary' },
  { name: '次要', variable: 'secondary' },
  { name: '边框', variable: 'border' },
  { name: '危险', variable: 'destructive' },
]
const rows: DemoRow[] = [
  { id: '1', name: '设计变量', status: '已完成', owner: '团队 A' },
  { id: '2', name: '组件预览', status: '进行中', owner: '团队 B' },
  { id: '3', name: '触控检查', status: '待开始', owner: '团队 C' },
]

const demoVideoSource = {
  src: '/mock/media/sample.mp4',
  type: 'video/mp4',
  poster: '/mock/media/poster.svg',
  subtitles: [
    {
      src: '/mock/media/sample.vtt',
      srcLang: 'zh-CN',
      label: '中文',
      default: true,
    },
  ],
}
const brokenVideoSource = {
  src: '/mock/media/not-found.mp4',
  type: 'video/mp4',
  poster: '/mock/media/poster.svg',
}

const demoUpload: UploadTransport = (_file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let progress = 0
    const timer = window.setInterval(() => {
      progress = Math.min(progress + 10, 100)
      onProgress(progress)
      if (progress === 100) {
        cleanup()
        resolve()
      }
    }, 250)
    const onAbort = () => {
      cleanup()
      reject(new DOMException('已取消', 'AbortError'))
    }
    const cleanup = () => {
      window.clearInterval(timer)
      signal.removeEventListener('abort', onAbort)
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })

const fileRules = {
  accept: ['image/*', 'video/*', 'audio/*'],
  maxBytes: 10 * 1024 * 1024,
  maxImageWidth: 4096,
  maxImageHeight: 4096,
  maxMediaDurationSeconds: 120,
}

function DemoSection({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4" aria-label={title}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export function DevWorkbenchPage() {
  const isMock = import.meta.env.MODE === 'mock'
  const fixtures = useQuery({
    queryKey: ['dev-fixtures'],
    queryFn: ({ signal }) =>
      apiGet<FixtureResponse>('/dev/fixtures', { signal }),
    enabled: isMock,
  })
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [paginationPageSize, setPaginationPageSize] = useState(10)
  const [paginationDisabled, setPaginationDisabled] = useState(false)
  const [loadMorePage, setLoadMorePage] = useState(1)
  const [showDynamicTab, setShowDynamicTab] = useState(true)
  const [dataState, setDataState] = useState<
    'filled' | 'empty' | 'loading' | 'error'
  >('filled')
  const [retryShouldFail, setRetryShouldFail] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileIssues, setFileIssues] = useState<string[]>([])
  const [showVideoError, setShowVideoError] = useState(false)
  const [showAudioError, setShowAudioError] = useState(false)
  const upload = useFileUpload(demoUpload)
  const aiChatClient = useMemo(() => createMockAiChatClient(), [])
  const aiClient = useMemo(() => createMockAiTaskClient(), [])
  const aiTask = useAiTask(aiClient, {
    pollIntervalMs: 300,
    storageKey: 'dev-workbench-ai-task',
  })
  const visibleRows = dataState === 'filled' ? rows : []

  async function retryData() {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 1400))
    if (retryShouldFail) throw new Error('模拟重试失败')
    setDataState('filled')
  }

  function onFiles(files: File[]) {
    upload.reset()
    setSelectedFile(files[0] ?? null)
    setFileIssues([])
  }

  function onRejected(results: FileValidationResult[]) {
    setFileIssues(
      results.flatMap(({ file, issues }) =>
        issues.map(({ message }) => `${file.name}：${message}`),
      ),
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className={skipLinkStyles} href="#main">
        跳到主要内容
      </a>
      <main
        id="main"
        className={`${pageShellStyles} space-y-12 py-10 sm:py-16`}
      >
        <header className="space-y-3">
          <Link
            className={`${textLinkStyles} inline-flex min-h-11 items-center`}
            to="/"
          >
            返回首页
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            组件预览
          </h1>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            检查默认、禁用、加载、错误、空数据和小屏布局。可用
            Tab、方向键、Enter、Space 与 Escape 验证键盘操作。
          </p>
        </header>

        <DesignSystemPreview />

        <DemoSection
          title="基础展示与输入"
          note="Button、Input、Textarea、FormField、Card、Empty"
        >
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => toast({ title: '操作已完成', variant: 'success' })}
            >
              主要操作
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast({ title: '次要操作已点击' })}
            >
              次要操作
            </Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: '描边按钮已点击' })}
            >
              描边按钮
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast({ title: '轻量按钮已点击' })}
            >
              轻量按钮
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast({ title: '危险操作示例', variant: 'error' })}
            >
              危险操作
            </Button>
            <Button loading>提交中</Button>
            <Button disabled>不可用</Button>
            <Button size="small" variant="outline">
              紧凑尺寸
            </Button>
            <Button size="icon" variant="outline" aria-label="图标按钮示例">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>表单状态</CardTitle>
                <CardDescription>
                  标签、说明和错误信息靠近输入控件
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="名称"
                  required
                  description="输入至少两个字符。"
                  error={name.length === 1 ? '名称至少需要两个字符' : undefined}
                  control={
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="请输入名称"
                    />
                  }
                />
                <FormField
                  label="补充说明"
                  control={
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="请输入补充说明"
                    />
                  }
                />
                <FormField
                  label="禁用输入"
                  control={<Input disabled value="不可编辑" readOnly />}
                />
                <FormField
                  label="紧凑输入"
                  control={<Input size="small" placeholder="紧凑尺寸" />}
                />
                <FormField
                  label="错误文本域"
                  error="请检查输入内容"
                  control={<Textarea size="small" defaultValue="错误示例" />}
                />
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setName('')
                    setNote('')
                  }}
                >
                  清空
                </Button>
              </CardFooter>
            </Card>
            <Empty
              title="暂无内容"
              description="创建内容后将在这里显示。"
              action={
                <Button
                  variant="outline"
                  onClick={() => toast({ title: '创建内容示例' })}
                >
                  创建内容
                </Button>
              }
            />
          </div>
        </DemoSection>

        <DemoSection title="交互与反馈" note="Select、Dialog、Sheet、Toast">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>选择与错误</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="分类"
                  required
                  error={category === 'error' ? '请选择有效分类' : undefined}
                  control={
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      options={[
                        { value: 'design', label: '设计' },
                        { value: 'code', label: '开发' },
                        { value: 'error', label: '错误示例' },
                        { value: 'disabled', label: '不可用', disabled: true },
                      ]}
                    />
                  }
                />
                <FormField
                  label="禁用选择"
                  control={
                    <Select
                      disabled
                      options={[{ value: 'a', label: '选项' }]}
                    />
                  }
                />
                <FormField
                  label="紧凑选择"
                  control={
                    <Select
                      size="small"
                      options={[{ value: 'a', label: '选项 A' }]}
                    />
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>弹层与提示</CardTitle>
                <CardDescription>在窄屏查看底部面板和安全区域</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Dialog
                  title="确认操作"
                  description="按 Escape 或关闭按钮可退出。"
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  trigger={<Button variant="outline">打开对话框</Button>}
                  footer={
                    <Button
                      onClick={() => {
                        setDialogOpen(false)
                        toast({ title: '已确认', variant: 'success' })
                      }}
                    >
                      确认
                    </Button>
                  }
                >
                  <p>焦点会留在对话框内，关闭后返回触发按钮。</p>
                  <Input
                    aria-label="对话框内输入"
                    placeholder="试试输入"
                    className="mt-4"
                  />
                </Dialog>
                <Sheet
                  title="详情面板"
                  description="小屏显示为底部面板。"
                  trigger={<Button variant="outline">打开面板</Button>}
                >
                  <p>面板内容可以滚动，底部留出安全区域。</p>
                  <Input
                    aria-label="面板内输入"
                    placeholder="试试输入"
                    className="mt-4"
                  />
                </Sheet>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast({ title: '信息提示', description: '这是普通状态。' })
                  }
                >
                  普通提示
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: '需要注意',
                      description: '这是警告状态。',
                      variant: 'warning',
                    })
                  }
                >
                  警告提示
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast({
                      title: '操作失败',
                      description: '请重试。',
                      variant: 'error',
                    })
                  }
                >
                  错误提示
                </Button>
              </CardContent>
            </Card>
          </div>
        </DemoSection>

        <DemoSection
          title="导航与数据"
          note="Tabs、Pagination、List、基础 Table"
        >
          <Tabs
            label="预览分组"
            items={[
              {
                value: 'overview',
                label: '总览',
                content: <p>使用左右方向键切换分组。</p>,
              },
              {
                value: 'details',
                label: '详细内容',
                content: <p>当前为第二个分组。</p>,
              },
              {
                value: 'disabled',
                label: '不可用',
                content: null,
                disabled: true,
              },
            ]}
          />
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-self-start"
              aria-pressed={!showDynamicTab}
              onClick={() => setShowDynamicTab((current) => !current)}
            >
              {showDynamicTab ? '隐藏详细分组' : '显示详细分组'}
            </Button>
            <Tabs
              label="动态预览分组"
              defaultValue="details"
              items={[
                {
                  value: 'overview',
                  label: '动态总览',
                  content: <p>动态分组的基础内容。</p>,
                },
                ...(showDynamicTab
                  ? [
                      {
                        value: 'details',
                        label: '动态详情',
                        content: <p>动态分组的详细内容。</p>,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          <Tabs
            label="垂直预览分组"
            orientation="vertical"
            className="max-w-xl rounded-lg border border-border p-3"
            items={[
              {
                value: 'summary',
                label: '概览',
                content: <p>使用上下方向键或触控切换垂直分组。</p>,
              },
              {
                value: 'detail',
                label: '细节',
                content: <p>窄屏仍保留左侧选项与右侧内容。</p>,
              },
              {
                value: 'disabled',
                label: '不可用',
                content: null,
                disabled: true,
              },
            ]}
          />
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label="数据状态"
          >
            <Button
              variant={dataState === 'filled' ? 'primary' : 'outline'}
              onClick={() => setDataState('filled')}
            >
              有数据
            </Button>
            <Button
              variant={dataState === 'empty' ? 'primary' : 'outline'}
              onClick={() => setDataState('empty')}
            >
              空数据
            </Button>
            <Button
              variant={dataState === 'loading' ? 'primary' : 'outline'}
              onClick={() => setDataState('loading')}
            >
              加载中
            </Button>
            <Button
              variant={dataState === 'error' ? 'primary' : 'outline'}
              onClick={() => setDataState('error')}
            >
              错误
            </Button>
            <Checkbox
              label="模拟重试失败"
              checked={retryShouldFail}
              onChange={(event) =>
                setRetryShouldFail(event.currentTarget.checked)
              }
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold">List</h3>
              <List
                items={visibleRows}
                getKey={(row) => row.id}
                renderItem={(row) => (
                  <div className="flex justify-between gap-4">
                    <span>{row.name}</span>
                    <span className="text-muted-foreground">{row.status}</span>
                  </div>
                )}
                loading={dataState === 'loading'}
                error={dataState === 'error' ? '示例列表加载失败' : undefined}
                onRetry={retryData}
                label="示例任务"
              />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Table</h3>
              <Table
                caption="示例任务表"
                rows={visibleRows}
                getRowKey={(row) => row.id}
                loading={dataState === 'loading'}
                error={dataState === 'error' ? '示例表格加载失败' : undefined}
                onRetry={retryData}
                columns={[
                  {
                    key: 'name',
                    header: '任务',
                    render: (row) => row.name,
                    sorter: (left, right) =>
                      left.name.localeCompare(right.name, 'zh-CN'),
                  },
                  {
                    key: 'status',
                    header: '状态',
                    render: (row) => row.status,
                    filterOptions: [
                      {
                        value: 'done',
                        label: '已完成',
                        matches: (row) => row.status === '已完成',
                      },
                      {
                        value: 'active',
                        label: '进行中',
                        matches: (row) => row.status === '进行中',
                      },
                      {
                        value: 'todo',
                        label: '待开始',
                        matches: (row) => row.status === '待开始',
                      },
                      {
                        value: 'archived',
                        label: '已归档',
                        matches: (row) => row.status === '已归档',
                      },
                    ],
                  },
                  {
                    key: 'owner',
                    header: '负责人',
                    render: (row) => row.owner,
                  },
                ]}
                selection={{
                  defaultSelectedKeys: ['2'],
                  disabled: (row) => row.id === '3',
                  getLabel: (row) => row.name,
                }}
                expandable={{
                  getLabel: (row) => row.name,
                  expandedRowRender: (row) => (
                    <p className="m-0 text-sm text-muted-foreground">
                      {row.name}：负责人为{row.owner}，当前状态为{row.status}。
                    </p>
                  ),
                }}
                renderMobileRow={(row) => (
                  <div className="space-y-1">
                    <strong>{row.name}</strong>
                    <p className="text-sm text-muted-foreground">
                      {row.status} · {row.owner}
                    </p>
                  </div>
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">页码模式</p>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPaginationDisabled((value) => !value)}
                >
                  {paginationDisabled ? '启用分页' : '禁用分页'}
                </Button>
              </div>
              <Pagination
                page={page}
                pageSize={paginationPageSize}
                total={135}
                disabled={paginationDisabled}
                onPageChange={setPage}
                onPageSizeChange={(size, nextPage) => {
                  setPaginationPageSize(size)
                  setPage(nextPage)
                }}
                showQuickJumper
                showTotal
              />
              <p className="text-xs text-muted-foreground">
                页码之间的省略号可跨 5 页；可使用键盘或触控操作。
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">加载更多模式</p>
              <Pagination
                page={loadMorePage}
                pageSize={3}
                total={12}
                onPageChange={setLoadMorePage}
                mode="load-more"
              />
            </div>
          </div>
        </DemoSection>

        <DemoSection
          title="文件能力"
          note="选择、拖放、校验、预览、上传进度与取消"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>选择文件</CardTitle>
                <CardDescription>
                  图片、视频或音频，最多 10 MB；图片不超过 4096 ×
                  4096，音视频不超过 120 秒。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FilePicker
                  rules={fileRules}
                  onFiles={onFiles}
                  onRejected={onRejected}
                />
                <FileDropzone
                  rules={fileRules}
                  onFiles={onFiles}
                  onRejected={onRejected}
                />
                {fileIssues.length > 0 && (
                  <ul
                    role="alert"
                    className="space-y-1 text-sm text-destructive"
                  >
                    {fileIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>预览与上传</CardTitle>
                <CardDescription>
                  演示使用本地模拟进度，真实上传可接入 XHR 适配器。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFile ? (
                  <FilePreview
                    file={selectedFile}
                    onRemove={() => {
                      upload.reset()
                      setSelectedFile(null)
                    }}
                  />
                ) : (
                  <Empty title="尚未选择文件" />
                )}
                <Button
                  disabled={!selectedFile || upload.status === 'uploading'}
                  onClick={() =>
                    selectedFile && void upload.start(selectedFile)
                  }
                >
                  开始上传
                </Button>
                <UploadProgress
                  status={upload.status}
                  progress={upload.progress}
                  error={upload.error}
                  onCancel={upload.cancel}
                  onRetry={
                    selectedFile
                      ? () => void upload.start(selectedFile)
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </div>
        </DemoSection>

        <DemoSection
          title="AI 任务能力"
          note="任务状态机、轮询、进度、取消、失败和重试"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>提交任务</CardTitle>
                <CardDescription>
                  Mock 客户端从 JSON fixture
                  初始化；输入“失败”可演示失败与重试。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptInput
                  onSubmit={(prompt) => void aiTask.submit({ prompt })}
                  loading={aiTask.phase === 'submitting'}
                  disabled={aiTask.isBusy && aiTask.phase !== 'submitting'}
                />
                <div className="grid gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-border bg-muted p-[var(--space-md)]">
                  <p className="font-medium">Mock 状态样例</p>
                  {aiClient.fixtures.map((fixture) => (
                    <div key={fixture.id} className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <code>{fixture.id}</code>
                        <TaskStatus
                          task={{
                            id: fixture.id,
                            input: { prompt: '' },
                            status: fixture.status as
                              'queued' | 'running' | 'completed',
                            progress: fixture.progress,
                          }}
                        />
                      </div>
                      {fixture.status === 'running' && (
                        <TaskProgress
                          task={{
                            id: fixture.id,
                            input: { prompt: '' },
                            status: 'running',
                            progress: fixture.progress,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>任务状态</CardTitle>
                <CardDescription>
                  业务页面只消费任务状态，不直接处理轮询细节。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span>当前状态</span>
                  <TaskStatus task={aiTask.task} />
                </div>
                <TaskProgress task={aiTask.task} />
                {aiTask.message && (
                  <p
                    role="alert"
                    className="text-sm leading-normal text-destructive"
                  >
                    {aiTask.message}
                  </p>
                )}
                {aiTask.task?.error && (
                  <p
                    role="alert"
                    className="text-sm leading-normal text-destructive"
                  >
                    {aiTask.task.error}
                  </p>
                )}
                {aiTask.task?.result && (
                  <div className="grid gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-border bg-accent p-[var(--space-md)] text-accent-foreground">
                    <p className="m-0 font-semibold">
                      {aiTask.task.result.title}
                    </p>
                    <p className="m-0 leading-normal">
                      {aiTask.task.result.summary}
                    </p>
                  </div>
                )}
                <TaskActions
                  state={aiTask}
                  onCancel={() => void aiTask.cancel()}
                  onRetry={() => void aiTask.retry()}
                />
              </CardContent>
            </Card>
          </div>
        </DemoSection>

        <DemoSection
          title="AI 对话能力"
          note="会话列表、欢迎态、快捷提示、思考中、流式输出、取消、失败和重试"
        >
          <AiChatWorkbench client={aiChatClient} />
        </DemoSection>

        <DemoSection
          title="视频能力"
          note="播放、暂停、跳转、音量、全屏、字幕和媒体错误"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>视频播放器</CardTitle>
                <CardDescription>
                  使用浏览器原生 video，控制栏按钮和进度条支持键盘与触控。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer source={demoVideoSource} title="视频能力示例" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>海报与错误状态</CardTitle>
                <CardDescription>
                  资源不存在时显示可重试的媒体错误，海报可独立复用。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VideoPoster src="/mock/media/poster.svg" alt="示例视频封面" />
                <Button
                  variant="outline"
                  onClick={() => setShowVideoError((visible) => !visible)}
                >
                  {showVideoError ? '隐藏媒体错误' : '演示媒体错误'}
                </Button>
                {showVideoError && (
                  <VideoPlayer
                    source={brokenVideoSource}
                    title="错误视频示例"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </DemoSection>

        <DemoSection title="音频能力" note="播放、暂停、跳转、音量和媒体错误">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>音频播放器</CardTitle>
                <CardDescription>
                  本地 WAV 样例；支持键盘和触控操作。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AudioPlayer
                  source={{ src: '/mock/media/sample.wav', type: 'audio/wav' }}
                  title="音频能力示例"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>错误状态</CardTitle>
                <CardDescription>资源加载失败时可重试。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAudioError((visible) => !visible)}
                >
                  {showAudioError ? '隐藏音频错误' : '演示音频错误'}
                </Button>
                {showAudioError && (
                  <AudioPlayer
                    source={{
                      src: '/mock/media/not-found.wav',
                      type: 'audio/wav',
                    }}
                    title="错误音频示例"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </DemoSection>

        {isMock && (
          <DemoSection
            title="完整 Mock 示例流程"
            note="文件选择 → 上传 → AI 任务 → 状态轮询 → 媒体预览；包含取消、失败与重试"
          >
            <MockWorkflowDemo />
          </DemoSection>
        )}

        <DemoSection title="设计变量">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((swatch) => (
              <div
                key={swatch.variable}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div
                  aria-hidden="true"
                  className="h-16 rounded-md border border-border"
                  style={{ backgroundColor: `var(--${swatch.variable})` }}
                />
                <p className="mt-3 text-sm font-medium">{swatch.name}</p>
                <code className="text-xs text-muted-foreground">
                  --{swatch.variable}
                </code>
              </div>
            ))}
          </div>
        </DemoSection>
        <DemoSection title="JSON Mock">
          {!isMock ? (
            <p className="text-muted-foreground">
              当前为真实接口模式。运行 <code>pnpm dev:mock</code> 可加载本地
              JSON 数据。
            </p>
          ) : fixtures.isPending ? (
            <p role="status">正在加载 Mock 数据…</p>
          ) : fixtures.isError ? (
            <p role="alert" className="text-destructive">
              Mock 数据加载失败：{fixtures.error.message}
            </p>
          ) : (
            <Card>
              <CardContent>
                <p className="font-medium">状态：{fixtures.data.status}</p>
                <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
                  {fixtures.data.examples.map((item) => (
                    <li key={item.id}>{item.label}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </DemoSection>
      </main>
    </div>
  )
}
