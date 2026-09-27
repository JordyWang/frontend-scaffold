# shared/ui 组件 API

业务代码只从 `@/shared/ui` 导入。组件的颜色和间距使用 `src/shared/styles/index.css` 中的设计变量；底层依赖集中在这一层。

| 组件             | 项目 API                                                                                            | 约定                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Button           | `variant`、`size`、`loading`、原生 button 属性                                                      | 默认 `type="button"`；加载时禁用，避免重复提交                    |
| Input / Textarea | 原生属性、`invalid`                                                                                 | 转发 ref；输入字号为 16px                                         |
| FormField        | `label`、`control`、`description`、`error`、`required`、`id`                                        | 自动连接 label、说明和错误；校验规则由调用方提供                  |
| Card             | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`                   | 仅负责内容容器                                                    |
| Empty            | `title`、`description`、`action`                                                                    | 适用于无数据状态                                                  |
| Select           | `options`、`value` / `defaultValue`、`onValueChange`、`placeholder`、`disabled`、`name`、`required` | 选项 `{ value, label, disabled? }`；Radix 处理方向键、搜索和焦点  |
| Dialog / Sheet   | `title`、`description`、`trigger`、`children`、`footer`、`open` / `defaultOpen`、`onOpenChange`     | Radix 管理焦点、Escape 和背景滚动；Sheet 小屏转为底部面板         |
| Toast            | `ToastProvider`、`toast({ title, description?, variant?, duration? })`                              | 在应用根部放一个 Provider；`variant` 为 default / success / error |
| Tabs             | `items`、`value` / `defaultValue`、`onValueChange`、`label`                                         | `items` 含 value、label、content、disabled；窄屏横向滚动          |
| Pagination       | `page`、`pageSize`、`total`、`onPageChange`、`mode`                                                 | `mode` 为 pages / load-more；页码从 1 开始                        |
| List             | `items`、`getKey`、`renderItem`、`loading`、`emptyTitle`、`label`                                   | 语义化列表，无数据和加载状态内置                                  |
| Table            | `columns`、`rows`、`getRowKey`、`caption`、`loading`、`emptyTitle`、`renderMobileRow`               | 列只负责渲染；传入 `renderMobileRow` 后，手机展示业务定义的卡片行 |

## 使用示例

```tsx
import { useState } from 'react'
import { Button, FormField, Input, ToastProvider, toast } from '@/shared/ui'

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
      <ToastProvider />
    </>
  )
}
```

`/__ui` 仅在开发模式注册，覆盖默认、禁用、加载、错误、空数据和 H5 布局。AI、音频和视频组件等这些基础能力稳定后再接入。
