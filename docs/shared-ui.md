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
| Form / FormItem                 | `initialValues`、`values`、`onValuesChange`、`onFinish`、`onFinishFailed`、`onFinishError`、`rules`、`valuePropName`、`trigger`                  | 表单只协调值和校验；控件仍使用项目自己的 API，规则错误通过 FormField 的 `aria-describedby` 暴露                             |
| InputNumber / Slider            | `value` / `defaultValue`、`min`、`max`、`step`、`onChange`、`label`                                                                              | 使用原生 number/range 控件；数值提交时限制在范围内，键盘和触控由浏览器处理                                                  |
| DatePicker / TimePicker         | 原生日期/时间属性、`value`、`defaultValue`、`onChange`、`size`                                                                                   | 输出 ISO 日期或本地时间字符串；输入由浏览器提供键盘和触控选择器                                                             |
| Calendar                        | `value` / `defaultValue`、`month` / `defaultMonth`、`onChange`、`onMonthChange`、`minDate`、`maxDate`、`disabledDate`、`renderDate`              | 选中日期使用 `YYYY-MM-DD`，月份使用 `YYYY-MM`；网格支持方向键、Home/End、PageUp/PageDown；日期按钮至少 44px                 |
| ColorPicker                     | `value` / `defaultValue`、`onChange`、`showText`、`size`、`label`、常用 `aria-*`                                                                 | 使用原生颜色控件，统一输出六位小写 hex；保留键盘、系统颜色面板和 44px 触控区域                                              |
| AutoComplete / Cascader         | `options`、`value` / `defaultValue`、`onChange`、`label`                                                                                         | 自动完成使用 `combobox` + `datalist`；级联选择按路径拆成多个可访问 select                                                   |
| TreeSelect                      | `treeData`、`value` / `defaultValue`、`onChange`、`multiple`、`showSearch`、`allowClear`、`defaultExpandedValues`                                | 项目树形选择契约；单选或多选，搜索会显示匹配项及其祖先，键盘使用方向键与 Enter，H5 提供 44px 触控区域                       |
| Transfer                        | `items`、`targetKeys` / `defaultTargetKeys`、`selectedKeys` / `defaultSelectedKeys`、`onChange`、`showSearch`、`filterItem`                      | 双栏穿梭框；可见项批量选择、禁用项保护、方向操作、键盘和 H5 单列布局                                                        |
| Upload                          | `accept`、`multiple`、`beforeUpload`、`onFiles`、`disabled`                                                                                      | 仅负责文件入口和筛选；预览、校验、上传进度继续使用 `capabilities/files`                                                     |
| Card                            | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`                                                                | 仅负责内容容器                                                                                                              |
| Empty                           | `title`、`description`、`action`                                                                                                                 | 适用于无数据状态                                                                                                            |
| Select                          | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size`、常用 `aria-*` 和焦点事件            | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点                                                            |
| Dialog / Modal / Sheet / Drawer | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                                                  | `Modal`/`Drawer` 是项目 API 的 AntD 语义别名；焦点、Escape、背景滚动和 H5 底部面板由内部统一处理                            |
| Dropdown / Tooltip / Popover    | `Dropdown(items, trigger)`；`Tooltip(title, children)`；`Popover(content, children, title?, label?, placement?)`                                 | 菜单支持 Enter、空格、上下方向键和 Escape；气泡内控件接续触发器的 Tab 顺序，提示用于可选信息，必要信息直接展示              |
| Popconfirm / FloatButton        | `Popconfirm(title, description, onConfirm, onCancel)`；`FloatButton(label, position, shape)`                                                     | 确认操作复用 Dialog 焦点管理；浮动按钮保留安全区和 44px 触控尺寸                                                            |
| Toast                           | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                                                      | 应用根部已有 Provider；`variant` 为 default / success / warning / error；系统深色和 H5 安全区由 Provider 处理               |
| Tabs                            | `items`、`value` / `defaultValue`、`onValueChange`、`orientation`、`activationMode`、`label`                                                     | `items` 含 value、label、content、disabled；支持垂直方向、手动激活、键盘导航和窄屏触控；垂直模式为左侧选项、右侧内容        |
| Pagination                      | `page`、`pageSize`、`total`、`onPageChange`、`mode`                                                                                              | `mode` 为 pages / load-more；页码从 1 开始；页码窗口支持直接跳转，窄屏区域独立滚动                                          |
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
| Segmented                       | `options`、`value` / `defaultValue`、`onChange`、`size`、`block`、`disabled`                                                                     | 使用原生单选控件，支持方向键、受控/非受控值和窄屏横向滚动                                                                   |
| Rate                            | `count`、`value` / `defaultValue`、`onChange`、`allowClear`、`character`、`tooltips`、`disabled`                                                 | 使用原生单选控件，支持方向键、清除、禁用、键盘和 44px 触控区域                                                              |
| Tag / Badge                     | `tone`；`Badge(count, max, dot, label)`                                                                                                          | 状态同时提供文字；徽标数量或标签可被辅助技术读取                                                                            |
| Image / Skeleton                | 原生 img 属性、必填 `alt`、`fallback`；`Skeleton(shape, width, height, label)`                                                                   | 图片懒加载，加载失败展示替代内容；骨架屏有状态标签                                                                          |
| Alert / Spinner                 | `Alert(title, description, tone, action)`；`Spinner(label, size)`                                                                                | 错误与警告用 alert，其他状态用 status；加载状态有可访问名称                                                                 |
| Spin                            | `spinning`、`delay`、`tip`、`label`、`size`、`fullscreen`                                                                                        | 可包裹局部内容或全屏展示；加载时内容不可操作，延迟用于避免短任务闪烁                                                        |
| Watermark                       | `content`、`image`、`markSize`、`gap`、`offset`、`rotate`、`opacity`、`fontSize`、`onRemove`                                                     | 在内容上重复绘制非交互水印；文字颜色跟随语义变量，图片加载失败时回退文字                                                    |
| BorderBeam                      | `children`、`color`、`duration`、`borderWidth`、`anchor`、`reverse`、原生 div 属性                                                               | 装饰性动态边框；内容保持原有语义、键盘和触控行为，系统减少动态效果时停止动画                                                |
| QRCode                          | `value`、`size`、`color`、`bgColor`、`bordered`、`errorLevel`、`icon`、`iconSize`、`status`、`statusRender`、`onRefresh`、`type`                 | 支持 SVG / Canvas、真实 QR 模块、加载与失效状态；状态操作和触控目标至少 44px                                                |
| Tour                            | `steps`、`open`、`current`、`onChange`、`onClose`、`onFinish`、`mask`、`keyboard`、`placement`、`gap`、`scrollIntoViewOptions`                   | 目标高亮、遮罩、左右方向键和 Escape；卡片操作与触控目标至少 44px                                                            |
| Progress / Result               | `Progress(percent, status, type, showInfo)`；`Result(status, title, subTitle, extra)`                                                            | 进度值限制在 0–100 并暴露 progressbar；结果状态提供明确文本和可选操作                                                       |
| Toast / Message / Notification  | `toast(options)`；`message.open/success/warning/error(content)`；`notification.open/success/warning/error({ message, description?, duration? })` | 共用 Provider 和安全区配置；页面不直接依赖 Sonner                                                                           |
| Collapse                        | `Collapse(items, activeKey, defaultActiveKey, accordion, onChange)`                                                                              | 使用按钮控制 region，支持受控/非受控和单开模式                                                                              |
| Avatar / Descriptions           | `Avatar(src, alt, label, size, shape)`；`Descriptions(items, column, bordered, layout)`                                                          | 头像始终有可访问名称；描述使用 `dl/dt/dd` 并在小屏自动单列                                                                  |
| Statistic / Timeline            | `Statistic(title, value, precision, prefix, suffix)`；`Timeline(items)`                                                                          | 统计值保留文本语义；时间线使用有序列表并提供状态颜色和文字                                                                  |
| Carousel / Tree                 | `Carousel(items, index, autoplay, onChange)`；`Tree(treeData, expandedKeys, defaultExpandedKeys, onExpand, selectedKey, onSelect)`               | 轮播提供上一项/下一项和 live 状态；树只有一个 Tab 入口，方向键移动及展开/收起，Enter/空格选择；触控可点展开区               |

