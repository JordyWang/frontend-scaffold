import { expect, test, type Locator, type Page } from '@playwright/test'
const demoFor = (page: Page) =>
  page.getByRole('region', { name: '毫秒时间精度', exact: true })
const option = (panel: Locator, unit: string, value: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )
async function activate(target: Locator, mobile: boolean) {
  if (mobile) await target.tap()
  else await target.press('Enter')
}
async function open(page: Page, label: string, field = label) {
  const demo = demoFor(page),
    input = demo.getByRole('combobox', { name: field, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', {
    name: label + '选择面板',
    exact: true,
  })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
})

test('1000 millisecond options support keyboard browsing, disabled skipping, touch selection and one confirmed submission', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(page, '完整毫秒时间')
  const column = panel.getByRole('listbox', {
    name: '完整毫秒时间毫秒',
    exact: true,
  })
  await expect(column.getByRole('option')).toHaveCount(1000)
  await expect(option(panel, 'millisecond', 126)).toBeDisabled()
  await option(panel, 'millisecond', 125).press('ArrowDown')
  await expect(option(panel, 'millisecond', 127)).toBeFocused()
  await expect(input).toHaveValue('09:30:15.125')
  await activate(option(panel, 'millisecond', 127), mobile)
  await expect(input).toHaveValue('09:30:15.127')
  await expect(demo.locator('input[name="millisecondTime"]')).toHaveValue(
    '09:30:15.125',
  )
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '毫秒时间提交值', exact: true }),
  ).toHaveText('09:30:15.127')
  await expect(
    demo.getByRole('status', { name: '毫秒时间回调次数', exact: true }),
  ).toHaveText('1')
  await expect(input).toBeFocused()
})

test('the last of 1000 values is revealed locally, remains 44px and cancels without publishing', async ({
  page,
}, info) => {
  const { demo, input, panel } = await open(page, '完整毫秒时间')
  const scroll = await page.evaluate(() => window.scrollY)
  await option(panel, 'millisecond', 125).press('End')
  const last = option(panel, 'millisecond', 999),
    box = (await last.boundingBox())!,
    column = (await panel
      .getByRole('listbox', { name: '完整毫秒时间毫秒' })
      .boundingBox())!
  await expect(last).toBeFocused()
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.y).toBeGreaterThanOrEqual(column.y)
  expect(box.y + box.height).toBeLessThanOrEqual(column.y + column.height + 1)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await activate(last, info.project.name.startsWith('mobile-'))
  await expect(input).toHaveValue('09:30:15.999')
  await panel.getByRole('button', { name: '取消', exact: true }).press('Enter')
  await expect(input).toHaveValue('09:30:15.125')
  await expect(
    demo.getByRole('status', { name: '毫秒时间回调次数', exact: true }),
  ).toHaveText('0')
})

test('desktop hover preserves semantics and a real wheel selects the final millisecond draft', async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith('mobile-'),
    'desktop mouse hover and wheel',
  )
  const { demo, input, panel } = await open(page, '完整毫秒时间')
  await option(panel, 'millisecond', 127).hover()
  await expect(input).toHaveValue('09:30:15.127')
  await expect(option(panel, 'millisecond', 125)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(demo.locator('input[name="millisecondTime"]')).toHaveValue(
    '09:30:15.125',
  )
  await input.press('Escape')
  await demo.getByRole('button', { name: '使用 RTL 毫秒时间' }).press('Enter')
  const narrow = demo.locator('[data-millisecond-narrow]'),
    column = narrow.getByRole('listbox', {
      name: '窄容器毫秒时间毫秒',
      exact: true,
    })
  await column.evaluate((element) =>
    element.scrollIntoView({ block: 'center', inline: 'nearest' }),
  )
  const box = (await column.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 25)
  await page.mouse.wheel(0, 88)
  await expect(
    narrow.getByRole('textbox', { name: '窄容器毫秒时间' }),
  ).toHaveValue('01:30:15.400 PM')
  await expect(option(narrow, 'millisecond', 100)).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await narrow.getByRole('button', { name: '取消', exact: true }).press('Enter')
  await expect(
    narrow.getByRole('textbox', { name: '窄容器毫秒时间' }),
  ).toHaveValue('01:30:15.100 PM')
})

