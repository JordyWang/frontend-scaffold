# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。设计变量定义在 `src/shared/styles/tokens.css`，新组件使用 Tailwind 语义工具类；底层依赖集中在这一层。新增组件样式约定见 [组件实现约定](./component-conventions.md)。

| 组件                            | 项目 API                                                                                                                                                  | 约定                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button                          | `variant`、`size`、`danger`、`loading`、`icon`、原生 button 属性                                                                                          | 默认 `type="button"`；危险状态保留外观层级；加载时替换图标并禁用，避免重复提交                                              |
| Input / Textarea                | 原生属性、`invalid`、`size`                                                                                                                               | 转发 ref；`size` 为 default / small / large，输入字号为 16px                                                                |
| Mentions                        | `options`、`value` / `defaultValue`、`onChange`、`onSelect`、`prefix`、`disabled`、原生 textarea 属性                                                     | 从光标前识别提及；方向键、Enter、Escape 与触控选择，候选项支持禁用；弹层继承局部主题                                        |
| SearchInput                     | `value` / `defaultValue`、`onValueChange`、`onSearch`、外观与计数                                                                                         | Enter 与按钮提交搜索；清空保持输入焦点；在 FormItem 中使用 `trigger="onValueChange"`                                        |
| PasswordInput                   | 原生输入属性、受控值、显隐与清空、外观与计数                                                                                                              | 保留原生密码输入及自动填充，显示/隐藏按钮支持键盘且不会提交表单                                                             |
| InputOTP                        | `length`、`value` / `defaultValue`、`onChange`、`onComplete`、`label`、`inputMode`、`mask`、`disabled`、`invalid`、`name`                                 | 分格输入一次性验证码；支持粘贴、方向键和删除，默认数字键盘，单格触控区域至少 44px                                           |
| FormField                       | `label?`、`control`、`description`、`error`、`required`、`id`                                                                                             | 自动连接标签、说明和错误；自带标签的控件省略 `label`                                                                        |
| Form / FormItem                 | `initialValues`、`values`、`onValuesChange`、`onFinish`、`onFinishFailed`、`onFinishError`、`rules`、`valuePropName`、`emptyValue`、`trigger`             | 表单只协调值和校验；控件仍使用项目自己的 API，规则错误通过 FormField 的 `aria-describedby` 暴露                             |
| InputNumber                     | `value` / `defaultValue`、`min`、`max`、`step`、`onChange`、`label`                                                                                       | 原生数字输入；数字草稿、边界、格式与步进由项目统一处理                                                                      |
| Slider                          | `value` / `defaultValue`、`range`、`marks`、`step`、`orientation`、`reverse`、`draggableTrack`、`onChange`、`onChangeComplete`                            | 原生 range 承载值与可访问性，项目处理轨道、键盘和触控；支持单值与有序多点数组                                               |
| DatePicker                      | `value` / `defaultValue`、`onChange`、`mode`、`open` / `defaultOpen`、`panelMonth`、`needConfirm`、`presets`、`disabledDate`、`classNames`                | 日期单位字符串；默认项目弹层，可选常驻面板或原生输入，确认前不提交；键盘、RTL、44px 网格和组合失焦                          |
| TimePicker                      | `value` / `defaultValue`、`onChange`、`mode`、`precision`、`use12Hours`、`needConfirm`、单位步长、禁用回调、`presets`、`classNames`                       | 24 小时本地时间字符串；默认项目时间列面板，可选常驻/原生模式；确认、键盘、RTL 与 44px 触控                                  |
| DateRangePicker                 | `value` / `defaultValue`、`picker`、`onChange`、`mode`、`onCalendarChange`、`needConfirm`、`presets`、`allowEmpty`、`disabledDate`                        | 日期单位起止元组；默认项目双面板，窄容器单面板；独立端点、确认、开放区间、键盘与 44px 触控                                  |
| MultiDatePicker                 | `value` / `defaultValue`、`onChange`、`order`、`needConfirm`、`maxCount`、`maxTagCount`、`renderTag`                                                      | 日期单位数组；同 `DatePicker multiple`，跨月切换、临时选择、逐项删除、44px 触控                                             |
| TimeRangePicker                 | `value` / `defaultValue`、`onChange`、`onCalendarChange`、`mode`、`precision`、`needConfirm`、`order`、`disabledTime`、端点控制、`presets`                | 同日时间元组；默认项目时间列面板，临时范围与提交分离；支持秒、12 小时显示、锁定端点、开放区间与窄容器                       |
| DateTimePicker                  | `value` / `defaultValue`、`onChange`、`onCalendarChange`、`mode`、`precision`、`needConfirm`、`defaultOpenTime`、日期相关禁用回调                         | 完整本地日期时间字符串；同 `DatePicker showTime`，日期/时间共用一次确认，边界时间与跨日步长一致                             |
| DateTimeRangePicker             | `value` / `defaultValue`、`onChange`、`onCalendarChange`、`needConfirm`、`order`、`allowEmpty`、端点控制、`defaultOpenTime`、日期/端点禁用回调            | 完整日期时间元组；同 `DateRangePicker showTime`，跨日、一次确认、锁定端点、JSON 表单提交、响应式日期/时间面板               |
| Calendar                        | `value` / `defaultValue`、`month` / `defaultMonth`、`onChange`、`onMonthChange`、`minDate`、`maxDate`、`disabledDate`、`renderDate`                       | 选中日期使用 `YYYY-MM-DD`，月份使用 `YYYY-MM`；网格支持方向键、Home/End、PageUp/PageDown；日期按钮至少 44px                 |
| ColorPicker                     | `value` / `defaultValue`、`onChange` / `onChangeComplete`、`format`、`mode`、`colorMode`、`disabledAlpha`、`presets`、`allowClear`、`open`、`showText`    | 项目单色/渐变面板支持透明度、Hex/RGB/HSB、色标增删、键盘滑块与触控；规范值保持字符串，原生颜色控件通过显式模式使用          |
| AutoComplete / Cascader         | `options`、`value` / `defaultValue`、`onChange`、`label`；Cascader 支持列式浏览、路径搜索、`changeOnSelect`、`mode`、四向弹层、外观和语义插槽             | 自动完成使用 `combobox` + `listbox`；级联选择默认列式弹层，支持内嵌面板与原生分级表单控件                                   |
| TreeSelect                      | `treeData`、`value` / `defaultValue`、`onChange`、`multiple`、`checkable`、`checkStrictly`、`checkedStrategy`、`maxCount`、`showSearch`、`allowClear`     | 项目树形选择契约；复用公共 Tree 的勾选、键盘和虚拟窗口，搜索保留完整树的选择结果，H5 提供 44px 触控区域                     |
| Transfer                        | `items`、`targetKeys` / `defaultTargetKeys`、`selectedKeys` / `defaultSelectedKeys`、`onChange`、`showSearch`、`filterItem`                               | 双栏穿梭框；可见项批量选择、禁用项保护、方向操作、键盘和 H5 单列布局                                                        |
| Upload                          | `accept`、`multiple`、`beforeUpload`、`onFiles`、`disabled`                                                                                               | 仅负责文件入口和筛选；预览、校验、上传进度继续使用 `capabilities/files`                                                     |
| Card                            | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`；`variant`、`appearance`、`size`、`tabs`、`classNames` / `styles`       | outlined / borderless 外观、内嵌卡片、组合式尺寸和项目 Tabs；小号可继承 ConfigProvider.componentSize                        |
| CardMeta / CardGrid             | `CardMeta(avatar, title, description, headingLevel, classNames, styles)`；`CardGridGroup(columns)`；`CardGrid(hoverable)`                                 | 元信息支持头像与说明；网格随容器宽度排成 1–4 列                                                                             |
| Empty                           | `title`、`description`、`action`、`image` / `imageAlt`、`size`、`classNames`                                                                              | 无数据状态；默认文案与插图可替换，图片 URL、富内容、语义 Tailwind 插槽；尺寸可继承全局配置                                  |
| Select                          | `options`、`value` / `defaultValue`、`onValueChange`、`showSearch`、`filterOption`、`allowClear`；其余字段同输入约定                                      | 选项 `{ value, label, disabled? }`；项目处理搜索文本与输入法，Radix 处理选项键盘与弹层焦点                                  |
| MultiSelect                     | `options`、`value` / `defaultValue`、`onValueChange`、`showSearch`、`allowClear`、`disabled`、`name`、`required`、`size`                                  | 项目多选值为 `string[]`；弹层列表支持过滤、方向键、Enter/空格、Escape 和 H5 触控                                            |
| Dialog / Modal / Sheet / Drawer | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                                                           | `Modal`/`Drawer` 是项目 API 的 AntD 语义别名；焦点、Escape、背景滚动和 H5 底部面板由内部统一处理                            |
| Dropdown / Tooltip / Popover    | `Dropdown(items, trigger, selectionMode, selectedKeys)`；`Tooltip(title, children)`；`Popover(content, children, title?, label?, placement?)`             | 菜单支持分组、分隔线、单选/多选和 Enter、空格、方向键、Escape；气泡内控件接续触发器 Tab 顺序，提示用于可选信息              |
| Popconfirm / FloatButton        | `Popconfirm(title, description, open, defaultOpen, onOpenChange, disabled, showCancel, onConfirm, onCancel)`；`FloatButton(label, position, shape)`       | 确认操作复用 Dialog 焦点管理，支持受控开合和异步确认；浮动按钮保留安全区和 44px 触控尺寸                                    |
| Toast                           | `ToastProvider`、`toast({ id?, title, description?, variant?, duration? })`、`dismissToast(id?)`                                                          | Provider 处理系统深色和 H5 安全区；固定 `id` 可更新同一提示，`loading` 形态默认持续展示                                     |
| Tabs                            | `items`、`value` / `defaultValue`、`onValueChange`、`variant`、`size`、`placement`、增删回调、面板生命周期                                                | 卡片与标签增删、逻辑位置、容器响应式、面板保留/销毁、键盘与触控；详见 Tabs 契约                                             |
| Pagination                      | `page`、`pageSize`、`total`、`onPageChange`、`mode`、`loading`、`disabled`                                                                                | `mode` 为 pages / load-more；页码从 1 开始；禁用时同步锁定页码、条数与跳页；窄屏区域独立滚动                                |
| List                            | `items`、`getKey`、`renderItem`、`header`、`footer`、`size`、`bordered`、`split`、`grid`、`pagination`、`classNames` / `styles`                           | 语义化列表；本地分页和容器网格共用加载、空、错误反馈，加载时标记 `aria-busy`                                                |
| Listy                           | `items`、`getKey`、`renderItem`、`itemHeight`、`height`、`overscan`、`onEndReached`、`loading`、`error`、`label`                                          | 固定行高虚拟列表；状态切换保留名称、高度和布局类，数据缩减时修正滚动位置，恢复数据后从首行开始；原生滚动和 H5 触控保留      |
| Table                           | `columns`、`rows`、`getRowKey`、`caption`、`dataMode`、`size`、`bordered`、`rowHoverable`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow` | 列支持 `header`、`align`、`rowScope`；加载、空和错误状态保留表格区域语义，传入 `renderMobileRow` 后手机展示业务定义的卡片行 |
| 公共能力                        | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                                                                      | 弹层挂载、异常兜底、响应式容器和统一反馈                                                                                    |
| App / ConfigProvider / Util     | `App`、`useApp()`；`ConfigProvider`、`useConfig()`；`getPrefixCls`、`usePrefixCls`、`warning`、`cx`                                                       | 应用级 message / notification / modal.confirm API；弹窗支持确认、取消和回调；主题、方向、尺寸、locale 与前缀配置            |
| ThemeScope                      | `mode`、`density`、`tokens`、原生 div 属性                                                                                                                | 局部浅色/深色、品牌 Token、组件 Token 和紧凑预览；`auto` 继承上级主题                                                       |
| Icon / Typography               | `Icon(name, size, label)`；`Typography(as, variant, tone, copyable, editable, ellipsis)`                                                                  | 图标默认装饰性；标题通过 `as` 保持层级，文字支持复制、编辑、容器省略与展开/收起                                             |
| Stack / Flex / Grid / Divider   | `Stack(direction, gap, align, justify, wrap)`；`Flex` 为 Stack 别名；`Grid(minItemWidth, gap)`；`Divider(orientation, variant, children)`                 | Grid 根据容器宽度自动换列；Divider 支持标题、线型与竖向分隔                                                                 |
| Splitter                        | `panels`、`sizes` / `defaultSizes`、`onResize`、`onResizeEnd`、`onCollapse`、`orientation`、`step`、`disabled`                                            | 多面板百分比尺寸；相邻面板拖拽、方向键、Home/End、双击重置及折叠；触控命中区至少 44px                                       |
| Masonry                         | `items`、`columns`、`gap`、`onLayoutChange`                                                                                                               | 按最短列排布不同高度内容；按容器宽度响应列数，内容或图片尺寸变化后重新测量                                                  |
| Layout                          | `Layout`、`Layout.Header`、`Layout.Sider`、`Layout.Content`、`Layout.Footer`；Sider 支持断点与受控折叠                                                    | 页面结构使用语义元素；窄屏侧栏借助 Sheet 处理焦点、Escape 和背景滚动                                                        |
| Space                           | `direction`、`size`、`align`、`wrap`、`split`                                                                                                             | 默认水平排列；支持数字间距和窄屏换行，分隔符为装饰性内容                                                                    |
| Breadcrumb / Steps              | `Breadcrumb(items, separator, label, maxItems, expanded)`；`Steps(items, current, status, direction, size, percent, onChange)`                            | 使用 `nav`/`ol` 语义；长路径可折叠；步骤支持键盘激活、当前步骤进度和小尺寸，窄屏可横向滚动                                  |
| Menu / Anchor / Affix           | `Menu(items, selectedKeys, mode, onSelect)`；`Anchor(links, activeHref)`；`Affix(offsetTop?, offsetBottom?, target?, onChange?)`                          | 菜单支持方向键；页内导航使用原生锚点；Affix 按目标滚动容器固定，保留占位空间，支持顶部/底部偏移和状态回调                   |
| Checkbox / Radio / Switch       | 原生 input 属性、`label`、`size`、`invalid`；`RadioGroup(options, value, onValueChange, required)`                                                        | 原生键盘行为和表单提交；标签提供 44px 触控区域                                                                              |
| Segmented                       | `options`、`value` / `defaultValue`、`onChange`、`size`、`block`、`disabled`                                                                              | 原生单选控件；显式 `value={undefined}` 可清空，非受控选项失效时回退到可用项；支持方向键和窄屏横向滚动                       |
| Rate                            | `count`、`value` / `defaultValue`、`onChange`、`allowClear`、`character`、`tooltips`、`disabled`                                                          | 原生单选控件；显式 `value={undefined}` 保持受控空值；支持方向键、清除和 44px 触控区域                                       |
| Tag / Badge                     | `Tag(tone, selectable, closable)`；`Badge(count, showZero, status, classNames)`；`Badge.Ribbon`                                                           | Tag 操作使用 44px 触控区域；Badge 支持自定义计数内容、状态点和角标，位置跟随 RTL 逻辑方向                                   |
| Image / Skeleton                | 原生 img 属性、必填 `alt`、`fallback`、`preview`；`Skeleton(shape, size, width, height, label, loading, active, avatar, title, paragraph, round)`         | 图片支持放大预览和加载失败反馈；骨架屏支持独立按钮、输入框、图片占位及组合内容，加载结束后展示真实内容                      |
| ImagePreviewGroup               | `items`、`current` / `defaultCurrent`、`onCurrentChange`、`open` / `defaultOpen`、`onOpenChange`、`label`、缩放配置                                       | 项目相册以图片数组表示，缩略图与预览地址可不同；键盘切换、触控工具栏和关闭后的焦点恢复共用图片预览实现                      |
| Alert / Spinner                 | `Alert(title, tone, banner, open, onOpenChange)`；`Spinner(label, size)`                                                                                  | 错误与警告用 alert，其他状态用 status；可控关闭与 Banner 支持 44px 操作区域；加载状态有可访问名称                           |
| Spin                            | `spinning`、`delay`、`description` / `tip`、`indicator`、`percent`、`label`、`size`、`fullscreen`、`classNames` / `styles`                                | 可包裹局部内容或全屏展示；数值或估算进度有可访问百分比；延迟避免短任务闪烁，全屏阻止背景交互并恢复焦点                      |
| Watermark                       | `content`、`image`、`markSize`、`gap`、`offset`、`rotate`、`opacity`、`fontSize`、`onRemove`                                                              | 在内容上重复绘制非交互水印；文字颜色跟随语义变量，图片加载失败时回退文字                                                    |
| BorderBeam                      | `children`、`color`、`duration`、`borderWidth`、`anchor`、`reverse`、原生 div 属性                                                                        | 装饰性动态边框；内容保持原有语义、键盘和触控行为，系统减少动态效果时停止动画                                                |
| QRCode                          | `value`、`size`、`color`、`bgColor`、`bordered`、`errorLevel`、`icon`、`iconSize`、`status`、`statusRender`、`onRefresh`、`type`                          | 支持 SVG / Canvas、真实 QR 模块、加载与失效状态；状态操作和触控目标至少 44px                                                |
| Tour                            | `steps`、`open`、`current`、`onChange`、`onClose`、`onFinish`、`mask`、`keyboard`、`placement`、`gap`、`scrollIntoViewOptions`                            | 目标高亮、遮罩、左右方向键和 Escape；卡片操作与触控目标至少 44px                                                            |
| Progress / Result               | `Progress(percent, status, type, showInfo, steps, gapDegree, gapPlacement)`；`Result(status, title?, subTitle?, size, headingLevel, extra, children)`     | 进度值限制在 0–100 并暴露单一 progressbar；结果状态提供默认文案、明确状态码、操作和错误详情                                 |
| Toast / Message / Notification  | `toast(options)`；`message.open/info/success/warning/error/loading(content)`；`notification.open/info/success/warning/error({ message, ... })`            | 共用 Provider；`id` 更新同一提示，`message.loading` 显示加载指示并默认持续展示                                              |
| Collapse                        | `items`、`activeKey` / `defaultActiveKey`、`accordion`、`size`、`collapsible`、`destroyOnHidden`、`classNames`                                            | 标题/图标开合、独立操作区、内容保留、方向键导航、动态焦点恢复及 RTL                                                         |
| Avatar                          | `src`、`srcSet`、`alt`、`label`、`size`、`shape`、`icon`、`gap`、`onError`                                                                                | 头像保留单一可访问名称，失败后回退到图标或文字；长文字自动缩放，尺寸可响应断点                                              |
| Descriptions                    | `items`、`column`、`bordered`、`layout`、`size`、`title`、`extra`、`colon`、`emptyText`、`classNames`、`styles`                                           | `dl/dt/dd` 保持一份阅读顺序；响应式列数和跨度、整行剩余填充、统一尺寸、RTL 与空状态                                         |
| AvatarGroup                     | `items`、`maxCount`、`size`、`shape`、`label`                                                                                                             | 重叠展示成员，溢出按钮支持键盘和触控打开公共 Popover 查看其余成员，布局跟随 RTL                                             |
| Statistic / StatisticTimer      | `Statistic(title, value, precision, locale, classNames, styles)`；`StatisticTimer(value, type, format, onChange, onFinish)`                               | 数值格式与内部语义节点可定制；计时器从毫秒时间戳倒计时或正计时，后台恢复时按实际时钟校正                                    |
| Timeline                        | `items`、`mode`、`orientation`、`reverse`、`variant`、`labelWidth`、`label`、`emptyText`、`classNames`                                                    | 原生有序列表；两侧与交替布局、水平滚动、容器响应式、加载与文字状态、动态焦点恢复                                            |
| Carousel                        | `items`、`index` / `defaultIndex`、`autoplay`、`dots`、`dotPlacement`、`effect`、`infinite`、`adaptiveHeight`、`ref`                                      | 受控轮播、四向指示点、两种动效、键盘/手势切换、播放进度及隐藏内容焦点恢复                                                   |
| Tree                            | `treeData`、`expandedKeys`、`selectedKey` / `selectedKeys`、`checkedKeys`、`multiple`、`loadChildren`、`classNames`                                       | 选择和勾选独立；父子传导与半选、禁用边界、异步加载与取消/重试、唯一 Tab 入口、RTL 键盘与空状态                              |

Input 与 Textarea 的 `allowClear` 在有值且可编辑时显示清空按钮，清空时触发原生 change、`onValueChange('')` 和 `onClear()`，随后恢复输入焦点。`disabled` 和 `readOnly` 均隐藏清空按钮；Textarea 的按钮只占右上角 44×44px，右侧其余区域仍可用于选择和滚动。两者支持 `variant`（outlined / filled / borderless / underlined）与 `status`（default / error / warning）。Input 的 `prefix` / `suffix` 为输入框内的 React 内容，动态切换时保留同一个原生 input；`onPressEnter` 仅在未被取消、非输入法组合的 Enter 时触发。Textarea 的 `autoSize` 支持布尔值或 `{ minRows, maxRows }`，只调整高度；达到最大行数后在字段内部滚动。

