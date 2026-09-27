import { Link } from 'react-router'

export function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <main id="main" className="page-shell flex min-h-dvh items-center">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            React · PC / H5
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            前端脚手架已就绪
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            工程、设计变量和 Mock
            模式已经接入。现在可以按组件约定逐步实现通用组件。
          </p>
          {import.meta.env.DEV ? (
            <Link
              className="text-link inline-flex min-h-11 items-center font-medium"
              to="/__ui"
            >
              打开开发预览
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  )
}
