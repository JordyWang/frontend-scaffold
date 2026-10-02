import { useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Carousel,
  ConfigProvider,
  FormField,
  Input,
  Typography,
  type CarouselDotPlacement,
  type CarouselEffect,
  type CarouselHandle,
} from '@/shared/ui'

export function CarouselPreview() {
  const [index, setIndex] = useState(0)
  const [effect, setEffect] = useState<CarouselEffect>('scroll')
  const [placement, setPlacement] = useState<CarouselDotPlacement>('bottom')
  const [infinite, setInfinite] = useState(true)
  const [adaptiveHeight, setAdaptiveHeight] = useState(false)
  const [dots, setDots] = useState(true)
  const [arrows, setArrows] = useState(true)
  const [gestures, setGestures] = useState(true)
  const [autoplay, setAutoplay] = useState(false)
  const [itemCount, setItemCount] = useState(3)
  const [status, setStatus] = useState('尚未切换')
  const apiRef = useRef<CarouselHandle>(null)
  const items = [
    <div key="draft" className="space-y-3">
      <Typography as="h4" className="font-semibold">
        第一张：草稿
      </Typography>
      <p>切换面板后保留表单值，隐藏内容不进入键盘和辅助技术的阅读顺序。</p>
      <FormField
        label="轮播草稿"
        control={<Input defaultValue="初始轮播草稿" />}
      />
    </div>,
    <div key="details" className="space-y-3">
      <Typography as="h4" className="font-semibold">
        第二张：较长内容
      </Typography>
      <p>默认保持最宽内容区域与最高幻灯片的高度，减少切换时的布局跳动。</p>
      <ul className="list-disc space-y-2 ps-5">
        <li>指示点支持四向位置和方向键选择。</li>
        <li>触控横向滑动切换，纵向手势保留页面滚动。</li>
        <li>鼠标拖拽需显式启用；表单和链接仍保持原生交互。</li>
      </ul>
    </div>,
    <div key="action" className="space-y-3">
      <Typography as="h4" className="font-semibold">
        第三张：操作
      </Typography>
      <p>从内容中切换后，焦点恢复到可操作的轮播区域。</p>
      <Button variant="outline" onClick={() => setIndex(0)}>
        从内容回到第一张
      </Button>
    </div>,
  ].slice(0, itemCount)

  return (
    <Card id="ds-carousel" className="col-span-full scroll-mt-6">
      <CardContent>
        <section aria-label="轮播状态预览" className="space-y-4">
          <Typography as="h3" variant="title">
            走马灯
          </Typography>
          <p className="text-sm text-muted-foreground">
            聚焦幻灯片区域或页码后，方向键切换，Home / End
            到首尾；自动播放遇到焦点、悬停或触控时暂停。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setEffect(effect === 'scroll' ? 'fade' : 'scroll')}
            >
              {effect === 'scroll' ? '使用渐显轮播' : '使用滑动轮播'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={!infinite}
              onClick={() => setInfinite((value) => !value)}
            >
              {infinite ? '关闭循环轮播' : '开启循环轮播'}
            </Button>
            <Button
              variant="outline"
              aria-pressed={adaptiveHeight}
              onClick={() => setAdaptiveHeight((value) => !value)}
            >
              {adaptiveHeight ? '保持轮播高度' : '自适应轮播高度'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDots((value) => !value)}
            >
              {dots ? '隐藏轮播页码' : '显示轮播页码'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setArrows((value) => !value)}
            >
              {arrows ? '隐藏轮播箭头' : '显示轮播箭头'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setGestures((value) => !value)}
            >
              {gestures ? '禁用手势切换' : '启用手势切换'}
            </Button>
            <Button variant="outline" onClick={() => setIndex(2)}>
              外部跳转第三张
            </Button>
            <Button
              variant="outline"
              onClick={() => apiRef.current?.goTo(0, { animate: false })}
            >
              无动画回到首张
            </Button>
            <Button
              variant="outline"
              onClick={() => setItemCount(itemCount === 3 ? 1 : 3)}
            >
              {itemCount === 3 ? '缩减轮播数据' : '恢复轮播数据'}
            </Button>
          </div>
          <div
            role="group"
            aria-label="轮播指示点位置"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ['top', '页码在上方'],
                ['bottom', '页码在下方'],
                ['start', '页码在起始'],
                ['end', '页码在末端'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={placement === value}
                onClick={() => setPlacement(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Carousel
            ref={apiRef}
            label="完整轮播预览"
            items={items}
            index={index}
            onChange={setIndex}
            effect={effect}
            infinite={infinite}
            adaptiveHeight={adaptiveHeight}
            dotPlacement={placement}
            dots={dots}
            arrows={arrows}
            draggable={gestures}
            swipe={gestures}
            onBeforeChange={(from, to) =>
              setStatus(`准备从第 ${from + 1} 项切换到第 ${to + 1} 项`)
            }
            onAfterChange={(next) => setStatus(`第 ${next + 1} 项切换完成`)}
          />
          <p
            role="status"
            aria-label="轮播切换状态"
            className="text-sm text-muted-foreground"
          >
            {status}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-label="自动轮播进度预览" className="space-y-3">
              <Typography as="h4" className="font-semibold">
                自动播放与进度
              </Typography>
              <Button
                variant="outline"
                onClick={() => setAutoplay((value) => !value)}
              >
                {autoplay ? '停用进度轮播' : '启用进度轮播'}
              </Button>
              <Carousel
                label="进度轮播"
                autoplay={autoplay}
                interval={2000}
                dotProgress
                items={[
                  <p key="one">自动切换第一项</p>,
                  <p key="two">自动切换第二项</p>,
                  <p key="three">自动切换第三项</p>,
                ]}
              />
            </section>
            <section aria-label="轮播边界状态" className="space-y-3">
              <Typography as="h4" className="font-semibold">
                RTL、单项与空数据
              </Typography>
              <ConfigProvider direction="rtl" theme={{ mode: 'dark' }}>
                <Carousel
                  label="RTL 深色轮播"
                  dotPlacement="start"
                  draggable
                  items={[
                    <p key="one">从右向左的第一项</p>,
                    <p key="two">从右向左的第二项</p>,
                  ]}
                />
              </ConfigProvider>
              <Carousel
                label="单项轮播"
                items={[<p key="only">一项内容无需切换控制。</p>]}
              />
              <Carousel label="空轮播" items={[]} />
            </section>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
