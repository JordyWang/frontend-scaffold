# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。组件的颜色和间距使用 `src/shared/styles/index.css` 中的设计变量；底层依赖集中在这一层。

| 组件                            | 项目 API                                                                                                                                         | 约定                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Button                          | `variant`、`size`、`loading`、原生 button 属性                                                                                                   | 默认 `type="button"`；加载时禁用，避免重复提交                                                                |
| Input / Textarea                | 原生属性、`invalid`、`size`                                                                                                                      | 转发 ref；`size` 为 default / small，输入字号为 16px                                                          |
| FormField                       | `label?`、`control`、`description`、`error`、`required`、`id`                                                                                    | 自动连接标签、说明和错误；自带标签的控件省略 `label`                                                          |
| InputNumber / Slider            | `value` / `defaultValue`、`min`、`max`、`step`、`onChange`、`label`                                                                              | 使用原生 number/range 控件；数值提交时限制在范围内，键盘和触控由浏览器处理                                    |
| DatePicker / TimePicker         | 原生日期/时间属性、`value`、`defaultValue`、`onChange`、`size`                                                                                   | 输出 ISO 日期或本地时间字符串；输入由浏览器提供键盘和触控选择器                                               |
| AutoComplete / Cascader         | `options`、`value` / `defaultValue`、`onChange`、`label`                                                                                         | 自动完成使用 `combobox` + `datalist`；级联选择按路径拆成多个可访问 select                                     |
| Upload                          | `accept`、`multiple`、`beforeUpload`、`onFiles`、`disabled`                                                                                      | 仅负责文件入口和筛选；预览、校验、上传进度继续使用 `capabilities/files`                                       |
| Card                            | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`                                                                | 仅负责内容容器                                                                                                |
| Empty                           | `title`、`description`、`action`                                                                                                                 | 适用于无数据状态                                                                                              |
| Select                          | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size`、常用 `aria-*` 和焦点事件            | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点                                              |
| Dialog / Modal / Sheet / Drawer | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                                                  | `Modal`/`Drawer` 是项目 API 的 AntD 语义别名；焦点、Escape、背景滚动和 H5 底部面板由内部统一处理              |
| Dropdown / Tooltip / Popover    | `Dropdown(items, trigger)`；`Tooltip(title, children)`；`Popover(content, children)`                                                             | 菜单支持方向键和 Escape；提示用于可选信息，必要信息直接展示                                                   |
| Popconfirm / FloatButton        | `Popconfirm(title, description, onConfirm, onCancel)`；`FloatButton(label, position, shape)`                                                     | 确认操作复用 Dialog 焦点管理；浮动按钮保留安全区和 44px 触控尺寸                                              |
| Toast                           | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                                                      | 应用根部已有 Provider；`variant` 为 default / success / warning / error；系统深色和 H5 安全区由 Provider 处理 |
| Tabs                            | `items`、`value` / `defaultValue`、`onValueChange`、`label`                                                                                      | `items` 含 value、label、content、disabled；窄屏横向滚动                                                      |
| Pagination                      | `page`、`pageSize`、`total`、`onPageChange`、`mode`                                                                                              | `mode` 为 pages / load-more；页码从 1 开始                                                                    |
| List                            | `items`、`getKey`、`renderItem`、`loading`、`error`、`onRetry`、`emptyTitle`、`label`                                                            | 语义化列表，加载、空和错误状态内置                                                                            |
| Table                           | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow`                                        | 传入 `renderMobileRow` 后，手机展示业务定义的卡片行                                                           |
| 公共能力                        | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                                                             | 弹层挂载、异常兜底、响应式容器和统一反馈                                                                      |
| ThemeScope                      | `mode`、`density`、`tokens`、原生 div 属性                                                                                                       | 局部浅色/深色、品牌 Token、组件 Token 和紧凑预览；`auto` 继承上级主题                                         |
| Icon / Typography               | `Icon(name, size, label)`；`Typography(as, variant, tone)`                                                                                       | 图标默认装饰性；有语义时传 `label`；标题通过 `as` 保持正确层级                                                |
| Stack / Flex / Grid / Divider   | `Stack(direction, gap, align, justify, wrap)`；`Flex` 为 Stack 别名；`Grid(minItemWidth, gap)`；`Divider(orientation)`                           | Grid 根据容器宽度自动换列；竖向分隔线仅用于水平布局                                                           |
| Space                           | `direction`、`size`、`align`、`wrap`、`split`                                                                                                    | 默认水平排列；支持数字间距和窄屏换行，分隔符为装饰性内容                                                      |
| Breadcrumb / Steps              | `Breadcrumb(items, separator, label)`；`Steps(items, current, status, direction, onChange)`                                                      | 使用 `nav`/`ol` 语义；步骤支持键盘激活和当前步骤标记，窄屏可横向滚动                                          |
| Menu / Anchor / Affix           | `Menu(items, selectedKeys, mode, onSelect)`；`Anchor(links, activeHref)`；`Affix(offsetTop)`                                                     | 菜单支持方向键；页内导航使用原生锚点；Affix 使用 sticky 并保留滚动空间                                        |
| Checkbox / Radio / Switch       | 原生 input 属性、`label`、`size`、`invalid`；`RadioGroup(options, value, onValueChange, required)`                                               | 原生键盘行为和表单提交；标签提供 44px 触控区域                                                                |
| Tag / Badge                     | `tone`；`Badge(count, max, dot, label)`                                                                                                          | 状态同时提供文字；徽标数量或标签可被辅助技术读取                                                              |
| Image / Skeleton                | 原生 img 属性、必填 `alt`、`fallback`；`Skeleton(shape, width, height, label)`                                                                   | 图片懒加载，加载失败展示替代内容；骨架屏有状态标签                                                            |
| Alert / Spinner                 | `Alert(title, description, tone, action)`；`Spinner(label, size)`                                                                                | 错误与警告用 alert，其他状态用 status；加载状态有可访问名称                                                   |
| Progress / Result               | `Progress(percent, status, type, showInfo)`；`Result(status, title, subTitle, extra)`                                                            | 进度值限制在 0–100 并暴露 progressbar；结果状态提供明确文本和可选操作                                         |
| Toast / Message / Notification  | `toast(options)`；`message.open/success/warning/error(content)`；`notification.open/success/warning/error({ message, description?, duration? })` | 共用 Provider 和安全区配置；页面不直接依赖 Sonner                                                             |
| Collapse                        | `Collapse(items, activeKey, defaultActiveKey, accordion, onChange)`                                                                              | 使用按钮控制 region，支持受控/非受控和单开模式                                                                |
| Avatar / Descriptions           | `Avatar(src, alt, label, size, shape)`；`Descriptions(items, column, bordered, layout)`                                                          | 头像始终有可访问名称；描述使用 `dl/dt/dd` 并在小屏自动单列                                                    |
| Statistic / Timeline            | `Statistic(title, value, precision, prefix, suffix)`；`Timeline(items)`                                                                          | 统计值保留文本语义；时间线使用有序列表并提供状态颜色和文字                                                    |
| Carousel / Tree                 | `Carousel(items, index, autoplay, onChange)`；`Tree(treeData, expandedKeys, defaultExpandedKeys, onExpand, selectedKey, onSelect)`               | 轮播提供上一项/下一项和 live 状态；树只有一个 Tab 入口，方向键移动及展开/收起，Enter/空格选择；触控可点展开区 |

Tree 在受控展开或数据更新后若移除了当前聚焦节点，会把焦点移到最近仍可见的祖先节点；焦点已移出 Tree 时不会重新抢占焦点。`/__ui` 可切换受控展开状态验证这一行为。

Carousel 开启 `autoplay` 后，焦点、鼠标进入或触控会暂停轮转，并提供暂停/恢复按钮；系统启用减少动态效果时默认不自动轮播，用户明确恢复后才开始。

Menu 的受控展开 API 为 `expandedKeys`、`defaultExpandedKeys` 和 `onExpand`；多级菜单使用方向键展开、收起和移动焦点，禁用项不会被方向键选中。

## 主题变量

设计变量按 **Seed → 语义 Map/Alias → 组件 Token** 组织。`--ui-seed-*` 控制品牌色、状态色和圆角；`--ui-map-*` 控制浅色/深色的表面、文字和边框，其中主色悬停/按下色及高亮色从主色 Seed 派生；`--ui-button-*`、`--ui-field-*`、`--ui-card-*`、`--ui-overlay-*`、`--ui-menu-*` 是组件级覆写点。既有 `--primary`、`--card` 等变量仍作为 Alias 使用，业务无需改动。

```tsx
<ThemeScope mode="dark" density="compact" tokens={{ primary: '#5eead4' }}>
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
    },
  }}