Input 与 Textarea 的 `count` 可设为 `true`，或 `{ max, strategy, render }`。默认按字符串长度计数，`strategy(value)` 可覆盖计算方式，`render({ value, count, max })` 自定义显示；计数文本通过 `aria-describedby` 关联字段。`count.max` 只显示并标记超限，不截断输入，受控值也原样显示；需要原生截断时使用 `maxLength`。Input 的计数位于字段内，Textarea 位于字段下方，均随值变更和原生表单重置更新。

`Breadcrumb.maxItems` 至少保留 3 项：第一项、尾部若干项和当前页；中间路径以 44px 折叠按钮代替。`expanded` / `defaultExpanded` / `onExpandedChange` 控制展开状态，受控值须由调用方接受。展开时隐藏项保持原来的链接、按钮或禁用语义，折叠按钮保留焦点并提供 `aria-expanded` 与所控制路径的关联。长路径在 `__ui` 中提供键盘、触控和 RTL 预览。

`Tag` 默认是静态标签。`selectable` 提供带 `aria-pressed` 的选择按钮，`selected` / `defaultSelected` 与 `onSelectedChange` 管理选择状态；`closable` 提供独立关闭按钮，`open` / `defaultOpen` 与 `onOpenChange` 管理可见性。关闭先调用 `onClose(event)`，可通过 `event.preventDefault()` 取消；`closeLabel` 和 `closeIcon` 可定制关闭按钮。`disabled` 禁用选择和关闭操作。按钮均不提交外层表单，触控目标至少 44px；关闭后优先将焦点移到同组下一可操作项，其次移到上一项。受控值须由调用方更新。

`Popconfirm` 通过 `open` / `defaultOpen` / `onOpenChange` 管理确认层，`disabled` 阻止触发，`showCancel` 可隐藏取消按钮；`okButtonProps` 和 `cancelButtonProps` 只覆写按钮外观与原生属性。确认回调支持 Promise，等待期间确认按钮保持 loading，成功后请求关闭；受控模式需由调用方接受关闭请求。取消始终调用 `onCancel` 后请求关闭，Dialog 的 Escape、关闭按钮和焦点恢复保持一致。

`Popover.trigger` 默认为 `click`，也可设为 `hover` 或 `focus`；后两种模式仍可轻触触发器打开，避免在 H5 依赖悬停。`placement` 使用项目的 `PopoverPlacement`：`top`、`bottom`、`left`、`right` 及各自的 `-start` / `-end` 变体，共 12 种，靠近视口边缘时自动翻转并限制在可见区域。`open` / `defaultOpen` / `onOpenChange` 管理受控或内部状态。焦点可在触发器和 Portal 内容间移动；Escape 关闭并返回触发器，点击外部关闭，悬停模式在离开后短暂延迟关闭。

`Dropdown.items` 支持普通项、`{ type: 'divider' }` 和带 `children` 的 `group`；`selectionMode` 为 `none` / `single` / `multiple`，选择值通过 `selectedKeys` / `defaultSelectedKeys` 与 `onSelectionChange` 管理。多选默认保持菜单打开，可用 `closeOnSelect` 覆写；选中项使用 `menuitemradio` 或 `menuitemcheckbox` 语义，禁用项不进入方向键序列。分组标题、分隔线和菜单项均不破坏 Portal、RTL、键盘与 44px 触控约定。

`Dropdown.triggerMode` 默认为 `click`，也可选 `hover` 或 `contextMenu`。悬停打开时指针可从触发器移入 Portal 菜单，离开后短暂延迟关闭；触屏轻触仍可打开。右键菜单按指针位置显示，键盘的菜单键或 Shift+F10 从触发器打开并将焦点移到首项。`placement` 使用 `DropdownPlacement` 的上下左右及 `-start` / `-end` 共 12 种位置，靠近视口边缘时翻转；Escape 返回触发器，Tab 续接页面顺序。受控 `open` / `onOpenChange` 保持调用方决策。

`Badge.count` 接受非负有限数字、短字符串或自定义 React 内容；数字零默认隐藏，`showZero` 可保留零，`dot` 显示圆点。数值超过 `max` 时只截断可见文本，可访问名称仍使用完整数值；自定义内容建议显式传 `label`，未传时回退为“徽标”。`size` 为 default / small，`offset` 的两个数字分别沿逻辑末端向外、沿块方向向下偏移像素。`status` 支持 default / success / processing / warning / error，可配 `text`，圆点始终有可访问的状态名称；指定状态时优先展示状态点。`title` 可为徽标指示器设置原生悬停说明，`null` / `false` 不添加说明。`Badge` 透传根节点原生属性与 ref，`classNames` 提供 root / indicator / text 的 Tailwind 插槽；`Badge.Ribbon` 的插槽为 root / indicator / content。Ribbon 的 `text`、`tone` 和 `placement` 控制卡片角标，start / end 随 RTL 方向变化。`label` 可覆写徽标的可访问名称；附着于控件时，业务入口本身仍需有名称。

`Alert` 的 `description`、`action` 可放入补充内容与操作；`showIcon`、`icon` 和 `closeIcon` 控制装饰图标。`closable` 开启关闭按钮，`closeLabel` 为其命名。`open` / `defaultOpen` 控制可见性，关闭操作先调用 `onOpenChange(false)` 和 `onDismiss(event)`；实际关闭后调用 `afterClose()`。受控状态由调用方接受关闭请求，未接受时提示继续显示。

`ToastOptions.id` 可传稳定的字符串或数字，让后续调用更新同一条提示。`message.loading({ id, content })` 显示加载指示，默认不自动关闭；任务完成时使用相同 `id` 调用 `message.success`、`message.error` 或 `message.destroy(id)`。显式 `duration` 可覆写默认时长。`/__ui` 演示加载到完成的更新路径。

`Space.Compact` 是 `Space` 的紧凑组合入口，也可直接导入 `SpaceCompact`。`direction` 支持 horizontal / vertical，`block` 让组合填满容器；可组合 Button、Input、Textarea、Select、SearchInput 和 PasswordInput。容器对带包装层的字段调整实际输入表面的宽度与圆角，相邻边框连接且窄屏可收缩；子控件保留自己的语义、焦点顺序和 44px 触控尺寸。

`Divider` 默认保留原生 `<hr>`；`orientation="vertical"` 用于有高度的水平容器。`variant` 为 solid / dashed / dotted。横向分隔线可传 `children` 作为标题，`titlePlacement` 将标题置于 start / center / end，`plain` 使用普通字重。标题分隔线以标题命名 `separator`，调用方也可提供 `aria-label` 或 `aria-labelledby`；长标题在窄容器换行，不撑开页面。

`Progress` 的 `type` 可选 `line`、`circle`、`dashboard`。`steps` 可传数字或 `{ count, gap? }`；`gap` 单位为 px，线性默认间距为 4px，圆环及仪表盘默认间距为 2px，最多渲染 100 段。`size="small"` 缩小线条和圆形画布，也可继承 ConfigProvider 的小尺寸；显式 `strokeWidth` 仍以项目像素单位覆盖默认线宽。`successPercent` 显示总进度内已完成的部分，限制在 0 到 `percent` 之间；不传或传非有限值时不显示成功段。仪表盘 `gapDegree` 默认 75°、限制在 0–295°，`gapPlacement` 默认 `bottom`，`start` / `end` 跟随 ConfigProvider 的 LTR/RTL 方向。所有形态只暴露一个 `progressbar`，总进度通过 `aria-valuenow` 表达，成功段通过 `aria-valuetext` 补充；可见百分比文本由 `format(percent, successPercent?)` 控制。

`Result` 的 `title` 可省略，按 `status` 提供中文默认标题；403、404、500 还提供默认说明与可见状态码。调用方传入的 `title`、`subTitle` 和 `icon` 优先。`size="small"` 用于卡片内紧凑结果，`headingLevel` 默认为 2，可设 1–6 以匹配页面标题层级。`children` 用于展示复杂错误详情或后续说明，位于 `extra` 操作区之后，并使用主题背景承载内容。结果区由标题提供可访问名称，状态码和自定义图标作为装饰内容隐藏，避免重复播报；长内容在窄屏换行。

`Skeleton` 默认是文字行占位；独立形态包括 `line`、`circle`、`block`、`button`、`input`、`image`。`size` 对独立形态提供 `small`、`medium`、`large` 三档，默认 `medium`；`width`、`height` 可覆写尺寸，按钮使用 `width="100%"` 时铺满父容器，`round` 可将独立形态设为圆角。`shape="content"` 明确启用组合骨架屏，此时尺寸由内容配置控制：`avatar` 可传布尔值或 `{ size, shape }`，`title` 可传布尔值或 `{ width }`，`paragraph` 可传布尔值或 `{ rows, width }`；段落宽度可为单值或按行数组。`loading={false}` 直接渲染 `children`，加载时真实内容不进入焦点顺序。`active` 默认开启脉冲动画，可关闭，系统减少动态效果时停止动画。

`Image` 默认允许点击或键盘打开预览，纯展示图片可传 `preview={false}`；原生属性、`className` 和事件仍作用于图片，`containerClassName` 调整预览入口。`preview` 对象支持独立大图 `src`、`open` / `defaultOpen` / `onOpenChange`、`label`、`maxScale`、`scaleStep`、`wheel` 和 `maskClosable`。缩放默认范围为 1–8 倍，`maxScale` 最大为 50，默认每步乘以 1.5；滚轮与点击空白关闭可独立禁用。

`ImagePreviewGroup.items` 为 `{ src, alt, thumbnailSrc? }[]`，`current` 从 0 开始，并限制在当前图片范围。预览支持放大、缩小、左右旋转、水平和垂直翻转、重置，以及指针拖动和双指缩放。左右方向键切换相册并跟随 RTL；加减键缩放、0 重置、Shift 加方向键移动放大后的图片。预览复用主题 Portal 和 Radix 焦点、滚动管理；关闭后回到打开入口，图片加载失败时显示可重试错误状态。

`Avatar` 的 `size` 保留项目的小号 32px、默认 40px、大号 56px，也支持像素数或 `{ xs, sm, md, lg, xl, xxl }`。响应式值对应 Tailwind 的基础、640、768、1024、1280、1536px 断点，缺失值沿用较小断点尺寸。字符头像按实际容器宽度缩放，`gap` 为左右留白，默认 4px。图片原生配置（`srcSet`、`sizes`、`loading`、`crossOrigin`、`referrerPolicy`、`draggable`）传给内层图片；失败后按 `icon`、`children`、默认用户图标的顺序回退。`onError(event)` 返回 `false` 可接管回退，图片源或 `srcSet` 改变后重新尝试加载。

`AvatarGroup` 使用 `{ key, label, ...头像属性 }[]`，`maxCount` 为最多显示的成员头像数，溢出按钮另占一个位置；设为 0 时全部成员进入弹层。组内统一 `size` 和 `shape`，逻辑方向重叠适配 RTL，过长的组可在自身内横向滚动。溢出按钮至少 44px，点击或 Enter/空格打开公共 Popover，Escape 关闭并恢复按钮焦点；弹层明确显示每位隐藏成员的名称。空数组显示“暂无成员”。

`Descriptions` 展示只读字段，用标题命名区域，以原生 `dl` 中的 `dt/dd` 配对表达标签和内容；`extra` 可放置项目操作按钮。`size` 为 default / small / large，未指定时继承 ConfigProvider.componentSize。响应式以描述列表自身容器宽度为依据，PC 窄卡片也能回退为单列。`column` 为数字时，容器宽度在 640px 以下固定单列，其余断点使用指定列数；也可传 `{ xs, sm, md, lg, xl, xxl }`，对应基础、640、768、1024、1280、1536px 容器断点，缺失值沿用较小断点（基础默认为 1）。

描述项 `span` 可为列数、`filled` 或相同断点对象。数字跨度限制在当前列数内，剩余空间不足时移到下一行；`filled` 占满当前行剩余部分，每行末项自动补足空列。垂直布局用 subgrid 对齐同一行的标签与内容，边框和长文本换行使用 Tailwind 语义变量；没有额外的移动端 DOM 副本。`colon` 控制无边框标签后的可见冒号，边框布局不显示冒号。`classNames` / `styles` 接受语义槽对象，或 `({ props, size, state }) => 槽对象`；`state` 为 `ready` 或 `empty`。槽包括 root、header、title、extra、body、item、label、content、empty。根节点的 `className` / `style` 优先于语义样式，单项的 `className`、`labelClassName`、`contentClassName` 优先于同名槽；布局计算用的网格变量由组件保留。空数组显示公共 Empty，`emptyText` 默认为“暂无详情”，标题和操作仍保留。

`BackTop` 在 `FloatButton` 之上提供回顶行为：`target?: () => Window | HTMLElement | null` 指定滚动目标，`visibilityHeight` 默认为 400px，`showProgress` 可显示进度环，`behavior` 默认为平滑滚动。系统要求减少动态效果时改用即时滚动；位置、安全区和至少 44px 的触控尺寸沿用 `FloatButton`。

`FloatButtonGroup` 用 `items: { key, label, icon, disabled? }[]` 组织浮动操作，`onSelect(key)` 接收操作键。`trigger` 为 `always`（默认）、`click` 或 `hover`；菜单模式支持 `open` / `defaultOpen` / `onOpenChange`、`placement` 和 `shape`。`position` 可选页面四角并遵守安全区；菜单朝向遇到相邻视口边缘时自动改到相反方向。展开后使用正常 Tab 顺序，Escape 关闭并返回触发器；触屏可点击触发器。

`FloatButton` 的 `tooltip` 和 `badge` 复用项目提示与徽标组件；按钮始终保留 `label` 作为可访问名称，`badge.label` 可单独说明数量。`containerClassName` 用于调整固定容器的位置，`className` 只调整按钮外观；`/__ui` 展示两者组合及 H5 安全区。

`FloatButton` 传入 `href` 时渲染原生链接，`linkTarget` 指定新页等浏览器目标；`_blank` 默认加入 `noopener noreferrer`，也可显式传入 `rel`。链接保留 `variant`、图标、提示和徽标；`disabled` 或 `loading` 时移除 `href` 与 Tab 入口，并提供 `aria-disabled` 或 `aria-busy`。无 `href` 时仍是原生按钮，BackTop 只接受按钮属性。

`List` 的 `header` / `footer` 可传内容或 `(visibleItems) => 内容`，在加载、错误和空状态下仍保留；`visibleItems` 是当前页记录。`renderItem(item, index)` 的索引为原始 `items` 中的位置，现有单参数回调保持兼容。`size` 为 `small`、`default`、`large`，未传时继承 ConfigProvider；`bordered` 默认开启，`split` 默认开启并仅作用于普通列表。`grid={{ minItemWidth?, gap? }}` 按 List 自身可用宽度自动换列，默认最小项宽 220px、间距 12px；网格项保留独立边框。`pagination` 对本地 `items` 截页，可用 `defaultPage` / `defaultPageSize`，或同时传 `page` / `pageSize` 受控；`onChange(page, pageSize)` 同步页码，改变条数时保留原首项所在页。加载、错误与空状态不显示分页，但根容器、标题和页脚仍保留。`classNames` / `styles` 接受 `root`、`header`、`state`、`list`、`item`、`footer`、`pagination` 插槽或 `({ props, size, state }) => 插槽`；根节点原有 `className` / `style` 优先。`/__ui` 的“List 列表布局”展示网格、尺寸、分页与状态切换。

`Table` 默认沿文字方向的起始侧对齐表头与单元格；列的显式 `align="left"`、`"center"`、`"right"` 使用指定的物理方向。传入 `renderMobileRow` 后，窄屏展示列表视图，桌面展示表格视图。

`columns` 接受数据列与 `TableColumnGroup` 混合数组。分组使用 `{ key, header, children, align? }`，可继续嵌套；只有带 `render(row)` 的叶子列参与数据、排序、筛选、汇总及 H5 工具栏。桌面表头依深度生成原生多行结构，分组用 `scope="colgroup"` 与 `colSpan`，较浅的叶子列用 `rowSpan` 对齐；数据和汇总单元格通过 `headers` 关联每层表头，选择和展开表头跨全部表头层级。无叶子列的空分组不渲染。各列 `key` 应唯一且稳定；`summary` 仍按叶子列键提供内容。`/__ui` 的“Table 分组表头”展示三层结构、排序、筛选、汇总与移动端卡片。

数据列与分组均可设 `hidden`。隐藏分组会移除整棵子树；隐藏叶子后，空分组自动移除，其他表头的 `colSpan` / `rowSpan` 与展开行跨度重算。被隐藏列的排序和筛选配置暂不参与本地数据处理或 H5 工具栏，但受控/默认状态保留，再显示时恢复；汇总只渲染可见叶子列。`/__ui` 可切换成员组、评审列与任务组。

数据列与分组还可设 `minContainerWidth`（CSS 像素）。Table 测量自身容器宽度，宽度低于阈值时按 `hidden` 的相同规则移除对应列或整组；容器缩放时自动重算，无需依赖视口断点。未测得宽度时先展示全部非 `hidden` 列。`renderMobileRow(row, context)` 的 `context.visibleColumnKeys` 提供最终可见叶子列键，`context.containerWidth` 提供测得的容器宽度（测量前为 `null`）；已有单参数回调继续可用。自定义卡片可据此同步展示内容。缩窄容器时，若当前焦点所在的列控件被移除，焦点回到有名称的 Table 区域。`/__ui` 的“按容器宽度显示列”可切换宽、中、窄容器，验证列组跨度、排序、筛选与汇总随宽度更新。

`Table.size` 使用项目统一的 `small`、`default`、`large`，未传时继承 `ConfigProvider.componentSize`。尺寸调整表头、数据单元格、详情区域与 H5 卡片行的留白；选择、排序和展开按钮仍保留至少 44px 触控目标。`bordered` 默认关闭，开启后桌面展示单元格网格线，H5 卡片行展示独立边框。`rowHoverable` 默认开启，只在支持悬停的设备上提示当前行；设为 `false` 可关闭。`/__ui` 的“Table 展示状态”可切换这些设置，并验证桌面表格与窄屏卡片视图。

`Table.classNames` / `styles` 接受语义槽对象，也可接收 `({ props, size, state }) => 槽对象`，其中 `state` 为 `loading`、`error`、`empty`、`filtered-empty` 或 `ready`。槽包括 `root`、`state`、`title`、`selectionSummary`、`scrollRegion`、`table`、`header`、`headerRow`、`headerCell`、`body`、`row`、`cell`、`summary`、`summaryCell`、`expandedRow`、`expandedCell`、`mobile`、`mobileToolbar`、`mobileList`、`mobileRow`、`mobileDetail`、`mobileSummary`、`mobileSummaryItem`、`footer` 和 `pagination`。根节点原有的 `className` / `style` 保留最高优先级。`rowClassName(row, index)` 可按可见数据的全局索引设置桌面行和 H5 卡片行；筛选、排序、分页后的索引与渲染顺序一致。动态 Tailwind 类名仍需以完整字面量出现在项目源码中。

`Table.title` / `footer` 可传内容或 `(visibleRows) => 内容`，在加载、错误和空状态下也保留；`caption` 继续提供表格的可访问名称。`summary(visibleRows)` 返回按列 `key` 对应的内容对象，桌面渲染为原生 `tfoot` 汇总行，选择列和展开列自动补空单元格；H5 卡片视图渲染相同值的 `dt/dd` 汇总列表。复杂表头可用列的 `summaryLabel` 指定 H5 汇总标签。`visibleRows` 是当前页最终展示的记录：本地模式已筛选、排序和分页，手动模式直接采用调用方传入的 `rows`。加载与错误状态不计算汇总；完全空表只显示空状态。

宽表格在自身容器内横向滚动。滚动区域可通过 Tab 聚焦；焦点位于区域自身时，左右方向键移动 44px，Home/End 移到逻辑起止，RTL 使用同一键位。单元格内按钮、输入和带修饰键的操作不被截获。`/__ui` 有 240px RTL 宽表预览，手机可直接横向触控滑动。

`Table.scrollY` 接受正数 CSS 像素值，限制桌面表格滚动区域的最大高度；多层表头作为整体固定在区域顶部。传入 `stickySummary` 且有汇总时，汇总行固定在底部。横向滚动仍在同一区域中进行；传入 `renderMobileRow` 的 H5 列表不受 `scrollY` 高度限制。`/__ui` 的“长表格滚动”展示键盘滚动、固定表头和汇总。

数据列可设 `width`（正数 CSS 像素，作为首选最小宽度）和 `fixed: 'start' | 'end'`。固定列在表格自身的横向滚动区域内停靠逻辑起止侧，偏移按实际表头宽度测量，因此内容、尺寸或容器变化后会重算。列组的 `fixed` 由子列继承；仅当可见子列全部固定在同一侧时，分组表头也固定。选择和展开列位于数据列之前；有起始侧固定列时它们一起固定。建议把起始侧固定列放在数据列开头、末尾固定列放在末尾，并为这些列提供 `width`，以便给中间数据留出可阅读空间。`hidden` 和 `minContainerWidth` 的列剪枝先执行，偏移只计算最终可见列；RTL 仍按逻辑方向停靠。`/__ui` 的“固定列宽表”展示分组、汇总、响应式列和 H5 横向触控。

