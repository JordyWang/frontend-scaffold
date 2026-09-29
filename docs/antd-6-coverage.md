# Ant Design 6.x 组件对照

本清单以 [Ant Design 组件总览](https://ant.design/components/overview-cn/) 6.6.5 版为参照，记录项目入口是否具备对应能力。入口存在只表示已有项目 API，不等于完整复刻 Ant Design 的全部属性与交互。新增组件遵循 [Tailwind 组件约定](./component-conventions.md)。

| 分类     | 已有项目入口                                                                                                                                                                 | 仍需实现或验证                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 通用     | Button、FloatButton、Icon、Typography                                                                                                                                        | 核对各状态、尺寸和视觉一致性                                                  |
| 布局     | Divider、Flex、Grid、Layout、Masonry、Space、Splitter                                                                                                                        | 核对响应式、动态尺寸和内容顺序                                                |
| 导航     | Anchor、Breadcrumb、Dropdown、Menu、Pagination、Steps、Tabs                                                                                                                  | 核对复杂键盘路径和 H5 导航                                                    |
| 数据录入 | AutoComplete、Cascader、Checkbox、ColorPicker、DatePicker、Form、Input、InputNumber、Mentions、Radio、Rate、Select、Slider、Switch、TimePicker、Transfer、TreeSelect、Upload | 核对组合表单、错误反馈和移动端输入                                            |
| 数据展示 | Avatar、Badge、Calendar、Card、Carousel、Collapse、Descriptions、Empty、Image、List、Popover、Segmented、Statistic、Table、Tag、Timeline、Tooltip、Tree                      | QRCode、Tour、Listy 虚拟列表；List 在上游已标记废弃，本项目暂保留基础列表 API |
| 反馈     | Alert、Drawer、Message、Modal、Notification、Popconfirm、Progress、Result、Skeleton、Spin、Spinner、Watermark                                                                | 核对独立 Spinner 与包裹式 Spin 的视觉一致性                                   |
| 其他     | Affix；ThemeScope、ToastProvider 提供部分配置与应用上下文能力                                                                                                                | BorderBeam、App、ConfigProvider、Util 的项目 API 与边界                       |

后续应先补真实缺口，再逐类检查现有入口的状态预览、可访问性、PC/H5 响应式和测试覆盖。AI、音视频与文件能力保持在 `capabilities`，不为追求组件名对齐而移入 `shared/ui`。
