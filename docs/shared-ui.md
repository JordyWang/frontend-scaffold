# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。设计变量定义在 `src/shared/styles/tokens.css`，新组件使用 Tailwind 语义工具类；底层依赖集中在这一层。新增组件样式约定见 [组件实现约定](./component-conventions.md)。

| 组件                            | 项目 API                                                                                                                                         | 约定                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Button                          | `variant`、`size`、`loading`、原生 button 属性                                                                                                   | 默认 `type="button"`；加载时禁用，避免重复提交                                                                              |
| Input / Textarea                | 原生属性、`invalid`、`size`                                                                                                                      | 转发 ref；`size` 为 default / small / large，输入字号为 16px                                                                |
| Mentions                        | `options`、`value` / `defaultValue`、`onChange`、`onSelect`、`prefix`、`disabled`、原生 textarea 属性                                            | 从光标前识别提及；方向键、Enter、Escape 与触控选择，候选项支持禁用；弹层继承局部主题                                        |
| SearchInput                     | `value` / `defaultValue`、`onValueChange`、`onSearch`、`allowClear`、`loading`、`invalid`、`size`                                                | Enter 与按钮提交搜索；清空保持输入焦点；在 FormItem 中使用 `trigger="onValueChange"`                                        |
| PasswordInput                   | 原生输入属性、`visible` / `defaultVisible`、`onVisibleChange`、`visibilityToggle`、`invalid`、`size`                                             | 保留原生密码输入及自动填充，显示/隐藏按钮支持键盘且不会提交表单                                                             |
| InputOTP                        | `length`、`value` / `defaultValue`、`onChange`、`onComplete`、`label`、`inputMode`、`mask`、`disabled`、`invalid`、`name`                        | 分格输入一次性验证码；支持粘贴、方向键和删除，默认数字键盘，单格触控区域至少 44px                                           |
| FormField                       | `label?`、`control`、`description`、`error`、`required`、`id`                                                                                    | 自动连接标签、说明和错误；自带标签的控件省略 `label`                                                                        |
| Form / FormItem                 | `initialValues`、`values`、`onValuesChange`、`onFinish`、`onFinishFailed`、`onFinishError`、`rules`、`valuePropName`、`emptyValue`、`trigger`    | 表单只协调值和校验；控件仍使用项目自己的 API，规则错误通过 FormField 的 `aria-describedby` 暴露                             |
| InputNumber / Slider            | `value` / `defaultValue`、`min`、`max`、`step`、`onChange`、`label`                                                                              | 使用原生 number/range 控件；数值提交时限制在范围内，键盘和触控由浏览器处理                                                  |
| DatePicker / TimePicker         | 原生日期/时间属性、`value`、`defaultValue`、`onChange`、`size`                                                                                   | 输出 ISO 日期或本地时间字符串；输入由浏览器提供键盘和触控选择器                                                             |
| DateRangePicker                 | `value` / `defaultValue`、`onChange`、`min`、`max`、`required`、`disabled`、`name`、`size`                                                       | 两个原生日期输入组成一个 `[开始, 结束]` 值；窄屏纵向排列，触控区域至少 44px                                                 |
| TimeRangePicker                 | `value` / `defaultValue`、`onChange`、`min`、`max`、`step`、`required`、`disabled`、`name`、`size`                                               | 两个原生时间输入组成同日时间区间；可精确到秒，窄屏纵向排列                                                                  |
| Calendar                        | `value` / `defaultValue`、`month` / `defaultMonth`、`onChange`、`onMonthChange`、`minDate`、`maxDate`、`disabledDate`、`renderDate`              | 选中日期使用 `YYYY-MM-DD`，月份使用 `YYYY-MM`；网格支持方向键、Home/End、PageUp/PageDown；日期按钮至少 44px                 |
| ColorPicker                     | `value` / `defaultValue`、`onChange`、`showText`、`size`、`label`、常用 `aria-*`                                                                 | 使用原生颜色控件，统一输出六位小写 hex；保留键盘、系统颜色面板和 44px 触控区域                                              |
| AutoComplete / Cascader         | `options`、`value` / `defaultValue`、`onChange`、`label`；AutoComplete 有 `onSelect`，Cascader 有 `mode`、`allowClear`                           | 自动完成使用 `combobox` + `listbox`；级联选择默认单入口弹层，`mode="inline"` 保留原生分级表单控件                           |
| TreeSelect                      | `treeData`、`value` / `defaultValue`、`onChange`、`multiple`、`showSearch`、`allowClear`、`defaultExpandedValues`                                | 项目树形选择契约；单选或多选，搜索会显示匹配项及其祖先，键盘使用方向键与 Enter，H5 提供 44px 触控区域                       |
| Transfer                        | `items`、`targetKeys` / `defaultTargetKeys`、`selectedKeys` / `defaultSelectedKeys`、`onChange`、`showSearch`、`filterItem`                      | 双栏穿梭框；可见项批量选择、禁用项保护、方向操作、键盘和 H5 单列布局                                                        |
| Upload                          | `accept`、`multiple`、`beforeUpload`、`onFiles`、`disabled`                                                                                      | 仅负责文件入口和筛选；预览、校验、上传进度继续使用 `capabilities/files`                                                     |
| Card                            | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`；`size` 为 default / small                                     | 组合式插槽共享尺寸；小号可继承 ConfigProvider.componentSize                                                                 |
| Empty                           | `title`、`description`、`action`、`image`、`size`                                                                                                | 无数据状态；default / small 尺寸，可继承 ConfigProvider.componentSize；默认插图可替换或隐藏                                 |
| Select                          | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size`、常用 `aria-*` 和焦点事件            | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点                                                            |
| MultiSelect                     | `options`、`value` / `defaultValue`、`onValueChange`、`showSearch`、`allowClear`、`disabled`、`name`、`required`、`size`                         | 项目多选值为 `string[]`；弹层列表支持过滤、方向键、Enter/空格、Escape 和 H5 触控                                            |
| Dialog / Modal / Sheet / Drawer | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                                                  | `Modal`/`Drawer` 是项目 API 的 AntD 语义别名；焦点、Escape、背景滚动和 H5 底部面板由内部统一处理                            |
| Dropdown / Tooltip / Popover    | `Dropdown(items, trigger)`；`Tooltip(title, children)`；`Popover(content, children, title?, label?, placement?)`                                 | 菜单支持 Enter、空格、上下方向键和 Escape；气泡内控件接续触发器的 Tab 顺序，提示用于可选信息，必要信息直接展示              |
| Popconfirm / FloatButton        | `Popconfirm(title, description, onConfirm, onCancel)`；`FloatButton(label, position, shape)`                                                     | 确认操作复用 Dialog 焦点管理；浮动按钮保留安全区和 44px 触控尺寸                                                            |
| Toast                           | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                                                      | 应用根部已有 Provider；`variant` 为 default / success / warning / error；系统深色和 H5 安全区由 Provider 处理               |
| Tabs                            | `items`、`value` / `defaultValue`、`onValueChange`、`orientation`、`activationMode`、`label`                                                     | `items` 含 value、label、content、disabled；支持垂直方向、手动激活、键盘导航和窄屏触控；垂直模式为左侧选项、右侧内容        |
| Pagination                      | `page`、`pageSize`、`total`、`onPageChange`、`mode`、`loading`、`disabled`                                                                       | `mode` 为 pages / load-more；页码从 1 开始；禁用时同步锁定页码、条数与跳页；窄屏区域独立滚动                                |
| List                            | `items`、`getKey`、`renderItem`、`loading`、`error`、`onRetry`、`emptyTitle`、`label`、`className`                                               | 语义化列表；加载、空和错误状态保留同一容器、名称与布局类，加载时标记 `aria-busy`                                            |
| Listy                           | `items`、`getKey`、`renderItem`、`itemHeight`、`height`、`overscan`、`onEndReached`、`loading`、`error`、`label`                                 | 固定行高虚拟列表；状态切换保留名称、高度和布局类，数据缩减时修正滚动位置，恢复数据后从首行开始；原生滚动和 H5 触控保留      |
| Table                           | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow`                                        | 列支持 `header`、`align`、`rowScope`；加载、空和错误状态保留表格区域语义，传入 `renderMobileRow` 后手机展示业务定义的卡片行 |
| 公共能力                        | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                                                             | 弹层挂载、异常兜底、响应式容器和统一反馈                                                                                    |
| App / ConfigProvider / Util     | `App`、`useApp()`；`ConfigProvider`、`useConfig()`；`getPrefixCls`、`usePrefixCls`、`warning`、`cx`                                              | 应用级 message / notification / modal.confirm API；弹窗支持确认、取消和回调；主题、方向、尺寸、locale 与前缀配置            |
| ThemeScope                      | `mode`、`density`、`tokens`、原生 div 属性                                                                                                       | 局部浅色/深色、品牌 Token、组件 Token 和紧凑预览；`auto` 继承上级主题                                                       |
| Icon / Typography               | `Icon(name, size, label)`；`Typography(as, variant, tone)`                                                                                       | 图标默认装饰性；有语义时传 `label`；标题通过 `as` 保持正确层级                                                              |
| Stack / Flex / Grid / Divider   | `Stack(direction, gap, align, justify, wrap)`；`Flex` 为 Stack 别名；`Grid(minItemWidth, gap)`；`Divider(orientation)`                           | Grid 根据容器宽度自动换列；竖向分隔线仅用于水平布局                                                                         |
| Splitter                        | `panels`、`sizes` / `defaultSizes`、`onResize`、`onResizeEnd`、`onCollapse`、`orientation`、`step`、`disabled`                                   | 多面板百分比尺寸；相邻面板拖拽、方向键、Home/End、双击重置及折叠；触控命中区至少 44px                                       |
| Masonry                         | `items`、`columns`、`gap`、`onLayoutChange`                                                                                                      | 按最短列排布不同高度内容；按容器宽度响应列数，内容或图片尺寸变化后重新测量                                                  |
| Layout                          | `Layout`、`Layout.Header`、`Layout.Sider`、`Layout.Content`、`Layout.Footer`；Sider 支持断点与受控折叠                                           | 页面结构使用语义元素；窄屏侧栏借助 Sheet 处理焦点、Escape 和背景滚动                                                        |
| Space                           | `direction`、`size`、`align`、`wrap`、`split`                                                                                                    | 默认水平排列；支持数字间距和窄屏换行，分隔符为装饰性内容                                                                    |
| Breadcrumb / Steps              | `Breadcrumb(items, separator, label)`；`Steps(items, current, status, direction, onChange)`                                                      | 使用 `nav`/`ol` 语义；步骤支持键盘激活和当前步骤标记，窄屏可横向滚动                                                        |
| Menu / Anchor / Affix           | `Menu(items, selectedKeys, mode, onSelect)`；`Anchor(links, activeHref)`；`Affix(offsetTop)`                                                     | 菜单支持方向键；页内导航使用原生锚点；Affix 使用 sticky 并保留滚动空间                                                      |
| Checkbox / Radio / Switch       | 原生 input 属性、`label`、`size`、`invalid`；`RadioGroup(options, value, onValueChange, required)`                                               | 原生键盘行为和表单提交；标签提供 44px 触控区域                                                                              |
| Segmented                       | `options`、`value` / `defaultValue`、`onChange`、`size`、`block`、`disabled`                                                                     | 原生单选控件；显式 `value={undefined}` 可清空，非受控选项失效时回退到可用项；支持方向键和窄屏横向滚动                       |
| Rate                            | `count`、`value` / `defaultValue`、`onChange`、`allowClear`、`character`、`tooltips`、`disabled`                                                 | 原生单选控件；显式 `value={undefined}` 保持受控空值；支持方向键、清除和 44px 触控区域                                       |
| Tag / Badge                     | `tone`；`Badge(count, max, dot, label)`                                                                                                          | 数量或标签可被辅助技术读取；Badge 可独立占位，也可附着于控件并跟随 RTL 逻辑末端                                             |
| Image / Skeleton                | 原生 img 属性、必填 `alt`、`fallback`、`preview`；`Skeleton(shape, width, height, label, loading, active, avatar, title, paragraph, round)`      | 图片支持放大预览和加载失败反馈；骨架屏有状态标签，内容形态支持头像、标题、段落及加载结束后展示真实内容                      |
| ImagePreviewGroup               | `items`、`current` / `defaultCurrent`、`onCurrentChange`、`open` / `defaultOpen`、`onOpenChange`、`label`、缩放配置                              | 项目相册以图片数组表示，缩略图与预览地址可不同；键盘切换、触控工具栏和关闭后的焦点恢复共用图片预览实现                      |
| Alert / Spinner                 | `Alert(title, description, tone, action, closable, closeLabel, onDismiss)`；`Spinner(label, size)`                                               | 错误与警告用 alert，其他状态用 status；可关闭提示保留 44px 操作区域；加载状态有可访问名称                                   |
| Spin                            | `spinning`、`delay`、`tip`、`label`、`size`、`fullscreen`                                                                                        | 可包裹局部内容或全屏展示；加载时内容不可操作，延迟用于避免短任务闪烁                                                        |
| Watermark                       | `content`、`image`、`markSize`、`gap`、`offset`、`rotate`、`opacity`、`fontSize`、`onRemove`                                                     | 在内容上重复绘制非交互水印；文字颜色跟随语义变量，图片加载失败时回退文字                                                    |
| BorderBeam                      | `children`、`color`、`duration`、`borderWidth`、`anchor`、`reverse`、原生 div 属性                                                               | 装饰性动态边框；内容保持原有语义、键盘和触控行为，系统减少动态效果时停止动画                                                |
| QRCode                          | `value`、`size`、`color`、`bgColor`、`bordered`、`errorLevel`、`icon`、`iconSize`、`status`、`statusRender`、`onRefresh`、`type`                 | 支持 SVG / Canvas、真实 QR 模块、加载与失效状态；状态操作和触控目标至少 44px                                                |
| Tour                            | `steps`、`open`、`current`、`onChange`、`onClose`、`onFinish`、`mask`、`keyboard`、`placement`、`gap`、`scrollIntoViewOptions`                   | 目标高亮、遮罩、左右方向键和 Escape；卡片操作与触控目标至少 44px                                                            |
| Progress / Result               | `Progress(percent, status, type, showInfo, steps, gapDegree, gapPlacement)`；`Result(status, title, subTitle, extra, children)`                  | 进度值限制在 0–100 并暴露单一 progressbar；支持线性、圆环、仪表盘及分段；结果状态提供明确文本、操作和错误详情               |
| Toast / Message / Notification  | `toast(options)`；`message.open/success/warning/error(content)`；`notification.open/success/warning/error({ message, description?, duration? })` | 共用 Provider 和安全区配置；页面不直接依赖 Sonner                                                                           |
| Collapse                        | `items`、`activeKey` / `defaultActiveKey`、`accordion`、`size`、`collapsible`、`destroyOnHidden`、`classNames`                                   | 标题/图标开合、独立操作区、内容保留、方向键导航、动态焦点恢复及 RTL                                                         |
| Avatar                          | `src`、`srcSet`、`alt`、`label`、`size`、`shape`、`icon`、`gap`、`onError`                                                                       | 头像保留单一可访问名称，失败后回退到图标或文字；长文字自动缩放，尺寸可响应断点                                              |
| Descriptions                    | `items`、`column`、`bordered`、`layout`、`size`、`title`、`extra`、`colon`、`emptyText`、`classNames`                                            | `dl/dt/dd` 保持一份阅读顺序；响应式列数和跨度、整行剩余填充、统一尺寸、RTL 与空状态                                         |
| AvatarGroup                     | `items`、`maxCount`、`size`、`shape`、`label`                                                                                                    | 重叠展示成员，溢出按钮支持键盘和触控打开公共 Popover 查看其余成员，布局跟随 RTL                                             |
| Statistic                       | `title`、`value`、`precision`、`prefix`、`suffix`、`locale`、`formatter`、`loading`                                                              | 数值按 ConfigProvider.locale 分组格式化，加载时提供可访问骨架                                                               |
| Timeline                        | `items`、`mode`、`orientation`、`reverse`、`variant`、`labelWidth`、`label`、`emptyText`、`classNames`                                           | 原生有序列表；两侧与交替布局、水平滚动、容器响应式、加载与文字状态、动态焦点恢复                                            |
| Carousel                        | `items`、`index` / `defaultIndex`、`autoplay`、`dots`、`dotPlacement`、`effect`、`infinite`、`adaptiveHeight`、`ref`                             | 受控轮播、四向指示点、两种动效、键盘/手势切换、播放进度及隐藏内容焦点恢复                                                   |
| Tree                            | `treeData`、`expandedKeys`、`selectedKey` / `selectedKeys`、`checkedKeys`、`checkStrictly`、`multiple`、`classNames`                             | 选择和勾选独立；父子传导与半选、禁用边界、严格勾选、唯一 Tab 入口、RTL 键盘与空状态                                         |

`Progress` 的 `type` 可选 `line`、`circle`、`dashboard`。`steps` 可传数字或 `{ count, gap? }`；`gap` 单位为 px，线性默认间距为 4px，圆环及仪表盘默认间距为 2px，最多渲染 100 段。圆环与仪表盘的 `strokeWidth` 沿用项目的像素单位。仪表盘 `gapDegree` 默认 75°、限制在 0–295°，`gapPlacement` 默认 `bottom`，`start` / `end` 跟随 ConfigProvider 的 LTR/RTL 方向。所有形态只暴露一个 `progressbar`，百分比文本由 `format` 控制。

`Result.children` 用于展示复杂错误详情或后续说明，位于 `extra` 操作区之后，并使用主题背景承载内容。结果区由标题提供可访问名称，默认及自定义图标均作为装饰内容隐藏，避免重复播报。

`Skeleton` 默认保留单块占位；`shape="content"` 明确启用组合骨架屏。`avatar` 可传布尔值或 `{ size, shape }`，`title` 可传布尔值或 `{ width }`，`paragraph` 可传布尔值或 `{ rows, width }`；段落宽度可为单值或按行数组。`loading={false}` 直接渲染 `children`，加载时真实内容不进入焦点顺序。`active` 默认开启脉冲动画，可关闭，系统减少动态效果时停止动画。

`Image` 默认允许点击或键盘打开预览，纯展示图片可传 `preview={false}`；原生属性、`className` 和事件仍作用于图片，`containerClassName` 调整预览入口。`preview` 对象支持独立大图 `src`、`open` / `defaultOpen` / `onOpenChange`、`label`、`maxScale`、`scaleStep`、`wheel` 和 `maskClosable`。缩放默认范围为 1–8 倍，`maxScale` 最大为 50，默认每步乘以 1.5；滚轮与点击空白关闭可独立禁用。

`ImagePreviewGroup.items` 为 `{ src, alt, thumbnailSrc? }[]`，`current` 从 0 开始，并限制在当前图片范围。预览支持放大、缩小、左右旋转、水平和垂直翻转、重置，以及指针拖动和双指缩放。左右方向键切换相册并跟随 RTL；加减键缩放、0 重置、Shift 加方向键移动放大后的图片。预览复用主题 Portal 和 Radix 焦点、滚动管理；关闭后回到打开入口，图片加载失败时显示可重试错误状态。

`Avatar` 的 `size` 保留项目的小号 32px、默认 40px、大号 56px，也支持像素数或 `{ xs, sm, md, lg, xl, xxl }`。响应式值对应 Tailwind 的基础、640、768、1024、1280、1536px 断点，缺失值沿用较小断点尺寸。字符头像按实际容器宽度缩放，`gap` 为左右留白，默认 4px。图片原生配置（`srcSet`、`sizes`、`loading`、`crossOrigin`、`referrerPolicy`、`draggable`）传给内层图片；失败后按 `icon`、`children`、默认用户图标的顺序回退。`onError(event)` 返回 `false` 可接管回退，图片源或 `srcSet` 改变后重新尝试加载。

`AvatarGroup` 使用 `{ key, label, ...头像属性 }[]`，`maxCount` 为最多显示的成员头像数，溢出按钮另占一个位置；设为 0 时全部成员进入弹层。组内统一 `size` 和 `shape`，逻辑方向重叠适配 RTL，过长的组可在自身内横向滚动。溢出按钮至少 44px，点击或 Enter/空格打开公共 Popover，Escape 关闭并恢复按钮焦点；弹层明确显示每位隐藏成员的名称。空数组显示“暂无成员”。

`Descriptions` 展示只读字段，用标题命名区域，以原生 `dl` 中的 `dt/dd` 配对表达标签和内容；`extra` 可放置项目操作按钮。`size` 为 default / small / large，未指定时继承 ConfigProvider.componentSize。响应式以描述列表自身容器宽度为依据，PC 窄卡片也能回退为单列。`column` 为数字时，容器宽度在 640px 以下固定单列，其余断点使用指定列数；也可传 `{ xs, sm, md, lg, xl, xxl }`，对应基础、640、768、1024、1280、1536px 容器断点，缺失值沿用较小断点（基础默认为 1）。

描述项 `span` 可为列数、`filled` 或相同断点对象。数字跨度限制在当前列数内，剩余空间不足时移到下一行；`filled` 占满当前行剩余部分，每行末项自动补足空列。垂直布局用 subgrid 对齐同一行的标签与内容，边框和长文本换行使用 Tailwind 语义变量；没有额外的移动端 DOM 副本。`colon` 控制无边框标签后的可见冒号，边框布局不显示冒号。`classNames` 可覆写 root、header、title、extra、body、item、label、content 的 Tailwind 类，单项也支持 `className`、`labelClassName`、`contentClassName`。空数组显示公共 Empty，`emptyText` 默认为“暂无详情”，标题和操作仍保留。

`BackTop` 在 `FloatButton` 之上提供回顶行为：`target?: () => Window | HTMLElement | null` 指定滚动目标，`visibilityHeight` 默认为 400px，`showProgress` 可显示进度环，`behavior` 默认为平滑滚动。系统要求减少动态效果时改用即时滚动；位置、安全区和至少 44px 的触控尺寸沿用 `FloatButton`。

`FloatButtonGroup` 用 `items: { key, label, icon, disabled? }[]` 组织浮动操作，`onSelect(key)` 接收操作键。`trigger` 为 `always`（默认）、`click` 或 `hover`；菜单模式支持 `open` / `defaultOpen` / `onOpenChange`、`placement` 和 `shape`。`position` 可选页面四角并遵守安全区；菜单朝向遇到相邻视口边缘时自动改到相反方向。展开后使用正常 Tab 顺序，Escape 关闭并返回触发器；触屏可点击触发器。

`FloatButton` 的 `tooltip` 和 `badge` 复用项目提示与徽标组件；按钮始终保留 `label` 作为可访问名称，`badge.label` 可单独说明数量。`containerClassName` 用于调整固定容器的位置，`className` 只调整按钮外观；`/__ui` 展示两者组合及 H5 安全区。

`FloatButton` 传入 `href` 时渲染原生链接，`linkTarget` 指定新页等浏览器目标；`_blank` 默认加入 `noopener noreferrer`，也可显式传入 `rel`。链接保留 `variant`、图标、提示和徽标；`disabled` 或 `loading` 时移除 `href` 与 Tab 入口，并提供 `aria-disabled` 或 `aria-busy`。无 `href` 时仍是原生按钮，BackTop 只接受按钮属性。

`Table` 默认沿文字方向的起始侧对齐表头与单元格；列的显式 `align="left"`、`"center"`、`"right"` 使用指定的物理方向。传入 `renderMobileRow` 后，窄屏展示列表视图，桌面展示表格视图。

`TableColumn.sorter(left, right)` 启用本地稳定排序；交互依次切换升序、降序和原始顺序。`sort` / `defaultSort` 使用 `{ columnKey, direction }`，`onSortChange` 接收新状态或 `null`；受控模式由调用方更新 `sort`。复杂表头可传入 `sortLabel` 作为排序按钮名称。桌面表头使用 `aria-sort`，配置 `renderMobileRow` 后手机卡片上方提供同一排序操作。

`Table.selection` 支持 `selectedKeys` / `defaultSelectedKeys`、`onChange(keys, currentRows)`、`disabled(row)` 和 `getLabel(row)`。全选只影响当前传入的可用行，保留其他页及禁用行的选中键；回调中的 `currentRows` 只包含当前 `rows` 内选中的记录。桌面选择列与手机卡片共用状态，部分选中时全选框呈混合状态。`Checkbox` 的 `indeterminate` 和 `hideLabel` 用于这类紧凑选择入口。

`TableColumn.filterOptions` 提供 `{ value, label, matches(row) }`，表头和手机工具栏共用筛选弹层。`filters` / `defaultFilters` 使用列键到值数组的映射，`onFiltersChange` 接收新映射；应用或重置后弹层触发器恢复焦点，筛选与排序、行选择按当前显示行协作。

筛选后无匹配行时，Table 保留桌面表头和 H5 筛选工具栏，空状态提示用户调整或清空筛选条件；筛选触发器仍可操作，恢复数据后焦点回到触发器。

`Input` 和 `Textarea` 的 `allowClear` 在有值且未禁用时显示 44px 清空按钮；清空会触发真实的 `input` 事件，使 `onValueChange('')` 和 `onChange` 均收到空值，非受控值立即显示为空并恢复输入焦点。`clearLabel` 可定制按钮名称，受控值仍由外部更新；两者均可作为 `FormItem` 的 `onValueChange` 控件。两者还支持 `variant`（outlined、filled、borderless、underlined）和 `status`（error、warning），状态使用主题 Token 表现。

未受控的 `Input`、`Textarea`、`SearchInput` 在原生 `<form>` 重置时恢复初始 `defaultValue`，并同步清空按钮状态；重置不会触发值变更回调。受控值继续由调用方负责。

`Select` 和 `MultiSelect` 使用相同的 `variant` 和 `status` 字段契约；`status="error"` 同时暴露 `aria-invalid="true"`，便于表单校验和辅助技术识别。

`Card` 保留 `CardHeader` / `CardContent` 等组合 API，同时支持 `title`、`extra`、`cover`、`actions`、`hoverable`、`loading`、`bordered` 和 `size`。小号尺寸会同步收紧标题、Header、Content、Footer 与加载骨架屏；未指定时继承全局小号配置，加载状态提供 `role="status"`。

`Button` 在原有 `variant`、`size`、`loading` 基础上支持 `danger`、`block`、`shape`（default、round、circle）以及 `icon` / `iconPosition` 插槽；`danger` 会优先使用错误主题色。

`InputNumber`、`DatePicker`、`TimePicker`、`DateRangePicker`、`TimeRangePicker` 和 `AutoComplete` 同样支持 `variant` 与 `status`；错误状态通过 `aria-invalid` 传递，日期和时间控件仍使用浏览器原生键盘与触控选择器。

`InputNumber` 输入期间保留原始数字草稿，`onChange` 会收到当前数值或清空时的 `undefined`；失焦时再按 `min` / `max` 限制数值，并在修正后再次调用 `onChange`。受控用法可传入 `value={undefined}` 表示空值，并在 `onChange` 中同步更新。

`DateRangePicker` 以 `YYYY-MM-DD` 字符串元组表示范围，清空任一端保留另一端；若新选日期越过另一端，会清空另一端以避免倒序。`name` 将完整元组以 JSON 数组字符串提交。两个原生日期输入都支持浏览器键盘和 H5 日期选择器。与 `FormItem` 配合时传入 `emptyValue={[]}`；如果提交必须同时包含起止日期，应另加 `validator` 检查两个端点。

`TimeRangePicker` 使用相同的 `[开始, 结束]` 值契约，时间为浏览器原生 `HH:mm` 或含秒字符串；默认表示同一天，越过另一端时清空另一端。`step` 以秒为单位传给两个时间控件。跨午夜区间应由业务使用日期和时间组合表示。与 `FormItem` 配合时同样使用 `emptyValue={[]}` 和完整区间校验。

`InputOTP` 的左右方向键按格子的视觉顺序移动焦点；方向默认跟随 `ConfigProvider.direction`，也可通过原生 `dir` 属性覆盖。RTL 格子顺序和 44px 触控区域在 `/__ui` 中预览。

`FormItem.emptyValue` 指定未设置值或重置后的控件空值，默认 `''`；布尔字段继续使用 `false`。数组值控件（如多选 `TreeSelect` 和 `Cascader`）应传入 `emptyValue={[]}`，避免初始空字符串被解释为选中项。表单存储在用户选择前仍保持未设置状态。

`FormRule.required` 将布尔 `false` 视为未完成；同意条款等复选框用 `valuePropName="checked"` 接入 `FormItem` 后，未勾选和重置后的状态均不会通过必填校验。`/__ui` 提供键盘与 H5 触控示例。

`AutoComplete` 根据选项 `value` 过滤候选；`onChange` 接收输入或选中的字符串，`onSelect(value, option)` 只在选中建议时调用。候选项可设置 `disabled`。输入框保留焦点，通过上下方向键浏览、Enter 选择、Escape 关闭；候选面板在主题作用域内浮动，H5 可直接触控选择。

`MultiSelect` 使用与单选 `Select` 相同的 `{ value, label, disabled? }` 选项，`onValueChange` 返回去重后的字符串数组。选中后弹层保持打开，可继续选择或再次点选移除；`showSearch` 过滤选项，禁用项不可操作。`allowClear` 提供独立 44px 清空按钮。传入 `name` 时以 JSON 数组字符串提交；连接 `FormItem` 时使用 `trigger="onValueChange"`、`emptyValue={[]}` 和 `rules` 校验。

单选 `Select.allowClear` 在有值且可用时显示独立 44px 清空按钮；清空后 `onValueChange('')`，非受控值显示占位文字、原生表单不再提交该字段，并把焦点还给触发器。传入 `label` 可为清空按钮生成具体的可访问名称；受控值仍由外部 `value` 决定。

`Pagination` 可选 `onPageSizeChange(size, page)`、`pageSizeOptions`、`showQuickJumper` 和 `showTotal`。切换每页条数时，`page` 指向原先第一条记录所在的新页，由调用方同步更新 `pageSize` 和 `page`；快速跳页只接受当前范围内的整数，错误会在输入框旁显示。加载时这些控件不可操作，`load-more` 模式维持单按钮入口。

`ErrorState.onRetry` 接受同步或异步回调；等待期间重试按钮进入忙碌并禁用状态，失败后保留错误提示和再次重试入口。List、Listy、Table 共用这一约定。

`Cascader` 默认使用单个触发器显示路径，在主题作用域弹层中逐级选择；选到叶节点后关闭并恢复焦点。弹层支持 Escape、正反向 Tab、外部点击和 H5 触控。`allowClear` 在有有效路径时提供独立的键盘和触控清空按钮；`mode="inline"` 保留多级原生选择框，适合需要浏览器原生 `required` 校验的表单；弹层模式以 `aria-required` 表达必填，应使用 `FormItem.rules` 校验。`onChange` 返回从第一级开始的有效路径；选择“请选择”会截断该级及其后续路径，根级清空返回 `[]`。选项移除或禁用时暂时显示最后有效的前缀，原选项恢复后可恢复未被用户改动的选择。传入 `name` 时，表单以 JSON 数组字符串提交完整有效路径。

`TreeSelect` 的左右方向键随 `ConfigProvider.direction` 调整展开和折叠方向，弹层在独立 Portal 容器中也保留 RTL。多选 `allowClear` 清空后关闭弹层并把焦点还给触发器。

`Tabs` 在非受控模式下会在当前项被移除或禁用时显示第一个可用面板；原项重新可用后会恢复之前的选择。若键盘焦点停在被移除或禁用的标签上，焦点会转到当前可用标签。受控模式仍以传入的 `value` 为准。

`Transfer.items` 的 `key` 必须唯一。`onChange(nextTargetKeys, direction, movedKeys)` 在移动后调用；`direction` 为 `to-target` 或 `to-source`。搜索只影响当前可见项和“全选可见项”，已勾选但被搜索隐藏的项目仍可移动。自定义 `filterItem` 收到去除首尾空格并转为小写的查询词。横向排列时箭头跟随 `ConfigProvider.direction`；窄屏上下排列时改用上下箭头，移动方向语义保持一致。

`Anchor` 默认跟踪同页 `#id` 目标的滚动位置，并以 `aria-current="location"` 标记当前章节；`offsetTop` 用于固定页头的判定偏移。传入 `activeHref` 后由业务控制高亮；点击链接仍保留浏览器原生锚点跳转，`onChange` 在点击或自动切换当前章节时收到链接地址。