`TableColumn.sorter(left, right)` 启用本地稳定排序；交互依次切换升序、降序和原始顺序。`sort` / `defaultSort` 使用 `{ columnKey, direction }`，`onSortChange` 接收新状态或 `null`；受控模式由调用方更新 `sort`。复杂表头可传入 `sortLabel` 作为排序按钮名称。桌面表头使用 `aria-sort`，配置 `renderMobileRow` 后手机卡片上方提供同一排序操作。

`Table.expandable` 提供项目自己的行详情契约：`expandedRowKeys` / `defaultExpandedRowKeys`、`onExpandedRowsChange`、`expandedRowRender(row, index)`、`rowExpandable` 和 `getLabel`。展开按钮是独立的 44px 键盘/触控入口，使用 `aria-expanded` 和 `aria-controls` 关联详情行；桌面表格和 H5 卡片复用同一展开状态，受控模式等待外部更新，排序、筛选和禁用行不会改变详情内容的值语义。

`Table.selection` 支持 `mode`（`multiple` 默认、`single` 单选）、`selectedKeys` / `defaultSelectedKeys`、`onChange(keys, currentRows)`、`disabled(row)` 和 `getLabel(row)`。多选全选只影响当前可见页的可用行，保留其他页及禁用行的选中键；部分选中时全选框呈混合状态。单选使用同一数组契约但最多保留一个键，不提供全选，选中当前项时再次点击不会清除；原生 Radio 支持方向键与触控。两种模式的桌面行和 H5 卡片行共用状态，选中行显示主题浅蓝背景；桌面行暴露 `aria-selected`。回调中的 `currentRows` 只包含当前 `rows` 内选中的记录。`Checkbox` 和 `Radio` 的 `hideLabel` 用于紧凑选择入口。`/__ui` 提供单选跨页与禁用行预览。

本地模式的 `Table.pagination` 可省略或设为 `false` 以展示全部数据；传入对象时先对所有行筛选和排序，再按当前页截取。非受控模式使用 `defaultPage` / `defaultPageSize`，受控模式同时提供 `page` / `pageSize` 并在 `onChange(page, pageSize)` 后更新；两者不能混用。`showSizeChanger`、`pageSizeOptions`、`showQuickJumper` 和 `showTotal` 透传到项目 Pagination。改变每页条数时保留原首条记录所在页；手动排序或筛选时请求第 1 页。外部数据量缩减时显示可用的最后一页，数据恢复后回到原请求页。选择键与展开键跨页保留，桌面表格和 H5 卡片使用同一页；分页导航以表格标题命名。

`dataMode="manual"` 用于服务端数据。调用方传入当前页的 `rows`，Table 不再本地筛选、排序或截取；若需要分页，必须提供受控 `pagination={{ page, pageSize, total, onChange }}`，其中 `total` 是服务端查询结果的总条数。可用 `sorter: true` 标记可排序列，筛选项只需 `{ value, label }`；`sort` / `filters`、`onSortChange` / `onFiltersChange` 由调用方同步到查询参数，并根据结果更新 `rows` 和 `pagination.total`。本地模式仍要求筛选项提供 `matches(row)`，并保持原有默认行为。手动模式当前页为空但总数非零时保留表头、筛选和分页入口。`/__ui` 的“Table 手动数据模式”用内存数据模拟这一协作流程。

`TableColumn.filterOptions` 提供 `{ value, label, matches(row) }`，表头和手机工具栏共用筛选弹层。`filters` / `defaultFilters` 使用列键到值数组的映射，`onFiltersChange` 接收新映射；应用或重置后弹层触发器恢复焦点，筛选与排序、行选择按当前显示行协作。

筛选后无匹配行时，Table 保留桌面表头和 H5 筛选工具栏，空状态提示用户调整或清空筛选条件；筛选触发器仍可操作，恢复数据后焦点回到触发器。

`Input` 和 `Textarea` 的 `allowClear` 在有值且未禁用时显示 44px 清空按钮；清空会触发真实的 `input` 事件，使 `onValueChange('')` 和 `onChange` 均收到空值，非受控值立即显示为空并恢复输入焦点。`clearLabel` 可定制按钮名称，受控值仍由外部更新；两者均可作为 `FormItem` 的 `onValueChange` 控件。两者还支持 `variant`（outlined、filled、borderless、underlined）和 `status`（error、warning），状态使用主题 Token 表现。

未受控的 `Input`、`Textarea`、`SearchInput`、`PasswordInput` 在原生 `<form>` 重置时恢复初始 `defaultValue`，并同步清空按钮状态；重置不会触发值变更回调。受控值继续由调用方负责。

`SearchInput` 和 `PasswordInput` 与普通文本输入共用 `size`、`invalid`、`variant`（outlined、filled、borderless、underlined）、`status`（default、error、warning）、`prefix`、`suffix`、`count`、`allowClear` 与 `onClear`；搜索另有 `loading`、`onSearch`，密码另有 `visible` / `defaultVisible`、`onVisibleChange`、`visibilityToggle`。超出 `count.max` 时显示计数错误并暴露 `aria-invalid`，但不截断值；显式 `maxLength` 继续由浏览器限制输入。只读和禁用状态不显示清空按钮；清空会通过原生输入事件触发 `onChange`、`onValueChange('')` 和 `onClear`，受控值仍由调用方更新。搜索在输入法组合期间不会因 Enter 提交。

`Select` 和 `MultiSelect` 使用相同的 `variant` 和 `status` 字段契约；`status="error"` 同时暴露 `aria-invalid="true"`，便于表单校验和辅助技术识别。

`Card` 保留 `CardHeader` / `CardContent` 等组合 API，同时支持 `title`、`extra`、`cover`、`actions`、`hoverable`、`loading`、`variant`、`appearance` 和 `size`。`variant` 为 outlined（默认）或 borderless；旧 `bordered` 布尔属性继续兼容，显式 `variant` 优先。`appearance="inner"` 用于卡片内嵌，缩小圆角并为标题区域添加背景与分隔线，组合式和声明式 Header 共用样式。小号尺寸会同步收紧标题、Header、Content、Footer、Meta、Grid、内置 Tabs 和加载骨架屏；未指定时继承全局小号配置。加载时根节点暴露 `aria-busy`，内容区显示有名称的 `status` 骨架。

`Card.classNames` / `Card.styles` 为声明式 `title`、`extra`、`cover`、`actions` 等提供 `root`、`header`、`title`、`extra`、`cover`、`body`、`actions`、`action`、`loading`、`tabs` 的语义插槽。两者支持对象或接收 `{ props }` 的函数，可根据 `loading` 等当前属性切换样式；组合式子组件仍可直接使用自身的 `className` 与 `style`。卡片内页签传入项目 `TabsProps` 作为 `tabs`，由 `tabs.items` 提供各页内容，不再传 `Card.children`；受控选择、禁用、更多菜单、键盘和触控行为均复用公共 Tabs。Card 的小号尺寸会传给页签，`tabs.size` 可单独覆写。`CardMeta` 接受 `avatar`、`title`、`description`，默认用三级标题，`headingLevel` 可选 3–6；`classNames` / `styles` 同样支持对象或函数，提供 root/avatar/section/title/description 插槽。`CardGridGroup` 用容器宽度而非视口宽度安排列数，`columns` 为 1–4，默认 3；不足 30rem 时单列，达到 30rem 后双列，48rem 后三列，64rem 后四列，不超过设置的列数。`CardGrid` 是非交互的列表项，`hoverable` 仅控制视觉反馈；操作应放入内部原生按钮或链接，保持键盘与 H5 触控行为。

`Empty` 的 `title` 默认为“暂无数据”；`title` 和 `description` 可传入富内容，容器允许长文本在窄屏换行。`image` 传字符串时作为图片 URL，`imageAlt` 指定图片替代文本，未指定时图片作为装饰；传 React 节点时由节点自行提供图片语义。`image={null}` 隐藏插图。`classNames` 提供 root / image / title / description / action 的 Tailwind 插槽，根节点透传原生属性与 ref。交互应放在 `action` 中使用可访问的按钮或链接。

`Button` 在原有 `variant`、`size`、`loading` 基础上支持 `danger`、`block`、`shape`（default、round、circle）以及 `icon` / `iconPosition` 插槽。`danger` 使用错误主题色，同时保留 primary、secondary、outline、ghost 的外观层级；`destructive` 仍是实心危险按钮。加载指示器在图标原位置替换图标，按钮禁用并强制暴露 `aria-busy="true"`，原生 `type="button"` 默认值避免在表单内误提交。按钮动效遵守减少动态效果设置。

`InputNumber`、`DatePicker`、`TimePicker`、`DateRangePicker`、`TimeRangePicker` 和 `AutoComplete` 同样支持 `variant` 与 `status`；错误状态通过 `aria-invalid` 传递；日期与时间的单选和范围默认使用项目面板，也提供显式原生适配。

`InputNumber` 输入期间保留原始数字草稿，`onChange` 会收到当前数值或清空时的 `undefined`；失焦时再按 `min` / `max` 限制数值，并在修正后再次调用 `onChange`。受控用法可传入 `value={undefined}` 表示空值，并在 `onChange` 中同步更新。`precision` 在提交和步进时限制小数位；`formatter(value, { userTyping, input })` 与 `parser(text)` 负责展示和规范值转换；`controls` 默认横向显示两个至少 44×44px 的步进按钮，也可传入上下图标，`keyboard` 控制上下方向键，`changeOnWheel` 显式开启聚焦时滚轮步进，`onStep(value, { offset, type })` 报告步进结果。原生 form reset 恢复 `defaultValue`，无效草稿不会绕过边界约束。

## Tabs

保留 `items`、`value` / `defaultValue`、`onValueChange` 与 `activationMode` 项目契约。每项使用唯一、非空的字符串 `value`，`label` 接受非交互 ReactNode，`content` 为面板内容。`ariaLabel` 为图标或富标签提供完整可访问名称；`icon` 是非交互装饰。ref 指向根 div，原生属性与 focus/blur 事件传到根元素，`label` 命名 tablist。

`variant` 为 line（默认）、card、editable-card；`size` 为 default/small/large，未指定时跟随 ConfigProvider.componentSize。小号只缩小字距和内边距，所有标签、新增与关闭入口仍至少 44×44px。`classNames` 提供 root/header/item/tab/remove/add/more/popup/extra/indicator/body/content 的 Tailwind 语义部位，卡片背景和选中蓝色使用主题 Token。

`indicator={{ size, align }}` 定制线形指示条；`size` 可传像素或根据原始标签宽度/高度返回尺寸，`align` 支持 start、center、end。`centered` 使标签在可用空间内居中，`tabBarExtraContent` 接受单个节点或 `{ start, end }` 逻辑附加区；附加操作保持独立的 Tab 顺序和触控目标。标签栏中间区域独立滚动，窄屏不会让附加区或更多入口离开视窗。

默认启用更多标签入口，只有标签实际超出滚动区域时显示；传 `more={false}` 可关闭。`more` 可配置 `label`、`icon`、`searchable`、`searchPlaceholder` 和 `popupRender(menu, { restTabs, onClose })`。入口使用 Portal 和视觉视窗定位，打开后搜索框或首个标签获得焦点；输入搜索、方向键、Home/End、Enter、Escape 和 Tab 均有明确行为，选择后恢复到对应标签。菜单中的 disabled 标签不可选，RTL 与 H5 触控沿用项目方向、焦点和 44px 约定。

`renderTabBarItem(item, defaultItem)` 是外部排序库或原生拖放的组合入口。返回增强后的默认标签项，保留其 ref、`data-tabs-item`、tab/关闭按钮、Tailwind 类和焦点语义；可用 `cloneElement` 附加拖放事件，或用保持原节点可见尺寸的组件包裹。Tabs 不在拖放时自行改写 `items`，调用方按稳定的 `value` 更新数组顺序；需要为键盘和 H5 提供等效的前移/后移操作。`/__ui` 展示桌面拖动、键盘及触控按钮排序，并在移动非当前标签后保留原选择和面板草稿。

### 标签增删

editable-card 提供 `onAdd()` 和 `onRemove(value)` 请求；items 始终由调用方维护。只有调用方实际插入/删除对应项后才执行选择与焦点交接；回调返回 false 可明确拒绝请求，void 表示等待数据更新。新增后请求选择第一个新出现且可用的标签；关闭当前项后优先选择之前的可用项，没有则选择之后的可用项。关闭非当前项保持原选择；关闭最后一项调用 `onValueChange('')`，展示 emptyTitle（默认“暂无可用标签页”）。受控 value 等待调用方接受更新，新增受控项的焦点同样等待实际选择；异步更新期间若用户已离开组件，不抢回外部焦点。

`addable={false}` 隐藏默认新增入口；`addLabel` / `addIcon` 自定义名称与装饰，外部新增按钮可自行更新 items/value。缺少 onAdd/onRemove 时对应按钮禁用。项 `closable={false}`、`closeIcon={null/false}` 隐藏关闭入口；disabled 项不可激活或关闭。`closeLabel` 自定义关闭名称，默认来自 ariaLabel、文字 label 或 value；`closeIcon` 优先于公共 removeIcon。关闭按钮与 tab 为兄弟按钮，不嵌套；仅当前项关闭按钮进入 Tab 序列，鼠标/触控仍可关闭其他项。

方向键/Home/End 浏览标签，automatic 立即激活，manual 通过 Enter/Space 激活；水平左右键遵循 RTL，上下键用于垂直布局。Delete 请求关闭可关闭项，重复键、输入法和修饰键不会触发。关闭操作与新增不会重复派发 value 回调。已聚焦的标签/关闭入口动态失效或面板被隐藏时恢复到可用标签；所有项不可用时使用新增入口或 tablist 回收焦点。

### 位置、响应式和面板生命周期

`placement` 为 top/bottom/start/end，优先于 orientation；显式 start/end 在组件自身宽度低于 640px 时转为 top。卡片不提供垂直形态，start/end 始终使用 top。未传 placement 的旧 orientation="vertical" 保留纵向布局，方便兼容已有调用。横向标签在自己的 header 内滚动，聚焦或选择会显示对应项；长标签按自身容器省略，为图标与关闭入口保留宽度。start/end 使用逻辑边框和间距，bottom 标签视觉排列在内容后。

面板默认按首次激活懒渲染，切换后保留 DOM 与局部草稿。非当前面板 hidden/inert，控件不进入读屏和键盘序列。`destroyOnHidden={true}` 在隐藏时卸载内容，单项同名属性可覆写全局约定；项 forceRender 提前并持续挂载面板。项目此前直接沿用 Radix 隐藏即卸载的表现，需要旧生命周期的调用方应显式设置 destroyOnHidden。

外部数据变化使非受控当前项被移除或禁用时，显示第一个可用面板；原项重新可用后恢复之前的选择。通过 onRemove 接受的明确删除会提交新的选择。受控仍以传入 value 为准，未知受控值展示空状态且不擅自回调。`/__ui` 独立展示可编辑卡片、保留/销毁草稿、禁用与空数组、数据/选择分步接受、四位置与 240px RTL 深色。

## Typography

保留项目 `as` / `variant` / `tone` API，元素支持 span、p、div 和 h1–h6；标题层级独立于字体外观，ref 指向根 HTML 元素。`tone` 支持 default、muted、danger、success、warning；`strong` / `italic` 使用语义标签，`underline` / `strike` 可组合，`code` / `keyboard` / `mark` 保留项目主题。`disabled` 保留可读文字并禁止复制/编辑/展开操作。富文本块内容与文档表格请使用 `as="div"`。

### 复制

`copyable` 为布尔值或 `TypographyCopyOptions`。默认复制完整正文与 `ellipsis.suffix`，省略、装饰和操作按钮不改变复制值；富文本复制来自正文 DOM 的 textContent。`text` 可指定字符串，或返回字符串/Promise 的函数；`format` 为 text/plain（默认）或 text/html，HTML 默认来自正文 DOM，后缀按文字转义后追加；显式 `text` 原样复制，不自动追加后缀。HTML 使用 ClipboardItem，浏览器不支持时显示失败。

复制期间使用 `aria-busy` / `aria-disabled` 和可见“正在复制”反馈，同一请求不会重复发起。失败提供可见错误，原按钮可重试；成功调用 `onCopy(text)` 并展示两秒成功反馈，失败调用 `onError(error)`。正文、后缀、复制来源/格式、禁用、移除操作和卸载使旧请求失效，迟到响应不写入新状态；异步取值尚未完成时失效则不再写剪贴板。已交给浏览器的剪贴板写入不能撤销，只忽略其过期反馈。

`label` / `successLabel` / `errorLabel`、两个 `icon`、两个 `tooltip` 内容（或 false）和 `tabIndex` 可定制。现代浏览器优先使用 Clipboard API；缺少纯文本 API 时使用 execCommand，并恢复原焦点、输入选区和文档选区。复制按钮为 type=button，不提交外部表单。

### 编辑

`editable` 为布尔值或 `TypographyEditOptions`。`value` / `defaultValue` 管理项目字符串；显式 `value={undefined}` 表示受控空值，`onChange(value)` 只在提交后报告。未指定值时，点击入口会读取完整正文文本；本地保存后显示字符串，外部 children 更新清除旧本地保存结果。任意自定义组件在初始 `defaultEditing` 时可通过 value/defaultValue 提供编辑源；编辑任意富文本后不自动重建原格式。

`editing` / `defaultEditing` / `onEditingChange` 独立管理开合，`onStart` 报告用户请求开始，`onCancel` 报告 Escape/取消，`onEnd(value, reason)` 报告 submit/blur。受控文字和开合等待外部接受，关闭请求尚未接受时不会重复发布同次提交。外部文字更新会重置过期草稿。`trigger` 为 icon（默认）、text 或 both；文字入口支持 Enter/空格，内部链接保持自身操作。

编辑复用公共 Textarea。Enter 保存、Shift+Enter 换行、Escape 取消，组合输入、229 键码和重复按键不会误提交；空白与换行原样保留。默认离开编辑区域时保存，内部保存/取消按钮的焦点切换不提前提交；`submitOnBlur={false}` 可保持会话。`maxLength` 使用原生文本长度限制，`autoSize` 默认 true，可指定 minRows/maxRows 或 false 保留手动调整；没有 maxRows 时不限制自动高度。`icon`、`submitIcon`（null 隐藏保存按钮）、`tooltip`、`label`、`inputLabel`、`tabIndex` 可定制，取消始终有明确入口。

开始编辑聚焦正文末端；保存/取消后恢复可用入口，移除或禁用焦点所属操作时回到根元素，已经移到外部的焦点保持。动态禁用、移除编辑或卸载终止旧会话，不发布残留草稿。

### 省略、操作与触控

`ellipsis` 为布尔值或 `TypographyEllipsisOptions`，默认一行；rows 限制为至少一行整数。通过 Tailwind line-clamp / 行高裁切和实际正文 DOM 测量判断溢出，ResizeObserver、字体载入和窗口变化重新检查；MutationObserver 覆盖富文本子组件自行改字或样式但框尺寸未变的情况。不挂载第二棵 React 富文本树。`onEllipsis(boolean)` 只报告溢出状态变化。

`expandable={true}` 为一次展开，`'collapsible'` 支持展开/收起；`expanded` / `defaultExpanded` / `onExpandedChange` 采用项目受控约定。只有实际溢出时显示操作，ARIA 关联正文和展开状态；`symbol` 为节点或 `(expanded) => ReactNode`。`suffix` 保留在省略末行的逻辑末端，为“省略号 + 后缀”预留宽度；无溢出或展开后接回正文。传入去掉尾段的正文和对应 `suffix`（如 `_最终版.mp4`）可保留文件名尾部，形成中间省略；不要在正文重复传入该尾段。后缀宽于容器时完整换行，实际高度可超过 rows，不裁掉后缀或撑宽页面。装饰后缀不进入读屏顺序，原始正文和尾段保持完整阅读、复制与富文本组件状态。`tooltip` 为 true 或自定义内容，默认提示包含完整正文与后缀，复用公共 Portal Tooltip，省略正文可通过 Tab 聚焦查看提示。推荐用展开查看大量文字。

富文本保持一份实际 DOM 和组件状态，链接等后代取得焦点时自动显示完整正文。受控展开尚未接受时暂时显示正文，离开根区域后恢复调用方要求的状态，避免焦点停在被裁切的内容上。`actions.placement` 可为 start/end（默认），操作栏在正文前/后独立排列，不消耗省略行宽。`classNames` 提供 root、content、actions、action、textarea、suffix、feedback、table、tableWrapper 语义部位，全部使用 Tailwind 与主题 Token。

### 原生文档表格

