import { Link } from 'react-router'
import { pageShellStyles, textLinkStyles } from '@/shared/ui/tailwind-styles'

export function NotFoundPage() {
  return (
    <main
      className={`${pageShellStyles} flex min-h-dvh flex-col justify-center gap-4 bg-background text-foreground`}
    >
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">页面不存在</h1>
      <Link
        className={`${textLinkStyles} inline-flex min-h-11 w-fit items-center`}
        to="/"
      >
        返回首页
      </Link>
    </main>
  )
}
