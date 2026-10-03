import { useState } from 'react'
import { Button, Form, FormItem, Input, Stack, Typography } from '@/shared/ui'

export function FormDependenciesPreview() {
  const [status, setStatus] = useState('尚未提交')

  return (
    <div
      role="group"
      aria-label="表单字段联动"
      className="grid gap-3 rounded-[var(--radius-lg)] border border-border p-4"
    >
      <Typography as="h4" variant="title">
        依赖字段校验
      </Typography>
      <Typography variant="caption" tone="muted">
        先离开“确认代号”，再修改“代号”；确认字段会随来源变化更新错误。
      </Typography>
      <Form
        aria-label="字段联动示例"
        initialValues={{ code: 'blue', confirmation: 'blue' }}
        validateOn="blur"
        onFinish={() => setStatus('字段一致，已提交')}
        onFinishFailed={() => setStatus('请修正字段错误')}
        onReset={() => setStatus('已重置')}
      >
        <FormItem name="code" label="代号" control={<Input />} />
        <FormItem
          name="confirmation"
          label="确认代号"
          dependencies={['code']}
          rules={[
            {
              validator: (value, values) =>
                value === values.code ? undefined : '两次代号不一致',
            },
          ]}
          control={<Input />}
        />
        <Stack direction="row" align="center" wrap gap="sm">
          <Button type="submit" size="small">
            提交字段联动
          </Button>
          <Button type="reset" variant="outline" size="small">
            重置字段联动
          </Button>
        </Stack>
      </Form>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  )
}