通过 children 传入的原生 `<table>` 自动获得表头背景、边框、单元格间距与 caption 样式，支持 Fragment 和原生容器嵌套。table、caption、th/td 的原属性、ref、事件和子组件状态保持不变；表头/单元格自身的 Tailwind 类可覆盖默认样式。外层滚动区域由 caption 文字或 Typography.label 命名，可通过 Tab 聚焦、左右方向键滚动，Home/End 定位逻辑起止；单元格内控件和带修饰键的操作不被截获。较宽表格只在自身容器内横向滚动。可用 table 的 `min-w-*` 设置业务需要的最小宽度，`classNames.table` / `tableWrapper` 自定义表格与滚动区域。自定义 React 组件作为独立边界保留，不主动调用它来递归处理其内部创建的表格。

按钮/文字编辑入口至少 44×44px，编辑字号至少 16px，操作蓝色从主色与文字色混合以保持可读对比。`/__ui` 独立展示受控编辑、复制等待/失败/重试、长度限制、富文本、动态容器、后缀、格式/状态与 240px RTL 深色。

## ColorPicker

`ColorPicker` 默认使用项目 `popup` 面板；`mode="panel"` 常驻展示，`mode="native"` 使用系统 `<input type="color">`。值 API 保持独立字符串：不透明颜色输出六位小写 Hex，带透明度输出八位 Hex，清空输出 `''`。Hex 支持 3/4/6/8 位；RGB/RGBA 支持逗号及空格/百分比写法，HSB/HSBA 支持数值及百分比，也接受 `transparent`。不支持命名色、CSS 变量、HSL 或任意 CSS 表达式；显式 `value={undefined}` 为受控黑色，无效外部颜色回退黑色，归一化不触发回调。编辑草稿无效时显示关联错误并保留已提交颜色，不发布黑色。

`format` / `defaultFormat` 使用 `hex`、`rgb`、`hsb`；`onFormatChange` 只报告编码切换，规范输出仍为 Hex。面板提供颜色区域、色相/饱和度/亮度/透明度 Slider、颜色文本，以及 RGB/HSB 三通道 InputNumber；HSB 通道显示最多两位小数，颜色与透明度输出按字节量化。黑色或灰色时保留色相等暂未体现的编辑坐标，后续调整亮度/饱和度可继续使用。`disabledAlpha` 强制不透明并隐藏透明度滑块，`disabledFormat` 锁定编码；两个限制同样作用于文本、通道与预设输入。颜色区域使用真实指针坐标与捕获，键盘及辅助技术使用等价的命名滑块，区域本身不参与 Tab。

`onChange` 报告实时规范值；松开指针、结束滑块键盘会话、文本 Enter/失焦、通道提交或选预设后，`onChangeComplete` 对有变更的会话报告一次。取消保留已发布的实时值并停止完成回调；外部值或禁用/模式/透明度约束变化会终止失效会话。可以仅在完成回调更新受控值，触发器仍以外部值显示。文本 Escape 恢复未提交草稿，输入法组合和 229 键码不会误提交。`allowClear` 提供明确清空按钮和触发器 Delete/Backspace；清空依次报告空值的 change、complete 与 `onClear`，已空或不可用时不再次清空。

`presets` 使用项目 `ColorPickerPreset[]`：每组 `{ key, label, colors: { value, label? }[] }`，无效颜色跳过；色块提供名称、选中语义、棋盘格透明背景与至少 44×44px 目标。`showText` 为布尔值或 `(value, format) => ReactNode`，`panelRender(panel)` 可包装项目面板。`size` 继承全局配置，小号仍保持 44px 触控区域；`variant` / `status` 沿用字段约定。`classNames` 提供 root、trigger、swatch、description、popup、panel、area、sliders、format、presets、footer、error、colorMode、gradient、stops 部位；外观使用 Tailwind 语义 Token，动态色值仅作为内容呈现。

`open` / `defaultOpen` / `onOpenChange` 控制 popup；四种逻辑位置为 bottomStart、bottomEnd、topStart、topEnd。面板复用项目 Portal、视口定位与局部滚动，逃离裁切容器并继承主题及 RTL。触发器 click/ArrowDown 打开并聚焦第一个可用控件；Escape 关闭并恢复触发器，正反向 Tab 续接字段顺序，外部点击关闭。动态关闭面板会恢复其持有的焦点，禁用时聚焦命名根容器，已经移到外部的焦点保持。`autoFocus` 在 popup/native 聚焦触发控件，在 panel 聚焦第一个可用控件。只读 popup 保留可聚焦触发器与 `aria-disabled`，不能打开或改值。

**ref 迁移：** ref 从原生颜色 input 改为项目 `ColorPickerHandle`，统一提供 `focus(options?)` / `blur()`；调用方不再通过 ref 读取 `.value` 或访问原生 input，使用受控值或 `onChange`。panel 的 focus 指向首个可用控件，native 指向系统颜色输入。

`name` / `form` 通过独立不可见字段提交规范值；编辑草稿不参与 FormData 或原生 required 校验。空必填颜色暴露可见错误并聚焦入口。非受控原生重置恢复 `defaultValue`，支持外部 form 关联并尊重取消的 reset，不触发值回调；项目 FormItem 使用 `onChange` 与空字符串。native 只输出不透明六位 Hex，不支持清空、项目弹层或透明度，系统颜色面板行为由浏览器决定。`/__ui` 展示受控实时/完成、只读/错误、常驻、预设、裁切弹层、项目/原生表单及 240px RTL 深色。

### 渐变颜色

`colorMode` 独立于展示模式 `mode`：默认 `single`，`gradient` 固定渐变编辑，数组 `['single', 'gradient']` 提供颜色类型切换。数组模式从规范 `value` 判断实际类型，选择器使用 ARIA radio 按钮、单一 Tab 入口与方向键/Home/End；左右方向键跟随 RTL，按钮不向原生表单添加字段。`onColorModeChange` 仅报告用户切换或预设引起的类型变化，外部值归一化不回调。

值继续使用字符串，例如 `linear-gradient(90deg, #1677ff 0%, #13c2c2 100%)`。解析仅接受 `linear-gradient(90deg, …)` 或 `linear-gradient(to right, …)`，至少两个显式百分比色标，颜色沿用 Hex/RGB/HSB/transparent 语法；不支持其他角度、径向/重复渐变、隐式位置或任意 CSS。位置限制为 0–100、量化到两位小数并稳定排序，外部重复位置保留以表达硬切换。规范输出统一 90deg 和小写 Hex，`format` / `showText` 可展示各色标的 RGB/HSB，回调与 FormData 仍提交规范字符串。`disabledAlpha` 同时去除所有色标的透明度。

渐变专用模式将单色归一化为相同颜色的 0% / 100% 两个色标；单色专用模式取传入渐变的第一个色标。用户从渐变切换单色时取当前选中色标，从单色切换渐变时创建同色双端点。清空仍为 `''`，空渐变的面板显示黑色双端点以供开始编辑，不因此通过 required 校验。`mode="native"` 忽略渐变编辑，取首个色标的不透明颜色。

选中色标后复用单色面板调整其颜色、编码与透明度，切换色标会丢弃前一色标的文本草稿/错误并终止未完成会话。色标位置复用范围 Slider 的键盘、触控和相邻边界，禁止交叉但允许重合；位置输入、轨道点击并拖动、明确添加/移除按钮以及 Delete/Backspace 提供等价入口。保留至少两个色标，添加按钮选择最大可用间隔的中点，轨道点击拒绝已占用位置；新增颜色按预乘 sRGB 插值并先量化 RGB 通道，透明端点不会污染中间色相。不设置任意色标数量上限，无可用位置时禁用添加。

增删后聚焦并显示新色标或相邻色标；受控增删等待外部接受相同值后恢复焦点，已经移到外部的焦点保持。指针取消保留实时值并抑制完成回调，动态外部值、禁用和类型变化终止失效会话。原生重置恢复默认渐变的色标结构与首个色标，取消 reset 时保留现状。

预设的 `value` 可用规范渐变字符串，整组渐变预设替换全部色标；允许两种类型时，单色预设切换为单色，渐变专用模式中的单色预设仅修改选中色标。完整渐变预设的选中语义比较整个值，单色预设比较选中色标。`/__ui` 的独立渐变预览展示受控实时/完成、透明度、只读/错误、类型切换、增删、原生/项目表单和 240px RTL 深色。

## Slider

`Slider` 保留单值 `number`，`range` 模式使用有序 `number[]`，普通范围至少显示两个滑块；开启 `editable` 后允许单点与空数组。`value` / `defaultValue` 和对应回调按单值/范围区分类型；`draggableTrack` 与 `editable` 是范围模式的独立属性。非法数值、上下界和步长会归一化，值按步长、标记及 `min` / `max` 吸附；移动单个滑块不越过相邻点。显式 `value={undefined}` 为受控下界值，普通范围的短数组显示两个下界点；归一化不会触发变更回调。

`marks` 使用 `{ value, label, className? }[]`，标签为非交互内容；重复值保留最后的标签，越界与非有限标记被忽略。`step={null}` 只允许标记及两个边界值，普通步长同时允许离散标记。标记按钮可以点选，无法越过禁用节点的标记不可操作。`dots` 显示步长圆点，密集刻度最多采样约 500 个步长圆点；采样不改变可选择的值。`included={false}` 显示独立点位并隐藏填充轨道。

`orientation` 默认水平，可设为 `vertical`；`reverse` 反向坐标，水平坐标同时跟随 ConfigProvider.direction。左右键跟随水平视觉方向，垂直上下键跟随垂直视觉方向；Home / End 到达当前相邻边界，PageUp / PageDown 浏览十个可选点。`keyboard={false}` 禁用数值按键并保留 Tab。每个滑块与标记按钮至少 44×44px，两个端点有独立名称；`handleLabels` 覆写端点后缀。移除或禁用持有焦点的滑块时恢复到可用点，全部不可用时聚焦命名组；外部焦点保持。

`disabled` 可整体禁用，也可用布尔数组固定部分滑块。固定点构成其他滑块的边界；存在固定点时停用整段拖动。`draggableTrack` 在显示填充轨道时整体平移区间，保持点间距离并遵守步长/标记及边界。`onChange` 报告实时值，松开指针、数值键或结束键盘焦点会话后，`onChangeComplete` 对有变化的会话报告一次。指针取消保留已报告的实时值并取消完成回调；外部值、范围结构或配置更新会终止失效会话。

`editable` 接受 `true` 或项目 `SliderEditable` 配置 `{ minCount?, maxCount? }`；默认最小数量为 0，最大数量不限。数量限制只约束用户增删，不截断外部数组，也不自动填充节点。负数或非整数数量归一到非负整数，最大数量不会低于最小数量。`editable` 优先于 `draggableTrack`，两种手势不同时启用；任意 `disabled` 数组项为 true 时停用节点增删，其他可用滑块仍可调整值。

可编辑模式中点击轨道或可用标记添加节点，自动按步长/标记吸附、保持排序，并拒绝重复位置；到达最大数量或所有可选位置已有节点时停用添加。新节点可继续拖动，一次指针会话只报告一次完成。聚焦滑块后可按 Delete / Backspace 删除，按键重复和输入法组合不删除；`keyboard={false}` 保留显式增删按钮。拖动沿垂直于轨道的方向离开至少 48px 显示待移除反馈，松开才删除；返回轨道、指针取消或配置变化取消待移除。最小数量、只读、整体禁用和原生禁用 fieldset 均保护节点。

编辑工具区提供十进制输入、添加和移除选中节点按钮，保证 H5 不依赖拖离或键盘。空闲位置的建议值不枚举密集步长网格；输入草稿不作为表单字段，不影响原生校验或已提交 JSON。成功增删后聚焦新节点或相邻节点，删除最后节点后聚焦可用的添加按钮，否则聚焦命名组；受控更新等待外部值确认再恢复焦点，已移到组件外部的焦点保持。空数组仍提交 `[]`，`ref` 在没有滑块时为 null；从空值开始的原生表单和外部 `form` 关联均支持 reset。

`tooltip` 默认在悬停、焦点和拖动时显示当前值，支持 `open`、`formatter(value, index)` 与四向 `placement`；`false` 或 `formatter: null` 隐藏提示。文本格式同步给默认 `aria-valuetext`，显式原生属性可以覆写。提示复用公共 Tooltip 的 Portal、定位和主题，自动提示可用 Escape 关闭。`status` 提供错误/警告，错误传递 `aria-invalid`；`size` 缩放可见圆点，触控区域保持 44px，并可继承全局尺寸。`className` / `style` 作用于根容器，`classNames` 支持 root、rail、track、thumb、dot、mark、editor 的 Tailwind 类。

`ref` 指向第一个原生范围输入，保留 `focus()` / `blur()`、标签、焦点和键盘事件。单值 `name` 按原生数值字符串提交，范围以一个 JSON 数组字段提交；部分禁用的范围保留完整数组，整体禁用时不提交。非受控原生 form reset 恢复默认值并尊重取消的重置事件，不触发值回调，也支持外部 `form` 关联；项目 `FormItem` 默认通过 `onChange` 连接，数组值使用 `emptyValue={[]}`。`/__ui` 提供单值、范围、多点、禁用点、离散刻度、方向、只读、表单和 240px RTL 深色预览。

公共 `Tooltip` 支持 `open` / `defaultOpen` / `onOpenChange`、`disabled`、`mouseEnterDelay` / `mouseLeaveDelay`。延迟单位为秒，只影响悬停；键盘聚焦与触控立即显示，Escape、失焦或外部触控关闭。`placement` 使用 `TooltipPlacement` 的上下左右及 `-start` / `-end` 共 12 种位置，靠近视口边缘时翻转并限制在可见范围；上下方向的起止对齐跟随 LTR/RTL。空 `title` 与禁用状态不挂载提示，也不添加 `aria-describedby`；子控件阻止默认焦点或指针事件时尊重其决定。

## 日期与时间的公共 format

DatePicker（五单位单选与 multiple）、MultiDatePicker、DateRangePicker、TimePicker、TimeRangePicker、DateTimePicker 和 DateTimeRangePicker 共用 `format` / `parseInput`。DatePicker / DateRangePicker 的 `showTime` 分支使用顶层 `format` 表示完整日期时间，不能把时间段格式单独作为完整格式。

```tsx
<DatePicker format={['DD/MM/YYYY', 'YYYY-M-D']} />
<TimePicker precision="millisecond" format={['hh:mm:ss.SSS a', 'HH:mm:ss.SSS']} />
<DatePicker picker="week" format="GGGG年[第]WW[周]" />
<DatePicker picker="quarter" format="YYYY年[第]Q[季度]" />
```

项目 `PickerFormat` 为字符串、`(canonicalValue: string) => string`、`{ format: string; type?: 'mask' }`，或这些类型的只读数组。数组首项用于展示，所有字符串项都可匹配输入；空数组沿用默认展示和规范输入。输入匹配严格的位数、有效日期/时间和格式回显，名称/时段大小写不敏感，忽略首尾空白；不自动修正 2 月 30 日、错误星期或重复字段冲突。多选标签、hover 输入、范围端点与状态文案同步格式化；自定义 `renderTag` 仍接收规范值。

当首项为 `{ format: 'YYYY-MM-DD', type: 'mask' }` 时，输入进入分段编辑：数字按 token 填入，完成一段后自动插入字面分隔符，左右方向键跨过分隔符，粘贴和触控输入使用同一归一化逻辑。掩码只负责未完成草稿的编辑，不把非法日期或越界值自动提交；Enter、确认或失焦仍走相同的严格解析和 `min` / `max` / `disabled*` 约束。含月份名称、星期或时段名称的格式保留普通文本编辑。`mode="native"` 仍由浏览器处理并忽略掩码。

`parseInput(text, { kind, picker, precision, locale })` 可补充函数格式的反向解析；返回规范字符串或 undefined。返回值必须通过严格规范解析和当前可选约束。函数不推测逆向转换；可传 `inputReadOnly` 通过面板选择，或在数组中提供可解析字符串格式。回调不接收 Day.js 对象，底层库不会泄漏到业务 API。

| 内容             | 支持的格式 token                                            |
| ---------------- | ----------------------------------------------------------- |
| 年、月、日       | YYYY、YY、M、MM、MMM、MMMM、D、DD、Do                       |
| 星期（验证日期） | d、dd、ddd、dddd                                            |
| ISO 周年、周号   | GGGG / gggg、W / WW、w / ww、wo                             |
| 季度             | Q                                                           |
| 时间             | H / HH、h / hh、k / kk、m / mm、s / ss、S / SS / SSS、A / a |
| 本地化别名       | LT、LTS、L / LL / LLL / LLLL 及小写变体                     |
| 字面量           | `[文字]`，如 `YYYY年[第]Q[季度]`                            |

周始终按项目 ISO 周计算；周选择中的 YYYY / YY 同样表示 ISO 周年，跨年不会显示上一日历年。YY 使用 Day.js 的 00–68 → 2000–2068、69–99 → 1969–1999 规则；0001–0099 年应使用 YYYY。日期输入需要完整年月日，月份需年月，季度需年和 Q，周需周年和周号，年份需年；不能从缺失字段猜测今日日期。时间至少需小时和分钟，缺失秒/毫秒补零；h / hh 必须配合 A / a，k / kk 中 24 表示同日的 00 点。

显式 `precision` 优先。已有规范值按规范值和 step 推断精度；初始空值可从格式中的秒/小数 token 或 LTS 补充推断。动态切换 format 不降低已初始化空控件的精度，变化后的上下界/step/默认时间仍可提高空控件的精度；隐藏秒/毫秒不修改已选值；需要固定精度时显式指定 precision，值、上下界和默认时间按该规范精度提供。低精度不接受非零低位，毫秒规范值固定三位。未显式提供 `use12Hours` 时，首个字符串格式的 h / hh 决定 12 小时列；显式值优先。

默认 locale 保持英文格式名称；显式 locale 优先于 ConfigProvider.locale。内置 Day.js locale 为 en、en-gb、zh-cn、zh-tw、fr、de、es、ja、ko，区域名先匹配完整名称再匹配语言，未载入的语言回退英文；额外语言可通过函数格式和 parseInput 接入。中文 A / a 支持凌晨、早上、上午、中午、下午、晚上。本批处理公历 civil 字段，不做时区转换；DST 跳过的墙上时间仍保持用户输入。Z / ZZ / z / zzz / X / x 不属于项目日期值的格式契约，若需要外部时区/时间戳请在业务适配层转换后使用函数格式。

格式、解析器或 locale 改变时清除未完成手工草稿与旧输入错误，保持当前已提交值及已通过可选约束的临时面板选择，不触发值回调；等价格式数组不会因父组件普通重渲染丢失草稿。规范值仍用于 min/max/step、disabled 回调、preset、onChange/onCalendarChange/onOk 和隐藏 FormData；模式为 native 时忽略 format / parseInput，浏览器负责展示，继续使用原生归一化。

`/__ui` 的“日期与时间格式”展示多格式、函数解析、五单位、分段 mask、早年、跨日、12 小时、毫秒、语言切换、格式切换、原生适配与 240px RTL 深色。验证覆盖严格解析、提交隔离、掩码粘贴/键盘移动、Form 校验/重置和 PC/H5 交互。

`DatePicker` 的值为严格的 `YYYY-MM-DD` 字符串（0001–9999 年），空值为 `''`；显式 `value={undefined}` 仍表示受控空值。默认 `mode="popup"`，`mode="panel"` 将面板常驻在输入之后，`mode="native"` 使用浏览器原生日期输入。输入 ref、原生输入属性、`size`、`variant` 与 `status` 保留；`className` 修饰输入，`classNames` 提供 root/input/toggle/clear/popup/panel/presets/footer/error 插槽。样式使用 Tailwind 与语义 Token。

`open` / `defaultOpen` / `onOpenChange` 只控制弹层模式。`panelMonth` / `onPanelMonthChange` 用 `YYYY-MM` 表示独立浏览月份；`defaultPanelMonth` 在首次展示及每次非受控弹层打开时作为起始月份，否则按当前有效日期定位。浏览、方向键和月份切换都不改变 `value`；手工提交或预设选中会请求展示对应月份，受控月份继续由外部更新。`placement` 为 bottomStart/bottomEnd/topStart/topEnd，逻辑起止跟随 RTL；空间不足时翻转并限制在视觉视口内。

`allowClear` 默认开启，清除发出 `onChange('')` 与 `onClear()` 并还输入焦点。`presets` 使用 `{ key, label, value }`，值可以是 ISO 字符串或点击时求值的函数；不可用的静态值禁用按钮，动态值失效时展示反馈。`min`、`max`、`step` 和 `disabledDate(date)` 同时限制面板、预设和手工输入；步长以日为单位，基准为有效 `min` 或 1970-01-01，计算不受夏令时小时差影响。

`needConfirm` 将选择保留为临时值；“确定”或有效编辑输入的 Enter 才发出 `onChange` 和 `onOk`，取消、Escape 或整个控件离焦丢弃临时值。普通模式在日期选择后立即提交，输入编辑则在 Enter 或整个控件失焦时提交；无效输入不发值回调，失焦恢复原值并给出说明。返回输入或在面板按钮间移动保留输入草稿。`disabled` / `readOnly` 禁止日期操作，`inputReadOnly` 只阻止手工输入，仍可用面板选择；它使用 HTML readOnly，所以必填等原生约束不参与浏览器校验，项目 Form 规则仍有效。

