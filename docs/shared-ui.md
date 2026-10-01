# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。设计变量定义在 `src/shared/styles/tokens.css`，新组件使用 Tailwind 语义工具类；底层依赖集中在这一层。新增组件样式约定见 [组件实现约定](./component-conventions.md)。

| 组件                            | 项目 API                                                                                                                                              | 约定                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button                          | `variant`、`size`、`loading`、原生 button 属性                                                                                                        | 默认 `type="button"`；加载时禁用，避免重复提交                                                                              |
| Input / Textarea                | 原生属性、`invalid`、`size`                                                                                                                           | 转发 ref；`size` 为 default / small / large，输入字号为 16px                                                                |
| Mentions                        | `options`、`value` / `defaultValue`、`onChange`、`onSelect`、`prefix`、`disabled`、原生 textarea 属性                                                 | 从光标前识别提及；方向键、Enter、Escape 与触控选择，候选项支持禁用；弹层继承局部主题                                        |
| SearchInput                     | `value` / `defaultValue`、`onValueChange`、`onSearch`、`allowClear`、`loading`、`invalid`、`size`                                                     | Enter 与按钮提交搜索；清空保持输入焦点；在 FormItem 中使用 `trigger="onValueChange"`                                        |
| PasswordInput                   | 原生输入属性、`visible` / `defaultVisible`、`onVisibleChange`、`visibilityToggle`、`invalid`、`size`                                                  | 保留原生密码输入及自动填充，显示/隐藏按钮支持键盘且不会提交表单                                                             |
| InputOTP                        | `length`、`value` / `defaultValue`、`onChange`、`onComplete`、`label`、`inputMode`、`mask`、`disabled`、`invalid`、`name`                             | 分格输入一次性验证码；支持粘贴、方向键和删除，默认数字键盘，单格触控区域至少 44px                                           |
| FormField                       | `label?`、`control`、`description`、`error`、`required`、`id`                                                                                         | 自动连接标签、说明和错误；自带标签的控件省略 `label`                                                                        |
| Form / FormItem                 | `initialValues`、`values`、`onValuesChange`、`onFinish`、`onFinishFailed`、`onFinishError`、`rules`、`valuePropName`、`emptyValue`、`trigger`         | 表单只协调值和校验；控件仍使用项目自己的 API，规则错误通过 FormField 的 `aria-describedby` 暴露                             |
| InputNumber / Slider            | `value` / `defaultValue`、`min`、`max`、`step`、`onChange`、`label`                                                                                   | 使用原生 number/range 控件；数值提交时限制在范围内，键盘和触控由浏览器处理                                                  |
| DatePicker                      | `value` / `defaultValue`、`onChange`、`mode`、`open` / `defaultOpen`、`panelMonth`、`needConfirm`、`presets`、`disabledDate`、`classNames`            | 日期单位字符串；默认项目弹层，可选常驻面板或原生输入，确认前不提交；键盘、RTL、44px 网格和组合失焦                          |
| TimePicker                      | `value` / `defaultValue`、`onChange`、`mode`、`precision`、`use12Hours`、`needConfirm`、单位步长、禁用回调、`presets`、`classNames`                   | 24 小时本地时间字符串；默认项目时间列面板，可选常驻/原生模式；确认、键盘、RTL 与 44px 触控                                  |
| DateRangePicker                 | `value` / `defaultValue`、`picker`、`onChange`、`mode`、`onCalendarChange`、`needConfirm`、`presets`、`allowEmpty`、`disabledDate`                    | 日期单位起止元组；默认项目双面板，窄容器单面板；独立端点、确认、开放区间、键盘与 44px 触控                                  |
| MultiDatePicker                 | `value` / `defaultValue`、`onChange`、`order`、`needConfirm`、`maxCount`、`maxTagCount`、`renderTag`                                                  | 日期单位数组；同 `DatePicker multiple`，跨月切换、临时选择、逐项删除、44px 触控                                             |
| TimeRangePicker                 | `value` / `defaultValue`、`onChange`、`onCalendarChange`、`mode`、`precision`、`needConfirm`、`order`、`disabledTime`、端点控制、`presets`            | 同日时间元组；默认项目时间列面板，临时范围与提交分离；支持秒、12 小时显示、锁定端点、开放区间与窄容器                       |
| Calendar                        | `value` / `defaultValue`、`month` / `defaultMonth`、`onChange`、`onMonthChange`、`minDate`、`maxDate`、`disabledDate`、`renderDate`                   | 选中日期使用 `YYYY-MM-DD`，月份使用 `YYYY-MM`；网格支持方向键、Home/End、PageUp/PageDown；日期按钮至少 44px                 |
| ColorPicker                     | `value` / `defaultValue`、`onChange`、`showText`、`size`、`label`、常用 `aria-*`                                                                      | 使用原生颜色控件，统一输出六位小写 hex；保留键盘、系统颜色面板和 44px 触控区域                                              |
| AutoComplete / Cascader         | `options`、`value` / `defaultValue`、`onChange`、`label`；Cascader 支持列式浏览、路径搜索、`changeOnSelect`、`mode`、四向弹层、外观和语义插槽         | 自动完成使用 `combobox` + `listbox`；级联选择默认列式弹层，支持内嵌面板与原生分级表单控件                                   |
| TreeSelect                      | `treeData`、`value` / `defaultValue`、`onChange`、`multiple`、`checkable`、`checkStrictly`、`checkedStrategy`、`maxCount`、`showSearch`、`allowClear` | 项目树形选择契约；复用公共 Tree 的勾选、键盘和虚拟窗口，搜索保留完整树的选择结果，H5 提供 44px 触控区域                     |
| Transfer                        | `items`、`targetKeys` / `defaultTargetKeys`、`selectedKeys` / `defaultSelectedKeys`、`onChange`、`showSearch`、`filterItem`                           | 双栏穿梭框；可见项批量选择、禁用项保护、方向操作、键盘和 H5 单列布局                                                        |
| Upload                          | `accept`、`multiple`、`beforeUpload`、`onFiles`、`disabled`                                                                                           | 仅负责文件入口和筛选；预览、校验、上传进度继续使用 `capabilities/files`                                                     |
| Card                            | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`；`size` 为 default / small                                          | 组合式插槽共享尺寸；小号可继承 ConfigProvider.componentSize                                                                 |
| Empty                           | `title`、`description`、`action`、`image`、`size`                                                                                                     | 无数据状态；default / small 尺寸，可继承 ConfigProvider.componentSize；默认插图可替换或隐藏                                 |
| Select                          | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size`、常用 `aria-*` 和焦点事件                 | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点                                                            |
| MultiSelect                     | `options`、`value` / `defaultValue`、`onValueChange`、`showSearch`、`allowClear`、`disabled`、`name`、`required`、`size`                              | 项目多选值为 `string[]`；弹层列表支持过滤、方向键、Enter/空格、Escape 和 H5 触控                                            |
| Dialog / Modal / Sheet / Drawer | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                                                       | `Modal`/`Drawer` 是项目 API 的 AntD 语义别名；焦点、Escape、背景滚动和 H5 底部面板由内部统一处理                            |
| Dropdown / Tooltip / Popover    | `Dropdown(items, trigger)`；`Tooltip(title, children)`；`Popover(content, children, title?, label?, placement?)`                                      | 菜单支持 Enter、空格、上下方向键和 Escape；气泡内控件接续触发器的 Tab 顺序，提示用于可选信息，必要信息直接展示              |
| Popconfirm / FloatButton        | `Popconfirm(title, description, onConfirm, onCancel)`；`FloatButton(label, position, shape)`                                                          | 确认操作复用 Dialog 焦点管理；浮动按钮保留安全区和 44px 触控尺寸                                                            |
| Toast                           | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                                                           | 应用根部已有 Provider；`variant` 为 default / success / warning / error；系统深色和 H5 安全区由 Provider 处理               |
| Tabs                            | `items`、`value` / `defaultValue`、`onValueChange`、`orientation`、`activationMode`、`label`                                                          | `items` 含 value、label、content、disabled；支持垂直方向、手动激活、键盘导航和窄屏触控；垂直模式为左侧选项、右侧内容        |
| Pagination                      | `page`、`pageSize`、`total`、`onPageChange`、`mode`、`loading`、`disabled`                                                                            | `mode` 为 pages / load-more；页码从 1 开始；禁用时同步锁定页码、条数与跳页；窄屏区域独立滚动                                |
| List                            | `items`、`getKey`、`renderItem`、`loading`、`error`、`onRetry`、`emptyTitle`、`label`、`className`                                                    | 语义化列表；加载、空和错误状态保留同一容器、名称与布局类，加载时标记 `aria-busy`                                            |
| Listy                           | `items`、`getKey`、`renderItem`、`itemHeight`、`height`、`overscan`、`onEndReached`、`loading`、`error`、`label`                                      | 固定行高虚拟列表；状态切换保留名称、高度和布局类，数据缩减时修正滚动位置，恢复数据后从首行开始；原生滚动和 H5 触控保留      |
| Table                           | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow`                                             | 列支持 `header`、`align`、`rowScope`；加载、空和错误状态保留表格区域语义，传入 `renderMobileRow` 后手机展示业务定义的卡片行 |
| 公共能力                        | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                                                                  | 弹层挂载、异常兜底、响应式容器和统一反馈                                                                                    |
| App / ConfigProvider / Util     | `App`、`useApp()`；`ConfigProvider`、`useConfig()`；`getPrefixCls`、`usePrefixCls`、`warning`、`cx`                                                   | 应用级 message / notification / modal.confirm API；弹窗支持确认、取消和回调；主题、方向、尺寸、locale 与前缀配置            |
| ThemeScope                      | `mode`、`density`、`tokens`、原生 div 属性                                                                                                            | 局部浅色/深色、品牌 Token、组件 Token 和紧凑预览；`auto` 继承上级主题                                                       |
| Icon / Typography               | `Icon(name, size, label)`；`Typography(as, variant, tone)`                                                                                            | 图标默认装饰性；有语义时传 `label`；标题通过 `as` 保持正确层级                                                              |
| Stack / Flex / Grid / Divider   | `Stack(direction, gap, align, justify, wrap)`；`Flex` 为 Stack 别名；`Grid(minItemWidth, gap)`；`Divider(orientation)`                                | Grid 根据容器宽度自动换列；竖向分隔线仅用于水平布局                                                                         |
| Splitter                        | `panels`、`sizes` / `defaultSizes`、`onResize`、`onResizeEnd`、`onCollapse`、`orientation`、`step`、`disabled`                                        | 多面板百分比尺寸；相邻面板拖拽、方向键、Home/End、双击重置及折叠；触控命中区至少 44px                                       |
| Masonry                         | `items`、`columns`、`gap`、`onLayoutChange`                                                                                                           | 按最短列排布不同高度内容；按容器宽度响应列数，内容或图片尺寸变化后重新测量                                                  |
| Layout                          | `Layout`、`Layout.Header`、`Layout.Sider`、`Layout.Content`、`Layout.Footer`；Sider 支持断点与受控折叠                                                | 页面结构使用语义元素；窄屏侧栏借助 Sheet 处理焦点、Escape 和背景滚动                                                        |
| Space                           | `direction`、`size`、`align`、`wrap`、`split`                                                                                                         | 默认水平排列；支持数字间距和窄屏换行，分隔符为装饰性内容                                                                    |
| Breadcrumb / Steps              | `Breadcrumb(items, separator, label)`；`Steps(items, current, status, direction, onChange)`                                                           | 使用 `nav`/`ol` 语义；步骤支持键盘激活和当前步骤标记，窄屏可横向滚动                                                        |
| Menu / Anchor / Affix           | `Menu(items, selectedKeys, mode, onSelect)`；`Anchor(links, activeHref)`；`Affix(offsetTop)`                                                          | 菜单支持方向键；页内导航使用原生锚点；Affix 使用 sticky 并保留滚动空间                                                      |
| Checkbox / Radio / Switch       | 原生 input 属性、`label`、`size`、`invalid`；`RadioGroup(options, value, onValueChange, required)`                                                    | 原生键盘行为和表单提交；标签提供 44px 触控区域                                                                              |
| Segmented                       | `options`、`value` / `defaultValue`、`onChange`、`size`、`block`、`disabled`                                                                          | 原生单选控件；显式 `value={undefined}` 可清空，非受控选项失效时回退到可用项；支持方向键和窄屏横向滚动                       |
| Rate                            | `count`、`value` / `defaultValue`、`onChange`、`allowClear`、`character`、`tooltips`、`disabled`                                                      | 原生单选控件；显式 `value={undefined}` 保持受控空值；支持方向键、清除和 44px 触控区域                                       |
| Tag / Badge                     | `tone`；`Badge(count, max, dot, label)`                                                                                                               | 数量或标签可被辅助技术读取；Badge 可独立占位，也可附着于控件并跟随 RTL 逻辑末端                                             |
| Image / Skeleton                | 原生 img 属性、必填 `alt`、`fallback`、`preview`；`Skeleton(shape, width, height, label, loading, active, avatar, title, paragraph, round)`           | 图片支持放大预览和加载失败反馈；骨架屏有状态标签，内容形态支持头像、标题、段落及加载结束后展示真实内容                      |
| ImagePreviewGroup               | `items`、`current` / `defaultCurrent`、`onCurrentChange`、`open` / `defaultOpen`、`onOpenChange`、`label`、缩放配置                                   | 项目相册以图片数组表示，缩略图与预览地址可不同；键盘切换、触控工具栏和关闭后的焦点恢复共用图片预览实现                      |
| Alert / Spinner                 | `Alert(title, description, tone, action, closable, closeLabel, onDismiss)`；`Spinner(label, size)`                                                    | 错误与警告用 alert，其他状态用 status；可关闭提示保留 44px 操作区域；加载状态有可访问名称                                   |
| Spin                            | `spinning`、`delay`、`tip`、`label`、`size`、`fullscreen`                                                                                             | 可包裹局部内容或全屏展示；加载时内容不可操作，延迟用于避免短任务闪烁                                                        |
| Watermark                       | `content`、`image`、`markSize`、`gap`、`offset`、`rotate`、`opacity`、`fontSize`、`onRemove`                                                          | 在内容上重复绘制非交互水印；文字颜色跟随语义变量，图片加载失败时回退文字                                                    |
| BorderBeam                      | `children`、`color`、`duration`、`borderWidth`、`anchor`、`reverse`、原生 div 属性                                                                    | 装饰性动态边框；内容保持原有语义、键盘和触控行为，系统减少动态效果时停止动画                                                |
| QRCode                          | `value`、`size`、`color`、`bgColor`、`bordered`、`errorLevel`、`icon`、`iconSize`、`status`、`statusRender`、`onRefresh`、`type`                      | 支持 SVG / Canvas、真实 QR 模块、加载与失效状态；状态操作和触控目标至少 44px                                                |
| Tour                            | `steps`、`open`、`current`、`onChange`、`onClose`、`onFinish`、`mask`、`keyboard`、`placement`、`gap`、`scrollIntoViewOptions`                        | 目标高亮、遮罩、左右方向键和 Escape；卡片操作与触控目标至少 44px                                                            |
| Progress / Result               | `Progress(percent, status, type, showInfo, steps, gapDegree, gapPlacement)`；`Result(status, title, subTitle, extra, children)`                       | 进度值限制在 0–100 并暴露单一 progressbar；支持线性、圆环、仪表盘及分段；结果状态提供明确文本、操作和错误详情               |
| Toast / Message / Notification  | `toast(options)`；`message.open/success/warning/error(content)`；`notification.open/success/warning/error({ message, description?, duration? })`      | 共用 Provider 和安全区配置；页面不直接依赖 Sonner                                                                           |
| Collapse                        | `items`、`activeKey` / `defaultActiveKey`、`accordion`、`size`、`collapsible`、`destroyOnHidden`、`classNames`                                        | 标题/图标开合、独立操作区、内容保留、方向键导航、动态焦点恢复及 RTL                                                         |
| Avatar                          | `src`、`srcSet`、`alt`、`label`、`size`、`shape`、`icon`、`gap`、`onError`                                                                            | 头像保留单一可访问名称，失败后回退到图标或文字；长文字自动缩放，尺寸可响应断点                                              |
| Descriptions                    | `items`、`column`、`bordered`、`layout`、`size`、`title`、`extra`、`colon`、`emptyText`、`classNames`                                                 | `dl/dt/dd` 保持一份阅读顺序；响应式列数和跨度、整行剩余填充、统一尺寸、RTL 与空状态                                         |
| AvatarGroup                     | `items`、`maxCount`、`size`、`shape`、`label`                                                                                                         | 重叠展示成员，溢出按钮支持键盘和触控打开公共 Popover 查看其余成员，布局跟随 RTL                                             |
| Statistic                       | `title`、`value`、`precision`、`prefix`、`suffix`、`locale`、`formatter`、`loading`                                                                   | 数值按 ConfigProvider.locale 分组格式化，加载时提供可访问骨架                                                               |
| Timeline                        | `items`、`mode`、`orientation`、`reverse`、`variant`、`labelWidth`、`label`、`emptyText`、`classNames`                                                | 原生有序列表；两侧与交替布局、水平滚动、容器响应式、加载与文字状态、动态焦点恢复                                            |
| Carousel                        | `items`、`index` / `defaultIndex`、`autoplay`、`dots`、`dotPlacement`、`effect`、`infinite`、`adaptiveHeight`、`ref`                                  | 受控轮播、四向指示点、两种动效、键盘/手势切换、播放进度及隐藏内容焦点恢复                                                   |
| Tree                            | `treeData`、`expandedKeys`、`selectedKey` / `selectedKeys`、`checkedKeys`、`multiple`、`loadChildren`、`classNames`                                   | 选择和勾选独立；父子传导与半选、禁用边界、异步加载与取消/重试、唯一 Tab 入口、RTL 键盘与空状态                              |

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

`InputNumber`、`DatePicker`、`TimePicker`、`DateRangePicker`、`TimeRangePicker` 和 `AutoComplete` 同样支持 `variant` 与 `status`；错误状态通过 `aria-invalid` 传递；日期与时间的单选和范围默认使用项目面板，也提供显式原生适配。

`InputNumber` 输入期间保留原始数字草稿，`onChange` 会收到当前数值或清空时的 `undefined`；失焦时再按 `min` / `max` 限制数值，并在修正后再次调用 `onChange`。受控用法可传入 `value={undefined}` 表示空值，并在 `onChange` 中同步更新。

`DatePicker` 的值为严格的 `YYYY-MM-DD` 字符串（0001–9999 年），空值为 `''`；显式 `value={undefined}` 仍表示受控空值。默认 `mode="popup"`，`mode="panel"` 将面板常驻在输入之后，`mode="native"` 使用浏览器原生日期输入。输入 ref、原生输入属性、`size`、`variant` 与 `status` 保留；`className` 修饰输入，`classNames` 提供 root/input/toggle/clear/popup/panel/presets/footer/error 插槽。样式使用 Tailwind 与语义 Token。

`open` / `defaultOpen` / `onOpenChange` 只控制弹层模式。`panelMonth` / `onPanelMonthChange` 用 `YYYY-MM` 表示独立浏览月份；`defaultPanelMonth` 在首次展示及每次非受控弹层打开时作为起始月份，否则按当前有效日期定位。浏览、方向键和月份切换都不改变 `value`；手工提交或预设选中会请求展示对应月份，受控月份继续由外部更新。`placement` 为 bottomStart/bottomEnd/topStart/topEnd，逻辑起止跟随 RTL；空间不足时翻转并限制在视觉视口内。

`allowClear` 默认开启，清除发出 `onChange('')` 与 `onClear()` 并还输入焦点。`presets` 使用 `{ key, label, value }`，值可以是 ISO 字符串或点击时求值的函数；不可用的静态值禁用按钮，动态值失效时展示反馈。`min`、`max`、`step` 和 `disabledDate(date)` 同时限制面板、预设和手工输入；步长以日为单位，基准为有效 `min` 或 1970-01-01，计算不受夏令时小时差影响。

`needConfirm` 将选择保留为临时值；“确定”或有效编辑输入的 Enter 才发出 `onChange` 和 `onOk`，取消、Escape 或整个控件离焦丢弃临时值。普通模式在日期选择后立即提交，输入编辑则在 Enter 或整个控件失焦时提交；无效输入不发值回调，失焦恢复原值并给出说明。返回输入或在面板按钮间移动保留输入草稿。`disabled` / `readOnly` 禁止日期操作，`inputReadOnly` 只阻止手工输入，仍可用面板选择；它使用 HTML readOnly，所以必填等原生约束不参与浏览器校验，项目 Form 规则仍有效。

点击输入或图标打开，输入的 ArrowDown / Enter 进入网格；网格支持方向键、Home/End、PageUp/PageDown 与 Shift+PageUp/PageDown。日期选择、确定和 Escape 还输入焦点；面板首项 Shift+Tab 返回输入，末项 Tab 接回字段按钮及后续控件。`onBlur` 的事件来自根 span，只在离开输入、字段按钮和 Portal 面板组成的整个控件时调用；与 `Form validateOn="blur"` 配合不会在浏览日期时提前报错。`name` 在面板模式通过隐藏字段提交已确认值，临时值不进入 FormData；非受控原生 form reset 恢复初值且不发 `onChange`。项目 Form 的必填规则与 reset 沿用普通字符串控件契约。

`weekStartsOn` 在日期网格中支持周一/周日，`locale` 默认继承 ConfigProvider。`renderDate` 只放非交互内容，额外说明通过 `getDateDescription` 同步给辅助技术；`footer` 和 `suffixIcon` 提供内容与装饰图标插槽。其他日期单位、范围与多选通过下述项目 API 提供，日期时间组合后续单独补齐。

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

`TimePicker` 默认 `mode="popup"`，提供 `panel` 常驻与显式 `native` 原生适配。值仍为 24 小时本地字符串：分钟精度为 `HH:mm`，秒精度为 `HH:mm:ss`，空值为 `''`；拒绝 24:00、非法分秒、时区和毫秒。显式 `value={undefined}` 表示受控空值。`precision` 为 minute/second；未指定时，value/defaultValue/min/max/defaultOpenValue 含秒或 `step` 不是 60 的整数倍会采用秒精度。切换精度会重建会话，调用方同步提供对应格式的值。

`use12Hours` 将时间列与输入显示为 `hh:mm[:ss] AM/PM`，手工输入同时接受该格式和规范的 24 小时格式，回调及隐藏表单字段始终保持 24 小时值。12 AM 为 00 点、12 PM 为 12 点。`min` / `max` 和预设仍使用 24 小时字符串；min 大于 max 表示跨午夜的可用窗口，时间字符串本身不附带日期。

`hourStep` / `minuteStep` / `secondStep` 限制单位选项；`step` 以秒为单位，基准为有效 min 或午夜，跨午夜窗口按从 min 延续到次日的距离计算，`step="any"` 不限制总秒步长。`disabledHours()`、`disabledMinutes(hour)`、`disabledSeconds(hour, minute)` 与 `disabledTime(value)` 同时约束输入、面板、此刻和预设；这些同步函数应保持纯且快速。`hideDisabledOptions` 隐藏不可选选项。更改上级单位优先保留下级单位，不可用时找本单位内距离最近的有效补全；不会自动提交初始浏览用的 `defaultOpenValue`。

默认 `needConfirm=true`：选项及预设只更新待确认时间，“确定”或有效编辑输入的 Enter 提交并调用 `onOk`。取消、Escape、外部关闭及整个控件失焦恢复已提交值，返回输入或在列间移动保留临时值。`needConfirm=false` 选择后立即提交，面板保持打开供继续调整，“完成”结束会话；非法输入 Enter 给出错误，移出控件后恢复原时间。`allowClear` 为明确的立即清空动作，`disabled` / `readOnly` 禁止操作，`inputReadOnly` 仅禁止手工输入。`showNow` 默认开启，每次点击求当前时间并执行同一约束；`presets` 使用 `{ key, label, value: string | (() => string) }[]`，函数在点击时求值。

时、分、秒和时段列分别为 listbox，每列一个 Tab 入口；上下方向键、Home/End、PageUp/PageDown（五项）只浏览，左右键跨列且跟随 RTL，Enter/Space 或触控才选择。首项 Shift+Tab 回到输入，末项 Tab 取消未确认会话后接回字段按钮，Escape 还焦点；动态禁用恢复可用焦点且不抢走外部焦点。列内部滚动不选择时间，按钮至少 44px，窄容器及 RTL 深色沿用语义 Token。`renderCell(value, unit)` 只放非交互内容，`getCellDescription(value, unit)` 提供读屏说明，unit 为 hour/minute/second/meridiem。

`open` / `defaultOpen` / `onOpenChange`、四向逻辑 `placement`、输入 ref、size/variant/status 沿用字段契约，`className` 修饰输入；语义 Tailwind 插槽包含 root/input/toggle/clear/popup/panel/presets/columns/column/option/footer/error。`onBlur` 来自根 span，只在离开输入、按钮和 Portal 弹层组成的整个控件时触发。隐藏 `name` 字段仅提交已确认值；待确认或无效时间由原生 validity 阻止提交，非受控原生 form reset 和项目 Form 的校验/重置都有回归。`inputReadOnly` 使用 HTML readOnly，因此必填等原生约束不参与浏览器校验，项目 Form 规则仍有效。

`/__ui` 的“时间选择面板预览”包括分钟/秒、12 小时、条件禁用、跨午夜、手工输入、立即提交、外部开合、240px 常驻、动态禁用、只读、错误和预约表单。PC Chromium、H5 Chromium/WebKit 覆盖键盘、触控选择、确认/取消、Tab、列滚动、定位、RTL 与表单协作。日期时间组合、滚动即选择、悬停值预览、毫秒精度和任意 format 尚未实现。

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

`TimeRangePicker` 使用 `[start: string, end: string]` 的同日时间元组；分钟精度为 `HH:mm`，秒精度为 `HH:mm:ss`，空端点为 `''`。显式 `value={undefined}` 为受控空范围，运行时兼容 Form 的空数组。默认 `mode="popup"`，提供 `panel` 常驻与显式 `native`；原有入口保持兼容，原生预览明确指定 native。`precision` 推断与单时间一致，也检查两个端点及 `defaultOpenValue`；`use12Hours` 只改变输入和列显示，回调和隐藏字段仍为 24 小时字符串。ref 指向开始输入，`endRef` 指向结束输入。

项目面板默认 `needConfirm=true`：选择时间单位只更新当前临时端点，`onCalendarChange(range, { endpoint })` 通知临时元组；端点按钮或输入焦点切换开始/结束，各列可以继续调整，不在选中小时后提前转到结束端。“确定”或完整合法编辑草稿的 Enter 提交一次元组并调用 `onOk`；取消、Escape、组合失焦与外部关闭恢复已提交值。`needConfirm=false` 在范围完整且可用时立即提交并保留面板，未完成的交叉范围在组合失焦时恢复。有效手工草稿可继续在时间列中调整另一端，非法输入不会发值回调；即时模式的有效手工输入在 Enter 或组合失焦时提交。原生模式按输入事件即时提交可用端点，不使用项目确认会话。

项目 `order` 为 clear（默认）或 sort。clear 保留旧契约：端点交叉时清空可编辑的另一端；sort 在提交时自动排序，临时端点仍保留身份，排序后重新验证端点限制。锁定端点永远不清空或移动，越过锁定端点的选项禁用。`disabled` 为 boolean 或 `[startDisabled, endDisabled]`；`readOnly` 禁止全部操作，`inputReadOnly` 只禁止手工输入。`allowEmpty={[false, true]}` 可通过明确确认提交开放区间，空元组不可确认；清除一个端点立即提交，保留另一端。跨午夜的区间应使用日期时间组合表示，不从两个时间字符串推断次日。

`min` / `max`、秒 step、hourStep/minuteStep/secondStep 复用单时间约定。`disabledTime(value, { endpoint, from? })` 同时约束面板、输入、预设与此刻；`from` 为另一端的临时时间。禁用列回调也接受端点信息：`disabledHours(info)`、`disabledMinutes(hour, info)`、`disabledSeconds(hour, minute, info)`。`hideDisabledOptions` 隐藏禁用项；更改上级单位保留或补全最近的有效下级时间。`presets` 使用 `{ key, label, value: TimeRange | (() => TimeRange) }[]`，函数仅在点击时求值；快捷范围不可修改锁定端点。`showNow` 默认关闭，启用后按点击时刻选择当前端点。`defaultOpenValue` 为两个浏览基础值，不自动提交。

`open` / `defaultOpen` / `onOpenChange` 与 `activeEndpoint` / `defaultActiveEndpoint` / `onActiveEndpointChange` 分别控制开合与活动端点；受控端点等待外部更新。尺寸、外观、状态、四向逻辑 placement、字段组命名和 Portal 主题沿用日期范围契约。`renderCell(value, unit, info)` 与 `getCellDescription(value, unit, info)` 接收当前端点上下文，内容应非交互；Tailwind `classNames` 提供 root/fields/input/startInput/endInput/clear/toggle/popup/panel/endpoints/presets/columns/column/option/footer/error 插槽。440px 以下字段容器纵向排列，240px 常驻四列仍保持 44px 触控目标；列内部滚动和 RTL 键盘复用 TimePickerPanel。

首项 Shift+Tab 回到活动输入并保留待确认范围，末项 Tab 结束会话后接回结束字段操作；Escape 还焦点，动态禁用活动端点恢复到另一可用端点且不抢走外部焦点。`onBlur` 来自根 fieldset，仅在离开输入、操作和 Portal 面板组成的整个控件时触发。`name` 将已提交元组作为 JSON 隐藏字段提交，临时范围不会进入 FormData；全部禁用时省略，支持外部 form、原生 reset 和项目 Form 重置。与 `FormItem` 配合使用 `emptyValue={[]}`，完整区间另加元组规则；`inputReadOnly` 使用 HTML readOnly，项目 Form 仍按规则校验。

`/__ui` 的“时间范围面板预览”覆盖条件禁用、秒说明、12 小时、交叉清空、自动排序、手工输入、锁定端点、开放区间、即时提交、外部开合、240px 常驻、只读、错误、原生模式与 Form。PC Chromium、H5 Chromium/WebKit 验证两端协作、确认/取消、键盘与触控、Tab、局部滚动、RTL 和窄屏定位。该范围不包含日期时间组合、滚动即选择、悬停值预览或毫秒精度。

`InputOTP` 的左右方向键按格子的视觉顺序移动焦点；方向默认跟随 `ConfigProvider.direction`，也可通过原生 `dir` 属性覆盖。RTL 格子顺序和 44px 触控区域在 `/__ui` 中预览。

`FormItem.emptyValue` 指定未设置值或重置后的控件空值，默认 `''`；布尔字段继续使用 `false`。数组值控件（如多选 `TreeSelect` 和 `Cascader`）应传入 `emptyValue={[]}`，避免初始空字符串被解释为选中项。表单存储在用户选择前仍保持未设置状态。

`FormRule.required` 将布尔 `false` 视为未完成；同意条款等复选框用 `valuePropName="checked"` 接入 `FormItem` 后，未勾选和重置后的状态均不会通过必填校验。`/__ui` 提供键盘与 H5 触控示例。

`AutoComplete` 根据选项 `value` 过滤候选；`onChange` 接收输入或选中的字符串，`onSelect(value, option)` 只在选中建议时调用。候选项可设置 `disabled`。输入框保留焦点，通过上下方向键浏览、Enter 选择、Escape 关闭；候选面板在主题作用域内浮动，H5 可直接触控选择。

`MultiSelect` 使用与单选 `Select` 相同的 `{ value, label, disabled? }` 选项，`onValueChange` 返回去重后的字符串数组。选中后弹层保持打开，可继续选择或再次点选移除；`showSearch` 过滤选项，禁用项不可操作。`allowClear` 提供独立 44px 清空按钮。传入 `name` 时以 JSON 数组字符串提交；连接 `FormItem` 时使用 `trigger="onValueChange"`、`emptyValue={[]}` 和 `rules` 校验。

单选 `Select.allowClear` 在有值且可用时显示独立 44px 清空按钮；清空后 `onValueChange('')`，非受控值显示占位文字、原生表单不再提交该字段，并把焦点还给触发器。传入 `label` 可为清空按钮生成具体的可访问名称；受控值仍由外部 `value` 决定。

`Pagination` 可选 `onPageSizeChange(size, page)`、`pageSizeOptions`、`showQuickJumper` 和 `showTotal`。切换每页条数时，`page` 指向原先第一条记录所在的新页，由调用方同步更新 `pageSize` 和 `page`；快速跳页只接受当前范围内的整数，错误会在输入框旁显示。加载时这些控件不可操作，`load-more` 模式维持单按钮入口。

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

`range` 与 `previewRange` 接收 ISO 起止元组，用于范围首尾、内部与临时预览标记；范围模式下网格设置 `aria-multiselectable`，范围日期单元格暴露 `aria-selected`，读屏名称包含范围位置。`onDateHover` 和 `onDateFocus` 提供预览通知，悬停离开时回传 undefined；焦点浏览仍不触发 `onChange`。

`selectedDates` 用于非连续多日期标记，数组可以为空；网格始终保留多选语义，值只改变单元格选中状态，焦点和浏览月份仍独立。`range` 同时传入时优先展示范围。

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