`Table` 默认沿文字方向的起始侧对齐表头与单元格；列的显式 `align="left"`、`"center"`、`"right"` 使用指定的物理方向。传入 `renderMobileRow` 后，窄屏展示列表视图，桌面展示表格视图。

`Transfer.items` 的 `key` 必须唯一。`onChange(nextTargetKeys, direction, movedKeys)` 在移动后调用；`direction` 为 `to-target` 或 `to-source`。搜索只影响当前可见项和“全选可见项”，已勾选但被搜索隐藏的项目仍可移动。自定义 `filterItem` 收到去除首尾空格并转为小写的查询词。

`Anchor` 默认跟踪同页 `#id` 目标的滚动位置，并以 `aria-current="location"` 标记当前章节；`offsetTop` 用于固定页头的判定偏移。传入 `activeHref` 后由业务控制高亮；点击链接仍保留浏览器原生锚点跳转，`onChange` 在点击或自动切换当前章节时收到链接地址。

`Steps` 可用 `current` 受控，也可用 `defaultCurrent` 初始化内部步骤；提供 `onChange` 后步骤可点击，禁用项仍以禁用按钮和 `aria-disabled` 暴露。当前步骤使用 `aria-current="step"`，各步状态通过辅助文字说明。

`Spinner` 和 `Spin` 共用小号 16px、默认 24px、大号 36px 的 Tailwind 指示器尺寸，并继承 `ConfigProvider.componentSize`。两者以可访问状态名称报告加载，系统启用减少动态效果时停止旋转。

Tree 支持 `selectedKey` 受控选择和 `defaultSelectedKey` 非受控初始选择。受控展开或数据更新后若移除了当前聚焦节点，会把焦点移到最近仍可见的祖先节点；焦点已移出 Tree 时不会重新抢占焦点。`/__ui` 可切换受控展开状态验证这一行为。

Carousel 开启 `autoplay` 后，焦点、鼠标进入或触控会暂停轮转，并提供暂停/恢复按钮；系统启用减少动态效果时默认不自动轮播，用户明确恢复后才开始。

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

`Tour.steps` 使用 `{ key, target?, title, description?, cover?, placement?, mask?, type? }`。`target` 可传元素或返回元素的函数；目标为空时卡片居中。开启遮罩时目标周围保留高亮区域，遮罩区域可点击关闭；`keyboard` 开启后支持 Escape、左右方向键，步骤切换会调用 `onChange`。`current` / `open` 为受控状态，`onFinish` 和 `onClose` 结束后恢复打开前焦点。

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
