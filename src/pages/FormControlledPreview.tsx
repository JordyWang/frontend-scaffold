import { useState } from 'react'
import { Button, Form, FormItem, Input, Stack, Typography } from '@/shared/ui'

const initialValues = { name: '初始名称' }

export function FormControlledPreview() {
  const [values, setValues] = useState(initialValues)
  const [pendingName, setPendingName] = useState<string>()
  const [status, setStatus] = useState('尚未提交')

  return (
    <div
      role="group"
      aria-label="受控表单状态"
      className="grid gap-3 rounded-[var(--radius-lg)] border border-border p-4"
    >
      <Typography as="h4" variant="title">
        受控表单请求与接纳
      </Typography>
      <Typography variant="caption" tone="muted">
        输入只提出变更；接纳后才更新字段、校验与提交值。
      </Typography>
      <Form
        aria-label="受控表单示例"
        values={values}
        initialValues={initialValues}
        validateOn="change"
        onValuesChange={(_, nextValues) => {
          setPendingName(String(nextValues.name ?? ''))
          setStatus('等待外部接纳')
        }}
        onFinish={(nextValues) =>
          setStatus(`已提交：${String(nextValues.name)}`)
        }
        onFinishFailed={() => setStatus('请修正受控字段')}
      >
        <FormItem
          name="name"
          label="受控名称"
          rules={[{ required: true, message: '请输入名称' }]}
          control={<Input />}
        />
        <Stack direction="row" align="center" wrap gap="sm">
          <Button type="submit" size="small">
            提交受控表单
          </Button>
          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={pendingName === undefined}
            onClick={() => {
              setValues({ name: pendingName! })
              setPendingName(undefined)
              setStatus('变更已接纳')
            }}
          >
            接纳请求
          </Button>
          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={pendingName === undefined}
            onClick={() => {
              setPendingName(undefined)
              setStatus('变更已拒绝')
            }}
          >
            拒绝请求
          </Button>
        </Stack>
      </Form>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        已接纳：{values.name} · 待接纳：{pendingName ?? '无'} · {status}
      </p>
    </div>
  )
}