滚动跟踪同时观察文档捕获阶段的滚动事件和目标可见性变化，保证浏览器程序滚动或嵌套滚动容器中的章节切换仍能刷新当前链接。

`Steps` 可用 `current` 受控，也可用 `defaultCurrent` 初始化内部步骤；提供 `onChange` 后步骤可点击，禁用项仍以禁用按钮和 `aria-disabled` 暴露。当前步骤使用 `aria-current="step"`，各步状态通过辅助文字说明。

`Spinner` 和 `Spin` 共用小号 16px、默认 24px、大号 36px 的 Tailwind 指示器尺寸，并继承 `ConfigProvider.componentSize`。两者以可访问状态名称报告加载，系统启用减少动态效果时停止旋转。

`Tree` 保留 `selectedKey` / `defaultSelectedKey` 和 `onSelect(key)` 的单选 API；数组契约使用 `selectedKeys` / `defaultSelectedKeys`、`onSelectionChange(keys, { node, selected })`，`multiple` 开启逐项追加或移除。选择与焦点独立，方向键只移动焦点；显式 `selectedKey={undefined}` 或 `selectedKeys={[]}` 表示受控空选择，单选模式最多显示第一个有效键。全局 `selectable` 和单项 `selectable={false}` 关闭节点选择，不影响展开和勾选。

