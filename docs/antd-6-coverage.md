# Ant Design 6.x 组件对照

本清单以 [Ant Design 组件总览](https://ant.design/components/overview-cn/) 6.6.5 版为参照，记录项目入口是否具备对应能力。入口存在只表示已有项目 API，不等于完整复刻 Ant Design 的全部属性与交互。新增组件遵循 [Tailwind 组件约定](./component-conventions.md)。

| 分类     | 已有项目入口                                                                                                                                                                 | 仍需实现或验证                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 通用     | Button、FloatButton、Icon、Typography                                                                                                                                        | 核对各状态、尺寸和视觉一致性                    |
| 布局     | Divider、Flex、Grid、Layout、Masonry、Space、Splitter                                                                                                                        | 核对响应式、动态尺寸和内容顺序                  |
| 导航     | Anchor、Breadcrumb、Dropdown、Menu、Pagination、Steps、Tabs                                                                                                                  | 核对复杂键盘路径和 H5 导航                      |
| 数据录入 | AutoComplete、Cascader、Checkbox、ColorPicker、DatePicker、Form、Input、InputNumber、Mentions、Radio、Rate、Select、Slider、Switch、TimePicker、Transfer、TreeSelect、Upload | 核对组合表单、错误反馈和移动端输入              |
| 数据展示 | Avatar、Badge、Calendar、Card、Carousel、Collapse、Descriptions、Empty、Image、List、Listy、Popover、QRCode、Segmented、Statistic、Table、Tag、Timeline、Tooltip、Tour、Tree | List 在上游已标记废弃，本项目暂保留基础列表 API |
| 反馈     | Alert、Drawer、Message、Modal、Notification、Popconfirm、Progress、Result、Skeleton、Spin、Spinner、Watermark                                                                | 继续核对其他反馈状态与 H5 表现                  |
| 其他     | Affix；App、BorderBeam、ConfigProvider、ThemeScope、ToastProvider、Util 提供应用上下文、主题、装饰边框和基础工具边界                                                         | 其余组件继续按真实业务补齐状态和行为            |

后续应先补真实缺口，再逐类检查现有入口的状态预览、可访问性、PC/H5 响应式和测试覆盖。AI、音视频与文件能力保持在 `capabilities`，不为追求组件名对齐而移入 `shared/ui`。

`Spinner` 和 `Spin` 已统一小号、默认和大号指示器尺寸及动画，在 `/__ui` 并排预览，并通过桌面和 H5 浏览器检查减少动态效果设置。

ConfigProvider 的 RTL 方向已覆盖 Select、Dialog、Sheet、Dropdown、Popover、Tooltip 的弹层容器，Select 的触发器和选项使用 Tailwind 逻辑方向样式；`/__ui` 提供键盘与 H5 触控预览。

Dropdown、Popover、Tooltip 的浮层已在裁切容器、RTL、桌面与 H5 中验证。Dropdown 的上下方向键、Enter、空格和正反向 Tab，以及 Popover 中交互内容的 Tab 顺序已有浏览器回归。

List 与 Listy 的加载、空、错误状态保留可访问名称和容器尺寸；Listy 从加载状态恢复时会重置可见窗口。`/__ui` 可切换这些状态，桌面和 H5 浏览器均有回归。

Listy 在滚动后数据量缩减时会把滚动位置限制到有效范围，避免出现空白窗口；`/__ui` 可切换 100 条与 5 条数据，桌面和 H5 均已验证。

基础 Table 默认文字对齐跟随 LTR/RTL；显式的 `left`、`center`、`right` 仍按物理方向对齐。桌面显示语义表格，窄屏配置 `renderMobileRow` 时显示列表视图，避免两个视图同时进入辅助技术的阅读顺序。

Table 可排序列支持稳定的升序、降序、原始顺序循环，既可内部管理也可由外部控制。桌面表头和手机卡片均有排序入口，方向通过 `aria-sort` 或按钮状态暴露。

Table 新增可选行选择：受控或默认选中、禁用行保护、当前可用行全选及跨页键保留。桌面和 H5 共用选中状态，部分选中时全选框显示混合状态。

Checkbox 与 Radio 的勾选标记使用相邻输入状态驱动的 Tailwind 样式，桌面和 H5 浏览器均已验证实际可见性。

Table 列筛选复用项目 Popover 的焦点和 Portal 约定，支持多选、应用、重置、键盘和 H5 触控；桌面表头与手机工具栏使用同一筛选结果。

Input 与 Textarea 增加 `allowClear`，清空按钮保持 44px 触控区域并恢复输入焦点；`/__ui` 提供普通输入和多行输入预览。

Input 与 Textarea 提供项目自己的 `variant`（outlined、filled、borderless、underlined）和 `status`（error、warning），状态通过主题 Token 和 `aria-invalid` 暴露。

Select 与 MultiSelect 复用同一组外观与状态字段，错误状态会同步设置 `aria-invalid`，`/__ui` 展示填充和下划线警告选择器。

Card 保留组合式子组件，并补充 AntD 常用的 `title`、`extra`、`cover`、`actions`、`hoverable`、`loading` 和 `bordered` 插槽；`/__ui` 展示声明式卡片。

Button 补充危险、块级、圆角和图标位置 API；这些状态仍使用项目的 Tailwind 语义 Token，并在 `/__ui` 展示触控尺寸。

数值、日期、时间和自动完成输入复用字段外观与状态契约，`/__ui` 展示填充数字、下划线日期和警告时间范围。

Tabs 非受控状态下移除或禁用当前标签时会显示可用面板，并在原标签持有焦点时恢复到可用标签；`/__ui` 提供动态分组预览和桌面、H5 回归。

Tour 高亮区域允许直接点击目标，遮罩模式下 Tab 只在卡片与目标间移动；卡片内容或目标尺寸变化时重新定位。`/__ui` 展示可展开说明，并覆盖桌面键盘及 H5 触控。

InputNumber 受控空值与逐字输入已补齐：输入期间可暂时越界，失焦时限制到 `min` / `max`。`/__ui` 提供清空与越界预览，桌面和 H5 浏览器验证原生键盘与触控。

AutoComplete 已用项目自己的候选面板替换原生 datalist：候选按输入过滤，支持禁用项、方向键、Enter、Escape、`onSelect` 与 H5 触控；`/__ui` 预览选择状态。

Cascader 默认以单入口弹层选择路径，并继续使用原生分级控件支持键盘和 H5；`allowClear` 提供独立清空按钮，`mode="inline"` 保留原生必填校验。路径清空会删除后续值，动态选项变化只显示有效前缀；`/__ui` 同时预览两种形式。

Transfer 在 RTL 双栏布局中按实际目标方向显示箭头，H5 单列布局改用上下箭头；`/__ui` 提供 RTL 与窄屏预览，移动行为在桌面和 H5 均已验证。

TreeSelect 的 RTL 展开、折叠键与弹层文字方向已对齐；多选清空后恢复触发器焦点。`/__ui` 提供 RTL 树选择，桌面与 H5 键盘、触控均有回归。

InputOTP 的方向键现在跟随 RTL 格子的视觉顺序；`/__ui` 提供 RTL 验证码，桌面与 H5 均已验证键盘焦点和触控。

DatePicker 补充了项目 API 的 `DateRangePicker`：两个原生日期控件组成起止元组，日期交叉时清空另一端，窄屏纵向排列；`/__ui` 展示受控、禁用和错误状态。

TimePicker 补充了同日 `TimeRangePicker`：复用范围输入契约，支持分钟或秒精度、受控值、交叉清空和 H5 原生时间控件；`/__ui` 展示各状态。

Select 补充项目 API 的 `MultiSelect`：多值选择、过滤、禁用项、清空、受控表单值及 RTL 弹层方向。单选 `Select` 也支持 `allowClear`，清空后恢复触发器焦点。`/__ui` 展示可清空单选及多选的默认、禁用和错误状态。

Pagination 增加可选每页条数、总量范围和快速跳页；页码输入只接受有效整数，切换条数时保持原先首条记录所在的新页。`/__ui` 预览完整控制及原有“加载更多”模式。

FormItem 可用 `emptyValue={[]}` 连接数组值控件；`/__ui` 的多选树表单预览覆盖初始空值、选择和重置，避免把空字符串误当作选中项。TreeSelect 首次打开时聚焦树节点不会把长页面滚离触发器，桌面和 H5 均有回归。

Form 的必填规则会拒绝布尔 `false`；同意条款复选框通过 `valuePropName="checked"` 接入，`/__ui` 覆盖未勾选、键盘或触控勾选、提交和重置。

Switch 的滑块在 RTL 主题下按文字方向反向移动；`/__ui` 提供 RTL 开关，桌面键盘和 H5 触控均验证开关状态及滑块位置。

Input、Textarea、SearchInput 的非受控默认值现在响应原生表单重置；`/__ui` 提供独立重置预览，桌面键盘与 H5 触控覆盖输入、清空和重置后的显示。

Anchor 除视窗滚动外也捕获文档滚动并观察目标可见性，修复移动 WebKit 程序滚动后当前章节偶发未更新的问题。

Table 的筛选结果为空时保留桌面表头及 H5 筛选入口，用户可重置条件恢复数据；`/__ui` 用“已归档”状态预览该路径。

List、Listy、Table 的公共错误状态支持异步重试，等待时防止重复触发，拒绝后提示重试失败；`/__ui` 可切换重试成功与失败预览。

Card 增加 default / small 尺寸契约，组合式插槽与声明式内容同步缩放，并支持继承 ConfigProvider 的小号尺寸；`/__ui` 展示小号卡片及可触控操作。

Alert 增加可关闭提示和关闭回调，关闭按钮保持 44px 触控区域；`/__ui` 展示操作、关闭与恢复，桌面键盘和 H5 触控均可验证。
