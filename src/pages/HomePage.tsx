import { Link } from 'react-router'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Tag } from '@/shared/ui/display'
import { Progress } from '@/shared/ui/feedback'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { toast } from '@/shared/ui/toast'
import { pageShellStyles, skipLinkStyles } from '@/shared/ui/tailwind-styles'

const capabilities = [
  {
    title: '通用组件',
    description: '输入、反馈、导航和数据展示共用一套语义化组件。',
    icon: 'folder',
    href: '/__ui#design-system',
  },
  {
    title: '文件处理',
    description: '选择、预览、校验与上传进度可直接组合使用。',
    icon: 'file',
    href: '/__ui#files',
  },
  {
    title: 'AI 交互',
    description: '任务状态、流式对话与错误重试已有独立能力模块。',
    icon: 'edit',
    href: '/__ui#ai-task',
  },
  {
    title: '媒体体验',
    description: '视频与音频播放器覆盖播放、进度和异常状态。',
    icon: 'eye',
    href: '/__ui#video',
  },
] as const

export function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className={skipLinkStyles} href="#main">
        跳到主要内容
      </a>
      <header
        className={`${pageShellStyles} flex min-h-20 items-center justify-between gap-4`}
      >
        <div className="inline-flex items-center gap-2 font-semibold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon name="home" size={20} />
          </span>
          Front UI
        </div>
        {import.meta.env.DEV && (
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            to="/__ui"
          >
            组件预览 <Icon name="arrowRight" size={18} />
          </Link>
        )}
      </header>

      <main id="main" className={`${pageShellStyles} pb-16 pt-8 sm:pt-14`}>
        <section className="grid items-center gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.82fr)] lg:gap-16 lg:pb-24">
          <div className="space-y-6">
            <Tag>React · PC / H5</Tag>
            <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
              用现有组件，构建一致的界面
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              组件、主题变量与业务能力已经接入。选择已有模块，组合页面，并在桌面与手机上检查真实交互。
            </p>
            {import.meta.env.DEV && (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--ui-button-radius)] bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                to="/__ui"
              >
                打开开发预览 <Icon name="arrowRight" size={18} />
              </Link>
            )}
          </div>

          <Card className="shadow-[0_20px_60px_rgb(15_23_42_/_0.06)]">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>交互示例</CardTitle>
                  <CardDescription>
                    直接使用项目中的输入与反馈组件
                  </CardDescription>
                </div>
                <Badge status="success" text="可操作" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="grid gap-2 text-sm font-medium">
                项目名称
                <Input placeholder="输入一个项目名称" />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    toast({ title: '示例操作已完成', variant: 'success' })
                  }
                >
                  主要操作
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast({ title: '次要操作已点击' })}
                >
                  次要操作
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">任务进度</span>
                  <span className="text-muted-foreground">进行中</span>
                </div>
                <Progress percent={68} showInfo={false} label="示例任务进度" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="capabilities-title" className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Capabilities
            </p>
            <h2
              id="capabilities-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              已有能力
            </h2>
            <p className="text-muted-foreground">
              从通用控件到业务交互，页面可直接复用这些模块。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((capability) => (
              <Card key={capability.title} hoverable className="h-full">
                <CardContent className="flex h-full flex-col gap-4 py-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon name={capability.icon} size={22} />
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {capability.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                  {import.meta.env.DEV && (
                    <Link
                      className="mt-auto inline-flex min-h-11 items-center gap-1 self-start font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                      to={capability.href}
                    >
                      查看示例 <Icon name="arrowRight" size={16} />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