点击输入或图标打开，输入的 ArrowDown / Enter 进入网格；网格支持方向键、Home/End、PageUp/PageDown 与 Shift+PageUp/PageDown。日期选择、确定和 Escape 还输入焦点；面板首项 Shift+Tab 返回输入，末项 Tab 接回字段按钮及后续控件。`onBlur` 的事件来自根 span，只在离开输入、字段按钮和 Portal 面板组成的整个控件时调用；与 `Form validateOn="blur"` 配合不会在浏览日期时提前报错。`name` 在面板模式通过隐藏字段提交已确认值，临时值不进入 FormData；非受控原生 form reset 恢复初值且不发 `onChange`。项目 Form 的必填规则与 reset 沿用普通字符串控件契约。

`weekStartsOn` 在日期网格中支持周一/周日，`locale` 默认继承 ConfigProvider。`renderDate` 只放非交互内容，额外说明通过 `getDateDescription` 同步给辅助技术；`footer` 和 `suffixIcon` 提供内容与装饰图标插槽。其他日期单位、范围与多选通过下述项目 API 提供，日期时间单选与范围组合见下文。

### 周、月、季度和年

`DatePicker` 与 `MultiDatePicker` 的 `picker` 为 date（默认）/week/month/quarter/year。单选仍输出字符串，多选输出相同单位的字符串数组；所有确认、取消、受控空值、标签、表单和主题契约沿用日期模式。`mode="native"` 只适用于单日期，在类型层禁止与其他单位组合；其他单位提供统一的 popup 与 panel。

| picker  | 值格式     | 示例       | step 单位 |
| ------- | ---------- | ---------- | --------- |
| date    | YYYY-MM-DD | 2024-02-29 | 日        |
| week    | YYYY-Www   | 2020-W53   | 周        |
| month   | YYYY-MM    | 2024-02    | 月        |
| quarter | YYYY-Qn    | 2024-Q1    | 季度      |
| year    | YYYY       | 2024       | 年        |

周使用 ISO 8601 周历：周一开始，包含 1 月 4 日的周为第 1 周，周年由该周的周四确定。`2020-W53` 表示 2020-12-28 至 2021-01-03，`2021-W53` 不存在。周历不随 locale 或 `weekStartsOn` 改变，避免相同 API 值在不同语言下指向不同日期。面板按整周展示可触控行，读屏名称包含周年、周号和日期跨度。其他单位保留严格零填充格式、四位年份和有效季度；计算使用本地日历并按日序号处理周步长，避免时区或夏令时改变结果。

`min` / `max`、预设、`disabledDate(value)` 与回调使用当前单位的值，限制整个单位，非日期模式不会逐日调用禁用函数。`step` 按上表单位计算，基准为有效 min 或包含 1970-01-01 的单位。外部无效值保留错误状态；手工输入必须完整、可选，拒绝后离焦恢复原值。单选普通模式选择后立即提交；确认模式的外部关闭也丢弃临时值。多选仍在完成或组合失焦时提交，确认模式需要明确确定。

浏览状态仍使用 `panelMonth` 的 YYYY-MM：周显示这个月份中的周行，月和季度使用其年份，年使用其十年区间。标题可逐层进入月份、年份和十年网格，选择浏览单元格只改变视图；选择目标单位才修改临时或提交值。浏览当前单位的按钮只定位，不提交。方向键按视觉列数移动并跳过禁用项，RTL 反转左右；Home/End 定位本行，Ctrl+Home/End 定位当前网格首尾，PageUp/PageDown 翻月、年、十年或百年；周模式 Shift+PageUp/PageDown 翻年。导航受 min/max 约束，内部焦点滚动不移动页面；动态禁用焦点所在项时恢复到可用项。

`renderCell(value, picker)` 和 `getCellDescription(value, picker)` 提供统一的非交互内容与无障碍说明，优先于原有 renderDate/getDateDescription，只用于目标单位的单元格。网格按钮至少 44px，常驻面板按自身容器收缩，`/__ui` 展示跨年周、禁用月份、确认季度、年份层级、多选、手工输入、240px 内嵌面板、表单校验/重置和 RTL 深色。切换 DatePicker 的 picker 会重建对应选择会话；调用方应同时传入新单位的 value/defaultValue，旧格式不被自动猜测或转换。各单位的范围选择使用下述 DateRangePicker。

### 时间选择器

`TimePicker` 默认 `mode="popup"`，提供 `panel` 常驻与显式 `native` 原生适配。值仍为 24 小时本地字符串：分钟精度为 `HH:mm`，秒精度为 `HH:mm:ss`，毫秒精度为 `HH:mm:ss.SSS`，空值为 `''`；拒绝 24:00、非法分秒、时区和不为三位的毫秒。显式 `value={undefined}` 表示受控空值。`precision` 为 minute/second/millisecond；未指定时，value/defaultValue/min/max/defaultOpenValue 含三位毫秒或 `step` 含小数秒则推断毫秒，其次含秒或正数 `step` 不是 60 的整数倍则推断秒。切换精度会重建会话，调用方同步提供对应格式的值。

`use12Hours` 将时间列与输入显示为 `hh:mm[:ss[.SSS]] AM/PM`，手工输入同时接受该格式和规范的 24 小时格式，回调及隐藏表单字段始终保持 24 小时值。12 AM 为 00 点、12 PM 为 12 点。`min` / `max` 和预设仍使用 24 小时字符串；min 大于 max 表示跨午夜的可用窗口，时间字符串本身不附带日期。

`hourStep` / `minuteStep` / `secondStep` / `millisecondStep` 限制单位选项；`step` 以秒为单位，基准为有效 min 或午夜，跨午夜窗口按从 min 延续到次日的距离计算，`step="any"` 不限制总秒步长。`disabledHours()`、`disabledMinutes(hour)`、`disabledSeconds(hour, minute)`、`disabledMilliseconds(hour, minute, second)` 与 `disabledTime(value)` 同时约束输入、面板、此刻和预设；这些同步函数应保持纯且快速。`hideDisabledOptions` 隐藏不可选选项。更改上级单位优先保留下级单位，不可用时找本单位内距离最近的有效补全；不会自动提交初始浏览用的 `defaultOpenValue`。

默认 `needConfirm=true`：选项及预设只更新待确认时间，“确定”或有效编辑输入的 Enter 提交并调用 `onOk`。取消、Escape、外部关闭及整个控件失焦恢复已提交值，返回输入或在列间移动保留临时值。`needConfirm=false` 选择后立即提交，面板保持打开供继续调整，“完成”结束会话；非法输入 Enter 给出错误，移出控件后恢复原时间。`allowClear` 为明确的立即清空动作，`disabled` / `readOnly` 禁止操作，`inputReadOnly` 仅禁止手工输入。`showNow` 默认开启，每次点击求当前时间并执行同一约束；`presets` 使用 `{ key, label, value: string | (() => string) }[]`，函数在点击时求值。

时、分、秒、毫秒和时段列分别为 listbox，每列一个 Tab 入口；上下方向键、Home/End、PageUp/PageDown（五项）只浏览，左右键跨列且跟随 RTL，Enter/Space 或触控才选择。首项 Shift+Tab 回到输入，末项 Tab 取消未确认会话后接回字段按钮，Escape 还焦点；动态禁用恢复可用焦点且不抢走外部焦点。列内部滚动不选择时间，按钮至少 44px，窄容器及 RTL 深色沿用语义 Token。`renderCell(value, unit)` 只放非交互内容，`getCellDescription(value, unit)` 提供读屏说明，unit 为 hour/minute/second/millisecond/meridiem。

`open` / `defaultOpen` / `onOpenChange`、四向逻辑 `placement`、输入 ref、size/variant/status 沿用字段契约，`className` 修饰输入；语义 Tailwind 插槽包含 root/input/toggle/clear/popup/panel/presets/columns/column/option/footer/error。`onBlur` 来自根 span，只在离开输入、按钮和 Portal 弹层组成的整个控件时触发。隐藏 `name` 字段仅提交已确认值；待确认或无效时间由原生 validity 阻止提交，非受控原生 form reset 和项目 Form 的校验/重置都有回归。`inputReadOnly` 使用 HTML readOnly，因此必填等原生约束不参与浏览器校验，项目 Form 规则仍有效。

`/__ui` 的“时间选择面板预览”包括分钟/秒、12 小时、条件禁用、跨午夜、手工输入、立即提交、外部开合、240px 常驻、动态禁用、只读、错误和预约表单。PC Chromium、H5 Chromium/WebKit 覆盖键盘、触控选择、确认/取消、Tab、列滚动、定位、RTL 与表单协作。日期时间范围组合见下文；滚动选择与悬停值预览见公共时间交互约定，毫秒精度见公共毫秒约定，format 见公共格式约定，分段 mask 已实现。

### 日期时间单选组合

`DateTimePicker` 是独立入口，`DatePicker showTime` 使用同一个实现；`showTime` 可为 true 或时间选项对象，对象选项优先于同名顶层选项。类型限制为单选 `picker="date"`，不与 multiple 或其他日期单位组合。项目值为严格的本地 `YYYY-MM-DDTHH:mm` / `YYYY-MM-DDTHH:mm:ss` / `YYYY-MM-DDTHH:mm:ss.SSS` 字符串，空值为 `''`；拒绝时区后缀、非三位毫秒和非法日期。不把本地字段换算成 UTC，步长使用民用日历日序号计算，夏令时不改变一天的步长长度。

`precision` 为 minute/second/millisecond，未指定时根据 value/defaultValue/min/max/defaultOpenTime 和总秒 step 推断；`use12Hours` 只改变输入和列的显示，回调仍使用规范的 24 小时值。手工输入接受 `YYYY-MM-DD HH:mm[:ss[.SSS]] [AM/PM]` 或规范 T 分隔格式；Enter 提交，非法输入保留错误草稿。`mode` 支持 popup（默认）、panel 和 native；native 使用 datetime-local，浏览器省略的零秒和尾部毫秒零补齐，超出所选精度的非零低位拒绝并恢复原值。

默认 `needConfirm=true`：日期与时间共用一个临时值和一次确认，`onCalendarChange(value, { part: 'date' | 'time' })` 通知临时选择，`onChange` 与 `onOk` 在确定或有效输入 Enter 后调用。`needConfirm=false` 选择立即提交并保留面板供继续调整，“完成”结束会话；取消、Escape、外部关闭及组合失焦丢弃未提交的选择。清除是立即动作；`presets` 用 `{ key, label, value: string | (() => string) }[]`，函数在点击时求值，`showNow` 默认开启并在点击时求完整日期时间。所有入口执行同一约束。

`min` / `max` 为完整日期时间；边界当天限制小时、分钟、秒，中间日期不会继承边界时间，min 大于 max 无可选值。`step` 以秒为单位，以有效 min 的完整日期时间或 1970-01-01T00:00 为基准，跨日连续计算；`step="any"` 不限制总秒步长。`hourStep` / `minuteStep` / `secondStep` / `millisecondStep` 限制单位选项。`disabledDate(date)` 接收日期字符串；`disabledHours(date)`、`disabledMinutes(hour, date)`、`disabledSeconds(hour, minute, date)`、`disabledMilliseconds(hour, minute, second, date)` 接收当前日期；`disabledTime(value)` 接收完整日期时间，回调应保持同步、纯且快速。

选择日期优先保留原时间；初次选日期使用 `defaultOpenTime`（只含时间的字符串），未提供时从午夜开始。目标时间不可选时寻找当天最近可选补全，无可选时间则保留原选择并显示反馈。默认打开时间不会因打开或浏览面板而提交；日期网格只按日期边界和 disabledDate 禁用，全天时间可用性在选择时判断，避免为每个日期格扫描所有时刻。

`panelMonth` / `defaultPanelMonth` / `onPanelMonthChange` 管理独立浏览月份；open、四向逻辑 placement、ref、size/variant/status 和字段原生属性沿用其他选择器。日期网格复用 Calendar，时间列复用 TimePickerPanel；宽容器并排显示，低于 640px 的容器通过“选择日期／调整时间”切换可见面板。浏览与选择分离，44px 操作、列内滚动、正反向 Tab、RTL 和动态禁用焦点恢复都有回归；WebKit 内部触控失焦与隐藏面板交接不取消会话，真实外部焦点不会被抢回。日期和时间内容分别通过 renderDate/getDateDescription 与 renderCell/getCellDescription 定制非交互内容。

`className` 修饰输入，Tailwind classNames 插槽为 root/input/toggle/clear/popup/panel/presets/switcher/calendar/time/columns/column/option/footer/error。`onBlur` 来自根 span，只在整个输入、按钮和 Portal 面板组合离焦时调用。`name` 隐藏字段只提交已确认值；未确认手工输入即使尚未打开面板也通过原生 validity 阻止提交。`inputReadOnly` 使用 HTML readOnly，原生约束不参与浏览器校验，项目 Form 规则仍有效。支持外部 form、非受控原生 reset 和 FormItem 的字符串规则与重置。

`/__ui` 的“日期时间组合预览”展示闰月、跨日秒精度、12 小时、边界、默认打开时间、输入错误、预设、立即提交、受控开合、240px 常驻与响应式常驻、动态禁用、大小/外观、只读、RTL 深色和原生适配。PC Chromium、H5 Chromium/WebKit 验证联动、确认/取消、键盘、触控、局部滚动、窄屏定位与表单；宽屏到窄屏的焦点恢复在桌面 Chromium 验证。日期时间范围使用下述独立入口；时间滚动选择与悬停预览见公共时间交互约定，毫秒精度见公共毫秒约定，format 见公共格式约定，分段 mask 已实现。

### 日期时间范围组合

`DateTimeRangePicker` 提供独立入口，`DateRangePicker showTime` 使用同一实现；showTime 可为 true 或 `DateRangeTimeOptions` 对象，对象选项优先于同名顶层选项，只支持 `picker="date"`。`DateTimeRange` 为 `[start: string, end: string]`，两端遵循单日期时间的严格本地格式和分钟/秒/毫秒精度，空端点为 `''`。时间字符串包含日期，因此可以明确表达跨午夜、跨月和闰日范围，不转换时区。

两端日期与时间共用一个选择会话，默认 `needConfirm=true`。`onCalendarChange(range, { endpoint, part })` 返回临时元组，part 为 date/time；确定或有效手工输入 Enter 才调用 onChange/onOk。`needConfirm=false` 只在范围完整、可选时立即提交，已有提交值在取消后保留；未完成选择取消恢复。默认时间 `defaultOpenTime={[startTime, endTime]}` 只含时间，选日期时才使用；未提供则优先沿用另一端时间，再回退午夜。打开、浏览和切换端点不提交。presets 使用 `{ key, label, value: DateTimeRange | (() => DateTimeRange) }[]`，函数只在点击时求值；`showNow` 默认关闭，开启时调整当前端点。

`min` / `max` 限制完整日期时间，边界当天限制时间，总秒 `step` 保留原始基准且跨日连续计算。`disabledDate(date, info)`、`disabledHours(date, info)`、`disabledMinutes(hour, date, info)`、`disabledSeconds(hour, minute, date, info)`、`disabledMilliseconds(hour, minute, second, date, info)` 和 `disabledTime(value, info)` 的 info 为 `{ endpoint: 'start' | 'end', from?: string }`，from 为另一端完整日期时间。面板、输入、预设、此刻和提交使用同一约束；回调应同步、纯且快速。

`order="clear"` 默认在交叉时清空可编辑的另一端，`order="sort"` 在提交时排序并重新验证端点限制；锁定端点不会清空或移动。`disabled` 支持 boolean 或 `[startDisabled, endDisabled]`，越过锁定端点的日期/时刻禁用，缩窄边界不改变原始步长网格。`allowEmpty={[false, true]}` 允许明确确认开放区间，空元组不可确认。清除单端是立即动作，保留另一端；readOnly 禁止操作，inputReadOnly 仅禁止手工输入。

`activeEndpoint` / `defaultActiveEndpoint` / `onActiveEndpointChange`、`panelMonth` / `defaultPanelMonth` / `onPanelMonthChange` 与 open 独立受控。外部未接受端点切换时，面板继续显示实际端点的月份。一个活动端点复用公共日期时间面板：640px 容器断点以上日期/时间并排，窄容器通过按钮切换；两输入在 440px 以下纵向排列。日期有范围开始、结束和区间内的文字/ARIA 说明；端点、日期和时间内容插槽带 endpoint/from 信息。字段 label 命名整个 fieldset，startLabel/endLabel 各自命名输入；className 修饰根，classNames 提供 root/fields/input/startInput/endInput/clear/toggle/popup/panel/endpoints/presets/switcher/calendar/time/columns/column/option/footer/error 的 Tailwind 插槽。

`onBlur` 来自根 fieldset，只在整个字段、按钮和 Portal 面板组合离焦时调用。WebKit 内部触控、隐藏面板切换及边界导航按钮禁用造成的临时失焦保留会话，恢复可用焦点且不抢走外部焦点。正反向 Tab 与 Escape 沿用公共弹层契约。name 隐藏字段只提交已确认的 JSON 元组；待确认输入通过原生 validity 阻止提交。inputReadOnly 使用 HTML readOnly，原生约束不参与浏览器校验，项目 Form 规则仍有效。项目 Form 支持完整范围规则、组合失焦与重置；显式 native 模式使用两个 datetime-local 输入和一个隐藏 JSON 字段，支持外部 form reset、零秒和毫秒尾零补齐及拒绝超出精度的非零低位。

`/__ui` 的“日期时间范围组合预览”展示跨日分钟/秒、日期/端点相关禁用、12 小时、交叉清空/排序、锁定端点、开放区间、默认时间、手工输入、立即提交、预设、受控开合、240px 与响应式常驻、动态可用性、大小/外观、只读、错误、RTL 深色、Form 和原生重置。PC Chromium 与 H5 Chromium/WebKit 验证两端联动、一次确认、JSON 提交值、键盘/触控、44px 目标、Tab、局部滚动和四向定位；桌面 Chromium 验证宽屏到窄屏焦点交接。时间滚动选择与悬停预览见公共时间交互约定；毫秒精度见公共毫秒约定，format 见公共格式约定，分段 mask 已实现。

### 公共时间交互：滚动选择与悬停预览

`TimePicker`、`TimeRangePicker`、`DateTimePicker` 和 `DateTimeRangePicker` 共用时间列交互；`DatePicker showTime` 与 `DateRangePicker showTime` 的时间选项对象也可设置 `changeOnScroll` 和 `previewValue`。显式 native 模式保留浏览器自身交互，这两个选项只作用于项目时间面板。

`changeOnScroll` 默认 false，列滚动只浏览。开启后，用户滚轮、触控或滚动条手势结束时选择列顶部最近的可用选项，跳过禁用项；使用原生 scrollend，未触发时由 150ms 静止窗口处理。指针仍按住时不选择，列外抬起和原生触控滚动的 pointercancel 均可释放等待；程序滚动、打开时对齐和键盘焦点滚动不触发选择。末项保留可对齐顶部的尾部空间，容器尺寸变化时重新测量。关闭、失焦、取消、禁用、可用选项变化或卸载清理待处理手势。

滚动选择遵守原组件的确认契约：needConfirm=true 只改变临时值，确定才提交；false 使用原立即提交路径。范围组件只调整活动端点，交叉清空、锁定端点、开放区间和排序仍使用已有约束；日期时间保留活动端点的日期，禁用回调继续收到日期和 endpoint/from 信息。

`previewValue` 默认 `'hover'`，传 false 关闭。只有鼠标悬停可用时间选项时，输入临时显示完整候选时间；触控不会触发悬停预览。预览不改变实际临时值、隐藏表单字段、ARIA 选中状态或 onChange/onCalendarChange/onOk。范围仅预览活动端点，不清空另一端或提前排序。离开选项、键盘操作、实际选择、取消、切换端点或日期/时间面板时恢复实际值；外部值或可用性变化也使旧预览失效。手工输入草稿优先，不被悬停覆盖。

`/__ui` 的“时间滚动与悬停预览”覆盖默认预览/关闭预览、确认与立即滚动、末项、禁用选项、范围交叉与锁定、跨日秒限制、动态可用性和 240px RTL 深色常驻。单测验证显示预览与提交隔离、手势静止/释放、程序滚动、取消与 FormData。E2E 使用桌面 Chromium 真实滚轮和鼠标悬停、移动 Chromium 真实触控滑动、H5 Chromium/WebKit 的 tap 选择与确认；两种移动引擎还以合成手势加真实 scroller 位置验证滚动提交、局部滚动、末项和窄容器。WebKit 的自动化滚动路径未模拟原生手指滑动。日期输入的悬停预览见下文；毫秒精度见公共毫秒约定，format 见公共格式约定，分段 mask 已实现。

### 公共毫秒精度约定

四类时间选择器以及 DatePicker/DateRangePicker 的 showTime 对象支持 `precision="millisecond"`、`millisecondStep` 和 `disabledMilliseconds`。规范值始终保留三位小数，`.000` 也不可省略；仅原生适配补齐浏览器省略的零秒或尾部小数零。低精度原生输入不截断非零秒或毫秒。`step` 仍以秒为单位，支持如 0.001、0.1、0.3 的小数秒；三种精度默认 step 分别为 60、1、0.001。millisecondStep 是 1 到 1000 的整数，默认 1；无效单位步长回退 1，step="any" 仅解除总步长，仍保留单位步长和禁用回调。

