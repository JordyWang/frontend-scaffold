import { expect, test, type Locator, type Page } from '@playwright/test'

const demoFor = (page: Page) =>
  page.getByRole('region', { name: '时间滚动与悬停预览', exact: true })
const option = (panel: Locator, unit: string, number: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + number + '"]',
  )
const column = (panel: Locator, unit: string) =>
  panel.locator('[data-time-scroll-unit="' + unit + '"]')
async function activate(target: Locator, mobile: boolean) {
  if (mobile) await target.tap()
  else await target.press('Enter')
}
async function open(page: Page, label: string, field = label) {
  const demo = demoFor(page),
    input = demo.getByRole('combobox', { name: field, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: label + '选择面板' })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}
async function scrollTo(
  panel: Locator,
  unit: string,
  number: number,
  mobile: boolean,
  arm = true,
) {
  // Both mobile engines exercise the native scroller after a touch gesture.
  // Desktop uses actual wheel input in the separate wheel test below.
  await column(panel, unit).evaluate(
    (element, args) => {
      if (args.arm)
        element.dispatchEvent(
          args.mobile
            ? new PointerEvent('pointerdown', {
                bubbles: true,
                pointerType: 'touch',
                pointerId: 81,
              })
            : new WheelEvent('wheel', { bubbles: true, deltaY: 44 }),
        )
      const button = element.querySelector<HTMLElement>(
        '[data-time-value="' + args.number + '"]',
      )!
      const padding =
        Number.parseFloat(getComputedStyle(element).paddingTop) || 0
      element.scrollTop +=
        button.getBoundingClientRect().top -
        element.getBoundingClientRect().top -
        element.clientTop -
        padding
      if (args.arm && args.mobile)
        element.dispatchEvent(
          new PointerEvent('pointerup', {
            bubbles: true,
            pointerType: 'touch',
            pointerId: 81,
          }),
        )
    },
    { number, mobile, arm },
  )
}

test('hover preview defaults on, preserves selected semantics and submitted value, and respects its opt-out', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse hover on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  await option(panel, 'hour', 11).hover()
  await expect(input).toHaveValue('11:30')
  await expect(input).toHaveAttribute('data-picker-preview', 'hover')
  await expect(option(panel, 'hour', 9)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(option(panel, 'hour', 11)).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await expect(
    demo.getByRole('status', { name: '滚动时间提交值', exact: true }),
  ).toHaveText('09:30')
  await expect(demo.locator('input[name="scrollTime"]')).toHaveValue('09:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
  await input.press('ArrowDown')
  await expect(input).toHaveValue('09:30')
  await option(panel, 'hour', 9).press('ArrowDown')
  await expect(option(panel, 'hour', 11)).toBeFocused()
  await expect(input).toHaveValue('09:30')
  await option(panel, 'hour', 12).hover()
  await panel.getByRole('button', { name: '确定', exact: true }).press('Enter')
  await expect(input).toHaveValue('09:30')
  const off = await open(page, '关闭悬停预览')
  await option(off.panel, 'hour', 10).hover()
  await expect(off.input).toHaveValue('09:30')
  await off.input.press('Escape')
})

test('real desktop wheel changes the draft once, skips a disabled hour and keeps page scrolling local', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'desktop wheel input')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  await page.mouse.move(0, 0)
  await column(panel, 'hour').evaluate((element) =>
    element.scrollIntoView({ block: 'nearest' }),
  )
  const box = (await column(panel, 'hour').boundingBox())!,
    scroll = await page.evaluate(() => window.scrollY),
    top = (await panel.boundingBox())!.y
  await page.mouse.move(box.x + box.width / 2, box.y + 30)
  await page.mouse.wheel(0, 88)
  await expect(input).toHaveValue('11:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间提交值', exact: true }),
  ).toHaveText('09:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  expect(Math.abs((await panel.boundingBox())!.y - top)).toBeLessThan(2)
  await panel.screenshot({ path: 'output/playwright/time-wheel-desktop.png' })
  await panel.getByRole('button', { name: '确定', exact: true }).press('Enter')
  await expect(
    demo.getByRole('status', { name: '滚动时间提交值', exact: true }),
  ).toHaveText('11:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('1')
})