test('12-hour millisecond range preserves endpoint constraints and canonical JSON', async ({
  page,
}, info) => {
  const { demo, panel, input } = await open(
    page,
    '毫秒时间范围',
    '毫秒结束时间',
  )
  await expect(option(panel, 'millisecond', 200)).toBeDisabled()
  await activate(
    option(panel, 'millisecond', 500),
    info.project.name.startsWith('mobile-'),
  )
  await expect(input).toHaveValue('09:30:00.500 AM')
  await expect(demo.locator('input[name="millisecondRange"]')).toHaveValue(
    '["09:30:00.100","09:30:00.400"]',
  )
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(
    demo.getByRole('status', { name: '毫秒范围提交值', exact: true }),
  ).toHaveText('["09:30:00.100","09:30:00.500"]')
})

test('changing the leap-day date completes the boundary time and applies date-aware millisecond exclusions', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(page, '毫秒日期时间')
  await activate(
    panel.locator('[data-calendar-date="2024-03-01"]').first(),
    mobile,
  )
  await expect(input).toHaveValue('2024-03-01 01:00:00.900')
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(panel, 'millisecond', 100)).toBeDisabled()
  await activate(option(panel, 'millisecond', 800), mobile)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '毫秒日期时间提交值', exact: true }),
  ).toHaveText('2024-03-01T01:00:00.800')
})

test('a locked cross-day range retains the original fractional grid and commits only the editable endpoint', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await open(
    page,
    '跨日毫秒范围',
    '跨日毫秒结束',
  )
  await expect(demo.getByLabel('跨日毫秒开始', { exact: true })).toBeDisabled()
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(panel, 'millisecond', 300)).toBeDisabled()
  await expect(option(panel, 'millisecond', 250)).toBeEnabled()
  await activate(option(panel, 'millisecond', 250), mobile)
  await expect(input).toHaveValue('2024-03-01 00:00:00.250')
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '跨日毫秒范围提交值', exact: true }),
  ).toHaveText('["2024-02-29T23:59:59.950","2024-03-01T00:00:00.250"]')
})

test('five RTL columns in a 240px dark container reveal the focused column without page overflow', async ({
  page,
}, info) => {
  const demo = demoFor(page),
    mobile = info.project.name.startsWith('mobile-')
  await activate(
    demo.getByRole('button', { name: '使用 RTL 毫秒时间' }),
    mobile,
  )
  const narrow = demo.locator('[data-millisecond-narrow]')
  await narrow.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  const initial = await page.evaluate(() => window.scrollY)
  await option(narrow, 'second', 15).press('ArrowLeft')
  await expect(option(narrow, 'millisecond', 100)).toBeFocused()
  await option(narrow, 'millisecond', 100).press('ArrowDown')
  await expect(option(narrow, 'millisecond', 300)).toBeFocused()
  const target = option(narrow, 'millisecond', 300),
    box = (await target.boundingBox())!,
    container = (await narrow.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(container.x)
  expect(box.x + box.width).toBeLessThanOrEqual(container.x + container.width)
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - initial),
  ).toBeLessThan(2)
  await activate(target, mobile)
  await activate(
    narrow.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    narrow.getByRole('textbox', { name: '窄容器毫秒时间' }),
  ).toHaveValue('01:30:15.300 PM')
  await narrow.screenshot({
    path: 'output/playwright/milliseconds-rtl-' + info.project.name + '.png',
  })
})