边界、排序和跨日步长采用整数毫秒；日期时间按民用日历计算，锁定范围端点缩窄边界保留原始网格。更改秒及上级单位时保留下级值或补全最近有效时刻，等距选较早值。补全先按小时/分钟/秒区间裁剪边界、步长网格和禁用单位，再查毫秒；日期或整段不可用应优先通过 disabledDate/disabledHours/disabledMinutes/disabledSeconds 表达。任意字符串级 disabledTime 谓词在无法通过单位约束剪枝时仍可能检查大量候选，应保持快速，不用于替代已有单位禁用回调。

毫秒列有独立名称、三位文字和一个 Tab 入口，renderCell/getCellDescription 的 unit 包含 millisecond。默认 1000 个毫秒选项可通过 Home/End/PageUp/PageDown 到达，禁用项跳过；焦点选项因动态隐藏消失时优先恢复同一可用列。五列窄容器使用列组内部横向滚动，键盘 reveal 保持 44px 目标可见，页面宽度不随列数增加。确认/立即提交、滚动选择、悬停显示、取消、范围端点和隐藏表单值沿用公共契约。

`/__ui` 的“毫秒时间精度”展示完整 1000 项、动态禁用、100 毫秒单位步长、12 小时范围、跨闰日日期时间、300 毫秒跨日网格及锁定起点、四种原生适配、表单提交/重置和 240px RTL 深色五列。单测包含严格解析、原生归一化、边界/网格、最近补全与有限网格穷举对照、回调上下文、确认与 FormData；浏览器验证范围记录在组件对照文档。

### 公共日期交互：悬停输入预览

`DatePicker`、`MultiDatePicker`（含 `DatePicker multiple`）、`DateRangePicker`、`DateTimePicker` 和 `DateTimeRangePicker` 的 `previewValue` 默认为 `'hover'`，传 false 关闭。日、ISO 周、月、季度、年使用当前单位的项目字符串值；年/十年等上层浏览格不预览输入。显式 native 模式使用浏览器交互，不应用悬停预览。DatePicker/DateRangePicker showTime 对象的同名配置继续优先于顶层选项，并同时控制日期与时间预览。

鼠标悬停可用单元格时只改变输入的临时显示，实际待选值、ARIA 选中状态、隐藏提交值、onChange/onCalendarChange/onOk 和确认按钮可用性保持实际选择。单选清除按钮依实际值显示，空字段预览不新增清除操作。范围只替换活动端点的显示；即使悬停跨过另一端也不清空或排序元组，不因这个临时交叉标记字段错误。多选只在添加输入中显示候选，不新增标签，不修改数组、数量或表单 JSON；已满数量的不可选项不预览。完成或 Enter 提交只使用实际选择与手工草稿，不把预览加入结果。

日期时间使用实际时间或 defaultOpenTime 补全悬停日期，并按实际选择的完整 min/max、步长和日期/端点禁用约束寻找可用时间；该日期无可用时间时不显示输入预览，也不因悬停产生选择错误。范围禁用回调继续得到活动 endpoint 与另一端完整 from。日期与时间共用同一预览状态，切换面板不保留旧预览。

离开选项、指针按下、键盘操作、实际选择、取消、组合失焦、浏览月份或切换端点清理预览。外部值、禁用状态、可用性与受控月份改变也使旧预览失效；恢复可用性不会复活旧值。手工草稿优先，触控不触发鼠标输入预览。范围原有键盘/鼠标网格预览保持独立，previewValue=false 仅关闭输入预览。

显示预览不能代替必填选择：日期/时间单选及允许另一端留空的范围，在实际必填值为空时仍阻止原生表单提交，隐藏值保持为空。inputReadOnly 使用 HTML readOnly，其浏览器原生校验行为与已有字段约定一致；项目 Form 的值校验继续读取实际提交值。

`/__ui` 的“日期输入悬停预览”展示默认/关闭预览、动态禁用、范围交叉、多选、四种日期单位、日期时间边界补全、跨日端点限制、必填提交和 240px RTL 深色。单测验证 FormData、ARIA、确认/取消、动态限制、手工草稿和必填隔离；桌面 Chromium 验证真实 hover，H5 Chromium/WebKit 验证 tap 选择与确认，三项目验证键盘和窄容器局部滚动。毫秒精度见公共毫秒约定，format 见公共格式约定；分段 mask 输入已实现。

### 日期多选

`DatePicker multiple` 与独立 `MultiDatePicker` 使用 `string[]` 的严格 ISO 日期契约，空值为 `[]`，显式 `value={undefined}` 仍是受控空值。`DatePickerProps` 通过 `multiple: true` 区分数组模式，单日期保持字符串值；`SingleDatePickerProps` 与 `MultiDatePickerProps` 可单独导入。默认去重并按日期排序，`order={false}` 保留首次选择顺序。多选支持 popup 和 panel，原生日期输入不支持数组选择。

月份浏览与选择值独立。点击日期切换选中状态，`onCalendarChange` 返回临时数组，选择过程中不发 `onChange`。普通模式通过“完成”、空输入的 Enter 或离开输入、按钮、标签及 Portal 面板组成的整个控件提交；`needConfirm` 模式只有“确定”或空输入 Enter 明确提交。`onOk` 通知明确完成动作；取消、Escape 和确认模式的组合失焦恢复已提交值。首项 Shift+Tab 返回输入并保留临时数组，末项 Tab 结束当前会话后续接字段操作；结束会话只通知一次值回调。`onBlur` 来自根 div，只在组合失焦时调用。

输入严格的 `YYYY-MM-DD` 并按 Enter 添加临时日期，再完成整个选择；重复输入只保留一项。日期越界、禁选或步长不符会保留错误草稿，离焦恢复已提交选择并说明原因。`inputReadOnly` 可避免 H5 虚拟键盘，仍可操作面板。`min` / `max`、以日为单位的 `step`、`disabledDate` 与单日期一致；`presets` 使用 `{ key, label, value: string[] | (() => string[]) }[]`，替换临时集合且不立即提交，静态不可用集合禁用，函数仅点击时求值并再次检查。

`maxCount` 限制新增日期数量，达到上限时仍可取消已有日期；`maxTagCount` 默认显示三个标签，其余通过按钮展开或收起。`renderTag(date)` 仅放非交互内容，删除按钮由组件提供；每个标签可独立移除，空输入的 Backspace / Delete 删除最后一项。面板关闭时标签删除立即提交，打开或常驻时修改临时集合；清空是明确动作，立即提交空数组。删除恢复输入焦点，外部更新移除焦点所在标签也恢复入口。外部不可用日期保留为错误状态，允许逐项移除以恢复有效值；禁用或只读时禁止选择、删除和清空。

ref 指向输入；`className` 修饰输入，`classNames` 除日期插槽外提供 tags/tag/tagRemove/overflow/summary。标签自动换行，按钮及网格保留 44px 触控目标；网格暴露 `aria-multiselectable` 和每个选中单元格的 `aria-selected`，日期名称包含“已选择”。`open`、`panelMonth`、逻辑四向 `placement`、RTL、locale 和日期内容插槽复用单日期约定。`name` 以隐藏字段提交已确认 JSON 数组；全部禁用时省略，支持外部 form 和非受控原生 reset。与 `FormItem` 配合使用 `emptyValue={[]}`，必填或最少选择数量由数组规则校验；输入本身是日期添加入口，组件通过 `aria-required` 与自定义原生约束表达数组要求，`inputReadOnly` 时项目 Form 校验仍有效。

### 日期范围选择器

`DateRangePicker` 使用 `[start: string, end: string]` 的日期单位元组，默认 picker=date；空端点为 `''`，显式 `value={undefined}` 表示受控空值，运行时兼容 Form 的空数组。默认 `mode="popup"`，也支持 `panel` 常驻与 `native` 原生适配。`size`、`variant`、`status`、`classNames`、`name` 和 `form` 沿用项目约定；输入 ref 指向开始端，`endRef` 指向结束端。`className` 修饰范围根节点，语义插槽包括 fields/input/startInput/endInput/clear/toggle/popup/panel/endpoints/presets/footer/error。

`picker="week" | "month" | "quarter" | "year"` 使用上表对应格式，min/max、step、disabledDate、预设和所有回调都针对当前单位，周仍采用固定 ISO 周历。非日期单位只支持 popup/panel，类型禁止与 native 组合。默认开始/结束标签与占位格式跟随单位；浏览上下文 panelMonth 仍为 YYYY-MM，周的两个面板相邻一月，月/季度相邻一年，年相邻十年。第二面板翻页同步第一面板；窄容器隐藏第二面板，键盘仍可跨页浏览。层级浏览不提交，目标单位选择才修改临时范围，范围内部与端点通过高亮和读屏说明表达，悬停与键盘只预览范围且不改变提交值。renderCell/getCellDescription 与单选保持相同签名和优先级。结束端为空时使用已有起点定位，确认面板被外部关闭会丢弃手工草稿；切换 picker 重建选择会话，调用方同时提供相应格式的值。`/__ui` 的“日期单位范围预览”包含四单位、确认预设、动态 from 限制、锁定起点、开放区间、240px 面板、输入错误、表单重置与 RTL 深色。

临时范围与已提交值分别管理：`onCalendarChange(range, { endpoint })` 通知浏览中的端点选择，普通面板选完开始后进入结束，完整范围才发出 `onChange`。`needConfirm` 保留临时范围，“确定”或有效编辑输入的 Enter 提交并调用 `onOk`；取消、Escape 或整个控件离焦丢弃面板临时值。`allowEmpty={[false, true]}` 等配置允许开放区间，通过“应用范围”明确提交；空元组不可确认。清空任一端保留另一端，日期交叉时清空可编辑的另一端，锁定端点永远不被修改。手工输入在 Enter 或普通模式的组合失焦提交，允许部分元组；无效日期、越界、禁选或步长不符不会发值回调，失焦恢复已提交范围并展示反馈。

`disabled` 支持 boolean 或 `[startDisabled, endDisabled]`，`readOnly` 禁止范围操作，`inputReadOnly` 仅禁止手工编辑。`min` / `max`、以日为单位的 `step` 与 `disabledDate(date, { endpoint, from? })` 同时约束输入、面板和预设；`from` 是另一端的当前临时日期。静态预设不可用时禁用，函数预设仅点击时求值，过期范围有错误反馈。`presets` 使用 `{ key, label, value: DateRange | (() => DateRange) }[]`。

`open` / `defaultOpen` / `onOpenChange`、`activeEndpoint` / `defaultActiveEndpoint` / `onActiveEndpointChange` 和 `panelMonth` / `defaultPanelMonth` / `onPanelMonthChange` 分别控制弹层、活动端点及起始浏览月份。端点使用 start/end，月份使用 `YYYY-MM`；右侧月份与起始月份联动。660px 以下的面板容器显示单月，440px 以下的字段容器纵向排列；不依赖页面视口决定窄卡片布局。`placement`、`weekStartsOn`、`locale`、`renderDate`、`getDateDescription` 和 `footer` 与单日期契约一致。

输入的 ArrowDown / Enter 进入活动端网格；方向键、Home/End、PageUp/PageDown 和 Shift+PageUp/PageDown 浏览不提交，RTL 跟随视觉方向。面板首项 Shift+Tab 返回当前输入并保留临时范围，末项 Tab 丢弃临时范围并接回字段后续操作；内部聚焦只滚动 Calendar 或弹层，不移动页面。范围首尾、内部与临时预览有独立语义。`onFocus(event, { endpoint })` 区分两个输入；`onBlur` 来自根 fieldset，只有离开两个输入、按钮和 Portal 面板组成的整个控件才触发。FormField 命名范围组，两个端点各自关联内部标签，错误说明同时关联两个输入。

`name` 将已提交元组以 JSON 数组字符串放入隐藏字段，临时选择不进入 FormData；全部禁用时省略，支持外部 form 和非受控原生 reset。与 `FormItem` 配合时传入 `emptyValue={[]}`；如果提交必须同时包含起止日期，应另加 `validator` 检查两个端点。`inputReadOnly` 使用 HTML readOnly，必填等原生约束不参与浏览器校验，项目 Form 规则仍有效。

### 时间范围选择器

`TimeRangePicker` 使用 `[start: string, end: string]` 的同日时间元组；分钟精度为 `HH:mm`，秒精度为 `HH:mm:ss`，毫秒精度为 `HH:mm:ss.SSS`，空端点为 `''`。显式 `value={undefined}` 为受控空范围，运行时兼容 Form 的空数组。默认 `mode="popup"`，提供 `panel` 常驻与显式 `native`；原有入口保持兼容，原生预览明确指定 native。`precision` 推断与单时间一致，也检查两个端点及 `defaultOpenValue`；`use12Hours` 只改变输入和列显示，回调和隐藏字段仍为 24 小时字符串。ref 指向开始输入，`endRef` 指向结束输入。

项目面板默认 `needConfirm=true`：选择时间单位只更新当前临时端点，`onCalendarChange(range, { endpoint })` 通知临时元组；端点按钮或输入焦点切换开始/结束，各列可以继续调整，不在选中小时后提前转到结束端。“确定”或完整合法编辑草稿的 Enter 提交一次元组并调用 `onOk`；取消、Escape、组合失焦与外部关闭恢复已提交值。`needConfirm=false` 在范围完整且可用时立即提交并保留面板，未完成的交叉范围在组合失焦时恢复。有效手工草稿可继续在时间列中调整另一端，非法输入不会发值回调；即时模式的有效手工输入在 Enter 或组合失焦时提交。原生模式按输入事件即时提交可用端点，不使用项目确认会话。

项目 `order` 为 clear（默认）或 sort。clear 保留旧契约：端点交叉时清空可编辑的另一端；sort 在提交时自动排序，临时端点仍保留身份，排序后重新验证端点限制。锁定端点永远不清空或移动，越过锁定端点的选项禁用。`disabled` 为 boolean 或 `[startDisabled, endDisabled]`；`readOnly` 禁止全部操作，`inputReadOnly` 只禁止手工输入。`allowEmpty={[false, true]}` 可通过明确确认提交开放区间，空元组不可确认；清除一个端点立即提交，保留另一端。跨午夜的区间应使用日期时间组合表示，不从两个时间字符串推断次日。

`min` / `max`、秒 step、hourStep/minuteStep/secondStep/millisecondStep 复用单时间约定。`disabledTime(value, { endpoint, from? })` 同时约束面板、输入、预设与此刻；`from` 为另一端的临时时间。禁用列回调也接受端点信息：`disabledHours(info)`、`disabledMinutes(hour, info)`、`disabledSeconds(hour, minute, info)`、`disabledMilliseconds(hour, minute, second, info)`。`hideDisabledOptions` 隐藏禁用项；更改上级单位保留或补全最近的有效下级时间。`presets` 使用 `{ key, label, value: TimeRange | (() => TimeRange) }[]`，函数仅在点击时求值；快捷范围不可修改锁定端点。`showNow` 默认关闭，启用后按点击时刻选择当前端点。`defaultOpenValue` 为两个浏览基础值，不自动提交。

`open` / `defaultOpen` / `onOpenChange` 与 `activeEndpoint` / `defaultActiveEndpoint` / `onActiveEndpointChange` 分别控制开合与活动端点；受控端点等待外部更新。尺寸、外观、状态、四向逻辑 placement、字段组命名和 Portal 主题沿用日期范围契约。`renderCell(value, unit, info)` 与 `getCellDescription(value, unit, info)` 接收当前端点上下文，内容应非交互；Tailwind `classNames` 提供 root/fields/input/startInput/endInput/clear/toggle/popup/panel/endpoints/presets/columns/column/option/footer/error 插槽。440px 以下字段容器纵向排列，240px 常驻最多五列仍保持 44px 触控目标，列组内部横向滚动；列内部滚动和 RTL 键盘复用 TimePickerPanel。

首项 Shift+Tab 回到活动输入并保留待确认范围，末项 Tab 结束会话后接回结束字段操作；Escape 还焦点，动态禁用活动端点恢复到另一可用端点且不抢走外部焦点。`onBlur` 来自根 fieldset，仅在离开输入、操作和 Portal 面板组成的整个控件时触发。`name` 将已提交元组作为 JSON 隐藏字段提交，临时范围不会进入 FormData；全部禁用时省略，支持外部 form、原生 reset 和项目 Form 重置。与 `FormItem` 配合使用 `emptyValue={[]}`，完整区间另加元组规则；`inputReadOnly` 使用 HTML readOnly，项目 Form 仍按规则校验。

`/__ui` 的“时间范围面板预览”覆盖条件禁用、秒说明、12 小时、交叉清空、自动排序、手工输入、锁定端点、开放区间、即时提交、外部开合、240px 常驻、只读、错误、原生模式与 Form。PC Chromium、H5 Chromium/WebKit 验证两端协作、确认/取消、键盘与触控、Tab、局部滚动、RTL 和窄屏定位。日期时间范围组合见上文；滚动选择与悬停值预览由独立时间交互测试验证，毫秒精度见公共毫秒约定。

`InputOTP` 的左右方向键按格子的视觉顺序移动焦点；方向默认跟随 `ConfigProvider.direction`，也可通过原生 `dir` 属性覆盖。RTL 格子顺序和 44px 触控区域在 `/__ui` 中预览。

`FormItem.emptyValue` 指定未设置值或重置后的控件空值，默认 `''`；布尔字段继续使用 `false`。数组值控件（如多选 `TreeSelect` 和 `Cascader`）应传入 `emptyValue={[]}`，避免初始空字符串被解释为选中项。表单存储在用户选择前仍保持未设置状态。

`FormRule.required` 将布尔 `false` 视为未完成；同意条款等复选框用 `valuePropName="checked"` 接入 `FormItem` 后，未勾选和重置后的状态均不会通过必填校验。`/__ui` 提供键盘与 H5 触控示例。

`AutoComplete` 根据选项 `value` 过滤候选；`onChange` 接收输入或选中的字符串，`onSelect(value, option)` 只在选中建议时调用。候选项可设置 `disabled`。输入框保留焦点，通过上下方向键浏览、Enter 选择、Escape 关闭；候选面板在主题作用域内浮动，H5 可直接触控选择。

`MultiSelect` 使用与单选 `Select` 相同的 `{ value, label, disabled? }` 选项，`onValueChange` 返回去重后的字符串数组。选中后弹层保持打开，可继续选择或再次点选移除；`showSearch` 过滤选项，禁用项不可操作。`allowClear` 提供独立 44px 清空按钮。传入 `name` 时以 JSON 数组字符串提交；连接 `FormItem` 时使用 `trigger="onValueChange"`、`emptyValue={[]}` 和 `rules` 校验。

单选 `Select.allowClear` 在有值且可用时显示独立 44px 清空按钮；清空后 `onValueChange('')`，非受控值显示占位文字、原生表单不再提交该字段，并把焦点还给触发器。传入 `label` 可为清空按钮生成具体的可访问名称；受控值仍由外部 `value` 决定。

单选 `Select.showSearch` 在项目弹层顶部提供可见搜索输入，按 `label` / `value` 过滤选项；`filterOption(inputValue, option)` 可替换过滤规则。搜索输入的 ArrowDown / ArrowUp 分别进入首个 / 末个可用选项，Enter 选择首个匹配的可用选项，Escape 关闭；首个选项的 ArrowUp 返回搜索。文本光标、空格、删除和输入法确认由输入框处理，组合输入及兼容的 229 键码不会误选或关闭。搜索 Tab 进入可用选项，选项 Shift+Tab 返回搜索；搜索 Shift+Tab 关闭并恢复触发器，选项 Tab（或无可用结果时的搜索 Tab）关闭并继续触发器之后的表单顺序。触控直接选择结果，搜索保留触发器当前值与标签；关闭或禁用后清除搜索会话，重新打开从完整选项开始。触发器与搜索框都通过 `aria-controls` 关联弹层，选择后仍遵循原有表单和焦点契约。

`Select` 弹层宽度限制在可用视口内，长选项和连续字符可换行；触发器中的已选长标签截断显示，完整文字保留在 DOM 中。`/__ui` 的 240px RTL 搜索预览覆盖这些状态。

`Pagination` 可选 `onPageSizeChange(size, page)`、`pageSizeOptions`、`showQuickJumper` 和 `showTotal`。切换每页条数时，`page` 指向原先第一条记录所在的新页，由调用方同步更新 `pageSize` 和 `page`；快速跳页只接受当前范围内的整数，错误会在输入框旁显示。长页码列表的省略号默认是可操作跳页按钮，每次跳 5 页；`jumpSize` 调整跨度，`showJumpers={false}` 保留纯装饰省略号。按钮有目标页码名称，原生键盘操作和至少 44px 的触控区域；跨页后省略号消失时，键盘焦点回到当前页。加载时这些控件不可操作，`load-more` 模式维持单按钮入口。

