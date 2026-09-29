import { useEffect, useState } from 'react'
import {
  Alert,
  Affix,
  Anchor,
  Avatar,
  AutoComplete,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  Calendar,
  Checkbox,
  Carousel,
  Collapse,
  Cascader,
  ColorPicker,
  DatePicker,
  Descriptions,
  Dialog,
  Divider,
  Dropdown,
  FloatButton,
  Form,
  FormField,
  FormItem,
  Grid,
  Icon,
  Image,
  Input,
  InputOTP,
  InputNumber,
  Layout,
  Masonry,
  PasswordInput,
  SearchInput,
  Menu,
  Mentions,
  Popconfirm,
  Popover,
  Progress,
  RadioGroup,
  Result,
  Rate,
  Select,
  Segmented,
  Sheet,
  Skeleton,
  Splitter,
  Spin,
  Spinner,
  Space,
  Stack,
  Steps,
  Slider,
  Statistic,
  Switch,
  Tag,
  ThemeScope,
  Timeline,
  TimePicker,
  Tree,
  TreeSelect,
  Transfer,
  Tooltip,
  Typography,
  Upload,
  Watermark,
  notification,
  toast,
} from '@/shared/ui'

const teamTreeData = [
  {
    value: 'product',
    label: '产品团队',
    children: [
      { value: 'design', label: '设计组' },
      { value: 'research', label: '用户研究组' },
    ],
  },
  { value: 'engineering', label: '研发团队' },
]

const transferItems = [
  { key: 'design', title: '设计规范', description: '组件与主题' },
  { key: 'video', title: '视频预览', description: '播放与字幕' },
  { key: 'audio', title: '音频预览', description: '播放与进度' },
  { key: 'analysis', title: '数据分析', description: '图表和报表' },
  { key: 'archived', title: '归档模块', disabled: true },
]