`checkable` 显示节点复选标记，`checkedKeys` / `defaultCheckedKeys` 与节点选择相互独立；`onCheck(keys, { node, checked, halfCheckedKeys })` 返回按树数据顺序排列的勾选键与半选键。默认父子关联，勾选父节点会选中可用后代，子节点全部勾选时父节点勾选，部分勾选时父节点半选。单项 `disabled`、`disableCheckbox` 和 `checkable={false}` 是勾选传导边界，父级操作不会改变该分支；边界下面的可用子节点仍可独立勾选。外部显式勾选的禁用节点保留自身状态，不传导。`checkStrictly` 关闭父子关联，可通过 `halfCheckedKeys` 显式提供严格模式下的半选状态；`disableCheckbox` 仅禁用勾选，仍可选择或展开节点，并提供可访问说明。

展开使用 `expandedKeys` / `defaultExpandedKeys` 和 `onExpand(keys)`。`defaultExpandAll` 只在首次挂载时展开当前所有父节点；`defaultExpandParent` 默认开启，初始化时展开指定节点的可用祖先；`autoExpandParent` 可让受控展开键自动补齐祖先，关闭父节点时会从请求中移除对应后代键，避免被自动展开立即还原。全局 `disabled` 同步关闭展开、勾选和选择。非受控状态清理已删除的键，已勾选父节点新增的可用后代会跟随勾选。

