import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-dvh flex-col justify-center gap-4 bg-background text-foreground">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">页面不存在</h1>
      <Link
        className="text-link inline-flex min-h-11 w-fit items-center"
        to="/"
      >
        返回首页
      </Link>
    </main>
  )
}
