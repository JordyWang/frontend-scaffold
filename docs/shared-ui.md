# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。组件的颜色和间距使用 `src/shared/styles/index.css` 中的设计变量；底层依赖集中在这一层。

| 组件             | 项目 API                                                                                                    | 约定                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Button           | `variant`、`size`、`loading`、原生 button 属性                                                              | 默认 `type="button"`；加载时禁用，避免重复提交                   |
| Input / Textarea | 原生属性、`invalid`、`size`                                                                                 | 转发 ref；`size` 为 default / small，输入字号为 16px             |
| FormField        | `label`、`control`、`description`、`error`、`required`、`id`                                                | 自动连接 label、说明和错误；校验规则由调用方提供                 |
| Card             | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`                           | 仅负责内容容器                                                   |
| Empty            | `title`、`description`、`action`                                                                            | 适用于无数据状态                                                 |
| Select           | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required`、`size` | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点 |
| Dialog / Sheet   | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`             | Radix 管理焦点、Escape 和背景滚动；Sheet 小屏转为底部面板        |
| Toast            | `ToastProvider`、`toast({ title, description?, variant?, duration? })`、`dismissToast(id?)`                 | 应用根部已有 Provider；`variant` 为 default / success / error    |
| Tabs             | `items`、`value` / `defaultValue`、`onValueChange`、`label`                                                 | `items` 含 value、label、content、disabled；窄屏横向滚动         |
| Pagination       | `page`、`pageSize`、`total`、`onPageChange`、`mode`                                                         | `mode` 为 pages / load-more；页码从 1 开始                       |
| List             | `items`、`getKey`、`renderItem`、`loading`、`error`、`onRetry`、`emptyTitle`、`label`                       | 语义化列表，加载、空和错误状态内置                               |
| Table            | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`error`、`onRetry`、`emptyTitle`、`renderMobileRow`   | 传入 `renderMobileRow` 后，手机展示业务定义的卡片行              |
| 公共能力         | `Portal`、`ErrorBoundary`、`Container`、`LoadingState`、`ErrorState`                                        | 弹层挂载、异常兜底、响应式容器和统一反馈                         |

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