树保留原生 `tree` / `treeitem` / `group` 层级和一个 roving Tab 入口，层级、兄弟位置、选择及勾选状态通过 ARIA 暴露；复选标记是该树项的触控入口，不额外增加 Tab 停靠点。空格切换勾选，Enter 选择；未显示复选框的节点空格仍可选择。上下键浏览、Home / End 到首尾、左右键展开/返回父级并随 RTL 反向；字符输入在当前可见可用节点间查找，可连续输入或重复首字母循环。节点的交互内容保留原生操作。被删除、关闭或禁用的焦点节点恢复到最近可用祖先，其次首个可用节点，全部不可用或空数据时回到根容器；外部焦点不被抢走。

`showLine` 显示按逻辑方向连接的分支线，`showIcon` 显示节点的装饰性 `icon`（缺省使用公共文件夹/文件图标），`switcherIcon({ node, expanded, direction })` 自定义展开图标。`blockNode` 默认开启以兼容原有整行标题，可关闭为内容宽度。长标题换行，深层缩进限制在容器的 25% 以内，触控入口至少 44px；展开图标的旋转尊重减少动画。`label` 命名树，`emptyText` 默认为“暂无节点”。`classNames` 支持 root、item、row、switcher、checkbox、icon、title、group，单项支持局部类名。`/__ui` 展示关联/严格勾选、多选/单选、禁用边界、长标题、窄容器、动态删除、RTL 深色、默认展开祖先和空数据。