test('native column scrolling ignores programmatic motion and confirms only the final gesture value', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  await scrollTo(panel, 'hour', 12, mobile, false)
  await expect(input).toHaveValue('09:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
  await scrollTo(panel, 'hour', 13, mobile)
  await expect(input).toHaveValue('13:30')
  await expect(input).not.toHaveAttribute('data-picker-preview')
  await scrollTo(panel, 'minute', 45, mobile)
  await expect(input).toHaveValue('13:45')
  await expect(demo.locator('input[name="scrollTime"]')).toHaveValue('09:30')
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '滚动时间提交值', exact: true }),
  ).toHaveText('13:45')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('1')
})

test('mobile Chromium native touch scrolling changes the draft without previewing or submitting it', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-chromium',
    'Chromium touch event protocol',
  )
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  const box = (await column(panel, 'hour').boundingBox())!
  const client = await page.context().newCDPSession(page)
  const x = box.x + box.width / 2,
    start = box.y + Math.min(box.height - 30, 140)
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: start }],
  })
  for (let index = 1; index <= 6; index++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: start - index * 16 }],
    })
    await page.waitForTimeout(20)
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await expect(input).not.toHaveValue('09:30')
  await expect(input).not.toHaveAttribute('data-picker-preview')
  await expect(panel).toBeVisible()
  await expect(
    demo.getByRole('status', { name: '滚动时间提交值', exact: true }),
  ).toHaveText('09:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
  await input.press('Escape')
  await expect(input).toHaveValue('09:30')
  await client.detach()
})

test('touch selection changes the draft without a hover preview and confirms through the ordinary path', async ({
  page,
}, info) => {
  test.skip(!info.project.name.startsWith('mobile-'), 'mobile touch activation')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  await option(panel, 'hour', 11).tap()
  await expect(input).toHaveValue('11:30')
  await expect(input).not.toHaveAttribute('data-picker-preview')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
  await panel.getByRole('button', { name: '确定', exact: true }).tap()
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('1')
})

test('immediate scroll reaches the last hour and minute, while keyboard reveal remains browsing', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(page, '立即滚动时间')
  await option(panel, 'hour', 9).press('End')
  await expect(option(panel, 'hour', 23)).toBeFocused()
  await expect(input).toHaveValue('09:30')
  await scrollTo(panel, 'hour', 22, mobile)
  await expect(input).toHaveValue('22:30')
  await scrollTo(panel, 'hour', 23, mobile)
  await expect(input).toHaveValue('23:30')
  await scrollTo(panel, 'minute', 59, mobile)
  await expect(
    demo.getByRole('status', { name: '立即滚动提交值', exact: true }),
  ).toHaveText('23:59')
  await input.press('Escape')
  await expect(input).toHaveValue('23:59')
})

test('range scrolling uses two drafts, clears a crossed endpoint and submits one complete tuple', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(
    page,
    '滚动时间范围',
    '滚动开始时间',
  )
  await scrollTo(panel, 'hour', 18, mobile)
  await expect(input).toHaveValue('18:30')
  await expect(
    demo.getByRole('combobox', { name: '滚动结束时间', exact: true }),
  ).toHaveValue('')
  await expect(
    panel.getByRole('button', { name: '确定', exact: true }),
  ).toBeDisabled()
  await expect(
    demo.getByRole('status', { name: '滚动时间范围提交值', exact: true }),
  ).toHaveText('["09:30","17:00"]')
  await expect(
    demo.getByRole('status', { name: '滚动时间范围临时回调次数', exact: true }),
  ).toHaveText('1')
  await activate(panel.getByRole('button', { name: /^滚动结束时间：/ }), mobile)
  await scrollTo(panel, 'hour', 19, mobile)
  await expect(
    demo.getByRole('combobox', { name: '滚动结束时间', exact: true }),
  ).toHaveValue('19:30')
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '滚动时间范围提交值', exact: true }),
  ).toHaveText('["18:30","19:30"]')
  const locked = await open(page, '锁定滚动起点', '可编辑滚动结束时间')
  await scrollTo(locked.panel, 'hour', 9, mobile)
  await expect(locked.input).toHaveValue('10:30')
  await expect(
    demo.getByRole('combobox', { name: '锁定滚动开始时间', exact: true }),
  ).toHaveValue('10:30')
  await locked.input.press('Escape')
})

