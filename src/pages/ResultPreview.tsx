import { useState } from 'react'
import { Button, Result, Typography } from '@/shared/ui'

export function ResultPreview() {
  const [action, setAction] = useState('尚未操作')

  return (
    <div role="group" aria-label="结果状态预览" className="space-y-3">
      <Typography as="h3" variant="title">
        页面结果状态
      </Typography>
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <Result
          status="404"
          size="small"
          headingLevel={4}
          className="rounded-lg border border-border bg-card"
          extra={
            <Button variant="outline" onClick={() => setAction('已返回工作台')}>
              返回工作台
            </Button>
          }
        />
        <Result
          status="403"
          size="small"
          headingLevel={4}
          className="rounded-lg border border-border bg-card"
        />
        <Result
          status="500"
          size="small"
          headingLevel={4}
          className="rounded-lg border border-border bg-card"
          extra={
            <Button variant="outline" onClick={() => setAction('已请求重试')}>
              重试服务
            </Button>
          }
        />
      </div>
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {action}
      </p>
    </div>
  )
}