Carousel 的 `items` 保持项目 ReactNode 数组 API；有状态的内容传稳定 React `key`，每项只挂载一次，切换后保留表单值。非活动幻灯片使用 `inert` 和 `aria-hidden`，动效期间也不进入焦点与辅助技术阅读顺序。`index` / `defaultIndex` 使用从零开始的索引，越界值限制到当前范围，非有限值回到首项；非受控状态会清理数据缩减后的索引，受控状态不回写父值。

`dots` 默认显示一个可 Tab 到达的当前页码入口，四向 `dotPlacement` 为 `top` / `bottom` / `start` / `end`，逻辑位置跟随 RTL；点击或方向键选择页码，Home / End 到首尾。幻灯片区域也支持左右键和 Home / End，内容中的输入、链接与按钮保留原生键盘行为。`arrows` 默认保留原有上一项/下一项入口；`infinite={false}` 到首尾时禁用相应按钮，自动播放在末项停止，再次开始会回到首项。

`effect` 为 `scroll`（默认）或 `fade`，`speed` 默认 300ms；切换使用原生 Web Animations，系统减少动画时直接显示最终状态。`adaptiveHeight={false}` 默认保留所有幻灯片所需的最高高度，设为 true 则跟随当前内容，不对高度做过渡。`swipe` 默认开启触控横向滑动，`draggable` 默认关闭鼠标拖拽；纵向手势保留页面滚动，表单、链接和 `data-carousel-no-swipe` 区域不被手势接管。