test('strict manual fractions retain errors, confirm canonical values and reset the form', async ({
  page,
}, info) => {
  const demo = demoFor(page),
    input = demo.getByRole('combobox', { name: '完整毫秒时间', exact: true }),
    mobile = info.project.name.startsWith('mobile-')
  await input.fill('09:30:00.1')
  await input.press('Enter')
  await expect(demo.getByRole('alert')).toContainText('HH:mm:ss.SSS')
  await expect(demo.locator('input[name="millisecondTime"]')).toHaveValue(
    '09:30:15.125',
  )
  await input.fill('09:30:00.123')
  await input.press('Enter')
  await activate(
    demo.getByRole('button', { name: '提交毫秒时间', exact: true }),
    mobile,
  )
  await expect(demo.getByRole('status', { name: '毫秒表单结果' })).toHaveText(
    '09:30:00.123',
  )
  await activate(
    demo.getByRole('button', { name: '重置毫秒时间', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('09:30:15.125')
  await expect(demo.getByRole('status', { name: '毫秒表单结果' })).toHaveText(
    '未提交',
  )
})

test('native time and civil date-time adapters retain fractional values and millisecond validity', async ({
  page,
}) => {
  const demo = demoFor(page)
  for (const label of [
    '原生毫秒时间',
    '原生毫秒开始时间',
    '原生毫秒日期时间',
    '原生毫秒开始日期时间',
  ]) {
    const input = demo.getByLabel(label, { exact: true }),
      value = label.includes('日期')
        ? '2024-02-29T09:30:01.250'
        : '09:30:01.250'
    await expect(input).toHaveAttribute('step', '0.001')
    if (label.includes('日期')) {
      // Playwright fill normalizes datetime-local through Date and rejects fractions.
      // Use the actual native value setter and input event to verify browser normalization.
      await input.fill('2024-02-29T09:30:01')
      await input.evaluate((element, raw) => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )!.set!.call(element, raw)
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
    } else await input.fill(value)
    await input.press('Tab')
    await expect(input).toHaveValue(/09:30:01\.25(?:0)?$/)
    const submitted = JSON.parse(
      (await demo
        .getByRole('status', { name: '原生毫秒提交值' })
        .textContent())!,
    )
    expect(
      label.includes('开始') ? submitted[label][0] : submitted[label],
    ).toBe(value)
    expect(
      await input.evaluate(
        (element) => (element as HTMLInputElement).validity.valid,
      ),
    ).toBe(true)
  }
})

test('millisecond scroll gestures keep programmatic reveals separate from candidate selection', async ({
  page,
}, info) => {
  const demo = demoFor(page),
    narrow = demo.locator('[data-millisecond-narrow]'),
    field = narrow.getByRole('textbox', { name: '窄容器毫秒时间' }),
    column = narrow.getByRole('listbox', { name: '窄容器毫秒时间毫秒' })
  await narrow.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  const setPosition = async (number: number, arm: boolean) =>
    column.evaluate(
      (element, args) => {
        if (args.arm)
          element.dispatchEvent(
            args.mobile
              ? new PointerEvent('pointerdown', {
                  bubbles: true,
                  pointerType: 'touch',
                  pointerId: 71,
                })
              : new WheelEvent('wheel', { bubbles: true, deltaY: 44 }),
          )
        const target = element.querySelector<HTMLElement>(
          '[data-time-value="' + args.number + '"]',
        )!
        element.scrollTop +=
          target.getBoundingClientRect().top -
          element.getBoundingClientRect().top -
          element.clientTop -
          (Number.parseFloat(getComputedStyle(element).paddingTop) || 0)
        if (args.arm && args.mobile)
          element.dispatchEvent(
            new PointerEvent('pointerup', {
              bubbles: true,
              pointerType: 'touch',
              pointerId: 71,
            }),
          )
      },
      { number, arm, mobile: info.project.name.startsWith('mobile-') },
    )
  await setPosition(500, false)
  await expect(field).toHaveValue('01:30:15.100 PM')
  await setPosition(700, true)
  await expect(field).toHaveValue('01:30:15.700 PM')
  await expect(field).not.toHaveAttribute('data-picker-preview')
  await expect(
    narrow.locator('input[name="narrowMillisecondTime"]'),
  ).toHaveValue('13:30:15.100')
  await activate(
    narrow.getByRole('button', { name: '确定', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(
    narrow.locator('input[name="narrowMillisecondTime"]'),
  ).toHaveValue('13:30:15.700')
})

test('a real Chromium touch swipe changes only the millisecond candidate until confirmation', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile-chromium',
    'Chromium native touch protocol',
  )
  const narrow = demoFor(page).locator('[data-millisecond-narrow]'),
    field = narrow.getByRole('textbox', { name: '窄容器毫秒时间' }),
    column = narrow.getByRole('listbox', { name: '窄容器毫秒时间毫秒' })
  await column.evaluate((element) =>
    element.scrollIntoView({ block: 'center', inline: 'nearest' }),
  )
  const box = (await column.boundingBox())!,
    client = await page.context().newCDPSession(page),
    x = box.x + box.width / 2,
    y = box.y + 140
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  })
  for (let index = 1; index <= 6; index++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - index * 16 }],
    })
    await page.waitForTimeout(20)
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await expect(field).not.toHaveValue('01:30:15.100 PM')
  await expect(field).not.toHaveAttribute('data-picker-preview')
  await expect(
    narrow.locator('input[name="narrowMillisecondTime"]'),
  ).toHaveValue('13:30:15.100')
  await narrow.getByRole('button', { name: '取消', exact: true }).tap()
  await expect(field).toHaveValue('01:30:15.100 PM')
  await client.detach()
})
