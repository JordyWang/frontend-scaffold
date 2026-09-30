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

Tabs 非受控状态下移除或禁用当前标签时会显示可用面板，并在原标签持有焦点时恢复到可用标签；`/__ui` 提供动态分组预览和桌面、H5 回归。

Tour 高亮区域允许直接点击目标，遮罩模式下 Tab 只在卡片与目标间移动；卡片内容或目标尺寸变化时重新定位。`/__ui` 展示可展开说明，并覆盖桌面键盘及 H5 触控。