>
  {/* 只影响这个作用域内的组件 */}
</ThemeScope>
```

`auto` 跟随系统深浅色；`light` 和 `dark` 仅作用于当前 `ThemeScope`。十六进制主色会派生对比度达标的按钮文字、悬停与按下色；成功、警告和错误 Seed 会同时派生徽标与危险操作所需的状态前景色。其他 CSS 颜色格式需显式提供 `onPrimary`、`onSuccess`、`onWarning` 或 `onError`，`onAccent` 可覆写柔和高亮的文字色。Dialog、Sheet、Select 和项目的 `Portal` 会挂载到最近的主题作用域，继承其变量。Toast 由应用根部的 Provider 统一管理。紧凑模式缩小内容间距，交互控件仍保持至少 44px 的触控高度。完整状态可在 `/__ui` 中切换查看。

嵌套 `ThemeScope` 的 `auto` 模式继承上层颜色和组件 Token；内层指定 `density="default"` 时会恢复常规间距。内层提供自己的 Seed 或组件 Token 时，仅覆写对应值。

Checkbox、Switch 和 RadioGroup 自带可访问标签。需要显示校验错误时，用 `FormField` 包裹它们并省略外层 `label`，避免重复或嵌套的标签；`description` 和 `error` 会关联到 input 或单选组。普通 Input、Textarea、Select 仍由 `FormField.label` 提供可见标签。

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