`onBeforeChange(current, next)` 和 `onChange(next)` 处理切换请求；`onAfterChange(current)` 在实际显示索引改变并完成动效后调用，被新索引替代的旧动效不回调；动效中途改变效果、方向或减少动画配置时，当前可见项直接完成并回调一次。`ref` 使用项目 `CarouselHandle`：`next()`、`prev()`、`goTo(index, { animate?: boolean })`，`animate: false` 跳过该次动效。受控模式下这些方法仍需父级更新 `index`；数据缩减后显式调用 `goTo(0)` 可以通过 `onChange(0)` 清理父级越界值，即使当前显示已被限制在首项。

开启 `autoplay` 后，焦点、鼠标进入或触控会暂停轮转，并提供暂停/恢复按钮；系统启用减少动态效果时默认不自动轮播，用户明确恢复后才开始。若启用播放时焦点已经在内容内，保持暂停；文档隐藏时停止计时，恢复可见后从新的完整间隔开始。`interval` 默认 4000ms，正值至少 100ms，非有限或非正值回退到默认值。`dotProgress` 展示当前指示点的装饰性进度，暂停时停止动效；减少动画时不绘制进度动画。

`label` 命名轮播区域，`emptyText` 定义空数据文案；单项数据不显示切换控制。`classNames` 提供 `root` / `viewport` / `slide` / `controls` / `arrow` / `dots` / `dot` / `status` / `rotation` 的 Tailwind 插槽。隐藏当前焦点所属内容、删除或禁用焦点所在的导航控件时，焦点恢复到轮播区域；外部焦点不被抢走。`/__ui` 展示两种动效、四向页码、有限循环、表单草稿、动态缩减、进度、RTL 深色、单项与空数据。