`Pagination.style` 可直接设置页码导航或“加载更多”容器的内联样式，供 Table 的 `styles.pagination` 等场景复用；常规外观仍优先使用 Tailwind `className`。

`ErrorState.onRetry` 接受同步或异步回调；等待期间重试按钮进入忙碌并禁用状态，失败后保留错误提示和再次重试入口。List、Listy、Table 共用这一约定。

`Cascader` 保留项目 `CascaderOption { value, label, children?, disabled?, disableCheckbox?, isLeaf?, searchText? }` 与单路径 `string[]` 契约，默认 `mode="popup"` 使用列式浏览：点击或确认父节点只展开，不触发 `onChange`；确认叶节点一次返回完整路径，关闭并恢复触发器焦点。`changeOnSelect` 允许点击或确认父路径，方向键展开始终只浏览。`expandTrigger="hover"` 只响应鼠标悬停，H5 继续点击展开；`mode="panel"` 在页面内使用相同列式面板。上下键、Home / End 和字符查找在同列移动，左右展开与返回父级跟随 RTL。面板只有一个 Tab 入口，跨列与列内滚动不推动页面；行高至少 44px，窄屏横向滚动限制在面板。

`showSearch` 查询任意祖先文本，结果展示完整路径，禁用祖先下的结果不可选择。复杂标签可提供 `searchText`；`filterOption(query, pathOptions)` 自定义过滤，`searchLimit` 默认 50。`searchValue` / `onSearch` 和 `open` / `onOpenChange` 支持受控使用，显式 `value={undefined}` 或 `searchValue={undefined}` 表示受控空值。弹层支持 Escape、正反向 Tab、外部关闭和 H5 触控：搜索 Tab 进入面板，面板 Shift+Tab 返回搜索，继续 Tab 回到触发器之后的表单操作。`ref` 提供 `focus()` / `blur()`。

四种 `variant`、三种 `status`、统一 `size`、`prefix` / `suffixIcon` / `expandIcon`、`displayRender(pathOptions)`、`optionRender(option, pathOptions)` 和语义 `classNames` 统一使用 Tailwind Token。标签和渲染插槽应为非交互内容。`placement` 使用逻辑 `topStart` / `topEnd` / `bottomStart` / `bottomEnd`；`popupWidth`、`columnWidth`、`listHeight` 控制面板尺寸，空间不足自动翻转，保留视口边距并响应软键盘视口变化。

`allowClear` 在有有效路径时提供独立的 44px 清空按钮，返回 `[]` 并调用 `onClear`。`mode="inline"` 保留原生分级选择框、逐级 `onChange` 和最后一级的浏览器 `required` 校验；原生“请选择”会截断该级及后续路径。弹层和面板以 `aria-required` 表达必填，应使用 `FormItem.rules` 校验。单选的选项移除或禁用时暂时显示最后有效前缀，原选项恢复后可恢复未被用户改动的选择。传入 `name` 时以 JSON 数组字符串提交有效路径。`/__ui` 展示搜索、三列、长标签、悬停、内嵌面板、四向位置、外观、空状态及 RTL 深色。

`Cascader` 的 `multiple` 使用独立类型 `CascaderMultipleProps`：`value` / `defaultValue` / `onChange` 为 `string[][]`，支持弹层和内嵌面板。点击父级标题或 Enter 浏览子列，点击 44px 勾选区或 Space 切换整条分支；叶节点点击或 Enter 切换勾选，弹层保持打开。`aria-checked` 暴露半选状态，搜索依据完整数据计算关联关系，保留未显示的勾选。同一 value 可出现在不同分支，完整路径是标识；同层 value 应唯一。

`showCheckedStrategy="parent"` 默认压缩为完整选中的父路径，`"leaf"` 回填叶路径；展示与 `onChange` 使用同一策略，受控传入的父路径仍会展开为对应叶节点。`disableCheckbox` 阻断自身与祖先的勾选传导，但保留目录浏览和后代的独立勾选；`disabled` 禁止自身及后代操作。外部传入的未知、已删除或不可勾选路径保留为标签，数据恢复后解析标签；其他勾选不会静默清除它们。不可勾选路径的标签不可移除，未知路径可以移除。

多选标签位于触发器之外，独立移除按钮保持 44px 触控和 Tab 顺序，移除父标签取消其参与关联的分支；触发器 Backspace / Delete 删除最后可移除路径。`maxTagCount` 为非负数字，仅折叠展示；`maxTagPlaceholder(omittedPaths)` 自定义剩余项说明，`tagRender({ path, options, label, disabled })` 自定义非交互标签内容，`removeIcon` 自定义移除图标，语义插槽包括 `checkbox`、`tags`、`tag`、`tagLabel`、`tagRemove`、`tagOverflow`。`autoClearSearchValue` 默认选择后清空搜索并返回搜索入口，false 保留查询。多选字段配合 `FormItem.emptyValue={[]}`，hidden field 提交 JSON 多路径；`/__ui` 展示策略切换、长标签、折叠、动态数据、未知/禁用值、RTL 深色、面板和表单校验/重置。

异步级联使用项目 `loadChildren(pathOptions, { signal }) => Promise<CascaderOption[]>`：只对显式 `isLeaf: false` 且尚无子项的目录发起请求，普通静态叶节点保持原有行为。完整路径映射为公共 Tree loader 的键，缓存、去重、取消、重试和版本刷新复用同一机制；返回项的 `value` 必须是非空字符串并在同层唯一，不同分支可重复。调用方不需要修改 `options`，显式提供的非空子项优先于缓存。`onLoad(pathOptions, children)` / `onLoadError(error, pathOptions)` 汇报结果，`loadVersion` 变化清理旧缓存。

列式弹层和 Panel 为待加载子级显示独立反馈列：加载时 `aria-busy`、状态文本及 44px 取消按钮，取消后可继续，失败后可重试；`loadingIcon` 和 `classNames.loading` / `error` / `loadAction` 自定义显示。键盘展开目录后，响应到达时聚焦首个可用子项；Tab 可进入反馈按钮，Shift+Tab 回到目录，返回父级方向键跟随 RTL。焦点滚动仅限面板内部。关闭弹层、切换/返回路径、搜索、禁用、移除、卸载或版本变化都会中止失效请求，迟到响应和错误不回写、不触发回调，成功缓存跨弹层保留。空响应将目录解析成终点，可确认或勾选。

异步搜索只查询已载入的完整叶路径，搜索本身不加载目录。未知单路径在子项到达后解析有效前缀与标签。未加载目录参与多选完整性判断，已有子项全部选中不会提前压缩成包含未知后代的父路径；直接勾选未加载目录不可用，显式父路径值保留整条分支的选择意图，加载后传导到子项。在 `leaf` 策略下，未解析的选择暂保留目录路径，待数据到达再解析。`mode="inline"` 同样可逐级加载并提供取消/重试，原生 `required` 在未解析目录或尚未选择末级时不通过。`/__ui` 同步嵌套、缓存、空目录、失败恢复、忽略取消的迟到响应、多选、原生分级、内嵌面板和 RTL 深色预览。

`TreeSelect` 的左右方向键随 `ConfigProvider.direction` 调整展开和折叠方向，弹层在独立 Portal 容器中也保留 RTL。多选 `allowClear` 清空后关闭弹层并把焦点还给触发器。

`TreeSelectOption` 继续使用唯一 `value` 和展示用 `label`，复杂标签通过 `searchText` 提供查找文本；标签应使用非交互内容。单项支持 `disabled`、`selectable`、`checkable`、`disableCheckbox`、`isLeaf` 和装饰性 `icon`。`value` 为字符串或字符串数组，显式 `value={undefined}` 是受控空值；`checkable` 自动使用数组契约。非受控状态清理已删除的已知选项选择与展开键；受控未知值及异步模式的待加载值保留原始 value 回填，数据载入后自动解析标签。

勾选模式默认父子关联，并遵守公共 Tree 的禁用和不可勾选边界；`checkStrictly` 让节点独立勾选，值仍为字符串数组。`checkedStrategy` 为 leaf（默认）、parent 或 all，决定勾选值的回填与 `onChange` 返回方式；严格模式始终返回所有独立勾选键。搜索只过滤显示，不改变完整树的父子关联、半选状态或已选兄弟节点。普通 `multiple` 同样保留被搜索过滤掉的选择。

`maxCount` 限制实际选择数量：普通多选与严格勾选按选中节点计数，关联勾选按可勾选叶节点计数，父级或全部回填也遵守同一限制。未知受控值同样计入上限。计数向下取整且至少为 0，无效数值不启用限制；达到上限后仍可展开目录、浏览和取消选择，不能新增会超过限制的节点或分支。父级传入的超限值不被自动截断。`maxTagCount` 仅限制多选触发器展示的标签数，剩余数量以 +N 表示，不修改选择值。

多选标签默认提供独立移除按钮，`removable={false}` 可隐藏这些入口；移除父级关联标签会取消该可勾选分支，独立选择与禁用边界仍保留。未知受控值也可请求移除。按钮是触发器的同级控件，避免嵌套交互元素，保留 44px 触控区域与明确名称；移除后聚焦触发器且不切换弹层开合。触发器上的 Backspace / Delete 移除最后一个回填值，Tab 按触发器、可见移除按钮、公共清除按钮的顺序移动，桌面及移动 WebKit 保持同一契约。

`placement` 指定 topStart / topEnd / bottomStart / bottomEnd，默认 bottomStart，起止跟随 RTL。空间不足时翻转上下方向；`popupWidth` 可指定正数宽度，未指定时跟随触发器，实际宽度和位置限制在可视视口内并保留 8px 边距。位置同时跟随页面、容器和软键盘引起的可视视口变化，锚点完全移出视口时隐藏弹层。

异步选项使用项目契约 `loadChildren(option, { signal }): Promise<TreeSelectOption[]>`，单项和返回值继续使用 value / label。TreeSelect 持有公共 Tree 加载器的缓存，关闭再打开弹层不丢失已加载选项；这些选项参与完整树的搜索、回填、父子勾选、半选及实际叶节点计数。父节点原有选择会传导给新后代；异步增加的叶数可能使原有选择超过 `maxCount`，既有值不被截断，仍可取消。未解析值计入上限，载入后改按节点关系计数。

提供加载器后，没有 `children` 的节点可展开；`isLeaf: true` 表示已知叶节点，显式空数组默认也是叶子，`isLeaf: false` 可将其声明为待加载目录。空结果成为叶节点，返回非法或重复 value 时显示错误。同一节点请求去重，失败通过按钮或展开方向键重试；`onLoad(option, children)` / `onLoadError(error, option)` 报告结果。`loadVersion`（默认 0）改变时清除缓存并取消旧请求；外部明确提供的 children / isLeaf 优先。加载器引用变化本身不刷新缓存。

关闭弹层、收起目录或祖先、禁用、删除、刷新版本、卸载和输入非空搜索时会取消在途请求；过期结果被忽略。搜索仅过滤当前已知选项，不自动发起加载；清空搜索恢复持久展开，尚未加载的展开目录可重新读取。取消按钮收起目录并保留树项焦点，失败重试完成后恢复该树项焦点。异步初始未知值等待加载，曾解析的值在祖先缓存刷新时也可等待重新载入；已知值失去所属分支或外部明确删除后清理，不会随数据恢复重新出现。移除或清除入口可请求取消未知值，移除加载器后恢复静态数据清理约定。

`expandedValues` / `defaultExpandedValues` 和 `onExpand` 管理展开，`treeDefaultExpandAll` 只负责初始化。搜索时临时展开匹配节点的祖先，清除搜索后恢复原展开状态；此时开合不改变持久展开键。`searchValue` / `defaultSearchValue`、`onSearch` 可控制搜索文本，`clearSearchOnSelect` 可在多选操作后请求清空搜索（默认保持搜索）。`onClear` 只在点击公共清除入口后报告一次，清除后的值为单选 undefined 或多选空数组。

弹层复用 Tree 的可变高度窗口；`listHeight` 默认 256px，实际高度按视口和搜索区可用空间限制，`virtual={false}` 保留完整嵌套树。键盘支持方向键、Home / End、字符查找和可见焦点；Enter 或空格选择/勾选，Escape 关闭并恢复触发器焦点。Tab 从搜索进入树，反向 Tab 回到搜索或触发器，从树向前 Tab 关闭弹层并继续触发器之后的表单控件（包括清除入口）。打开时、跨窗口定位时不改变页面滚动；外部点击或焦点移出时关闭，不抢回外部焦点。

`variant`、`status` 和 `size` 与其他输入控件统一，错误状态设置 `aria-invalid`，`prefix` / `suffixIcon` 提供非交互装饰。`showLine` / `showIcon` 复用 Tree 视觉，`emptyText` 配置无结果文案。`classNames` 提供 root / trigger / value / tag / remove / prefix / suffix / clear / popup / search / tree / item / title / switcher / checkbox / loading / error 的 Tailwind 插槽。`/__ui` 独立预览关联/严格勾选、三种回填、选择上限、标签折叠、逐项移除、四向弹出、受控空值、千节点窗口、四种外观、错误/警告、空结果与 RTL 深色；异步预览包含延迟、缓存、嵌套目录、空结果、失败、取消、刷新、删除与待加载值。

