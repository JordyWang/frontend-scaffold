import { useEffect, useRef, useState } from 'react'
import { CollapsePreview } from './CollapsePreview'
import { CarouselPreview } from './CarouselPreview'
import { TimelinePreview } from './TimelinePreview'
import { TreePreview } from './TreePreview'
import { TreeAsyncPreview } from './TreeAsyncPreview'
import { TreeVirtualPreview } from './TreeVirtualPreview'
import { TreeDragPreview } from './TreeDragPreview'
import { TreeSelectPreview } from './TreeSelectPreview'
import { TreeSelectAsyncPreview } from './TreeSelectAsyncPreview'
import { CascaderPreview } from './CascaderPreview'
import { DatePickerPreview } from './DatePickerPreview'
import { DateRangePreview } from './DateRangePreview'
import { MultiDatePreview } from './MultiDatePreview'
import { DateUnitPreview } from './DateUnitPreview'
import { DateUnitRangePreview } from './DateUnitRangePreview'
import { TimePickerPreview } from './TimePickerPreview'
import { TimeRangePreview } from './TimeRangePreview'
import { DateTimePreview } from './DateTimePreview'
import { DateTimeRangePreview } from './DateTimeRangePreview'
import { TimeInteractionPreview } from './TimeInteractionPreview'
import { DateInputPreview } from './DateInputPreview'
import { MillisecondTimePreview } from './MillisecondTimePreview'
import { PickerFormatPreview } from './PickerFormatPreview'
import { SliderPreview } from './SliderPreview'
import { ColorPickerPreview } from './ColorPickerPreview'
import { ColorPickerGradientPreview } from './ColorPickerGradientPreview'
import { TypographyPreview } from './TypographyPreview'
import { TabsPreview } from './TabsPreview'
import { TagPreview } from './TagPreview'
import { BadgePreview } from './BadgePreview'
import { TooltipPreview } from './TooltipPreview'
import { DropdownPreview } from './DropdownPreview'
import { ResultPreview } from './ResultPreview'
import {
  Alert,
  Affix,
  Anchor,
  Avatar,
  AvatarGroup,
  AutoComplete,
  BackTop,
  Badge,
  BorderBeam,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardMeta,
  CardGrid,
  CardGridGroup,
  Calendar,
  Checkbox,
  Carousel,
  Collapse,
  Cascader,
  ColorPicker,
  ConfigProvider,
  DatePicker,
  DateRangePicker,
  Descriptions,
  Dialog,
  Divider,
  Dropdown,
  Empty,
  FloatButton,
  FloatButtonGroup,
  Form,
  FormField,
  FormItem,
  Grid,
  Icon,
  Image,
  ImagePreviewGroup,
  Input,
  InputOTP,
  InputNumber,
  Layout,
  Listy,
  Masonry,
  PasswordInput,
  SearchInput,
  Menu,
  Mentions,
  MultiSelect,
  Popconfirm,
  Popover,
  Progress,
  QRCode,
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
  StatisticTimer,
  Switch,
  Table,
  Tag,
  Textarea,
  ThemeScope,
  Timeline,
  TimePicker,
  TimeRangePicker,
  Tour,
  Tree,
  TreeSelect,
  Transfer,
  Tooltip,
  Typography,
  Upload,
  Watermark,
  message,
  notification,
  toast,
  type DateRange,
  type PopoverPlacement,
  type TimeRange,
} from '@/shared/ui'

const popoverPlacements: PopoverPlacement[] = [
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

const virtualListItems = Array.from({ length: 100 }, (_, index) => ({
  id: `virtual-${index + 1}`,
  title: `虚拟列表项目 ${index + 1}`,
  description: index % 2 === 0 ? '可见窗口内渲染' : '滚动后按需渲染',
}))

const masonryHeights = ['h-24', 'h-36', 'h-28', 'h-44', 'h-32', 'h-40']

function ExpandableTourDescription() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="grid gap-2">
      <span>先选择要处理的图片、视频或音频文件。</span>
      <Button
        variant="ghost"
        size="small"
        className="justify-self-start"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? '收起说明' : '展开说明'}
      </Button>
      {expanded && (
        <span>
          可以先核对文件类型与大小，再选择要上传的内容。引导卡片会在说明展开后重新定位，保持操作区域可见。
        </span>
      )}
    </div>
  )
}

const demoWatermarkImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64" viewBox="0 0 120 64"><circle cx="60" cy="32" r="27" fill="none" stroke="#334155" stroke-width="4"/><text x="60" y="38" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#334155">DEMO</text></svg>',
)}`

export function DesignSystemPreview() {
  const [checked, setChecked] = useState(false)
  const [compactStatus, setCompactStatus] = useState('尚未应用输入组合')
  const [showInputSuffix, setShowInputSuffix] = useState(true)
  const [inputClearStatus, setInputClearStatus] = useState('尚未清空金额')
  const [enabled, setEnabled] = useState(true)
  const [choice, setChoice] = useState('a')
  const [segmentedValue, setSegmentedValue] = useState<string | undefined>(
    'list',
  )
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<'default' | 'compact'>('default')
  const [floatTrigger, setFloatTrigger] = useState<
    'click' | 'hover' | 'always'
  >('click')
  const [floatOpen, setFloatOpen] = useState(false)
  const [floatLinkState, setFloatLinkState] = useState<
    'active' | 'disabled' | 'loading'
  >('active')
  const [step, setStep] = useState(1)
  const [uncontrolledStepEvent, setUncontrolledStepEvent] = useState(0)
  const [quantity, setQuantity] = useState<number | undefined>(3)
  const [amount, setAmount] = useState(12.5)
  const [volume, setVolume] = useState(42)
  const [controlledRating, setControlledRating] = useState<number | undefined>(
    3,
  )
  const [statisticLoading, setStatisticLoading] = useState(true)
  const [timerTarget, setTimerTarget] = useState(() => Date.now() + 90_000)
  const [timerStart, setTimerStart] = useState(() => Date.now())
  const [timerStatus, setTimerStatus] = useState('倒计时进行中')
  const [skeletonLoading, setSkeletonLoading] = useState(true)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [avatarRecovered, setAvatarRecovered] = useState(false)
  const [descriptionLayout, setDescriptionLayout] = useState<
    'horizontal' | 'vertical'
  >('horizontal')
  const [descriptionBordered, setDescriptionBordered] = useState(true)
  const [descriptionSize, setDescriptionSize] = useState<
    'default' | 'small' | 'large'
  >('default')
  const [descriptionEdited, setDescriptionEdited] = useState(false)
  const [colorValue, setColorValue] = useState('#1677ff')
  const [dateRange, setDateRange] = useState<DateRange>(['', ''])
  const [timeRange, setTimeRange] = useState<TimeRange>(['', ''])
  const [formStatus, setFormStatus] = useState('尚未提交')
  const [consentStatus, setConsentStatus] = useState('尚未提交')
  const [searchStatus, setSearchStatus] = useState('尚未搜索')
  const [buttonStatus, setButtonStatus] = useState('尚未操作按钮')
  const [smallCardStatus, setSmallCardStatus] = useState('尚未操作')
  const [cardGridStatus, setCardGridStatus] = useState('尚未选择卡片项目')
  const [innerCardStatus, setInnerCardStatus] = useState('尚未操作内层卡片')
  const [emptyStatus, setEmptyStatus] = useState('尚未重置')
  const [badgeStatus, setBadgeStatus] = useState('尚未查看 RTL 通知')
  const [alertKey, setAlertKey] = useState(0)
  const [alertStatus, setAlertStatus] = useState('提示可关闭')
  const [bannerAlertOpen, setBannerAlertOpen] = useState(true)
  const [bannerAlertStatus, setBannerAlertStatus] =
    useState('Banner 提示可关闭')
  const [controlledConfirmOpen, setControlledConfirmOpen] = useState(false)
  const [controlledConfirmStatus, setControlledConfirmStatus] =
    useState('受控确认已关闭')
  const [controlledPopoverOpen, setControlledPopoverOpen] = useState(false)
  const [popoverPlacement, setPopoverPlacement] =
    useState<PopoverPlacement>('bottom-start')
  const [dropdownSelection, setDropdownSelection] = useState<string[]>(['all'])
  const [dropdownSelectionStatus, setDropdownSelectionStatus] =
    useState('已选择：全部')
  const [city, setCity] = useState('')
  const [selectedCity, setSelectedCity] = useState('尚未选择城市')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showShanghaiOption, setShowShanghaiOption] = useState(true)
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
  const [horizontalMenuSelection, setHorizontalMenuSelection] = useState('')
  const [breadcrumbStatus, setBreadcrumbStatus] = useState('路径已折叠')
  const [affixStatus, setAffixStatus] = useState('未固定')
  const [affixBottomStatus, setAffixBottomStatus] = useState('未固定')
  const [transferDisabled, setTransferDisabled] = useState(false)
  const [masonryCount, setMasonryCount] = useState(7)
  const [virtualListState, setVirtualListState] = useState<
    'filled' | 'loading' | 'empty' | 'error'
  >('filled')
  const [virtualListCount, setVirtualListCount] = useState(100)
  const [regionLoading, setRegionLoading] = useState(true)
  const [fullscreenLoading, setFullscreenLoading] = useState(false)
  const [watermarkImage, setWatermarkImage] = useState(false)
  const [qrStatus, setQrStatus] = useState<'active' | 'expired' | 'loading'>(
    'active',
  )
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [tourReturnTarget, setTourReturnTarget] = useState<'start' | 'edge'>(
    'start',
  )
  const [tourTargetClicks, setTourTargetClicks] = useState(0)
  const [tourGuardOpen, setTourGuardOpen] = useState(false)
  const tourGuardCloseRequests = useRef(0)
  const [tourBlockedOpen, setTourBlockedOpen] = useState(false)
  const [rtlPopupContainer, setRtlPopupContainer] =
    useState<HTMLDivElement | null>(null)
  const tourTriggerRef = useRef<HTMLButtonElement>(null)
  const tourEdgeTriggerRef = useRef<HTMLButtonElement>(null)
  const tourGuardTriggerRef = useRef<HTMLButtonElement>(null)
  const tourBlockedTriggerRef = useRef<HTMLButtonElement>(null)
  const anchorScrollRef = useRef<HTMLDivElement>(null)
  const alertRestoreRef = useRef<HTMLButtonElement>(null)
  const affixTargetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fullscreenLoading) return
    const timeout = window.setTimeout(() => setFullscreenLoading(false), 1400)
    return () => window.clearTimeout(timeout)
  }, [fullscreenLoading])

  return (
    <section
      id="design-system"
      className="scroll-mt-6 space-y-5"
      aria-label="设计系统补充组件"
    >
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          设计系统补充组件
        </h2>
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
        <Button
          variant="outline"
          onClick={() => {
            setFloatOpen(false)
            setFloatTrigger(
              floatTrigger === 'click'
                ? 'hover'
                : floatTrigger === 'hover'
                  ? 'always'
                  : 'click',
            )
          }}
        >
          切换浮动菜单触发方式
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setFloatLinkState(
              floatLinkState === 'active'
                ? 'disabled'
                : floatLinkState === 'disabled'
                  ? 'loading'
                  : 'active',
            )
          }
        >
          切换浮动链接状态
        </Button>
        <Typography as="span" variant="caption" tone="muted">
          当前：{mode === 'light' ? '浅色' : '深色'} ·{' '}
          {density === 'default' ? '常规' : '紧凑'} · 浮动菜单
          {floatTrigger === 'click'
            ? '点击'
            : floatTrigger === 'hover'
              ? '悬停'
              : '常驻'}{' '}
          · 浮动链接
          {floatLinkState === 'active'
            ? '可用'
            : floatLinkState === 'disabled'
              ? '禁用'
              : '加载'}
        </Typography>
      </Stack>
      <ThemeScope
        role="group"
        aria-label="组件状态主题预览"
        mode={mode}
        density={density}
        className="rounded-xl border border-border p-4 sm:p-6"
      >
        <div ref={setRtlPopupContainer} data-ui-rtl-popup-root="" />
        <Grid minItemWidth="25rem" gap="lg" className="mx-auto max-w-[70rem]">
          <Card
            id="ds-base"
            className="scroll-mt-6"
            title="按钮扩展"
            extra={<Typography variant="caption">AntD 风格</Typography>}
          >
            <CardContent className="grid gap-3">
              <Button danger shape="round" block>
                危险操作
              </Button>
              <Stack direction="row" gap="sm" wrap>
                <Button shape="round" variant="outline">
                  圆角按钮
                </Button>
                <Button size="icon" shape="circle" aria-label="新增">
                  +
                </Button>
              </Stack>
              <Stack direction="row" gap="sm" wrap>
                <Button
                  danger
                  variant="outline"
                  onClick={() => setButtonStatus('已点击危险描边')}
                >
                  危险描边
                </Button>
                <Button
                  danger
                  variant="ghost"
                  onClick={() => setButtonStatus('已点击危险文字')}
                >
                  危险文字
                </Button>
                <Button
                  loading
                  icon={<Icon name="check" size={16} />}
                  iconPosition="end"
                  aria-busy={false}
                >
                  正在保存
                </Button>
              </Stack>
              <p role="status" className="m-0 text-sm text-muted-foreground">
                {buttonStatus}
              </p>
            </CardContent>
          </Card>
          <Card
            title="声明式卡片"
            extra={
              <Button size="small" variant="ghost">
                更多
              </Button>
            }
            hoverable
            actions={[<Button variant="ghost">打开详情</Button>]}
          >
            <CardContent>标题、额外操作和底部 actions 可直接组合。</CardContent>
          </Card>
          <Card title="小号卡片" size="small">
            <CardContent>
              <p className="m-0">紧凑卡片使用相同的项目 API。</p>
              <p role="status" className="mb-0 text-sm text-muted-foreground">
                {smallCardStatus}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                size="small"
                variant="outline"
                onClick={() => setSmallCardStatus('已执行操作')}
              >
                执行小号卡片操作
              </Button>
            </CardFooter>
          </Card>
          <Card
            title="卡片元信息与网格"
            className="col-span-full"
            classNames={{
              header: 'border-b border-border',
              title: 'text-primary',
              body: 'min-w-0',
            }}
          >
            <CardContent className="grid gap-3">
              <CardMeta
                avatar={<Avatar label="组件维护组">组</Avatar>}
                title="组件目录"
                description="头像、标题和说明跟随卡片宽度换行。"
                headingLevel={4}
                classNames={{ title: 'text-primary' }}
              />
              <p role="status" className="m-0 text-sm text-muted-foreground">
                {cardGridStatus}
              </p>
            </CardContent>
            <CardGridGroup columns={3} aria-label="卡片网格示例">
              <CardGrid>
                <div className="grid gap-2">
                  <strong>基础控件</strong>
                  <p className="m-0 text-sm text-muted-foreground">
                    按钮、输入与空状态。
                  </p>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setCardGridStatus('已打开基础控件')}
                  >
                    打开基础控件
                  </Button>
                </div>
              </CardGrid>
              <CardGrid>
                <div className="grid gap-2">
                  <strong>数据展示</strong>
                  <p className="m-0 text-sm text-muted-foreground">
                    统计、列表与表格。
                  </p>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setCardGridStatus('已打开数据展示')}
                  >
                    打开数据展示
                  </Button>
                </div>
              </CardGrid>
              <CardGrid hoverable={false}>
                <strong>静态说明</strong>
                <p className="m-0 text-sm text-muted-foreground">
                  此项只展示内容，不模拟可点击卡片。
                </p>
              </CardGrid>
            </CardGridGroup>
          </Card>
          <Card
            title="页签卡片"
            size="small"
            tabs={{
              label: '卡片内容页签',
              items: [
                {
                  value: 'overview',
                  label: '概览',
                  content: <p className="m-0">概览内容保留在卡片内。</p>,
                },
                {
                  value: 'history',
                  label: '操作记录',
                  content: <p className="m-0">操作记录支持键盘和触控切换。</p>,
                },
                {
                  value: 'locked',
                  label: '待开放',
                  disabled: true,
                  content: <p className="m-0">尚未开放。</p>,
                },
              ],
            }}
          />
          <div className="col-span-full rounded-lg bg-muted/40 p-3 sm:p-4">
            <Card title="无边框与内嵌卡片" variant="borderless">
              <CardContent className="grid gap-3">
                <p className="m-0 text-sm text-muted-foreground">
                  外层无边框，内层卡片保留独立边界和标题区域。
                </p>
                <Card
                  title="内层信息"
                  appearance="inner"
                  extra={
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setInnerCardStatus('已操作内层卡片')}
                    >
                      查看信息
                    </Button>
                  }
                >
                  <CardContent>
                    <p role="status" className="m-0">
                      {innerCardStatus}
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
          <Card title="空状态">
            <CardContent className="grid gap-3">
              <Empty
                title="暂无匹配结果"
                description="调整筛选条件后重试。"
                action={
                  <Button
                    variant="outline"
                    onClick={() => setEmptyStatus('已重置空状态')}
                  >
                    重置空状态
                  </Button>
                }
              />
              <Empty
                size="small"
                image={<Icon name="search" size={32} />}
                title="暂无可选成员"
              />
              <Empty
                title="自定义图片空状态"
                description={
                  <span>
                    可使用图片地址，并在说明中加入<strong>重点文字</strong>。
                  </span>
                }
                image="/empty-search.svg"
                imageAlt="搜索插图"
                classNames={{ image: 'size-14', title: 'text-primary' }}
              />
              <p role="status" className="m-0 text-sm text-muted-foreground">
                {emptyStatus}
              </p>
            </CardContent>
          </Card>
          <Card id="ds-layout" className="col-span-full scroll-mt-6">
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
                  <Badge count={24} label="24 条独立通知" />
                  <Badge label="已同步" tone="success" />
                </Stack>
                <TagPreview />
                <BadgePreview />
                <Divider />
                <Typography variant="caption" tone="muted">
                  Grid 根据可用宽度自动换列。
                </Typography>
                <Space.Compact aria-label="紧凑操作组">
                  <Button variant="outline">前缀</Button>
                  <Input
                    aria-label="紧凑输入"
                    className="w-40"
                    defaultValue="内容"
                  />
                  <Button>提交</Button>
                </Space.Compact>
                <Space.Compact
                  aria-label="地址输入组合"
                  block
                  className="max-w-[32rem]"
                >
                  <Select
                    aria-label="紧凑协议"
                    className="w-28"
                    defaultValue="https"
                    options={[
                      { value: 'https', label: 'HTTPS' },
                      { value: 'http', label: 'HTTP' },
                    ]}
                  />
                  <Input aria-label="紧凑域名" defaultValue="example.com" />
                  <Button
                    onClick={() => setCompactStatus('已应用地址输入组合')}
                  >
                    应用
                  </Button>
                </Space.Compact>
                <Space.Compact
                  aria-label="金额输入组合"
                  block
                  className="max-w-[32rem]"
                >
                  <Input
                    aria-label="紧凑金额"
                    prefix="¥"
                    suffix="元"
                    defaultValue="100"
                    allowClear
                  />
                  <Button
                    onClick={() => setCompactStatus('已确认金额输入组合')}
                  >
                    确认
                  </Button>
                </Space.Compact>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Space.Compact aria-label="搜索输入组合" block>
                    <Button variant="outline">站内</Button>
                    <SearchInput
                      aria-label="紧凑搜索"
                      defaultValue="组件"
                      onSearch={(value) => setCompactStatus(`已搜索：${value}`)}
                    />
                  </Space.Compact>
                  <Space.Compact aria-label="密码输入组合" block>
                    <PasswordInput
                      aria-label="紧凑密码"
                      defaultValue="secret"
                    />
                    <Button onClick={() => setCompactStatus('已保存紧凑密码')}>
                      保存
                    </Button>
                  </Space.Compact>
                  <Space.Compact
                    aria-label="多行输入组合"
                    direction="vertical"
                    block
                    className="max-w-[20rem]"
                  >
                    <Textarea aria-label="紧凑多行" defaultValue="第一行" />
                    <Button onClick={() => setCompactStatus('已保存紧凑多行')}>
                      保存多行
                    </Button>
                  </Space.Compact>
                </div>
                <Typography as="span" variant="caption" role="status">
                  {compactStatus}
                </Typography>
                <Space.Compact
                  direction="vertical"
                  aria-label="纵向紧凑操作组"
                  className="max-w-48"
                >
                  <Button variant="outline">纵向操作一</Button>
                  <Button variant="outline">纵向操作二</Button>
                </Space.Compact>
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
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
          <Card className="col-span-full">
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
          <Card id="ds-input" className="col-span-full scroll-mt-6">
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
                  label="可清空输入"
                  control={
                    <Input allowClear defaultValue="可用键盘或触控清空" />
                  }
                />
                <FormField
                  label="可清空文本域"
                  control={
                    <Textarea allowClear defaultValue="多行内容也支持清空" />
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="金额前后缀"
                    control={
                      <Input
                        defaultValue="128"
                        prefix="¥"
                        suffix={showInputSuffix ? '元' : null}
                        allowClear
                        onClear={() => setInputClearStatus('金额已清空')}
                      />
                    }
                  />
                  <FormField
                    label="自适应文本域"
                    control={
                      <Textarea
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        defaultValue={'第一行\n第二行'}
                      />
                    }
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setShowInputSuffix((shown) => !shown)}
                  >
                    切换金额后缀
                  </Button>
                  <Typography as="span" variant="caption" role="status">
                    {inputClearStatus}
                  </Typography>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField
                    label="字符上限输入"
                    description="超过 count.max 时提示，不截断内容。"
                    control={
                      <Input
                        allowClear
                        count={{ max: 4 }}
                        defaultValue="内容超过上限"
                      />
                    }
                  />
                  <FormField
                    label="原生长度限制"
                    control={<Input count maxLength={5} defaultValue="任务" />}
                  />
                  <FormField
                    label="自定义字数文本域"
                    control={
                      <Textarea
                        defaultValue="😀😀😀"
                        count={{
                          max: 4,
                          strategy: (value) => Array.from(value).length,
                          render: ({ count, max }) =>
                            `${count} 个字符 / ${max}`,
                        }}
                      />
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="只读输入"
                    control={
                      <Input
                        allowClear
                        readOnly
                        defaultValue="只读内容不可清空"
                      />
                    }
                  />
                  <FormField
                    label="只读文本域"
                    control={
                      <Textarea
                        allowClear
                        readOnly
                        defaultValue="只读多行内容不可清空"
                      />
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="填充输入"
                    control={<Input variant="filled" defaultValue="filled" />}
                  />
                  <FormField
                    label="无边框输入"
                    control={
                      <Input variant="borderless" defaultValue="borderless" />
                    }
                  />
                  <FormField
                    label="下划线警告"
                    control={
                      <Textarea
                        variant="underlined"
                        status="warning"
                        defaultValue="underlined"
                      />
                    }
                  />
                  <FormField
                    label="错误输入"
                    error="请输入有效内容"
                    control={<Input status="error" />}
                  />
                </div>
                <form
                  aria-label="原生表单重置预览"
                  className="grid gap-3 rounded-[var(--radius-md)] border border-border p-4"
                >
                  <FormField
                    label="原生标题"
                    control={<Input defaultValue="默认标题" allowClear />}
                  />
                  <FormField
                    label="原生说明"
                    control={<Textarea defaultValue="默认说明" allowClear />}
                  />
                  <FormField
                    label="原生搜索"
                    control={<SearchInput defaultValue="默认搜索" allowClear />}
                  />
                  <FormField
                    label="原生密码"
                    control={
                      <PasswordInput defaultValue="default-123" allowClear />
                    }
                  />
                  <Button type="reset" variant="outline" size="small">
                    重置原生表单
                  </Button>
                </form>
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
                  label="受控评分"
                  control={
                    <Rate
                      value={controlledRating}
                      onChange={setControlledRating}
                    />
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setControlledRating(undefined)}
                  >
                    清空受控评分
                  </Button>
                  <span role="status">
                    当前评分：
                    {controlledRating === undefined ? '无' : controlledRating}
                  </span>
                </div>
                <FormField
                  label="主题色"
                  description="项目颜色面板；不透明值输出六位 Hex，透明值输出八位 Hex。"
                  control={
                    <ColorPicker
                      value={colorValue}
                      onChange={setColorValue}
                      showText
                    />
                  }
                />
                <Stack direction="row" wrap gap="md" align="center">
                  <ColorPicker
                    label="不可用颜色"
                    defaultValue="#1677ff"
                    disabled
                    showText
                  />
                  <FormField
                    label="错误颜色"
                    error="请选择有效颜色"
                    control={<ColorPicker defaultValue="#b91c1c" />}
                  />
                  <Rate aria-label="十星评分" count={10} defaultValue={7} />
                  <Rate aria-label="不可用评分" defaultValue={3} disabled />
                </Stack>
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setSegmentedValue(undefined)}
                  >
                    清空数据视图
                  </Button>
                  <span role="status">
                    当前视图：{segmentedValue ?? '未选择'}
                  </span>
                </div>
                <Segmented
                  aria-label="不可用数据视图"
                  disabled
                  options={[
                    { value: 'list', label: '列表' },
                    { value: 'grid', label: '网格' },
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
                <div
                  role="group"
                  aria-label="搜索与密码输入外观"
                  className="grid min-w-0 gap-3 sm:grid-cols-2"
                >
                  <FormField
                    label="填充警告搜索"
                    description="前后缀、字数提示和清空使用相同输入约定。"
                    control={
                      <SearchInput
                        variant="filled"
                        status="warning"
                        prefix="站内"
                        suffix="项"
                        count={{ max: 4 }}
                        defaultValue="组件"
                        allowClear
                      />
                    }
                  />
                  <FormField
                    label="下划线密码"
                    control={
                      <PasswordInput
                        variant="underlined"
                        count={{ max: 12 }}
                        defaultValue="demo-123"
                        allowClear
                        autoComplete="off"
                      />
                    }
                  />
                  <FormField
                    label="错误搜索状态"
                    error="请输入有效关键词"
                    control={<SearchInput status="error" defaultValue="?" />}
                  />
                  <FormField
                    label="只读密码状态"
                    control={
                      <PasswordInput
                        variant="borderless"
                        defaultValue="read-only"
                        readOnly
                        allowClear
                      />
                    }
                  />
                </div>
                <PasswordInput
                  aria-label="不可用密码"
                  value="disabled"
                  disabled
                  readOnly
                />
                <Form
                  layout="horizontal"
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
                  <FormItem
                    name="teams"
                    label="表单团队"
                    emptyValue={[]}
                    control={
                      <TreeSelect
                        label="表单团队"
                        multiple
                        allowClear
                        treeData={teamTreeData}
                      />
                    }
                  />
                  <FormItem
                    name="modules"
                    label="表单模块"
                    trigger="onValueChange"
                    emptyValue={[]}
                    control={
                      <MultiSelect
                        label="表单模块"
                        options={[
                          { value: 'files', label: '文件' },
                          { value: 'ai', label: 'AI 任务' },
                          { value: 'video', label: '视频' },
                        ]}
                        showSearch
                        allowClear
                      />
                    }
                  />
                  <Stack direction="row" align="center" wrap gap="sm">
                    <Button type="submit" size="small">
                      提交表单
                    </Button>
                    <Button type="reset" variant="outline" size="small">
                      重置表单
                    </Button>
                    <Typography variant="caption" tone="muted">
                      {formStatus}
                    </Typography>
                  </Stack>
                </Form>
                <Form
                  aria-label="条款确认示例"
                  onFinish={() => setConsentStatus('已确认条款')}
                  onFinishFailed={() => setConsentStatus('请先同意条款')}
                  onReset={() => setConsentStatus('尚未提交')}
                >
                  <FormItem
                    name="consent"
                    valuePropName="checked"
                    rules={[{ required: true, message: '请同意条款' }]}
                    control={<Checkbox label="同意条款" />}
                  />
                  <Stack direction="row" align="center" wrap gap="sm">
                    <Button type="submit" size="small">
                      提交条款确认
                    </Button>
                    <Button type="reset" variant="outline" size="small">
                      重置条款确认
                    </Button>
                    <Typography variant="caption" tone="muted">
                      {consentStatus}
                    </Typography>
                  </Stack>
                </Form>
                <div
                  role="group"
                  aria-label="长表单错误定位"
                  className="max-h-60 overflow-y-auto rounded-lg border border-border p-3"
                >
                  <Form aria-label="长表单示例">
                    <FormItem
                      name="project"
                      label="顶部必填项目"
                      rules={[{ required: true, message: '请输入项目名称' }]}
                      control={<Input placeholder="项目名称" />}
                    />
                    <p className="m-0 min-h-72 text-sm text-muted-foreground">
                      滚动到底部提交，校验失败后会显示并聚焦顶部字段。
                    </p>
                    <Button type="submit" variant="outline">
                      检查长表单
                    </Button>
                  </Form>
                </div>
              </Stack>
            </CardContent>
          </Card>
          <Card id="ds-calendar" className="col-span-full scroll-mt-6">
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
          <Card id="ds-display" className="col-span-full scroll-mt-6">
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
                  preview={{
                    open: imagePreviewOpen,
                    onOpenChange: setImagePreviewOpen,
                    maxScale: 4,
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => setImagePreviewOpen(true)}
                >
                  打开受控图片预览
                </Button>
                <ImagePreviewGroup
                  label="媒体相册预览"
                  items={[
                    { src: '/mock/media/poster.svg', alt: '相册横向封面' },
                    {
                      src: '/mock/media/image-portrait.svg',
                      alt: '相册纵向插图',
                    },
                  ]}
                />
                <Dialog
                  title="图片预览容器"
                  trigger={
                    <Button variant="outline">在对话框中预览图片</Button>
                  }
                >
                  <Image
                    src="/mock/media/poster.svg"
                    alt="对话框中的封面"
                    width={240}
                    height={135}
                  />
                </Dialog>
                <Image
                  src="/mock/media/poster.svg"
                  alt="预览加载失败示例"
                  width={160}
                  height={90}
                  preview={{ src: '/mock/media/missing-preview.svg' }}
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
                <div
                  role="group"
                  aria-label="独立骨架屏预览"
                  className="flex w-full flex-wrap items-end gap-4"
                >
                  <Skeleton shape="circle" size="small" label="头像正在加载" />
                  <Skeleton
                    shape="button"
                    size="small"
                    label="小按钮正在加载"
                  />
                  <Skeleton shape="button" round label="圆角按钮正在加载" />
                  <div className="w-40 max-w-full">
                    <Skeleton
                      shape="button"
                      width="100%"
                      label="铺满容器的按钮正在加载"
                    />
                  </div>
                  <Skeleton shape="input" label="输入框正在加载" />
                  <Skeleton shape="image" size="small" label="图片正在加载" />
                </div>
                <div
                  role="group"
                  aria-label="组合骨架屏预览"
                  className="grid w-full gap-3"
                >
                  <Button
                    variant="outline"
                    className="justify-self-start"
                    onClick={() => setSkeletonLoading((current) => !current)}
                  >
                    {skeletonLoading ? '显示加载结果' : '显示骨架屏'}
                  </Button>
                  <Skeleton
                    shape="content"
                    label="文章正在加载"
                    loading={skeletonLoading}
                    avatar={{ size: 48, shape: 'square' }}
                    title={{ width: '48%' }}
                    paragraph={{ rows: 3, width: ['100%', '82%', '56%'] }}
                    round
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar label="文章作者">作</Avatar>
                      <div className="min-w-0 space-y-2">
                        <h4 className="font-semibold">加载完成的文章</h4>
                        <p className="text-sm text-muted-foreground">
                          骨架屏消失后，真实内容进入阅读顺序。
                        </p>
                      </div>
                    </div>
                  </Skeleton>
                </div>
                <Stack direction="row" align="center" gap="sm">
                  <Spinner label="正在处理" />
                  <Typography variant="caption">处理中</Typography>
                </Stack>
                <div
                  role="group"
                  aria-label="加载指示器尺寸"
                  className="flex flex-wrap items-center gap-3"
                >
                  <div className="flex items-center gap-1">
                    <Spinner size="small" label="小号独立加载" />
                    <Spin size="small" label="小号区域加载" />
                    <span className="text-sm text-muted-foreground">小号</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Spinner size="default" label="默认独立加载" />
                    <Spin size="default" label="默认区域加载" />
                    <span className="text-sm text-muted-foreground">默认</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Spinner size="large" label="大号独立加载" />
                    <Spin size="large" label="大号区域加载" />
                    <span className="text-sm text-muted-foreground">大号</span>
                  </div>
                </div>
              </Stack>
            </CardContent>
          </Card>
          <Card id="ds-feedback" className="col-span-full scroll-mt-6">
            <CardContent>
              <Stack gap="sm">
                <Typography as="h3" variant="title">
                  状态反馈
                </Typography>
                <Alert title="信息" description="展示当前状态。" />
                <Alert tone="success" title="已完成" />
                <Alert tone="warning" title="需要检查" />
                <div className="grid gap-2" data-alert-preview>
                  <Alert
                    banner
                    title="Banner 提示"
                    description="支持受控开合、关闭回调和自定义图标。"
                    closable
                    open={bannerAlertOpen}
                    onOpenChange={(open) => {
                      setBannerAlertOpen(open)
                      if (!open) setBannerAlertStatus('Banner 已请求关闭')
                    }}
                    afterClose={() => setBannerAlertStatus('Banner 已关闭')}
                    icon={<Icon name="check" />}
                  />
                  <Stack direction="row" align="center" gap="sm" wrap>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => {
                        setBannerAlertOpen(true)
                        setBannerAlertStatus('Banner 已恢复')
                      }}
                    >
                      恢复 Banner
                    </Button>
                    <span
                      data-testid="banner-alert-state"
                      aria-live="polite"
                      className="text-sm text-muted-foreground"
                    >
                      {bannerAlertStatus}
                    </span>
                  </Stack>
                </div>
                <Alert
                  key={alertKey}
                  title="可关闭提示"
                  description="处理完毕后可以关闭，必要时再恢复。"
                  closable
                  action={
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setAlertStatus('已查看提示详情')}
                    >
                      查看详情
                    </Button>
                  }
                  onDismiss={() => {
                    setAlertStatus('提示已关闭')
                    alertRestoreRef.current?.focus()
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    ref={alertRestoreRef}
                    variant="outline"
                    onClick={() => {
                      setAlertKey((key) => key + 1)
                      setAlertStatus('提示已恢复')
                    }}
                  >
                    恢复提示
                  </Button>
                  <span data-testid="alert-state" aria-live="polite">
                    {alertStatus}
                  </span>
                </div>
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
                  label="可清空单选"
                  control={
                    <Select
                      label="可清空单选"
                      defaultValue="one"
                      allowClear
                      options={[
                        { value: 'one', label: '选项一' },
                        { value: 'two', label: '选项二' },
                      ]}
                    />
                  }
                />
                <FormField
                  label="可搜索选择"
                  control={
                    <Select
                      label="可搜索选择"
                      showSearch
                      options={[
                        {
                          value: 'unavailable',
                          label: '暂不可用城市',
                          disabled: true,
                        },
                        { value: 'beijing', label: '北京' },
                        { value: 'shanghai', label: '上海' },
                        { value: 'shenzhen', label: '深圳' },
                      ]}
                    />
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="填充选择"
                    control={
                      <Select
                        variant="filled"
                        defaultValue="one"
                        options={[
                          { value: 'one', label: '选项一' },
                          { value: 'two', label: '选项二' },
                        ]}
                      />
                    }
                  />
                  <FormField
                    label="下划线警告选择"
                    control={
                      <Select
                        variant="underlined"
                        status="warning"
                        defaultValue="one"
                        options={[
                          { value: 'one', label: '选项一' },
                          { value: 'two', label: '选项二' },
                        ]}
                      />
                    }
                  />
                </div>
                <FormField
                  label="多选分类"
                  control={
                    <MultiSelect
                      label="多选分类"
                      options={[
                        { value: 'design', label: '设计' },
                        { value: 'video', label: '视频' },
                        { value: 'archived', label: '归档', disabled: true },
                      ]}
                      value={selectedCategories}
                      onValueChange={setSelectedCategories}
                      showSearch
                      allowClear
                    />
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="填充多选"
                    control={
                      <MultiSelect
                        variant="filled"
                        defaultValue={['design']}
                        options={[{ value: 'design', label: '设计' }]}
                      />
                    }
                  />
                  <FormField
                    label="下划线警告多选"
                    control={
                      <MultiSelect
                        variant="underlined"
                        status="warning"
                        options={[{ value: 'design', label: '设计' }]}
                      />
                    }
                  />
                </div>
                <Typography variant="caption" tone="muted">
                  已选分类：
                  {selectedCategories.length
                    ? selectedCategories.join('、')
                    : '无'}
                </Typography>
                <MultiSelect
                  label="不可用多选"
                  options={[{ value: 'one', label: '选项一' }]}
                  defaultValue={['one']}
                  disabled
                />
                <FormField
                  label="错误多选"
                  error="请至少选择一个分类"
                  control={
                    <MultiSelect
                      label="错误多选"
                      options={[{ value: 'one', label: '选项一' }]}
                    />
                  }
                />
                <FormField
                  label="开始日期"
                  control={<DatePicker aria-label="开始日期" mode="native" />}
                />
                <FormField
                  label="日期范围"
                  control={
                    <DateRangePicker
                      mode="native"
                      value={dateRange}
                      onChange={setDateRange}
                      min="2026-01-01"
                      max="2027-12-31"
                    />
                  }
                />
                <FormField
                  label="下划线时间范围"
                  control={
                    <TimeRangePicker
                      mode="native"
                      variant="underlined"
                      status="warning"
                      defaultValue={['09:00', '10:00']}
                    />
                  }
                />
                <Typography variant="caption" tone="muted">
                  已选范围：{dateRange[0] || '未选开始'} →{' '}
                  {dateRange[1] || '未选结束'}
                </Typography>
                <DateRangePicker
                  mode="native"
                  label="不可用日期范围"
                  defaultValue={['2026-10-01', '2026-10-05']}
                  disabled
                />
                <FormField
                  label="错误日期范围"
                  error="请选择完整日期范围"
                  control={<DateRangePicker mode="native" />}
                />
                <FormField
                  label="开始时间"
                  control={<TimePicker mode="native" aria-label="开始时间" />}
                />
                <FormField
                  label="时间范围"
                  control={
                    <TimeRangePicker
                      mode="native"
                      value={timeRange}
                      onChange={setTimeRange}
                      min="08:00"
                      max="22:00"
                      step={300}
                    />
                  }
                />
                <Typography variant="caption" tone="muted">
                  已选时间：{timeRange[0] || '未选开始'} →{' '}
                  {timeRange[1] || '未选结束'}
                </Typography>
                <TimeRangePicker
                  mode="native"
                  label="不可用时间范围"
                  defaultValue={['09:00', '17:00']}
                  disabled
                />
                <FormField
                  label="错误时间范围"
                  error="请选择完整时间范围"
                  control={<TimeRangePicker mode="native" />}
                />
                <FormField
                  label="城市"
                  control={
                    <AutoComplete
                      label="城市"
                      aria-label="城市"
                      value={city}
                      onChange={(next) => {
                        setCity(next)
                        setSelectedCity('尚未选择城市')
                      }}
                      onSelect={(_, option) =>
                        setSelectedCity(`已选择：${option.value}`)
                      }
                      options={[
                        { value: '上海' },
                        { value: '北京' },
                        { value: '杭州', disabled: true },
                      ]}
                    />
                  }
                />
                <Typography variant="caption" tone="muted">
                  {selectedCity}
                </Typography>
                <FormField
                  label="地区"
                  required
                  control={
                    <Cascader
                      label="地区"
                      changeOnSelect
                      allowClear
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
                  label="动态地区"
                  control={
                    <Cascader
                      label="动态地区"
                      mode="inline"
                      defaultValue={['cn', 'sh']}
                      options={[
                        {
                          value: 'cn',
                          label: '中国',
                          children: [
                            ...(showShanghaiOption
                              ? [{ value: 'sh', label: '上海' }]
                              : []),
                            { value: 'bj', label: '北京' },
                          ],
                        },
                      ]}
                    />
                  }
                />
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setShowShanghaiOption((current) => !current)}
                >
                  {showShanghaiOption ? '移除上海选项' : '恢复上海选项'}
                </Button>
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
                  <Sheet
                    title="左侧面板"
                    side="left"
                    trigger={<Button variant="outline">打开左侧面板</Button>}
                  >
                    <Typography>桌面从左侧展开，手机从底部展开。</Typography>
                  </Sheet>
                  <Sheet
                    title="底部面板"
                    side="bottom"
                    trigger={<Button variant="outline">打开底部面板</Button>}
                  >
                    <Typography>底部面板保留安全区间距。</Typography>
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
                  <Dropdown
                    label="筛选菜单"
                    trigger={<Button variant="outline">打开筛选菜单</Button>}
                    selectionMode="multiple"
                    selectedKeys={dropdownSelection}
                    closeOnSelect={false}
                    onSelectionChange={(next) => {
                      setDropdownSelection(next)
                      setDropdownSelectionStatus(
                        next.length
                          ? `已选择：${next.join('、')}`
                          : '未选择筛选项',
                      )
                    }}
                    items={[
                      {
                        type: 'group',
                        key: 'scope',
                        label: '范围',
                        children: [
                          { key: 'all', label: '全部' },
                          { key: 'mine', label: '我的项目' },
                        ],
                      },
                      { type: 'divider', key: 'divider' },
                      {
                        type: 'group',
                        key: 'state',
                        label: '状态',
                        children: [
                          { key: 'active', label: '进行中' },
                          { key: 'archived', label: '已归档', disabled: true },
                        ],
                      },
                    ]}
                  />
                  <Popover
                    title="补充说明"
                    content={
                      <div className="grid gap-2">
                        <p>必要信息会直接展示，这里用于可选上下文。</p>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => toast({ title: '气泡内操作完成' })}
                        >
                          气泡内操作
                        </Button>
                      </div>
                    }
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
                  <Popconfirm
                    title="提交受控任务？"
                    description="调用方决定何时关闭确认框。"
                    open={controlledConfirmOpen}
                    showCancel={false}
                    okText="提交任务"
                    onOpenChange={(next) => {
                      setControlledConfirmOpen(next)
                      setControlledConfirmStatus(
                        next ? '受控确认已打开' : '受控确认已关闭',
                      )
                    }}
                    onConfirm={() => {
                      toast({ title: '受控任务已提交', variant: 'success' })
                      setControlledConfirmOpen(false)
                      setControlledConfirmStatus('受控确认已关闭')
                    }}
                  >
                    <Button variant="outline">受控确认</Button>
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      const id = 'preview-message-flow'
                      message.loading({ id, content: '任务处理中' })
                      window.setTimeout(
                        () => message.success({ id, content: '任务已完成' }),
                        650,
                      )
                    }}
                  >
                    消息状态更新
                  </Button>
                </Stack>
                <p
                  role="status"
                  data-testid="dropdown-selection-status"
                  className="m-0 text-sm text-muted-foreground"
                >
                  {dropdownSelectionStatus}
                </p>
                <p
                  role="status"
                  data-testid="controlled-confirm-status"
                  className="m-0 text-sm text-muted-foreground"
                >
                  {controlledConfirmStatus}
                </p>
                <TooltipPreview />
                <DropdownPreview />
                <div
                  role="group"
                  aria-label="Popover 触发与位置预览"
                  className="grid gap-3"
                >
                  <p className="m-0 text-sm text-muted-foreground">
                    悬停、聚焦或轻触可查看补充内容，Escape 返回触发按钮。
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover
                      title="悬停气泡"
                      content={
                        <Button variant="outline">悬停气泡内操作</Button>
                      }
                      trigger="hover"
                      placement="top-end"
                    >
                      <Button variant="outline">悬停查看气泡</Button>
                    </Popover>
                    <Popover
                      title="聚焦气泡"
                      content={
                        <Button variant="outline">聚焦气泡内操作</Button>
                      }
                      trigger="focus"
                      placement="right-start"
                    >
                      <Button variant="outline">聚焦查看气泡</Button>
                    </Popover>
                    <Popover
                      title="受控气泡"
                      content="开合由外部状态控制。"
                      open={controlledPopoverOpen}
                      onOpenChange={setControlledPopoverOpen}
                      placement="left-end"
                    >
                      <Button variant="outline">切换受控气泡</Button>
                    </Popover>
                    <Button
                      variant="ghost"
                      onClick={() => setControlledPopoverOpen(true)}
                    >
                      外部打开气泡
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setControlledPopoverOpen(false)}
                    >
                      外部关闭气泡
                    </Button>
                    <Select
                      label="气泡位置"
                      aria-label="气泡位置"
                      value={popoverPlacement}
                      onValueChange={(next) =>
                        setPopoverPlacement(next as PopoverPlacement)
                      }
                      options={popoverPlacements.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                    <Popover
                      title="位置气泡"
                      content={`当前请求位置：${popoverPlacement}`}
                      placement={popoverPlacement}
                    >
                      <Button variant="outline">查看位置气泡</Button>
                    </Popover>
                  </div>
                  <p
                    role="status"
                    className="m-0 text-sm text-muted-foreground"
                  >
                    受控气泡：{controlledPopoverOpen ? '已打开' : '已关闭'}
                  </p>
                </div>
              </Stack>
            </CardContent>
          </Card>
          <Card id="ds-navigation" className="col-span-full scroll-mt-6">
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
                <div
                  className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-border p-3"
                  data-breadcrumb-preview
                >
                  <Typography as="span" variant="caption">
                    长路径与折叠状态
                  </Typography>
                  <Breadcrumb
                    label="长路径导航"
                    maxItems={3}
                    onExpandedChange={(next) =>
                      setBreadcrumbStatus(next ? '路径已展开' : '路径已折叠')
                    }
                    items={[
                      { key: 'home', title: '工作台', href: '#' },
                      {
                        key: 'projects',
                        title: '项目列表',
                        href: '#preview-result',
                      },
                      {
                        key: 'project',
                        title: '项目 A',
                        onClick: () => setBreadcrumbStatus('已打开项目 A'),
                      },
                      { key: 'history', title: '历史版本', disabled: true },
                      {
                        key: 'record',
                        title: '记录 B',
                        href: '#preview-timeline',
                      },
                      { key: 'current', title: '当前详情' },
                    ]}
                  />
                  <span role="status" className="text-sm text-muted-foreground">
                    {breadcrumbStatus}
                  </span>
                  <ConfigProvider direction="rtl">
                    <Breadcrumb
                      label="RTL 长路径导航"
                      maxItems={3}
                      items={[
                        { title: '起点', href: '#' },
                        { title: '资料夹', href: '#' },
                        { title: '二级资料夹', href: '#' },
                        { title: '三级资料夹', href: '#' },
                        { title: '当前条目' },
                      ]}
                    />
                  </ConfigProvider>
                </div>
                <div
                  className="grid gap-2 rounded-[var(--radius-md)] border border-border bg-muted/30 p-3"
                  data-affix-preview
                >
                  <Stack direction="row" align="center" wrap gap="sm">
                    <Typography as="span" variant="caption">
                      目标容器 Affix
                    </Typography>
                    <Typography
                      as="span"
                      variant="caption"
                      tone="muted"
                      data-affix-status
                    >
                      顶部：{affixStatus} · 底部：{affixBottomStatus}
                    </Typography>
                  </Stack>
                  <div
                    ref={affixTargetRef}
                    className="h-56 overflow-auto overscroll-contain rounded-[var(--radius-md)] border border-border bg-background p-3"
                    data-affix-scroll-container
                  >
                    <div className="grid min-h-24 content-center rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                      目标容器：向下滚动，观察顶部和底部偏移。
                    </div>
                    <Affix
                      target={() => affixTargetRef.current}
                      offsetTop={8}
                      onChange={(next) =>
                        setAffixStatus(next ? '已固定' : '未固定')
                      }
                    >
                      <div className="my-2 flex min-h-11 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary shadow-sm">
                        容器顶部固定条
                      </div>
                    </Affix>
                    <div className="h-72 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                      目标容器内容区
                    </div>
                    <Affix
                      target={() => affixTargetRef.current}
                      offsetBottom={8}
                      onChange={(next) =>
                        setAffixBottomStatus(next ? '已固定' : '未固定')
                      }
                    >
                      <div className="my-2 flex min-h-11 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary shadow-sm">
                        容器底部固定条
                      </div>
                    </Affix>
                    <div className="h-24 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                      目标容器末端
                    </div>
                  </div>
                </div>
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
                <Menu
                  mode="horizontal"
                  label="横向导航"
                  selectedKeys={
                    horizontalMenuSelection ? [horizontalMenuSelection] : []
                  }
                  onSelect={setHorizontalMenuSelection}
                  items={[
                    {
                      key: 'catalog',
                      label: '目录',
                      children: [
                        { key: 'all-components', label: '全部组件' },
                        { key: 'guides', label: '组件示例' },
                        {
                          key: 'disabled-child',
                          label: '暂不可选',
                          disabled: true,
                        },
                      ],
                    },
                    { key: 'examples', label: '示例' },
                    { key: 'unavailable', label: '暂不可用', disabled: true },
                  ]}
                />
                <p
                  role="status"
                  aria-label="横向菜单选择"
                  className="m-0 text-sm text-muted-foreground"
                >
                  已选择：{horizontalMenuSelection || '无'}
                </p>
                <Anchor
                  links={[
                    { href: '#preview-timeline', title: '时间线' },
                    { href: '#preview-result', title: '结果' },
                  ]}
                />
                <div
                  role="group"
                  aria-label="容器页内导航预览"
                  className="grid min-w-0 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]"
                >
                  <Anchor
                    label="容器页内导航"
                    getContainer={() => anchorScrollRef.current}
                    offsetTop={8}
                    links={[
                      { href: '#anchor-panel-one', title: '概览章节' },
                      { href: '#anchor-panel-two', title: '配置章节' },
                      { href: '#anchor-panel-three', title: '结果章节' },
                    ]}
                  />
                  <div
                    ref={anchorScrollRef}
                    role="region"
                    aria-label="章节滚动容器"
                    tabIndex={0}
                    className="h-56 min-w-0 overflow-y-auto overscroll-contain rounded-lg border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <section
                      id="anchor-panel-one"
                      className="min-h-56 border-b border-border p-4"
                    >
                      <Typography as="h4" variant="title">
                        概览章节
                      </Typography>
                      <Typography tone="muted">容器内第一节内容。</Typography>
                    </section>
                    <section
                      id="anchor-panel-two"
                      className="min-h-56 border-b border-border p-4"
                    >
                      <Typography as="h4" variant="title">
                        配置章节
                      </Typography>
                      <Typography tone="muted">容器内第二节内容。</Typography>
                    </section>
                    <section id="anchor-panel-three" className="min-h-72 p-4">
                      <Typography as="h4" variant="title">
                        结果章节
                      </Typography>
                      <Typography tone="muted">容器内最后一节内容。</Typography>
                    </section>
                  </div>
                </div>
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
                <div className="grid gap-2">
                  <p className="text-sm font-semibold">小尺寸步骤与当前进度</p>
                  <Steps
                    label="小尺寸步骤与当前进度"
                    size="small"
                    current={step}
                    percent={step === 0 ? 0 : step === 1 ? 68 : 100}
                    onChange={setStep}
                    items={[
                      { title: '上传文件' },
                      { title: '分析媒体', description: '处理进度示例' },
                      { title: '查看结果' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">非受控垂直步骤</p>
                  <Steps
                    label="非受控垂直步骤"
                    direction="vertical"
                    defaultCurrent={0}
                    onChange={setUncontrolledStepEvent}
                    items={[
                      { title: '收集信息' },
                      { title: '确认内容' },
                      { title: '暂不可用', disabled: true },
                    ]}
                  />
                  <p className="text-sm text-muted-foreground">
                    最近切换：第 {uncontrolledStepEvent + 1} 步
                  </p>
                </div>
                <Progress
                  percent={step === 2 ? 100 : step * 50}
                  status={step === 2 ? 'success' : 'active'}
                />
                <Progress
                  label="分段上传进度"
                  percent={step === 2 ? 100 : 62}
                  steps={5}
                  status={step === 2 ? 'success' : 'active'}
                />
                <div
                  role="group"
                  aria-label="小尺寸与分阶段进度"
                  className="grid gap-3 rounded-[var(--radius-md)] border border-border p-3"
                >
                  <p className="m-0 text-sm text-muted-foreground">
                    蓝色表示总进度 68%，绿色表示其中已完成的 30%。
                  </p>
                  <Progress
                    label="分阶段线性进度"
                    size="small"
                    percent={68}
                    successPercent={30}
                  />
                  <Progress
                    label="分阶段分段进度"
                    size="small"
                    percent={68}
                    successPercent={30}
                    steps={5}
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <Progress
                      type="circle"
                      label="分阶段圆形进度"
                      size="small"
                      percent={68}
                      successPercent={30}
                    />
                    <Progress
                      type="dashboard"
                      label="分阶段仪表盘进度"
                      size="small"
                      percent={68}
                      successPercent={30}
                      steps={{ count: 5, gap: 3 }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Progress
                    type="circle"
                    label="圆环分段进度"
                    percent={step === 2 ? 100 : 62}
                    steps={{ count: 5, gap: 4 }}
                    status={step === 2 ? 'success' : 'normal'}
                  />
                  <Progress
                    type="dashboard"
                    label="仪表盘进度"
                    percent={step === 2 ? 100 : 62}
                    gapDegree={75}
                    gapPlacement="bottom"
                    status={step === 2 ? 'success' : 'normal'}
                  />
                  <Progress
                    type="dashboard"
                    label="仪表盘分段进度"
                    percent={step === 2 ? 100 : 62}
                    steps={{ count: 6, gap: 3 }}
                    gapDegree={90}
                    gapPlacement="start"
                    status={step === 2 ? 'success' : 'normal'}
                  />
                </div>
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
                <section
                  aria-label="头像状态预览"
                  className="grid min-w-0 gap-4"
                >
                  <h3 className="m-0 text-base font-semibold">头像与成员组</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      label="失败回退头像"
                      src={
                        avatarRecovered
                          ? '/mock/media/poster.svg'
                          : '/mock/media/missing-avatar.svg'
                      }
                    >
                      回退
                    </Avatar>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setAvatarRecovered((previous) => !previous)
                      }
                    >
                      {avatarRecovered ? '恢复失败头像' : '替换为可用头像'}
                    </Button>
                    <Avatar label="长文字头像" size={56} gap={6}>
                      USERNAME
                    </Avatar>
                    <Avatar label="图标头像" icon={<Icon name="user" />} />
                    <Avatar
                      label="响应式头像"
                      size={{ xs: 32, sm: 40, md: 48, xl: 64 }}
                    >
                      团队
                    </Avatar>
                  </div>
                  <AvatarGroup
                    label="项目成员"
                    maxCount={2}
                    items={[
                      { key: 'one', label: '项目设计师', children: '设' },
                      { key: 'two', label: '项目开发者', children: '开' },
                      { key: 'three', label: '项目测试者', children: '测' },
                      { key: 'four', label: '项目负责人', children: '负' },
                    ]}
                  />
                  <ConfigProvider direction="rtl">
                    <AvatarGroup
                      label="RTL 成员组"
                      size="small"
                      shape="square"
                      maxCount={1}
                      items={[
                        { key: 'one', label: 'RTL 设计师', children: '设' },
                        { key: 'two', label: 'RTL 开发者', children: '开' },
                        { key: 'three', label: 'RTL 测试者', children: '测' },
                      ]}
                    />
                  </ConfigProvider>
                  <AvatarGroup label="空成员组" items={[]} />
                </section>
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
                <section
                  aria-label="描述列表状态预览"
                  className="grid min-w-0 gap-4"
                >
                  <h3 className="m-0 text-base font-semibold">描述列表</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDescriptionLayout((previous) =>
                          previous === 'horizontal' ? 'vertical' : 'horizontal',
                        )
                      }
                    >
                      {descriptionLayout === 'horizontal'
                        ? '切换为垂直详情'
                        : '切换为水平详情'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDescriptionBordered((previous) => !previous)
                      }
                    >
                      {descriptionBordered ? '隐藏详情边框' : '显示详情边框'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDescriptionSize((previous) =>
                          previous === 'default'
                            ? 'small'
                            : previous === 'small'
                              ? 'large'
                              : 'default',
                        )
                      }
                    >
                      {descriptionSize === 'default'
                        ? '使用小号详情'
                        : descriptionSize === 'small'
                          ? '使用大号详情'
                          : '恢复默认详情尺寸'}
                    </Button>
                  </div>
                  <Descriptions
                    title="响应式任务详情"
                    extra={
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() =>
                          setDescriptionEdited((previous) => !previous)
                        }
                      >
                        更新详情
                      </Button>
                    }
                    column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                    bordered={descriptionBordered}
                    layout={descriptionLayout}
                    size={descriptionSize}
                    items={[
                      {
                        key: 'team',
                        label: '归属团队',
                        children: '独立能力库',
                      },
                      {
                        key: 'id',
                        label: '记录编号（自动生成的任务标识）',
                        children:
                          'MOCK-2026-TAILWIND-DESCRIPTIONS-RESPONSIVE-1234567890',
                        span: { xs: 1, md: 2 },
                      },
                      {
                        key: 'phase',
                        label: '任务阶段',
                        children: (
                          <span role="status" aria-label="详情更新状态">
                            {descriptionEdited ? '已更新' : '待审核'}
                          </span>
                        ),
                        span: 'filled',
                      },
                      {
                        key: 'notes',
                        label: '实现说明',
                        children:
                          '标签和内容保持同一份语义结构。整行内容可以包含长文本、链接和操作，并根据视口宽度重新排列。',
                        span: 'filled',
                      },
                    ]}
                  />
                  <ConfigProvider
                    direction="rtl"
                    componentSize="small"
                    theme={{ mode: 'dark' }}
                  >
                    <Descriptions
                      title="RTL 垂直详情"
                      bordered
                      layout="vertical"
                      column={{ xs: 1, md: 2 }}
                      items={[
                        {
                          key: 'locale',
                          label: '界面方向',
                          children: '从右向左',
                        },
                        {
                          key: 'scope',
                          label: '局部主题',
                          children: '深色 · 小号',
                        },
                      ]}
                    />
                  </ConfigProvider>
                  <Descriptions title="空详情预览" items={[]} />
                </section>
                <Stack direction="row" wrap gap="lg" align="center">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="填充数字"
                      control={
                        <InputNumber
                          variant="filled"
                          defaultValue={8}
                          aria-label="填充数字"
                        />
                      }
                    />
                    <FormField
                      label="警告日期"
                      control={
                        <DatePicker
                          variant="underlined"
                          status="warning"
                          aria-label="警告日期"
                        />
                      }
                    />
                  </div>
                  <FormField
                    label="数量"
                    control={
                      <InputNumber
                        aria-label="数量"
                        min={0}
                        max={99}
                        value={quantity}
                        onChange={setQuantity}
                        suffix="项"
                      />
                    }
                  />
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setQuantity(undefined)}
                  >
                    清空数量
                  </Button>
                  <FormField
                    label="格式化金额"
                    description="精度、解析器和步进按钮共用数字值 API。"
                    control={
                      <InputNumber
                        aria-label="格式化金额"
                        value={amount}
                        min={0}
                        max={9999}
                        step={0.5}
                        precision={2}
                        formatter={(value, info) =>
                          info.userTyping
                            ? info.input
                            : value === undefined
                              ? ''
                              : '¥' + value.toFixed(2)
                        }
                        parser={(value) => Number(value.replace('¥', ''))}
                        onChange={(next) => setAmount(next ?? 0)}
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
                  <div
                    role="group"
                    aria-label="统计数值语义预览"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Statistic
                      title="完成率"
                      value={volume}
                      suffix="%"
                      classNames={{
                        header: 'pb-1',
                        value: 'text-primary',
                        suffix: 'text-primary',
                      }}
                    />
                    <Statistic
                      title="处理任务数"
                      value={12345.678}
                      precision={1}
                      loading={statisticLoading}
                      classNames={{ value: 'text-primary' }}
                    />
                    <Statistic
                      title="自定义分隔符"
                      value={1234567.89}
                      precision={2}
                      prefix="¥"
                      suffix="元"
                      groupSeparator="_"
                      decimalSeparator="·"
                      classNames={{
                        prefix: 'text-primary',
                        value: 'text-primary',
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setStatisticLoading((value) => !value)}
                  >
                    {statisticLoading ? '完成统计加载' : '重置统计加载'}
                  </Button>
                  <div
                    role="group"
                    aria-label="统计计时器预览"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <StatisticTimer
                      title="任务倒计时"
                      value={timerTarget}
                      format="mm:ss"
                      onFinish={() => setTimerStatus('倒计时已完成')}
                    />
                    <StatisticTimer
                      title="任务已运行"
                      value={timerStart}
                      type="countup"
                      format="HH:mm:ss"
                    />
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          setTimerTarget(Date.now() + 3_000)
                          setTimerStatus('倒计时进行中')
                        }}
                      >
                        启动 3 秒倒计时
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setTimerStart(Date.now())}
                      >
                        重置正计时
                      </Button>
                      <span
                        role="status"
                        className="text-sm text-muted-foreground"
                      >
                        {timerStatus}
                      </span>
                    </div>
                  </div>
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
                <div role="group" aria-label="单开折叠预览">
                  <Collapse
                    accordion
                    defaultActiveKey={['overview']}
                    items={[
                      {
                        key: 'overview',
                        label: '折叠概览',
                        children: '一次只展开一个面板。',
                      },
                      {
                        key: 'details',
                        label: '折叠详情',
                        children: '可以用键盘或触控切换。',
                      },
                      {
                        key: 'disabled',
                        label: '不可用折叠',
                        children: '不可操作。',
                        disabled: true,
                      },
                    ]}
                  />
                </div>
                <div id="preview-result">
                  <Result
                    status={step === 2 ? 'success' : 'info'}
                    title={step === 2 ? '流程已完成' : '流程进行中'}
                    subTitle="点击步骤或按钮检查受控状态。"
                  />
                  <Result
                    status="error"
                    title="提交失败"
                    subTitle="请检查以下信息后重试。"
                    extra={
                      <Button variant="outline" onClick={() => setStep(0)}>
                        重新检查
                      </Button>
                    }
                  >
                    <div className="space-y-2 text-sm">
                      <p>需要处理的问题：</p>
                      <ul className="list-disc space-y-1 ps-5">
                        <li>上传文件的格式不受支持。</li>
                        <li>请重新选择文件并确认后提交。</li>
                      </ul>
                    </div>
                  </Result>
                </div>
                <ResultPreview />
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
          <CollapsePreview />
          <CarouselPreview />
          <TimelinePreview />
          <TreePreview />
          <TreeAsyncPreview />
          <TreeVirtualPreview />
          <TreeDragPreview />
          <TreeSelectPreview />
          <TreeSelectAsyncPreview />
          <CascaderPreview />
          <DatePickerPreview />
          <DateRangePreview />
          <MultiDatePreview />
          <DateUnitPreview />
          <DateUnitRangePreview />
          <TimePickerPreview />
          <TimeRangePreview />
          <DateTimePreview />
          <DateTimeRangePreview />
          <TimeInteractionPreview />
          <DateInputPreview />
          <MillisecondTimePreview />
          <PickerFormatPreview />
          <SliderPreview />
          <ColorPickerPreview />
          <ColorPickerGradientPreview />
          <TypographyPreview />
          <TabsPreview />
          <Card id="ds-utilities" className="col-span-full scroll-mt-6">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    动态边框
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    装饰动画遵循系统减少动态效果设置
                  </Typography>
                </Stack>
                <BorderBeam
                  aria-label="动态边框示例"
                  className="max-w-xl"
                  color="var(--primary)"
                  duration={5}
                >
                  <div className="p-5">
                    <Typography>内容区域保持正常键盘和触控交互。</Typography>
                  </div>
                </BorderBeam>
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    二维码
                  </Typography>
                  <Stack direction="row" gap="sm" wrap>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() =>
                        setQrStatus((current) =>
                          current === 'active' ? 'expired' : 'active',
                        )
                      }
                    >
                      {qrStatus === 'active' ? '模拟失效' : '恢复二维码'}
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setQrStatus('loading')}
                    >
                      模拟加载
                    </Button>
                  </Stack>
                </Stack>
                <Stack direction="row" gap="lg" wrap align="center">
                  <QRCode
                    value="https://ant.design/index-cn"
                    type="svg"
                    status={qrStatus}
                    onRefresh={() => setQrStatus('active')}
                    aria-label="Ant Design 文档二维码"
                  />
                  <Stack gap="sm">
                    <Typography>
                      支持 SVG / Canvas、错误级别、图标和状态覆盖。
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      失效状态可通过刷新按钮恢复，触控目标保持至少 44px。
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    虚拟列表
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {virtualListCount} 条数据，仅渲染可见行
                  </Typography>
                </Stack>
                <div
                  role="group"
                  aria-label="虚拟列表状态"
                  className="flex flex-wrap gap-2"
                >
                  {(
                    [
                      ['filled', '有数据'],
                      ['loading', '加载中'],
                      ['empty', '空数据'],
                      ['error', '错误'],
                    ] as const
                  ).map(([state, label]) => (
                    <Button
                      key={state}
                      variant={
                        virtualListState === state ? 'primary' : 'outline'
                      }
                      aria-pressed={virtualListState === state}
                      onClick={() => setVirtualListState(state)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  aria-pressed={virtualListCount === 5}
                  onClick={() =>
                    setVirtualListCount(virtualListCount === 5 ? 100 : 5)
                  }
                >
                  {virtualListCount === 5
                    ? '恢复 100 条数据'
                    : '缩减到 5 条数据'}
                </Button>
                <Listy
                  items={
                    virtualListState === 'empty'
                      ? []
                      : virtualListItems.slice(0, virtualListCount)
                  }
                  itemHeight={52}
                  height={260}
                  overscan={4}
                  label="虚拟任务列表"
                  loading={virtualListState === 'loading'}
                  error={
                    virtualListState === 'error'
                      ? '虚拟列表加载失败'
                      : undefined
                  }
                  onRetry={() => setVirtualListState('filled')}
                  getKey={(item) => item.id}
                  renderItem={(item, index) => (
                    <div className="flex w-full items-center justify-between gap-3 px-4">
                      <div className="min-w-0">
                        <Typography className="truncate">
                          {item.title}
                        </Typography>
                        <Typography variant="caption" tone="muted">
                          {item.description}
                        </Typography>
                      </div>
                      <Typography variant="caption" tone="muted">
                        #{index + 1}
                      </Typography>
                    </div>
                  )}
                />
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
          <Card className="col-span-full">
            <CardContent>
              <Stack gap="md">
                <Stack direction="row" wrap align="center" justify="between">
                  <Typography as="h3" variant="title">
                    分步引导
                  </Typography>
                  <Button
                    ref={tourTriggerRef}
                    variant="outline"
                    size="small"
                    onClick={() => {
                      setTourReturnTarget('start')
                      setTourStep(0)
                      setTourOpen(true)
                    }}
                  >
                    开始引导
                  </Button>
                  <Button
                    ref={tourEdgeTriggerRef}
                    variant="outline"
                    size="small"
                    onClick={() => {
                      setTourReturnTarget('edge')
                      setTourStep(2)
                      setTourOpen(true)
                    }}
                  >
                    预览边缘放置
                  </Button>
                  <Button
                    ref={tourGuardTriggerRef}
                    variant="outline"
                    size="small"
                    onClick={() => {
                      tourGuardCloseRequests.current = 0
                      setTourGuardOpen(true)
                    }}
                  >
                    预览受控关闭
                  </Button>
                  <Button
                    ref={tourBlockedTriggerRef}
                    variant="outline"
                    size="small"
                    onClick={() => setTourBlockedOpen(true)}
                  >
                    预览禁止目标交互
                  </Button>
                </Stack>
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <Button
                    id="tour-upload"
                    variant="outline"
                    onClick={() => setTourTargetClicks((count) => count + 1)}
                  >
                    上传素材
                  </Button>
                  <Button id="tour-save" variant="outline">
                    保存草稿
                  </Button>
                  <Button id="tour-publish" variant="primary">
                    发布内容
                  </Button>
                </div>
                <Typography variant="caption" tone="muted">
                  引导支持
                  Escape、左右方向键、遮罩关闭和手机触控；靠近视口边缘时卡片自动换边。高亮目标可直接操作，上传按钮已点击{' '}
                  {tourTargetClicks} 次。
                </Typography>
                <Tour
                  open={tourOpen}
                  current={tourStep}
                  returnFocusRef={
                    tourReturnTarget === 'edge'
                      ? tourEdgeTriggerRef
                      : tourTriggerRef
                  }
                  onChange={setTourStep}
                  onClose={() => setTourOpen(false)}
                  onFinish={() => setTourOpen(false)}
                  steps={[
                    {
                      key: 'upload',
                      target: () => document.getElementById('tour-upload'),
                      title: '上传素材',
                      description: <ExpandableTourDescription />,
                      placement: 'bottom',
                    },
                    {
                      key: 'save',
                      target: () => document.getElementById('tour-save'),
                      title: '保存草稿',
                      description: '中途离开前可以保存当前编辑状态。',
                      placement: 'bottom',
                    },
                    {
                      key: 'publish',
                      target: () => document.getElementById('tour-publish'),
                      title: '发布内容',
                      description: '确认内容无误后发布给团队成员。',
                      placement: 'right',
                      type: 'primary',
                    },
                  ]}
                />
                <Tour
                  open={tourGuardOpen}
                  returnFocusRef={tourGuardTriggerRef}
                  onClose={() => {
                    tourGuardCloseRequests.current += 1
                    if (tourGuardCloseRequests.current >= 2)
                      setTourGuardOpen(false)
                  }}
                  onFinish={() => setTourGuardOpen(false)}
                  steps={[
                    {
                      key: 'guarded-close',
                      title: '受控关闭请求',
                      description:
                        '第一次关闭请求由调用方拒绝，卡片保持打开；第二次请求才真正关闭并恢复焦点。',
                    },
                  ]}
                />
                <Tour
                  open={tourBlockedOpen}
                  disabledInteraction
                  type="primary"
                  arrow={{ pointAtCenter: true }}
                  maskClosable={false}
                  returnFocusRef={tourBlockedTriggerRef}
                  onClose={() => setTourBlockedOpen(false)}
                  onFinish={() => setTourBlockedOpen(false)}
                  steps={[
                    {
                      key: 'blocked-target',
                      target: () => document.getElementById('tour-upload'),
                      title: '禁止目标交互',
                      description:
                        '引导期间不能触发高亮的上传按钮；关闭后恢复目标操作。箭头指向目标中心。',
                      placement: 'bottom',
                    },
                  ]}
                />
              </Stack>
            </CardContent>
          </Card>
          <Card id="ds-rtl" className="col-span-full scroll-mt-6">
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  RTL 控件
                </Typography>
                <ConfigProvider
                  direction="rtl"
                  getPopupContainer={() => rtlPopupContainer ?? document.body}
                >
                  <div
                    role="group"
                    aria-label="RTL 控件预览"
                    className="grid w-full max-w-3xl gap-3"
                  >
                    <Select
                      aria-label="RTL 选择"
                      defaultValue="first"
                      options={[
                        { value: 'first', label: 'RTL 第一项' },
                        { value: 'second', label: 'RTL 第二项' },
                      ]}
                    />
                    <Select
                      label="RTL 搜索选择"
                      aria-label="RTL 搜索选择"
                      className="max-w-60"
                      showSearch
                      status="warning"
                      defaultValue="first"
                      options={[
                        {
                          value: 'unavailable',
                          label: 'RTL 不可用项',
                          disabled: true,
                        },
                        { value: 'first', label: 'RTL 搜索第一项' },
                        { value: 'second', label: 'RTL 搜索第二项' },
                        {
                          value: 'long',
                          label:
                            'RTL 很长的选项 https://example.test/' +
                            'a'.repeat(90),
                        },
                      ]}
                    />
                    <MultiSelect
                      label="RTL 多选"
                      options={[
                        { value: 'alpha', label: 'RTL 甲' },
                        { value: 'beta', label: 'RTL 乙' },
                      ]}
                      defaultValue={['alpha']}
                      showSearch
                    />
                    <TreeSelect
                      label="RTL 树选择"
                      treeData={[
                        {
                          value: 'team',
                          label: '团队',
                          children: [{ value: 'design', label: '设计组' }],
                        },
                      ]}
                    />
                    <InputOTP label="RTL 验证码" length={4} defaultValue="12" />
                    <Switch label="RTL 开关" />
                    <div className="flex flex-wrap items-center gap-4">
                      <Badge count={8} label="8 条 RTL 通知">
                        <Button
                          variant="outline"
                          onClick={() => setBadgeStatus('已打开 RTL 通知')}
                        >
                          RTL 通知
                        </Button>
                      </Badge>
                      <Badge count={24} label="24 条独立 RTL 通知" />
                      <span role="status" aria-label="RTL 通知操作状态">
                        {badgeStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Dialog
                        title="RTL 对话框"
                        trigger={
                          <Button variant="outline">打开 RTL 对话框</Button>
                        }
                      >
                        弹层方向跟随配置。
                      </Dialog>
                      <Sheet
                        title="RTL 面板"
                        trigger={
                          <Button variant="outline">打开 RTL 面板</Button>
                        }
                      >
                        面板方向跟随配置。
                      </Sheet>
                      <Dropdown
                        label="RTL 菜单"
                        placement="bottom-start"
                        trigger={
                          <Button variant="outline">打开 RTL 菜单</Button>
                        }
                        items={[{ key: 'copy', label: 'RTL 复制' }]}
                      />
                      <Popover
                        title="RTL 说明"
                        content="对齐方向跟随配置。"
                        placement="bottom-end"
                      >
                        <Button variant="outline">打开 RTL 气泡</Button>
                      </Popover>
                      <Tooltip
                        title="起始边与文字方向一致。"
                        placement="top-start"
                      >
                        <Button variant="outline">打开 RTL 提示</Button>
                      </Tooltip>
                    </div>
                    <Table
                      caption="RTL 数据表"
                      rows={[{ id: 'rtl-row', name: '任务', status: '进行中' }]}
                      getRowKey={(row) => row.id}
                      columns={[
                        {
                          key: 'name',
                          header: '任务',
                          rowScope: 'row',
                          render: (row) => row.name,
                        },
                        {
                          key: 'status',
                          header: '状态',
                          render: (row) => row.status,
                        },
                      ]}
                      expandable={{
                        defaultExpandedRowKeys: ['rtl-row'],
                        getLabel: (row) => row.name,
                        expandedRowRender: (row) => (
                          <p className="m-0 text-sm text-muted-foreground">
                            {row.name} 的详细状态：{row.status}
                          </p>
                        ),
                      }}
                    />
                    <div
                      role="group"
                      aria-label="窄 RTL 表格预览"
                      className="w-full max-w-60"
                    >
                      <Table
                        caption="窄 RTL 数据表"
                        rows={[
                          {
                            id: 'rtl-long-row',
                            name: '任务 2026-10-03',
                            owner: '设计系统团队',
                            status: '等待内容审核',
                            date: '2026-10-10',
                          },
                        ]}
                        getRowKey={(row) => row.id}
                        columns={[
                          {
                            key: 'name',
                            header: '任务编号',
                            rowScope: 'row',
                            render: (row) => (
                              <span className="whitespace-nowrap">
                                {row.name}
                              </span>
                            ),
                          },
                          {
                            key: 'owner',
                            header: '负责人',
                            render: (row) => (
                              <span className="whitespace-nowrap">
                                {row.owner}
                              </span>
                            ),
                          },
                          {
                            key: 'status',
                            header: '状态',
                            render: (row) => (
                              <span className="whitespace-nowrap">
                                {row.status}
                              </span>
                            ),
                          },
                          {
                            key: 'date',
                            header: '截止日期',
                            render: (row) => (
                              <span className="whitespace-nowrap">
                                {row.date}
                              </span>
                            ),
                          },
                        ]}
                      />
                    </div>
                    <Transfer
                      label="RTL 模块分配"
                      titles={['待分配', '已分配']}
                      items={[
                        { key: 'a', title: '任务 A' },
                        { key: 'b', title: '任务 B' },
                      ]}
                      defaultTargetKeys={['b']}
                    />
                  </div>
                </ConfigProvider>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </ThemeScope>
      <BackTop showProgress />
      <FloatButtonGroup
        label="展开快捷操作"
        trigger={floatTrigger}
        open={floatOpen}
        onOpenChange={setFloatOpen}
        shape="square"
        position="top-right"
        items={[
          { key: 'help', label: '浮动帮助', icon: <Icon name="info" /> },
          { key: 'done', label: '浮动确认', icon: <Icon name="check" /> },
        ]}
        onSelect={(key) =>
          toast({ title: key === 'help' ? '打开浮动帮助' : '已完成浮动操作' })
        }
      />
      <FloatButton
        label="浮动反馈"
        position="bottom-left"
        variant="outline"
        tooltip="发送反馈"
        badge={{ count: 3, label: '3 条待处理反馈', tone: 'warning' }}
        onClick={() => toast({ title: '已收到反馈' })}
      >
        <Icon name="info" />
      </FloatButton>
      <FloatButton
        label="首页快捷入口"
        href="/"
        disabled={floatLinkState === 'disabled'}
        loading={floatLinkState === 'loading'}
        tooltip="打开首页"
        position="bottom-left"
        containerClassName="bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))]"
        variant="outline"
      >
        <Icon name="home" />
      </FloatButton>
      <ThemeScope
        id="ds-theme"
        role="group"
        aria-label="局部品牌主题预览"
        mode={mode === 'light' ? 'dark' : 'light'}
        density="compact"
        tokens={{
          primary: mode === 'light' ? '#4096ff' : '#1677ff',
          onPrimary: mode === 'light' ? '#111827' : '#ffffff',
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
        className="scroll-mt-6 rounded-xl border border-border p-4"
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
          role="group"
          aria-label="嵌套主题预览"
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