`Timeline.items` 保留项目的 `title`（内容标题）、`children`（详情）和 `dot` API，新增 `label` 表示时间或另一侧辅助信息；不改变旧 `title` 的含义。有动态排序或局部状态时传稳定 `key`，`reverse` 实际倒置 DOM 阅读顺序而不修改输入数组，表单值与焦点不会因倒序重建。

`mode` 为 `start`（默认）、`end` 或 `alternate`，单项 `placement` 可覆写逻辑侧；`orientation` 为 `vertical`（默认）或 `horizontal`。容器宽度不足 640px 时，所有布局回退为节点加单列内容，时间标签放在标题之前；基于容器宽度，不依赖视口宽度。宽容器内，竖向布局把时间标签与内容放在轴的两侧，交替或跨侧覆写时轴居中；水平布局以 subgrid 对齐节点和连接线，内容与标签位于轴上下两侧，单项至少 12rem，多项在列表内横向滚动。

`labelWidth` 控制竖向单侧布局的标签列宽，默认为 `'28%'`；数字和 `px` 字符串为像素，也接受百分比字符串。实际标签列限制在 5rem 至容器的 40% 之间，交替布局使用两侧等宽。`variant` 为 `outlined`（默认）或 `filled`，节点使用项目语义颜色 `primary` / `success` / `warning` / `error` / `gray`；`loading` 提供旋转标记和 `aria-busy`，相邻连接线使用虚线，减少动态效果时停止旋转。`dot` 是装饰性标记，不放交互内容；`statusText` 可指定可访问状态文字，否则根据颜色和加载状态生成，不依赖颜色传达状态。

`label` 命名时间轴区域，内部原生 `ol` 保持唯一阅读顺序；只有实际横向溢出时，列表才进入 Tab 顺序并关联方向键滚动说明；左右键按物理方向滚动，Home / End 到逻辑首尾，移动 WebKit 也由组件显式处理键盘滚动。内容按钮和输入保留原生键盘行为与触控。焦点所属内容被删除或禁用时恢复到首个可用操作，空数据时恢复到根容器；外部焦点不被抢走。`emptyText` 默认为“暂无记录”，空数组复用公共 Empty，单项不显示连接线。

`classNames` 支持 `root` / `list` / `item` / `marker` / `dot` / `rail` / `label` / `title` / `content` 的 Tailwind 插槽，单项可传 `className` 和除 root / list 外的局部 `classNames`。原生属性、style 和焦点事件传给根容器，方向默认继承 ConfigProvider。`/__ui` 展示布局切换、倒序、标签宽度、长文本、自定义标记、加载/错误与内容操作、水平长列表、PC 窄容器、RTL 深色、单项和空数据。

Menu 的受控展开 API 为 `expandedKeys`、`defaultExpandedKeys` 和 `onExpand`；多级菜单使用方向键展开、收起和移动焦点，禁用项不会被方向键选中。Menu 只有一个 Tab 入口，焦点菜单项通过 roving `tabIndex` 暴露。横向菜单的子菜单通过主题作用域内的 Portal 显示，避开卡片裁切边界；Escape 返回触发项，点击外部关闭。

## 主题变量

设计变量按 **Seed → 语义 Map/Alias → 组件 Token** 组织。`--ui-seed-*` 控制品牌色、状态色和圆角；`--ui-map-*` 控制浅色/深色的表面、文字和边框，其中主色悬停/按下色及高亮色从主色 Seed 派生；`--ui-button-*`、`--ui-field-*`、`--ui-card-*`、`--ui-overlay-*`、`--ui-menu-*` 是组件级覆写点。既有 `--primary`、`--card` 等变量仍作为 Alias 使用，业务无需改动。

```tsx
<ThemeScope mode="dark" density="compact" tokens={{ primary: '#4096ff' }}>
  <Button>局部主题按钮</Button>
</ThemeScope>
```

组件 Token 使用项目自己的 `components` 分组，不把底层库的主题字段暴露给业务：

```tsx
<ThemeScope
  tokens={{
    components: {
      button: { radius: '999px' },
      field: { height: '48px' },
      card: { radius: '1rem' },
      overlay: { radius: '1.25rem' },
      menu: { radius: '0.75rem' },
      segmented: { radius: '0.5rem', height: '46px' },
      transfer: { radius: '0.75rem', listHeight: '16rem' },
    },
  }}
>
  {/* 只影响这个作用域内的组件 */}
</ThemeScope>
```

`auto` 跟随系统深浅色；`light` 和 `dark` 仅作用于当前 `ThemeScope`。十六进制主色会派生对比度达标的按钮文字、悬停与按下色；成功、警告和错误 Seed 会同时派生徽标与危险操作所需的状态前景色。其他 CSS 颜色格式需显式提供 `onPrimary`、`onSuccess`、`onWarning` 或 `onError`，`onAccent` 可覆写柔和高亮的文字色。Dialog、Sheet、Select、Dropdown、Popover、Tooltip 和项目的 `Portal` 默认挂载到最近的主题作用域；配置 `ConfigProvider.getPopupContainer` 后，这些弹层会挂载到该容器。Toast 由应用根部的 Provider 统一管理。紧凑模式缩小内容间距，交互控件仍保持至少 44px 的触控高度。完整状态可在 `/__ui` 中切换查看。

`ConfigProvider.direction="rtl"` 会传入 Select 的底层键盘导航，并明确设置 Select、Dialog、Sheet、Dropdown、Popover、Tooltip 弹层的文字方向；即使弹层挂到配置的外部容器，方向也不依赖该容器继承。Select 的选项内边距和选中标记使用 Tailwind 逻辑方向工具类。

嵌套 `ThemeScope` 的 `auto` 模式继承上层颜色和组件 Token；内层指定 `density="default"` 时会恢复常规间距。内层提供自己的 Seed 或组件 Token 时，仅覆写对应值。

Checkbox、Switch 和 RadioGroup 自带可访问标签。需要显示校验错误时，用 `FormField` 包裹它们并省略外层 `label`，避免重复或嵌套的标签；`description` 和 `error` 会关联到 input 或单选组。普通 Input、Textarea、Select 仍由 `FormField.label` 提供可见标签。

`Form` 的异步规则使用同一份值快照校验；输入在校验期间变化时会重新校验最新值，旧结果不会覆盖新错误状态。`onFinishFailed(errors, values)` 只处理字段规则错误；`onFinish` 的同步异常或 Promise 拒绝交给 `onFinishError(error, values)`。如需处理保存失败，应提供 `onFinishError` 并在其中展示反馈。`resetFields()` 会恢复初始值、清除后来新增的字段和错误，并取消尚未完成的校验及提交；命令式 `validateFields()` 在此时以 `AbortError` 拒绝。传入受控 `values` 时，应在 `onValuesChange` 中同步更新它。

