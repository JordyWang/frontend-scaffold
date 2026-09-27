import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { apiGet } from '@/shared/api/request'

type FixtureResponse = {
  status: string
  examples: { id: string; label: string }[]
}

const swatches = [
  { name: '背景', variable: 'background' },
  { name: '表面', variable: 'card' },
  { name: '主色', variable: 'primary' },
  { name: '次要', variable: 'secondary' },
  { name: '边框', variable: 'border' },
  { name: '危险', variable: 'destructive' },
]

export function DevWorkbenchPage() {
  const isMock = import.meta.env.MODE === 'mock'
  const fixtures = useQuery({
    queryKey: ['dev-fixtures'],
    queryFn: ({ signal }) =>
      apiGet<FixtureResponse>('/dev/fixtures', { signal }),
    enabled: isMock,
  })

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <main id="main" className="page-shell space-y-10 py-10 sm:py-16">
        <header className="space-y-3">
          <Link className="text-link inline-flex min-h-11 items-center" to="/">
            返回首页
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            开发预览
          </h1>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            这里用于检查设计变量、响应式排版与 JSON
            Mock。组件完成后再加入各状态预览。
          </p>
        </header>

        <section aria-labelledby="tokens-title" className="space-y-4">
          <h2 id="tokens-title" className="text-xl font-semibold">
            设计变量
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((swatch) => (
              <div
                key={swatch.variable}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div
                  aria-hidden="true"
                  className="h-16 rounded-md border border-border"
                  style={{ backgroundColor: `var(--${swatch.variable})` }}
                />
                <p className="mt-3 text-sm font-medium">{swatch.name}</p>
                <code className="text-xs text-muted-foreground">
                  --{swatch.variable}
                </code>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="mock-title" className="space-y-4">
          <h2 id="mock-title" className="text-xl font-semibold">
            JSON Mock
          </h2>
          {!isMock ? (
            <p className="text-muted-foreground">
              当前为真实接口模式。运行 <code>pnpm dev:mock</code> 可加载本地
              JSON 数据。
            </p>
          ) : fixtures.isPending ? (
            <p role="status">正在加载 Mock 数据…</p>
          ) : fixtures.isError ? (
            <p role="alert" className="text-destructive">
              Mock 数据加载失败：{fixtures.error.message}
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">状态：{fixtures.data.status}</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
                {fixtures.data.examples.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
