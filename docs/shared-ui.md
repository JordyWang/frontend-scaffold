# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。组件的颜色和间距使用 `src/shared/styles/index.css` 中的设计变量；底层依赖集中在这一层。

| 组件                          | 项目 API                                                                                                               | 约定                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Button                        | `variant`、`size`、`loading`、原生 button 属性                                                                         | 默认 `type="button"`；加载时禁用，避免重复提交                   |
| Input / Textarea              | 原生属性、`invalid`、`size`                                                                                            | 转发 ref；`size` 为 default / small，输入字号为 16px             |
| FormField                     | `label`、`control`、`description`、`error`、`required`、`id`                                                           | 自动连接 label、说明和错误；校验规则由调用方提供                 |
| Card                          | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`                                      | 仅负责内容容器                                                   |
| Empty                         | `title`、`description`、`action`                                                                                       | 适用于无数据状态                                                 |
| Select                        | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size`            | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点 |
| Dialog / Sheet                | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`                        | Radix 管理焦点、Escape 和背景滚动；Sheet 小屏转为底部面板        |
| Toast                         | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                            | 应用根部已有 Provider；`variant` 为 default / success / error    |
| Tabs                          | `items`、`value` / `defaultValue`、`onValueChange`、`label`                                                            | `items` 含 value、label、content、disabled；窄屏横向滚动         |
| Pagination                    | `page`、`pageSize`、`total`、`onPageChange`、`mode`                                                                    | `mode` 为 pages / load-more；页码从 1 开始                       |
| List                          | `items`、`getKey`、`renderItem`、`loading`、`error`、`onRetry`、`emptyTitle`、`label`                                  | 语义化列表，加载、空和错误状态内置                               |
| Table                         | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow`              | 传入 `renderMobileRow` 后，手机展示业务定义的卡片行              |
| 公共能力                      | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                                   | 弹层挂载、异常兜底、响应式容器和统一反馈                         |
| ThemeScope                    | `mode`、`density`、原生 div 属性                                                                                       | 局部浅色/深色和紧凑预览；`auto` 继承系统主题                     |
| Icon / Typography             | `Icon(name, size, label)`；`Typography(as, variant, tone)`                                                             | 图标默认装饰性；有语义时传 `label`；标题通过 `as` 保持正确层级   |
| Stack / Flex / Grid / Divider | `Stack(direction, gap, align, justify, wrap)`；`Flex` 为 Stack 别名；`Grid(minItemWidth, gap)`；`Divider(orientation)` | Grid 根据容器宽度自动换列；竖向分隔线仅用于水平布局              |
| Checkbox / Radio / Switch     | 原生 input 属性、`label`、`size`、`invalid`；`RadioGroup(options, value, onValueChange)`                               | 原生键盘行为和表单提交；标签提供 44px 触控区域                   |
| Tag / Badge                   | `tone`；`Badge(count, max, dot, label)`                                                                                | 状态同时提供文字；徽标数量或标签可被辅助技术读取                 |
| Image / Skeleton              | 原生 img 属性、必填 `alt`、`fallback`；`Skeleton(shape, width, height, label)`                                         | 图片懒加载，加载失败展示替代内容；骨架屏有状态标签               |
| Alert / Spinner               | `Alert(title, description, tone, action)`；`Spinner(label, size)`                                                      | 错误与警告用 alert，其他状态用 status；加载状态有可访问名称      |

## 主题变量

设计变量按 **Seed → 语义 Map/Alias → 组件 Token** 组织。`--ui-seed-*` 控制品牌色、状态色和圆角；`--ui-map-*` 控制浅色/深色的表面、文字和边框；`--ui-button-radius`、`--ui-field-radius`、`--ui-card-radius` 是组件级覆写点。既有 `--primary`、`--card` 等变量仍作为 Alias 使用，业务无需改动。

```tsx
<ThemeScope
  mode="dark"
  density="compact"
  style={{ '--ui-seed-primary': '#5eead4' } as React.CSSProperties}
>
  <Button>局部主题按钮</Button>
</ThemeScope>
```

`auto` 跟随系统深浅色；`light` 和 `dark` 仅作用于当前 `ThemeScope`。紧凑模式缩小内容间距，交互控件仍保持至少 44px 的触控高度。完整状态可在 `/__ui` 中切换查看。

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