`Calendar` 的 `value` 和 `month` 可分别受控；`onChange` 返回本地日期字符串，不经过 UTC 转换。`renderDate` 只放非交互内容；有额外日期信息时同时提供 `getDateDescription`，让读屏器读到完整日期和说明。窄屏时日期表格在组件内部横向滚动，不让页面产生横向溢出。

`Mentions.options` 使用 `{ value, label, disabled? }`；`onChange` 返回完整文本，`onSelect` 返回选中的选项。光标前的前缀需要位于文本起始、空白或左括号之后；插入时保留光标后的内容，并在需要时追加空格。可直接放入 `FormItem`，错误说明由 `FormField` 关联到 textarea。

`Splitter.panels` 使用 `{ key, label, content, minSize?, maxSize?, resizable?, collapsible? }`。`sizes` / `defaultSizes` 为总和 100 的百分比数组；拖拽时只调整分隔条两侧的面板。`onResize` 返回新尺寸，受控模式需在回调中同步更新 `sizes`。键盘方向键按 `step` 调整，Home/End 跳到约束边界，双击分隔条恢复默认比例；折叠按钮会记住展开前的尺寸。

`Layout` 在直接包含 `Layout.Sider` 时使用横向排列，其余情况纵向排列。`Layout.Content` 默认渲染 `main`；在已有 `main` 的预览或嵌套区域中设 `as="div"`。`Layout.Sider` 的断点使用 Tailwind 的 640/768/1024/1280px；低于断点时折叠，展开后借助 `Sheet` 显示导航。`onCollapse(collapsed, source)` 的 source 为 `trigger` 或 `breakpoint`；受控模式需同步更新 `collapsed`。

`Masonry.items` 使用 `{ key, content, column?, estimatedHeight?, className? }`。`columns` 接受固定列数或 `{ base, sm, md, lg, xl }`，断点按组件容器宽度计算；默认 1 / 2 / 3 列。`gap` 接受一个像素值或 `[水平, 垂直]`。组件以最短列分配项目，`column` 可固定某项所在列；`onLayoutChange` 返回每项的 `{ key, column }`。动态内容通过 ResizeObserver 重新排布，DOM 顺序和键盘顺序保持 `items` 顺序。

`Watermark` 只作内容来源提示，不作为防截图或保密机制。`image` 支持同源地址、data URL 或允许跨域读取的地址；图片加载或画布导出失败时优先显示 `content`。覆盖层不可接收指针事件，也不进入辅助技术阅读顺序。主题变化会重新生成水印；覆盖层被移除后会恢复，并调用 `onRemove`。

`QRCode` 默认使用 Canvas，也支持 SVG；`value` 采用字节模式编码，`errorLevel` 为 `L` / `M` / `Q` / `H`。`status="loading"` 和 `status="expired"` 会保留二维码容器并覆盖状态层，`onRefresh` 用于失效后的重新获取。

`Tour.steps` 使用 `{ key, target?, title, description?, cover?, placement?, mask?, type? }`。`target` 可传元素或返回元素的函数；目标为空时卡片居中。开启遮罩时目标周围保留可直接操作的高亮区域，Tab 在卡片和高亮目标之间循环，遮罩区域可点击关闭；卡片或目标尺寸变化时会重新定位。`keyboard` 开启后支持 Escape、左右方向键，步骤切换会调用 `onChange`。`current` / `open` 为受控状态，`onFinish` 和 `onClose` 结束后恢复打开前焦点。

## 折叠面板

`Collapse.items` 使用稳定字符串 `key` 和非交互式 `label`，内容放在 `children`，标题旁的按钮放在 `extra`。`extra` 是展开按钮的兄弟节点，点击不会触发折叠；容器不足 360px 时操作区换行。`size` 为 `small` / `default` / `large`，未传时继承 ConfigProvider；`bordered={false}` 去掉外框，`ghost` 同时移除背景与分隔线。

`activeKey` / `defaultActiveKey` 和 `onChange(keys)` 始终使用字符串数组；`accordion` 最多展开一项。重复和不存在的键会被过滤，再应用单开约束；非受控状态移除面板后清理它的展开键，受控状态只派生当前显示，不自动回调 `onChange`。

`collapsible` 可设为 `header`（默认）、`icon` 或 `disabled`，单项同名字段可以覆写全局值。`disabled` 优先禁止用户开合，但不强制关闭受控展开的面板。`showArrow={false}` 隐藏箭头；与图标触发组合时回退为标题按钮，保留可操作入口。`expandIconPlacement` 为逻辑 `start` / `end`，跟随 RTL；`expandIcon({ key, expanded, disabled, direction })` 自定义装饰图标，不重复播报。

默认内容首次展开才挂载，关闭后保持 DOM 与表单草稿；`destroyOnHidden` 关闭时卸载内容，单项 `forceRender` 则始终挂载并优先于销毁。内容区的 region 外壳始终保留，使 `aria-controls` 在关闭时也指向有效元素；隐藏内容不进入焦点和辅助技术阅读顺序。

展开按钮支持 Enter、空格、上下方向键、Home / End，方向键跳过禁用项并循环；额外按钮、内容输入和嵌套面板各自保留键盘行为。内容关闭、面板删除或焦点所在的触发器禁用后，若焦点仍属于该面板，则恢复到原触发器、首个可用触发器或容器；用户移到外部的焦点保持原位。

`classNames` 可指定 `root` / `item` / `header` / `icon` / `label` / `body` / `extra` 的 Tailwind 类，单项也支持除 `root` 外的同名槽位。空数据使用 `emptyText`（默认“暂无面板”），`label` 命名折叠组。`/__ui` 的独立折叠预览包含尺寸、外观、操作区、内容生命周期、受控动态数据、嵌套、RTL 深色和空状态。

## 使用示例

```tsx
import { useState } from 'react'
import { Button, FormField, Input, toast } from '@/shared/ui'

function Example() {
  const [name, setName] = useState('')
  return (
    <>
      <FormField
        label="名称"
        required
        control={
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        }
      />
      <Button onClick={() => toast({ title: '保存成功', variant: 'success' })}>
        保存
      </Button>
    </>
  )
}
```

`/__ui` 仅在开发模式注册，覆盖默认、禁用、加载、错误、空数据和 H5 布局；文件、AI 任务、音频、视频和完整 Mock 流程也在同一入口验证。第一阶段的范围和退出条件见 [第一阶段收口清单](./phase-one.md)。