const masonryHeights = ['h-24', 'h-36', 'h-28', 'h-44', 'h-32', 'h-40']
const demoWatermarkImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64" viewBox="0 0 120 64"><circle cx="60" cy="32" r="27" fill="none" stroke="#334155" stroke-width="4"/><text x="60" y="38" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#334155">DEMO</text></svg>',
)}`

export function DesignSystemPreview() {
  const [checked, setChecked] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [choice, setChoice] = useState('a')
  const [segmentedValue, setSegmentedValue] = useState('list')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<'default' | 'compact'>('default')
  const [step, setStep] = useState(1)
  const [volume, setVolume] = useState(42)
  const [colorValue, setColorValue] = useState('#4338ca')
  const [formStatus, setFormStatus] = useState('尚未提交')
  const [searchStatus, setSearchStatus] = useState('尚未搜索')
  const [mentionsValue, setMentionsValue] = useState('')
  const [mentionsStatus, setMentionsStatus] = useState('尚未选择成员')
  const [splitSizes, setSplitSizes] = useState([60, 40])
  const [splitStatus, setSplitStatus] = useState('尚未调整')
  const [layoutStatus, setLayoutStatus] = useState('可折叠侧边栏')
  const [calendarStatus, setCalendarStatus] = useState('尚未选择日期')
  const [otpValue, setOtpValue] = useState('')
  const [otpComplete, setOtpComplete] = useState(false)
  const [treeSelected, setTreeSelected] = useState('button')
  const [treeExpanded, setTreeExpanded] = useState(['components'])
  const [carouselAutoplay, setCarouselAutoplay] = useState(false)
  const [menuExpanded, setMenuExpanded] = useState<string[]>([])
  const [transferDisabled, setTransferDisabled] = useState(false)
  const [masonryCount, setMasonryCount] = useState(7)
  const [regionLoading, setRegionLoading] = useState(true)
  const [fullscreenLoading, setFullscreenLoading] = useState(false)
  const [watermarkImage, setWatermarkImage] = useState(false)

  useEffect(() => {
    if (!fullscreenLoading) return
    const timeout = window.setTimeout(() => setFullscreenLoading(false), 1400)
    return () => window.clearTimeout(timeout)
  }, [fullscreenLoading])

  return (
    <section className="space-y-4" aria-label="设计系统补充组件">
      <div>
        <h2 className="text-xl font-semibold">设计系统补充组件</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          浅色、深色、紧凑和局部主题；原生表单控件支持键盘与触控。
        </p>
      </div>
      <Stack direction="row" wrap gap="sm" align="center">
        <Button
          variant="outline"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          切换预览主题
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setDensity(density === 'default' ? 'compact' : 'default')
          }
        >
          切换预览密度
        </Button>
        <Typography as="span" variant="caption" tone="muted">
          当前：{mode === 'light' ? '浅色' : '深色'} ·{' '}
          {density === 'default' ? '常规' : '紧凑'}
        </Typography>
      </Stack>
      <ThemeScope
        mode={mode}
        density={density}
        className="rounded-xl border border-border p-4 sm:p-6"
      >
        <Grid minItemWidth="17rem" gap="lg">
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  通用与布局
                </Typography>
                <Typography>
                  正文、
                  <Typography as="span" tone="muted">
                    次要文字
                  </Typography>
                  与语义标题。
                </Typography>
                <Stack direction="row" align="center" gap="sm" wrap>
                  <Icon name="info" label="信息" />
                  <Tag>默认</Tag>
                  <Tag tone="success">成功</Tag>
                  <Tag tone="warning">警告</Tag>
                  <Tag tone="error">错误</Tag>
                  <Badge count={3}>
                    <Button size="icon" variant="outline" aria-label="通知">
                      <Icon name="info" />
                    </Button>
                  </Badge>
                  <Badge count={3} tone="success" label="3 条成功通知">
                    <Button size="icon" variant="outline" aria-label="成功通知">
                      <Icon name="check" />
                    </Button>
                  </Badge>
                  <Badge count={2} tone="warning" label="2 条提醒">
                    <Button size="icon" variant="outline" aria-label="提醒">
                      <Icon name="warning" />
                    </Button>
                  </Badge>
                  <Badge count={1} tone="error" label="1 条错误通知">
                    <Button size="icon" variant="outline" aria-label="错误通知">
                      <Icon name="warning" />
                    </Button>
                  </Badge>
                </Stack>
                <Divider />
                <Typography variant="caption" tone="muted">
                  Grid 根据可用宽度自动换列。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  分隔面板
                </Typography>
                <Splitter
                  label="工作区分隔面板"
                  sizes={splitSizes}
                  defaultSizes={[60, 40]}
                  onResize={setSplitSizes}
                  onResizeEnd={(next) =>
                    setSplitStatus(
                      `已调整：${Math.round(next[0])}% / ${Math.round(next[1])}%`,
                    )
                  }
                  panels={[
                    {
                      key: 'nav',
                      label: '导航区',
                      minSize: 20,
                      maxSize: 80,
                      collapsible: true,
                      className: 'bg-muted/40',
                      content: <div className="p-3">导航区</div>,
                    },
                    {
                      key: 'detail',
                      label: '内容区',
                      minSize: 20,
                      content: <div className="p-3">内容区</div>,
                    },
                  ]}
                />
                <Typography variant="caption" tone="muted">
                  {splitStatus}；双击分隔条可恢复默认比例。
                </Typography>
                <Splitter
                  label="不可用的垂直分隔面板"
                  orientation="vertical"
                  disabled
                  className="h-36"
                  panels={[
                    {
                      key: 'top',
                      label: '顶部',
                      content: <div className="p-2">顶部</div>,
                    },
                    {
                      key: 'bottom',
                      label: '底部',
                      content: <div className="p-2">底部</div>,
                    },
                  ]}
                />
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  页面布局
                </Typography>
                <Layout className="h-64 overflow-hidden rounded-xl border border-border">
                  <Layout.Header className="min-h-12 px-3">
                    工作台页头
                  </Layout.Header>
                  <Layout className="flex-1">
                    <Layout.Sider
                      label="示例导航"
                      width={120}
                      collapsedWidth={0}
                      breakpoint="md"
                      collapsible
                      onCollapse={(collapsed, source) =>
                        setLayoutStatus(
                          `${source === 'breakpoint' ? '断点' : '按钮'}：${collapsed ? '已收起' : '已展开'}`,
                        )
                      }
                    >
                      <nav aria-label="示例导航菜单" className="grid gap-2 p-3">
                        <a
                          href="#preview-result"
                          className="text-primary underline"
                        >
                          概览
                        </a>
                        <a
                          href="#preview-timeline"
                          className="text-primary underline"
                        >
                          活动
                        </a>
                      </nav>
                    </Layout.Sider>
                    <Layout.Content as="div" className="p-4">
                      内容区会随侧边栏自动伸缩。
                    </Layout.Content>
                  </Layout>
                  <Layout.Footer className="px-3 py-2">
                    工作台页脚
                  </Layout.Footer>
                </Layout>
                <Typography variant="caption" tone="muted">
                  {layoutStatus}；窄屏使用可关闭的导航面板。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="sm">
                <Typography as="h3" variant="title">
                  数据录入
                </Typography>
                <FormField
                  required
                  description="提交前需要同意通知。"
                  error={checked ? undefined : '请同意更新通知'}
                  control={
                    <Checkbox
                      label="同意更新通知"
                      checked={checked}
                      onChange={(event) => setChecked(event.target.checked)}
                    />
                  }
                />
                <Checkbox label="不可用复选框" disabled />
                <FormField
                  required
                  error={choice === 'a' ? '请选择网格展示以继续' : undefined}
                  control={
                    <RadioGroup
                      label="展示方式"
                      value={choice}
                      onValueChange={setChoice}
                      options={[
                        { value: 'a', label: '列表' },
                        { value: 'b', label: '网格' },
                        { value: 'c', label: '不可用', disabled: true },
                      ]}
                    />
                  }
                />
                <FormField
                  error={enabled ? undefined : '请启用提醒'}
                  control={
                    <Switch
                      label="启用提醒"
                      checked={enabled}
                      onChange={(event) => setEnabled(event.target.checked)}
                    />
                  }
                />
                <Switch label="不可用开关" disabled />
                <FormField
                  label="满意度"
                  description="可点击当前评分清除选择。"
                  control={
                    <Rate
                      defaultValue={3}
                      tooltips={['很差', '较差', '一般', '满意', '非常满意']}
                    />
                  }
                />
                <FormField
                  label="主题色"
                  description="原生颜色选择器；值统一为六位小写 hex。"
                  control={
                    <ColorPicker
                      value={colorValue}
                      onChange={setColorValue}
                      showText
                    />
                  }
                />
                <Segmented
                  aria-label="数据视图"
                  value={segmentedValue}
                  onChange={setSegmentedValue}
                  block
                  options={[
                    { value: 'list', label: '紧凑列表' },
                    { value: 'grid', label: '宽卡片' },
                    { value: 'disabled', label: '不可用', disabled: true },
                  ]}
                />
                <InputOTP
                  label="一次性验证码"
                  value={otpValue}
                  onChange={(nextValue) => {
                    setOtpValue(nextValue)
                    setOtpComplete(false)
                  }}
                  onComplete={() => setOtpComplete(true)}
                />
                <Typography variant="caption" tone="muted">
                  {otpComplete
                    ? '验证码已填写完整'
                    : `已填写 ${otpValue.length} / 6 位`}
                </Typography>
                <InputOTP
                  label="不可用验证码"
                  length={4}
                  defaultValue="12"
                  disabled
                />
                <InputOTP
                  label="错误验证码"
                  length={4}
                  defaultValue="12"
                  invalid
                />
                <FormField
                  label="搜索组件"
                  control={
                    <SearchInput
                      defaultValue="按钮"
                      allowClear
                      onSearch={(query) =>
                        setSearchStatus(`已搜索：${query || '空查询'}`)
                      }
                    />
                  }
                />
                <Typography variant="caption" tone="muted">
                  {searchStatus}
                </Typography>
                <FormField
                  label="提及成员"
                  description="输入 @ 后可用方向键、Enter 或触控选择成员。"
                  control={
                    <Mentions
                      value={mentionsValue}
                      onChange={setMentionsValue}
                      onSelect={(option) =>
                        setMentionsStatus(`已选择：${option.label}`)
                      }
                      options={[
                        { value: 'design', label: '设计团队' },
                        { value: 'developer', label: '开发团队' },
                        { value: 'ops', label: '运营团队', disabled: true },
                      ]}
                      placeholder="输入 @ 提及成员"
                    />
                  }
                />
                <Typography variant="caption" tone="muted">
                  {mentionsStatus}
                </Typography>
                <FormField
                  label="错误提及"
                  error="请选择有效成员"
                  control={<Mentions options={[]} defaultValue="@missing" />}
                />
                <Mentions
                  aria-label="不可用提及"
                  options={[]}
                  value="不可编辑"
                  disabled
                />
                <SearchInput
                  aria-label="加载中的搜索"
                  defaultValue="卡片"
                  loading
                />
                <FormField
                  label="登录密码"
                  control={
                    <PasswordInput
                      defaultValue="example-123"
                      autoComplete="current-password"
                    />
                  }
                />
                <FormField
                  label="错误密码"
                  error="密码不符合要求"
                  control={<PasswordInput defaultValue="short" />}
                />
                <PasswordInput
                  aria-label="不可用密码"
                  value="disabled"
                  disabled
                  readOnly
                />
                <Form
                  initialValues={{ email: '', view: 'list' }}
                  onFinish={(values) =>
                    setFormStatus(`已提交：${String(values.email)}`)
                  }
                  onFinishFailed={() => setFormStatus('请修正表单错误')}
                >
                  <FormItem
                    name="email"
                    label="联系邮箱"
                    rules={[
                      { required: true, message: '请输入联系邮箱' },
                      {
                        validator: (value) =>
                          typeof value === 'string' && value.includes('@')
                            ? undefined
                            : '请输入有效邮箱',
                      },
                    ]}
                    control={<Input placeholder="name@example.com" />}
                  />
                  <FormItem
                    name="view"
                    label="表单视图"
                    trigger="onValueChange"
                    rules={[{ required: true, message: '请选择表单视图' }]}
                    control={
                      <Select
                        options={[
                          { value: 'list', label: '列表' },
                          { value: 'grid', label: '网格' },
                        ]}
                      />
                    }
                  />
                  <Stack direction="row" align="center" wrap gap="sm">
                    <Button type="submit" size="small">
                      提交表单
                    </Button>
                    <Typography variant="caption" tone="muted">
                      {formStatus}
                    </Typography>
                  </Stack>
                </Form>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  日历
                </Typography>
                <Calendar
                  label="活动日历"
                  onChange={(date) => setCalendarStatus(`已选择：${date}`)}
                  disabledDate={(date) => {
                    const day = new Date(`${date}T12:00:00`).getDay()
                    return day === 0 || day === 6
                  }}
                  renderDate={(date) =>
                    date.endsWith('-15') ? (
                      <span className="text-xs leading-none">发布</span>
                    ) : null
                  }
                  getDateDescription={(date) =>
                    date.endsWith('-15') ? '发布日' : undefined
                  }
                />
                <Typography variant="caption" tone="muted">
                  {calendarStatus}；周末不可选择。
                </Typography>
                <Calendar label="不可用日历" size="small" disabled />
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  展示与加载
                </Typography>
                <Image
                  src="/mock/media/poster.svg"
                  alt="示例封面"
                  width={240}
                  height={135}
                />
                <Image
                  src="data:image/png;base64,broken"
                  alt="加载失败的示例图片"
                  fallback="图片加载失败"
                  width={240}
                  height={60}
                />
                <Skeleton width="80%" label="标题正在加载" />
                <Skeleton shape="block" height={48} label="内容正在加载" />
                <Stack direction="row" align="center" gap="sm">
                  <Spinner label="正在处理" />
                  <Typography variant="caption">处理中</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="sm">
                <Typography as="h3" variant="title">
                  状态反馈
                </Typography>
                <Alert title="信息" description="展示当前状态。" />
                <Alert tone="success" title="已完成" />
                <Alert tone="warning" title="需要检查" />
                <Alert
                  tone="error"
                  title="操作失败"
                  action={
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast({ title: '已重试', variant: 'success' })
                      }
                    >
                      重试
                    </Button>
                  }
                />
                <FormField
                  label="局部选择"
                  control={
                    <Select
                      options={[
                        { value: 'one', label: '选项一' },
                        { value: 'two', label: '选项二' },
                      ]}
                    />
                  }
                />
                <FormField
                  label="开始日期"
                  control={<DatePicker aria-label="开始日期" />}
                />
                <FormField
                  label="开始时间"
                  control={<TimePicker aria-label="开始时间" />}
                />
                <FormField
                  label="城市"
                  control={
                    <AutoComplete
                      aria-label="城市"
                      options={[{ value: '上海' }, { value: '北京' }]}
                    />
                  }
                />
                <FormField
                  label="地区"
                  control={
                    <Cascader
                      label="地区"
                      options={[
                        {
                          value: 'cn',
                          label: '中国',
                          children: [{ value: 'sh', label: '上海' }],
                        },
                      ]}
                    />
                  }
                />
                <FormField
                  label="团队选择"
                  description="可搜索折叠分支；方向键浏览，Enter 选择。"
                  control={
                    <TreeSelect
                      label="团队选择"
                      showSearch
                      allowClear
                      treeData={teamTreeData}
                    />
                  }
                />
                <TreeSelect
                  label="多选团队"
                  multiple
                  allowClear
                  defaultValue={['design']}
                  defaultExpandedValues={['product']}
                  treeData={teamTreeData}
                />
                <TreeSelect
                  label="不可用团队选择"
                  disabled
                  treeData={[{ value: 'disabled', label: '不可用' }]}
                />
                <Upload accept="image/*" label="上传图片" />
                <Stack direction="row" wrap gap="sm">
                  <Dialog
                    title="局部对话框"
                    trigger={<Button variant="outline">打开局部对话框</Button>}
                  >
                    <Typography>弹层继承当前主题。</Typography>
                  </Dialog>
                  <Sheet
                    title="局部面板"
                    trigger={<Button variant="outline">打开局部面板</Button>}
                  >
                    <Typography>面板继承当前主题。</Typography>
                  </Sheet>
                </Stack>
                <Stack direction="row" wrap gap="sm" align="center">
                  <Dropdown
                    trigger={<Button variant="outline">打开菜单</Button>}
                    items={[
                      {
                        key: 'copy',
                        label: '复制内容',
                        onSelect: () => toast({ title: '已复制' }),
                      },
                      { key: 'delete', label: '删除内容', danger: true },
                    ]}
                  />
                  <Popover
                    title="补充说明"
                    content="必要信息会直接展示，这里用于可选上下文。"
                  >
                    <Button variant="outline">查看说明</Button>
                  </Popover>
                  <Tooltip title="这是可选的上下文提示">
                    <Button size="small" variant="ghost">
                      悬停或聚焦提示
                    </Button>
                  </Tooltip>
                  <Popconfirm
                    title="确认删除？"
                    description="删除后无法恢复。"
                    onConfirm={() => {
                      toast({ title: '已确认删除', variant: 'success' })
                    }}
                  >
                    <Button variant="destructive">确认操作</Button>
                  </Popconfirm>
                  <Button
                    variant="outline"
                    onClick={() =>
                      notification.success({
                        message: '通知已发送',
                        description: 'Message-shaped notification API。',
                      })
                    }
                  >
                    通知示例
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  导航、进度与结果
                </Typography>
                <Breadcrumb
                  items={[
                    { title: '工作台' },
                    { title: '组件库' },
                    { title: '当前页' },
                  ]}
                />
                <Affix offsetTop={8}>
                  <Menu
                    expandedKeys={menuExpanded}
                    onExpand={setMenuExpanded}
                    items={[
                      { key: 'overview', label: '概览' },
                      {
                        key: 'settings',
                        label: '设置',
                        children: [{ key: 'theme', label: '主题' }],
                      },
                    ]}
                  />
                </Affix>
                <Anchor
                  activeHref="#preview-result"
                  links={[
                    { href: '#preview-result', title: '结果' },
                    { href: '#preview-timeline', title: '时间线' },
                  ]}
                />
                <Button
                  variant="outline"
                  disabled={carouselAutoplay}
                  onClick={() => setCarouselAutoplay(true)}
                >
                  启用自动轮播
                </Button>
                <Carousel
                  items={[
                    <Typography key="one">第一张预览</Typography>,
                    <Typography key="two">第二张预览</Typography>,
                  ]}
                  autoplay={carouselAutoplay}
                  interval={2000}
                />
                <Steps
                  current={step}
                  onChange={setStep}
                  items={[
                    { title: '准备' },
                    { title: '处理中' },
                    { title: '完成' },
                  ]}
                />
                <Progress
                  percent={step === 2 ? 100 : step * 50}
                  status={step === 2 ? 'success' : 'active'}
                />
                <Space wrap size="small">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setStep(0)}
                  >
                    重置步骤
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    标记完成
                  </Button>
                  <Avatar label="团队成员">A</Avatar>
                  <Avatar label="方形头像" shape="square" size="small">
                    B
                  </Avatar>
                </Space>
                <Descriptions
                  column={2}
                  bordered
                  items={[
                    { key: 'owner', label: '负责人', children: '团队 A' },
                    {
                      key: 'status',
                      label: '状态',
                      children: step === 2 ? '已完成' : '进行中',
                    },
                  ]}
                />
                <Stack direction="row" wrap gap="lg" align="center">
                  <FormField
                    label="数量"
                    control={
                      <InputNumber
                        aria-label="数量"
                        min={0}
                        max={99}
                        defaultValue={3}
                        suffix="项"
                      />
                    }
                  />
                  <FormField
                    label="音量"
                    control={
                      <Slider
                        aria-label="音量"
                        value={volume}
                        onChange={setVolume}
                      />
                    }
                  />
                  <Statistic title="完成率" value={volume} suffix="%" />
                </Stack>
                <div id="preview-timeline">
                  <Timeline
                    items={[
                      {
                        key: 'submitted',
                        title: '已提交',
                        children: '刚刚',
                        color: 'success',
                      },
                      {
                        key: 'processing',
                        title: '处理中',
                        children: '等待结果',
                        color: 'primary',
                      },
                    ]}
                  />
                </div>
                <Collapse
                  defaultActiveKey={['notes']}
                  items={[
                    {
                      key: 'notes',
                      label: '实现说明',
                      children:
                        '导航和反馈组件使用同一套语义 Token，并在窄屏保持可滚动或单列布局。',
                    },
                  ]}
                />
                <div id="preview-result">
                  <Result
                    status={step === 2 ? 'success' : 'info'}
                    title={step === 2 ? '流程已完成' : '流程进行中'}
                    subTitle="点击步骤或按钮检查受控状态。"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setTreeExpanded(treeExpanded.length ? [] : ['components'])
                  }
                >
                  切换树展开
                </Button>
                <Tree
                  treeData={[
                    {
                      key: 'components',
                      title: '组件',
                      children: [
                        { key: 'button', title: 'Button' },
                        { key: 'input', title: 'Input' },
                      ],
                    },
                  ]}
                  expandedKeys={treeExpanded}
                  onExpand={setTreeExpanded}
                  selectedKey={treeSelected}
                  onSelect={setTreeSelected}
                />
                <Typography as="p" variant="caption" tone="muted">
                  当前树节点：{treeSelected}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    双栏穿梭框
                  </Typography>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setTransferDisabled((current) => !current)}
                  >
                    {transferDisabled ? '启用穿梭框' : '禁用穿梭框'}
                  </Button>
                </Stack>
                <Transfer
                  label="模块分配"
                  items={transferItems}
                  defaultTargetKeys={['analysis']}
                  titles={['可用模块', '已启用模块']}
                  showSearch
                  disabled={transferDisabled}
                />
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    响应式瀑布流
                  </Typography>
                  <Stack direction="row" gap="sm">
                    <Button
                      variant="outline"
                      size="small"
                      disabled={masonryCount <= 1}
                      onClick={() => setMasonryCount((count) => count - 1)}
                    >
                      删除卡片
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setMasonryCount((count) => count + 1)}
                    >
                      添加卡片
                    </Button>
                  </Stack>
                </Stack>
                <Masonry
                  aria-label="瀑布流卡片"
                  columns={{ base: 2, md: 3, lg: 4 }}
                  gap={12}
                  items={Array.from({ length: masonryCount }, (_, index) => ({
                    key: `card-${index + 1}`,
                    content: (
                      <div
                        className={`flex ${masonryHeights[index % masonryHeights.length]} items-center justify-center rounded-lg border border-border bg-muted/40 p-3 text-card-foreground`}
                      >
                        卡片 {index + 1}
                      </div>
                    ),
                  }))}
                />
                <Typography variant="caption" tone="muted">
                  容器宽度决定列数；新增或移除不同高度卡片后自动重新排布。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  区域与全屏加载
                </Typography>
                <Spin
                  spinning={regionLoading}
                  delay={250}
                  tip="正在加载卡片"
                  label="卡片加载中"
                >
                  <div className="min-h-36 rounded-lg border border-border bg-muted/40 p-4">
                    这一区域加载时暂不可操作。
                    <Button className="mt-3" variant="outline" size="small">
                      区域内操作
                    </Button>
                  </div>
                </Spin>
                <Stack direction="row" gap="sm" wrap>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setRegionLoading((current) => !current)}
                  >
                    {regionLoading ? '结束区域加载' : '开始区域加载'}
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setFullscreenLoading(true)}
                  >
                    演示全屏加载
                  </Button>
                </Stack>
                <Spin
                  fullscreen
                  spinning={fullscreenLoading}
                  label="页面加载中"
                />
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    内容水印
                  </Typography>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setWatermarkImage((current) => !current)}
                  >
                    {watermarkImage ? '显示文字水印' : '显示图片水印'}
                  </Button>
                </Stack>
                <Watermark
                  role="group"
                  aria-label="水印示例"
                  content={['仅供预览', '示例内容']}
                  image={watermarkImage ? demoWatermarkImage : undefined}
                  className="rounded-lg border border-border bg-muted/30"
                >
                  <div className="space-y-3 p-6">
                    <Typography>
                      水印覆盖内容区域，下面的操作仍可通过键盘和触控使用。
                    </Typography>
                    <Button variant="outline" size="small">
                      水印内操作
                    </Button>
                  </div>
                </Watermark>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </ThemeScope>
      <FloatButton
        label="回到顶部"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        ↑
      </FloatButton>
      <ThemeScope
        mode={mode === 'light' ? 'dark' : 'light'}
        density="compact"
        tokens={{
          primary: mode === 'light' ? '#5eead4' : '#0f766e',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#fb7185',
          components: {
            button: { radius: '999px', height: '48px' },
            field: { height: '48px' },
            card: { radius: '1rem' },
            overlay: { radius: '1.25rem' },
            menu: { radius: '0.75rem' },
          },
        }}
        className="rounded-xl border border-border p-4"
      >
        <Stack direction="row" align="center" wrap gap="sm">
          <Typography as="span" variant="caption">
            局部反色与品牌主题
          </Typography>
          <Button
            size="small"
            onClick={() => toast({ title: '品牌主题操作已点击' })}
          >
            主要操作
          </Button>
          <Tag
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
            }}
          >
            派生高亮
          </Tag>
          <Tag tone="success">正常</Tag>
          <Tag tone="warning">提醒</Tag>
          <Tag tone="error">异常</Tag>
          <Button variant="destructive">局部危险操作</Button>
          <Badge count={3} tone="success" label="3 条成功通知">
            <Button size="icon" variant="outline" aria-label="局部成功通知">
              <Icon name="check" />
            </Button>
          </Badge>
          <Badge count={2} tone="warning" label="2 条提醒">
            <Button size="icon" variant="outline" aria-label="局部提醒">
              <Icon name="warning" />
            </Button>
          </Badge>
          <Badge count={1} tone="error" label="1 条错误通知">
            <Button size="icon" variant="outline" aria-label="局部错误通知">
              <Icon name="warning" />
            </Button>
          </Badge>
        </Stack>
        <ThemeScope
          density="default"
          className="mt-4 rounded-xl border border-border p-4"
        >
          <Stack gap="sm">
            <Typography as="span" variant="caption">
              嵌套主题继承
            </Typography>
            <Button>继承按钮</Button>
            <Input aria-label="继承输入" placeholder="继承输入" />
            <Card>
              <CardContent>继承卡片</CardContent>
            </Card>
            <Dialog
              title="组件 Token 对话框"
              trigger={<Button variant="outline">打开组件 Token 对话框</Button>}
            >
              <Typography>Overlay Token 继承成功。</Typography>
            </Dialog>
            <Dropdown
              trigger={<Button variant="outline">打开组件 Token 菜单</Button>}
              items={[{ key: 'token', label: 'Token 菜单项' }]}
            />
          </Stack>
        </ThemeScope>
      </ThemeScope>
    </section>
  )
}