`Tabs` 的动态标签、增删焦点和面板生命周期见 [Tabs](#tabs)。

`Transfer.items` 的 `key` 必须唯一。`onChange(nextTargetKeys, direction, movedKeys)` 在移动后调用；`direction` 为 `to-target` 或 `to-source`。搜索只影响当前可见项和“全选可见项”，已勾选但被搜索隐藏的项目仍可移动。自定义 `filterItem` 收到去除首尾空格并转为小写的查询词。横向排列时箭头跟随 `ConfigProvider.direction`；窄屏上下排列时改用上下箭头，移动方向语义保持一致。

`Anchor` 默认跟踪同页 `#id` 目标的滚动位置，并以 `aria-current="location"` 标记当前章节；`offsetTop` 用于固定页头的判定偏移。传入 `activeHref` 后由业务控制高亮；点击链接仍保留浏览器原生锚点跳转，`onChange` 在点击或自动切换当前章节时收到链接地址。

`getContainer()` 可指定独立滚动的 HTMLElement 或 Window。容器模式仅跟踪该容器内的目标，活动章节按容器顶部加 `offsetTop` 判定；点击同页链接时只滚动容器，并保留 URL hash 与 `onChange`。修饰键点击仍由浏览器处理。未指定容器时继续使用原生页面锚点跳转。`/__ui` 提供三章节容器预览，键盘与 H5 轻触均可导航。

滚动跟踪同时观察文档捕获阶段的滚动事件和目标可见性变化，保证浏览器程序滚动或嵌套滚动容器中的章节切换仍能刷新当前链接。

`Steps` 可用 `current` 受控，也可用 `defaultCurrent` 初始化内部步骤；提供 `onChange` 后步骤可点击，禁用项仍以禁用按钮和 `aria-disabled` 暴露。`size="small"` 缩小标记和文字，也可继承 `ConfigProvider.componentSize="small"`；交互区域仍至少 44px。`percent` 在当前进行中的步骤标记外显示 0–100% 进度环，非有限值不显示；其他步骤或错误状态不显示进度环。当前步骤使用 `aria-current="step"`，各步状态和当前百分比通过辅助文字说明。

`Spinner` 和 `Spin` 共用小号 16px、默认 24px、大号 36px 的 Tailwind 指示器尺寸，并继承 `ConfigProvider.componentSize`。两者以可访问状态名称报告加载，系统启用减少动态效果时停止旋转。`Spin fullscreen` 使用项目 Portal 容器中的模态层；加载期间背景无法获得键盘焦点或触控操作，Escape 不会中断加载，结束后焦点返回原位置。没有 `tip` 时全屏层显示 `label`。

`Spin description` 是优先于旧 `tip` 的描述文案；`indicator` 可换装饰性加载图标。`percent` 为数值时限制到 0–100 并显示环形进度；`percent="auto"` 在等待期间缓慢估算且不会自行到达 100，任务结束须设置 `spinning={false}`。设置进度时环形指示器优先于自定义 `indicator`。`classNames` / `styles` 提供 `root`、`section`、`indicator`、`description`、`container` 插槽，支持对象或接收 `{ props }` 的函数；样式仍使用项目 Tailwind 语义类和 Token。`/__ui` 展示数值进度、估算进度、自定义指示器及 100% 进度样式。

`Tree` 保留 `selectedKey` / `defaultSelectedKey` 和 `onSelect(key)` 的单选 API；数组契约使用 `selectedKeys` / `defaultSelectedKeys`、`onSelectionChange(keys, { node, selected })`，`multiple` 开启逐项追加或移除。选择与焦点独立，方向键只移动焦点；显式 `selectedKey={undefined}` 或 `selectedKeys={[]}` 表示受控空选择，单选模式最多显示第一个有效键。全局 `selectable` 和单项 `selectable={false}` 关闭节点选择，不影响展开和勾选。

`checkable` 显示节点复选标记，`checkedKeys` / `defaultCheckedKeys` 与节点选择相互独立；`onCheck(keys, { node, checked, halfCheckedKeys })` 返回按树数据顺序排列的勾选键与半选键。默认父子关联，勾选父节点会选中可用后代，子节点全部勾选时父节点勾选，部分勾选时父节点半选。单项 `disabled`、`disableCheckbox` 和 `checkable={false}` 是勾选传导边界，父级操作不会改变该分支；边界下面的可用子节点仍可独立勾选。外部显式勾选的禁用节点保留自身状态，不传导。`checkStrictly` 关闭父子关联，可通过 `halfCheckedKeys` 显式提供严格模式下的半选状态；`disableCheckbox` 仅禁用勾选，仍可选择或展开节点，并提供可访问说明。

展开使用 `expandedKeys` / `defaultExpandedKeys` 和 `onExpand(keys)`。`defaultExpandAll` 只在首次挂载时展开当前所有父节点；`defaultExpandParent` 默认开启，初始化时展开指定节点的可用祖先；`autoExpandParent` 可让受控展开键自动补齐祖先，关闭父节点时会从请求中移除对应后代键，避免被自动展开立即还原。全局 `disabled` 同步关闭展开、勾选和选择。非受控状态清理已删除的键，已勾选父节点新增的可用后代会跟随勾选。

树保留原生 `tree` / `treeitem` / `group` 层级和一个 roving Tab 入口，层级、兄弟位置、选择及勾选状态通过 ARIA 暴露；复选标记是该树项的触控入口，不额外增加 Tab 停靠点。空格切换勾选，Enter 选择；未显示复选框的节点空格仍可选择。上下键浏览、Home / End 到首尾、左右键展开/返回父级并随 RTL 反向；字符输入在当前可见可用节点间查找，可连续输入或重复首字母循环。节点的交互内容保留原生操作。被删除、关闭或禁用的焦点节点恢复到最近可用祖先，其次首个可用节点，全部不可用或空数据时回到根容器；外部焦点不被抢走。

`showLine` 显示按逻辑方向连接的分支线，`showIcon` 显示节点的装饰性 `icon`（缺省使用公共文件夹/文件图标），`switcherIcon({ node, expanded, direction })` 自定义展开图标。`blockNode` 默认开启以兼容原有整行标题，可关闭为内容宽度。长标题换行，深层缩进限制在容器的 25% 以内，触控入口至少 44px；展开图标的旋转尊重减少动画。`label` 命名树，`emptyText` 默认为“暂无节点”。`classNames` 支持 root、item、row、switcher、checkbox、icon、title、group、loading、error，单项支持局部类名。`/__ui` 展示关联/严格勾选、多选/单选、禁用边界、长标题、窄容器、动态删除、RTL 深色、默认展开祖先和空数据。

异步树使用项目返回值契约 `loadChildren(node, { signal }): Promise<TreeNode[]>`，组件管理子节点缓存并保持原始 `treeData` 不变。没有 `children` 的节点在提供加载器后可展开；`isLeaf: true` 是已知叶子，显式 `children: []` 默认也为叶子，`isLeaf: false` 可把空数组声明为待加载目录。已有非空子节点直接展示，空加载结果成为已知叶子。同一节点请求去重，成功后再次展开使用缓存；加载所得子节点继续参与勾选传导，也可嵌套异步目录。所有节点 key 必须在整棵树中唯一，返回重复键或非法子节点时显示加载错误。

`onLoad(node, children)` 和 `onLoadError(error, node)` 分别报告成功与加载失败。`loadVersion`（默认 0）改变时整体缓存失效并取消旧请求；切换数据源时更新版本，加载器函数引用改变本身不清缓存。外部明确提供 `children` 或 `isLeaf: true` 时以外部数据为准。收起节点或其祖先、禁用、删除、版本变化和卸载会通过 `AbortSignal` 取消进行中的请求；即使加载器不遵守 signal，旧响应也不能覆盖新数据。

加载期间节点使用 `aria-busy`、可访问加载文字和取消按钮，失败时显示错误及重试按钮，不自动重复失败请求。展开方向键也可重试；即使受控父级拒绝收起，取消按钮仍立即中断请求并提供继续加载入口。加载或重试按钮消失后，焦点恢复到同一可用树项；外部操作保持外部焦点。取消和重试入口保留 44px 触控尺寸，指示器尊重减少动态效果。`/__ui` 的独立异步树预览包含嵌套加载、空结果、失败恢复、外部开合、缓存刷新、禁用、删除与 RTL 深色主题。

`height` 指定树滚动容器的像素高度，传入有效正数后默认开启虚拟窗口；`virtual={false}` 保留有高度的完整嵌套树。高度下限为 44px，无效高度回退为自然布局。`estimatedItemHeight` 默认 44px、下限 44px，是尚未测量节点的估计值；`overscan` 默认 3，限制在 0–50 个节点。窗口按展开后的逻辑顺序定位，仅挂载附近节点及当前 Tab/焦点入口。长标题、节点交互内容及加载/错误反馈用 ResizeObserver 测量实际高度，宽度变化后重新测量；上方节点变高时保留可见节点的滚动锚点，原本完整可见的焦点行增加加载/错误反馈后保持可见，数据缩减或收起后限制滚动范围。

虚拟树使用平铺的 `treeitem` 和显式 `aria-level`、`aria-posinset`、`aria-setsize` 表达完整逻辑层级；展开、选择、勾选与禁用仍遵循相同 API。方向键、Home / End 和字符查找能够先挂载并滚动到目标再聚焦。字符串标题可直接查找；复杂 React 标题通过单项 `textValue` 提供用于查找的文本，避免依赖未挂载的 DOM。手动滚动保留焦点节点及其交互内容，窗口变化不抢走外部焦点。虚拟窗口以容器宽度换行，不自动扩展横向宽度；非活动节点卸载后不会保存其内部局部状态，有状态内容应使用外部受控数据，或关闭虚拟化。

`ref` 提供项目 `TreeHandle`：`getNodePath(key)` 返回当前已知节点从根到目标的 `TreeNode[]`，未知键返回空数组；`scrollTo({ key, align?, offset?, autoExpand?, focus? })` 按 key 定位已知节点。`align` 为 start / center / end / auto，默认 auto 只在目标不完整可见时滚动；正 `offset` 向下增加滚动距离，默认不改变焦点。`autoExpand` 请求展开已知目标的祖先，受控模式通过 `onExpand` 请求并等待外部更新，禁用祖先不会被强行展开；`focus` 仅聚焦可用节点。不提供高度时保留自然布局，定位不会触发未知异步子节点加载。`/__ui` 展示 1000 个文件、跨窗口定位、数据缩减、长标题/变高内容、虚拟化切换、异步反馈、RTL 深色及窄容器。

`draggable` 默认关闭，可设为布尔值或 `(node) => boolean`，单项 `draggable: false` 禁止移动该节点。`onDrop(info)` 报告项目移动命令，数据仍由父级管理；`info` 包含 `dragKey`、`dropKey`、`position`（before / inside / after）、`dragNode`、`dropNode`、整棵来源分支的 `dragKeys` 和包含已加载子节点的当前 `treeData` 快照。异步树应使用这个快照更新，避免从原始数据中遗漏加载所得节点：

```tsx
<Tree
  treeData={nodes}
  draggable
  onDrop={(info) => setNodes(moveTreeNode(info.treeData, info))}
/>
```

`moveTreeNode(treeData, move)` 不可变地移动整棵分支，未改变的分支保留引用；拒绝不存在的键、自身及后代、禁用节点及其禁用祖先、不可移动来源、明确叶节点的内部放置和无实际变化的位置，返回原数组。移走最后一个子节点时保留明确的 `children: []` 并清除 `isLeaf: false`，避免异步缓存恢复已经移走的节点；该空目录仍可接收后续移动。`allowDrop(info)` 是组件的额外同步纯判断，工具函数不应用它。选择和显式勾选键按 key 保留，父子勾选按新结构重新计算。

桌面从 44px 六点手柄原生拖动，目标行上部、中央和下部分别代表之前、内部和之后，边界线及目录高亮配合可访问状态文字反馈。悬停可接收的未展开目录 600ms 后请求展开；异步目录须先加载完成才能接收内部放置。虚拟窗口保留原生拖动来源的 DOM，指针靠近容器上下边缘时自动滚动，离开容器停止滚动。移动模式在小于 640px 的容器中将每级缩进从 24px 缩小到 12px，连接线同步调整，为标题保留空间，操作区域仍为 44px。

H5 点击移动手柄、目标节点、位置和确认按钮完成同一命令；键盘 Ctrl+Space 开始，方向键选择目标，Enter / 空格按当前位置提交（默认 after），Escape 取消，面板按钮可通过 Tab 到达。无目标或不允许的位置禁用对应按钮，移动中不改变节点选择或勾选。内部放置请求展开接收目录，提交或取消后恢复来源焦点；外部指针、窗口失焦，或来源删除、禁用、隐藏时取消。受控父级仍需更新数据和展开键，状态文字只报告移动请求已提交。`classNames` 新增 dragHandle、dropIndicator、moveControls，局部 moveControls 使用活动来源节点的覆写。`/__ui` 的独立移动预览覆盖前后排序、整棵分支、保护规则、异步接收目录、虚拟滚动、键盘确认、RTL 深色和 H5 操作。

Carousel 的 `items` 保持项目 ReactNode 数组 API；有状态的内容传稳定 React `key`，每项只挂载一次，切换后保留表单值。非活动幻灯片使用 `inert` 和 `aria-hidden`，动效期间也不进入焦点与辅助技术阅读顺序。`index` / `defaultIndex` 使用从零开始的索引，越界值限制到当前范围，非有限值回到首项；非受控状态会清理数据缩减后的索引，受控状态不回写父值。

`dots` 默认显示一个可 Tab 到达的当前页码入口，四向 `dotPlacement` 为 `top` / `bottom` / `start` / `end`，逻辑位置跟随 RTL；点击或方向键选择页码，Home / End 到首尾。幻灯片区域也支持左右键和 Home / End，内容中的输入、链接与按钮保留原生键盘行为。`arrows` 默认保留原有上一项/下一项入口；`infinite={false}` 到首尾时禁用相应按钮，自动播放在末项停止，再次开始会回到首项。

`effect` 为 `scroll`（默认）或 `fade`，`speed` 默认 300ms；切换使用原生 Web Animations，系统减少动画时直接显示最终状态。`adaptiveHeight={false}` 默认保留所有幻灯片所需的最高高度，设为 true 则跟随当前内容，不对高度做过渡。`swipe` 默认开启触控横向滑动，`draggable` 默认关闭鼠标拖拽；纵向手势保留页面滚动，表单、链接和 `data-carousel-no-swipe` 区域不被手势接管。

`onBeforeChange(current, next)` 和 `onChange(next)` 处理切换请求；`onAfterChange(current)` 在实际显示索引改变并完成动效后调用，被新索引替代的旧动效不回调；动效中途改变效果、方向或减少动画配置时，当前可见项直接完成并回调一次。`ref` 使用项目 `CarouselHandle`：`next()`、`prev()`、`goTo(index, { animate?: boolean })`，`animate: false` 跳过该次动效。受控模式下这些方法仍需父级更新 `index`；数据缩减后显式调用 `goTo(0)` 可以通过 `onChange(0)` 清理父级越界值，即使当前显示已被限制在首项。

开启 `autoplay` 后，焦点、鼠标进入或触控会暂停轮转，并提供暂停/恢复按钮；系统启用减少动态效果时默认不自动轮播，用户明确恢复后才开始。若启用播放时焦点已经在内容内，保持暂停；文档隐藏时停止计时，恢复可见后从新的完整间隔开始。`interval` 默认 4000ms，正值至少 100ms，非有限或非正值回退到默认值。`dotProgress` 展示当前指示点的装饰性进度，暂停时停止动效；减少动画时不绘制进度动画。

`label` 命名轮播区域，`emptyText` 定义空数据文案；单项数据不显示切换控制。`classNames` 提供 `root` / `viewport` / `slide` / `controls` / `arrow` / `dots` / `dot` / `status` / `rotation` 的 Tailwind 插槽。隐藏当前焦点所属内容、删除或禁用焦点所在的导航控件时，焦点恢复到轮播区域；外部焦点不被抢走。`/__ui` 展示两种动效、四向页码、有限循环、表单草稿、动态缩减、进度、RTL 深色、单项与空数据。

`Statistic.classNames` / `styles` 可传语义槽对象，或接收 `({ props, state }) => 槽对象` 的函数；`state` 为 `loading` 或 `ready`。槽包括 `root`、`header`、`title`、`content`、`value`、`prefix`、`suffix`，分别应用 Tailwind 类和 CSS 属性。根节点原有的 `className` / `style` 优先于语义槽；加载时保留标题、内容和值节点，并把骨架放在值节点内。数字先按 `locale` 和 `precision` 格式化，再通过 `groupSeparator`、`decimalSeparator` 覆写对应的分组和小数标记；`formatter` 完全接管数值显示。`StatisticTimer` 继承同一套语义样式入口。

`StatisticTimer` 的 `value` 是 Unix 毫秒时间戳：倒计时表示目标时间，正计时表示起始时间。`type` 默认为 `countdown`，`format` 默认为 `HH:mm:ss`；支持 `D` / `DD`、`H` / `HH`、`m` / `mm`、`s` / `ss`、`S` / `SS` / `SSS`，字面文字用方括号包裹。有天数时小时显示当天小时，否则显示累计小时；秒级格式每秒更新，包含毫秒的格式以约 50ms 间隔刷新。`onChange` 收到当前显示精度对应的剩余或已过毫秒数，`onFinish` 在倒计时首次到零时调用一次；更换目标时间会重新开始。无效时间显示 `—`。计时器使用 `role="timer"` 且关闭自动播报，避免每秒打断阅读；加载时复用 Statistic 骨架屏。

`Timeline.items` 保留项目的 `title`（内容标题）、`children`（详情）和 `dot` API，新增 `label` 表示时间或另一侧辅助信息；不改变旧 `title` 的含义。有动态排序或局部状态时传稳定 `key`，`reverse` 实际倒置 DOM 阅读顺序而不修改输入数组，表单值与焦点不会因倒序重建。

`mode` 为 `start`（默认）、`end` 或 `alternate`，单项 `placement` 可覆写逻辑侧；`orientation` 为 `vertical`（默认）或 `horizontal`。容器宽度不足 640px 时，所有布局回退为节点加单列内容，时间标签放在标题之前；基于容器宽度，不依赖视口宽度。宽容器内，竖向布局把时间标签与内容放在轴的两侧，交替或跨侧覆写时轴居中；水平布局以 subgrid 对齐节点和连接线，内容与标签位于轴上下两侧，单项至少 12rem，多项在列表内横向滚动。

`labelWidth` 控制竖向单侧布局的标签列宽，默认为 `'28%'`；数字和 `px` 字符串为像素，也接受百分比字符串。实际标签列限制在 5rem 至容器的 40% 之间，交替布局使用两侧等宽。`variant` 为 `outlined`（默认）或 `filled`，节点使用项目语义颜色 `primary` / `success` / `warning` / `error` / `gray`；`loading` 提供旋转标记和 `aria-busy`，相邻连接线使用虚线，减少动态效果时停止旋转。`dot` 是装饰性标记，不放交互内容；`statusText` 可指定可访问状态文字，否则根据颜色和加载状态生成，不依赖颜色传达状态。

`label` 命名时间轴区域，内部原生 `ol` 保持唯一阅读顺序；只有实际横向溢出时，列表才进入 Tab 顺序并关联方向键滚动说明；左右键按物理方向滚动，Home / End 到逻辑首尾，移动 WebKit 也由组件显式处理键盘滚动。内容按钮和输入保留原生键盘行为与触控。焦点所属内容被删除或禁用时恢复到首个可用操作，空数据时恢复到根容器；外部焦点不被抢走。`emptyText` 默认为“暂无记录”，空数组复用公共 Empty，单项不显示连接线。

`classNames` 支持 `root` / `list` / `item` / `marker` / `dot` / `rail` / `label` / `title` / `content` 的 Tailwind 插槽，单项可传 `className` 和除 root / list 外的局部 `classNames`。原生属性、style 和焦点事件传给根容器，方向默认继承 ConfigProvider。`/__ui` 展示布局切换、倒序、标签宽度、长文本、自定义标记、加载/错误与内容操作、水平长列表、PC 窄容器、RTL 深色、单项和空数据。

Menu 的受控展开 API 为 `expandedKeys`、`defaultExpandedKeys` 和 `onExpand`；多级菜单使用方向键展开、收起和移动焦点，禁用项不会被方向键选中。Menu 只有一个 Tab 入口，焦点菜单项通过 roving `tabIndex` 暴露。横向菜单的子菜单通过主题作用域内的 Portal 显示，避开卡片裁切边界；Escape 返回触发项，点击外部关闭。

横向菜单的父项支持 ArrowDown 打开并聚焦首个可用子项，弹层内 ArrowDown/ArrowUp 在同级可用项之间移动。选中子项会请求收起横向弹层；受控 `expandedKeys` 在调用方接受前保持原状态，实际收起后焦点回到父项。禁用父项即使被外部列入 `expandedKeys`，也不会展示或允许操作子项。`/__ui` 预览连续键盘导航、禁用子项和 H5 触控选择。

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

`Form` 的异步规则使用同一份值快照校验；输入在校验期间变化时会重新校验最新值，旧结果不会覆盖新错误状态。`onFinishFailed(errors, values)` 只处理字段规则错误；`onFinish` 的同步异常或 Promise 拒绝交给 `onFinishError(error, values)`。如需处理保存失败，应提供 `onFinishError` 并在其中展示反馈。`resetFields()` 会恢复初始值、清除后来新增的字段和错误，并取消尚未完成的校验及提交；命令式 `validateFields()` 在此时以 `AbortError` 拒绝。传入受控 `values` 时，`onValuesChange(changed, proposed)` 只提出变更，字段显示、命令式读取、校验和提交均以外部已接纳的 `values` 为准；重置也先提出恢复初始值的请求。`validateOn="change"` 等待外部接纳后校验，受控值变化会清除对应旧错误，迟到的异步结果不会覆盖新值。`/__ui` 展示接纳与拒绝请求。

提交校验失败时，Form 会聚焦首个错误控件，并默认以 `scrollToFirstError` 将它滚到可见区域；可传入 `ScrollIntoViewOptions` 调整位置，或设为 `false` 保留当前滚动位置。每次失败提交只定位一次，后续无关重渲染不会抢回焦点。`/__ui` 的长表单示例覆盖嵌套滚动容器。

`Calendar` 的 `value` 和 `month` 可分别受控；`onChange` 返回本地日期字符串，不经过 UTC 转换。`renderDate` 只放非交互内容；有额外日期信息时同时提供 `getDateDescription`，让读屏器读到完整日期和说明。窄屏时日期表格在组件内部横向滚动，不让页面产生横向溢出。

`range` 与 `previewRange` 接收 ISO 起止元组，用于范围首尾、内部与临时预览标记；范围模式下网格设置 `aria-multiselectable`，范围日期单元格暴露 `aria-selected`，读屏名称包含范围位置。`onDateHover` 和 `onDateFocus` 提供预览通知，悬停离开时回传 undefined；焦点浏览仍不触发 `onChange`。

`selectedDates` 用于非连续多日期标记，数组可以为空；网格始终保留多选语义，值只改变单元格选中状态，焦点和浏览月份仍独立。`range` 同时传入时优先展示范围。

`Mentions.options` 使用 `{ value, label, disabled? }`；`onChange` 返回完整文本，`onSelect` 返回选中的选项。光标前的前缀需要位于文本起始、空白或左括号之后；插入时保留光标后的内容，并在需要时追加空格。可直接放入 `FormItem`，错误说明由 `FormField` 关联到 textarea。

`Splitter.panels` 使用 `{ key, label, content, minSize?, maxSize?, resizable?, collapsible? }`。`sizes` / `defaultSizes` 为总和 100 的百分比数组；拖拽时只调整分隔条两侧的面板。`onResize` 返回新尺寸，受控模式需在回调中同步更新 `sizes`。键盘方向键按 `step` 调整，Home/End 跳到约束边界，双击分隔条恢复默认比例；折叠按钮会记住展开前的尺寸。

`Layout` 在直接包含 `Layout.Sider` 时使用横向排列，其余情况纵向排列。`Layout.Content` 默认渲染 `main`；在已有 `main` 的预览或嵌套区域中设 `as="div"`。`Layout.Sider` 的断点使用 Tailwind 的 640/768/1024/1280px；低于断点时折叠，展开后借助 `Sheet` 显示导航。`onCollapse(collapsed, source)` 的 source 为 `trigger` 或 `breakpoint`；受控模式需同步更新 `collapsed`。

`Masonry.items` 使用 `{ key, content, column?, estimatedHeight?, className? }`。`columns` 接受固定列数或 `{ base, sm, md, lg, xl }`，断点按组件容器宽度计算；默认 1 / 2 / 3 列。`gap` 接受一个像素值或 `[水平, 垂直]`。组件以最短列分配项目，`column` 可固定某项所在列；`onLayoutChange` 返回每项的 `{ key, column }`。动态内容通过 ResizeObserver 重新排布，DOM 顺序和键盘顺序保持 `items` 顺序。

`Watermark` 只作内容来源提示，不作为防截图或保密机制。`image` 支持同源地址、data URL 或允许跨域读取的地址；图片加载或画布导出失败时优先显示 `content`。覆盖层不可接收指针事件，也不进入辅助技术阅读顺序。主题变化会重新生成水印；覆盖层被移除后会恢复，并调用 `onRemove`。

`QRCode` 默认使用 Canvas，也支持 SVG；`value` 采用字节模式编码，`errorLevel` 为 `L` / `M` / `Q` / `H`。`status="loading"` 和 `status="expired"` 会保留二维码容器并覆盖状态层，`onRefresh` 用于失效后的重新获取。

`Tour.steps` 使用 `{ key, target?, title, description?, cover?, placement?, mask?, arrow?, type? }`。`target` 可传元素或返回元素的函数；目标为空时卡片居中。开启遮罩时目标周围默认保留可直接操作的高亮区域，Tab 在卡片和高亮目标之间循环，遮罩区域可点击关闭；卡片或目标尺寸变化时会重新定位。`keyboard` 开启后支持 Escape、左右方向键，步骤切换会调用 `onChange`。`current` / `open` 为受控状态，`onFinish` 和 `onClose` 结束后恢复打开前焦点。

`arrow` 默认显示，可用步骤的 `arrow` 覆写；传 `{ pointAtCenter: true }` 时箭头朝高亮目标中心对齐，位置随卡片换边调整。`type` 可在 Tour 或单个步骤设为 `primary`，统一卡片与箭头的主题色。`disabledInteraction` 将高亮目标临时设为 `inert` 并遮挡指针，Tab 只在卡片内循环；换步或关闭后恢复目标原有的 `inert` 状态。`/__ui` 的“预览禁止目标交互”展示这一组合。

`actionsRender(defaultActions, { current, total })` 可扩展或替换默认操作按钮。步骤的 `nextButtonProps` / `prevButtonProps` 支持按钮文案及原生点击回调；回调调用 `event.preventDefault()` 可取消默认换步。`closeIcon` 支持全局或步骤级自定义，传 `false` 隐藏关闭按钮；此时初始焦点落到卡片内下一可操作项。步骤 `onClose` 在全局 `onClose` 前调用，步骤 `scrollIntoViewOptions` 可覆写全局滚动设置，步骤 `mask` 可覆写全局遮罩及颜色/样式。`getPopupContainer(target)` 可指定局部挂载节点，未指定时沿用 ConfigProvider/ThemeScope 的 Portal；`zIndex` 默认为项目浮层层级 70，可显式调整。`classNames` / `styles` 提供 root、mask、highlight、arrow、card、close、cover、title、description、indicators、actions 语义插槽，位置尺寸仍由组件计算。`/__ui` 的“预览自定义引导”展示局部挂载、操作扩展、关闭图标和步骤覆写。

`gap` 推荐使用对象形式：`{ offset: [水平, 垂直], radius }`，两个偏移也可写成同一个数字。旧的数字 `gap` 与 `[偏移, 圆角]` 写法继续可用，默认相当于 `{ offset: 6, radius: 8 }`。`classNames` / `styles` 还可传函数，接收 `{ props, current, total, step }` 并返回各插槽配置；换步时按当前步骤重新求值。`/__ui` 的自定义引导展示不同水平/垂直高亮间距及步骤样式。

受控 `open` 的 `onClose` / `onFinish` 是关闭请求；调用方继续保持 `open=true` 时，卡片不会提前将焦点恢复到启动按钮，键盘 Tab 仍进入引导。只有实际变为关闭状态后才恢复启动前焦点；`/__ui` 的“预览受控关闭”展示第一次拒绝、第二次接受的路径。

卡片优先使用指定的 `placement`；目标贴近视口边缘时先尝试相反方向，再尝试有足够空间的其他方向，最后将卡片限制在视口内。卡片高度最多为视口高度减 24px，内容过长时在卡片内滚动，操作按钮仍可触达。`/__ui` 的“预览边缘放置”可检查侧向位置与窄屏换边，关闭后焦点回到实际触发按钮。

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