test('range mouse previews preserve endpoint identity and disappear on switching endpoints', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse hover on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(
    page,
    '滚动时间范围',
    '滚动开始时间',
  )
  await option(panel, 'hour', 18).hover()
  await expect(input).toHaveValue('18:30')
  await expect(
    demo.getByRole('combobox', { name: '滚动结束时间', exact: true }),
  ).toHaveValue('17:00')
  await expect(
    demo.getByRole('status', { name: '滚动时间范围临时回调次数', exact: true }),
  ).toHaveText('0')
  await panel.getByRole('button', { name: /^滚动结束时间：/ }).press('Enter')
  await expect(input).toHaveValue('09:30')
  await input.press('Escape')
})

test('date-time scrolling preserves dates and endpoint-aware second restrictions', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const single = await open(page, '日期时间滚动')
  await activate(
    single.panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await scrollTo(single.panel, 'minute', 45, mobile)
  await expect(single.input).toHaveValue('2024-02-29 09:45')
  await expect(
    single.demo.getByRole('status', {
      name: '日期时间滚动提交值',
      exact: true,
    }),
  ).toHaveText('2024-02-29T09:30')
  await activate(
    single.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    single.demo.getByRole('status', {
      name: '日期时间滚动提交值',
      exact: true,
    }),
  ).toHaveText('2024-02-29T09:45')
  const range = await open(page, '跨日滚动范围', '跨日滚动结束日期时间')
  await activate(
    range.panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(range.panel, 'second', 30)).toBeDisabled()
  await scrollTo(range.panel, 'second', 45, mobile)
  await expect(range.input).toHaveValue('2024-03-01 00:30:45')
  await expect(
    range.demo.locator('input[name="scrollDateTimeRange"]'),
  ).toHaveValue('["2024-02-29T23:30:15","2024-03-01T00:30:15"]')
  await activate(
    range.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    range.demo.getByRole('status', { name: '跨日滚动范围提交值', exact: true }),
  ).toHaveText('["2024-02-29T23:30:15","2024-03-01T00:30:45"]')
})

test('cancellation and changing availability discard pending scroll work', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(page, '确认滚动时间')
  await scrollTo(panel, 'hour', 12, mobile)
  await input.press('Escape')
  await expect(input).toHaveValue('09:30')
  await input.press('ArrowDown')
  await expect(input).toHaveValue('09:30')
  await demo.getByRole('button', { name: '停用滚动选项', exact: true }).click()
  await expect(panel).toHaveCount(0)
  await expect(input).toHaveValue('09:30')
  await expect(
    demo.getByRole('status', { name: '滚动时间值回调次数', exact: true }),
  ).toHaveText('0')
})

test('240px RTL seconds and AM/PM scroll without horizontal overflow or page motion', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-'),
    demo = demoFor(page)
  await demo
    .getByRole('button', { name: '使用 RTL 滚动时间', exact: true })
    .click()
  const input = demo.getByRole('textbox', {
    name: '窄容器滚动时间',
    exact: true,
  })
  const root = input.locator('xpath=ancestor::*[@data-timepicker]')
  await root.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(root).toHaveAttribute('dir', 'rtl')
  const scroll = await page.evaluate(() => window.scrollY)
  await scrollTo(root, 'meridiem', 1, mobile)
  await expect(input).toHaveValue('12:30:15 PM')
  await scrollTo(root, 'second', 45, mobile)
  await expect(input).toHaveValue('12:30:45 PM')
  const box = (await option(root, 'second', 45).boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await root.screenshot({
    path:
      'output/playwright/time-scroll-narrow-rtl-' + info.project.name + '.png',
  })
  await activate(
    root.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('12:30:45 PM')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
