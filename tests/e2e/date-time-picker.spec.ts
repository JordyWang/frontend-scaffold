import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
const day = (panel: Locator, date: string) =>
  panel.locator('[data-calendar-date="' + date + '"]')
const option = (panel: Locator, unit: string, value: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )
async function openDateTime(page: Page, label: string) {
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  const input = demo.getByRole('combobox', { name: label, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: label + '选择面板' })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}

test('date-time browsing, leap-date completion and time columns share one confirmation', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openDateTime(page, '跨闰月预约')
  const status = demo.getByRole('status', {
    name: '日期时间提交值',
    exact: true,
  })
  await expect(day(panel, '2024-02-28')).toBeFocused()
  await day(panel, '2024-02-28').press('ArrowRight')
  await expect(day(panel, '2024-02-29')).toBeFocused()
  await expect(input).toHaveValue('2024-02-28 09:30')
  await expect(day(panel, '2024-02-29')).toHaveAccessibleName(/闰日预约/)
  const cell = await day(panel, '2024-02-29').boundingBox()
  expect(cell!.width).toBeGreaterThanOrEqual(44)
  expect(cell!.height).toBeGreaterThanOrEqual(44)
  await activate(day(panel, '2024-02-29'), mobile)
  await expect(input).toHaveValue('2024-02-29 10:00')
  await expect(day(panel, '2024-03-02')).toBeDisabled()
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(panel, 'hour', 10)).toBeFocused()
  await expect(option(panel, 'hour', 9)).toBeDisabled()
  const scroll = await page.evaluate(() => window.scrollY)
  const top = (await panel.boundingBox())!.y
  await option(panel, 'hour', 10).press('ArrowRight')
  await expect(option(panel, 'minute', 0)).toBeFocused()
  await option(panel, 'minute', 0).press('ArrowDown')
  await option(panel, 'minute', 15).press('ArrowDown')
  await expect(option(panel, 'minute', 45)).toBeFocused()
  const target = await option(panel, 'minute', 45).boundingBox()
  expect(target!.width).toBeGreaterThanOrEqual(44)
  expect(target!.height).toBeGreaterThanOrEqual(44)
  await activate(option(panel, 'minute', 45), mobile)
  await expect(input).toHaveValue('2024-02-29 10:45')
  await expect(status).toHaveText('2024-02-28T09:30')
  expect(Math.abs((await panel.boundingBox())!.y - top)).toBeLessThan(2)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await expect(
    demo.getByRole('status', { name: '日期时间失焦次数' }),
  ).toHaveText('0')
  await panel.screenshot({
    path: 'output/playwright/datetime-' + info.project.name + '.png',
  })
  await page.screenshot({
    path: 'output/playwright/datetime-context-' + info.project.name + '.png',
  })
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(panel).toHaveCount(0)
  await expect(input).toBeFocused()
  await expect(status).toHaveText('2024-02-29T10:45')
})

test('date-time second limits change with the date and enforce the final boundary day', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openDateTime(page, '跨日媒体时刻')
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(panel, 'second', 30)).toBeDisabled()
  await expect(option(panel, 'second', 45)).toHaveAccessibleName(
    '45秒，媒体标记',
  )
  await activate(option(panel, 'second', 45), mobile)
  await expect(input).toHaveValue('2024-02-29 23:30:45')
  await activate(
    panel.getByRole('button', { name: '选择日期', exact: true }),
    mobile,
  )
  await day(panel, '2024-02-29').press('ArrowRight')
  await activate(day(panel, '2024-03-01'), mobile)
  await expect(input).toHaveValue('2024-03-01 02:00:00')
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(option(panel, 'hour', 3)).toBeDisabled()
  await activate(option(panel, 'hour', 1), mobile)
  await activate(option(panel, 'second', 30), mobile)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '媒体日期时间提交值' }),
  ).toHaveText('2024-03-01T01:00:30')
})

test('presets, Escape, Tab and external close retain committed date-time values', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openDateTime(page, '跨闰月预约')
  await activate(panel.getByRole('button', { name: '次日午后' }), mobile)
  await expect(input).toHaveValue('2024-03-01 14:30')
  await panel.getByRole('button', { name: '确定', exact: true }).press('Escape')
  await expect(input).toHaveValue('2024-02-28 09:30')
  await expect(input).toBeFocused()
  await input.press('ArrowDown')
  await panel.getByRole('button', { name: '次日午后' }).press('Shift+Tab')
  await expect(input).toBeFocused()
  await activate(panel.getByRole('button', { name: '次日午后' }), mobile)
  await panel.getByRole('button', { name: '确定', exact: true }).press('Tab')
  await expect(panel).toHaveCount(0)
  await expect(input).toHaveValue('2024-02-28 09:30')
  await expect(
    demo.getByRole('button', { name: '清空跨闰月预约' }),
  ).toBeFocused()
  await demo.getByRole('button', { name: '外部打开日期时间' }).click()
  const controlled = demo.getByRole('combobox', {
    name: '外部控制日期时间',
    exact: true,
  })
  await controlled.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  const external = page.getByRole('dialog', {
    name: '外部控制日期时间选择面板',
  })
  await expect(external).toBeVisible()
  await activate(day(external, '2024-03-01'), mobile)
  await demo.getByRole('button', { name: '外部关闭日期时间' }).click()
  await expect(external).toHaveCount(0)
  await expect(controlled).toHaveValue('2024-02-29 09:30')
})

test('manual local input rejects invalid dates and 12-hour display commits canonical values', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  const manual = demo.getByRole('combobox', {
    name: '输入日期时间',
    exact: true,
  })
  await manual.fill('2024-02-30 09:30')
  await manual.press('Enter')
  await expect(
    demo.getByRole('alert').filter({ hasText: '请输入可选日期时间' }),
  ).toBeVisible()
  await expect(manual).toHaveAttribute('aria-invalid', 'true')
  await manual.fill('2024-03-01T13:45')
  await manual.press('Enter')
  await expect(manual).toHaveValue('2024-03-01 13:45')
  await expect(manual).not.toHaveAttribute('aria-invalid', 'true')
  const { input, panel } = await openDateTime(page, '12 小时日期时间')
  const mobile = info.project.name.startsWith('mobile-')
  await expect(input).toHaveValue('2024-02-29 12:30 AM')
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await activate(option(panel, 'meridiem', 1), mobile)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('2024-02-29 12:30 PM')
  const defaultTime = await openDateTime(page, '默认打开时间')
  await expect(defaultTime.input).toHaveValue('')
  await activate(day(defaultTime.panel, '2024-02-28'), mobile)
  await expect(defaultTime.input).toHaveValue('2024-02-28 10:00')
  await activate(
    defaultTime.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
})

test('narrow date-time panels switch visible parts, contain scrolling and support RTL dark mode', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  await demo.getByRole('button', { name: '使用 RTL 日期时间' }).click()
  const input = demo.getByRole('textbox', {
    name: '窄容器日期时间',
    exact: true,
  })
  const panel = input
    .locator('xpath=ancestor::*[@data-datetimepicker]')
    .locator('[id$="-popup"]')
  await panel.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(panel.getByRole('grid')).toBeVisible()
  await expect(panel.getByRole('listbox')).toHaveCount(0)
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await expect(panel.getByRole('grid')).toHaveCount(0)
  await expect(option(panel, 'hour', 9)).toBeFocused()
  const scroll = await page.evaluate(() => window.scrollY)
  await option(panel, 'hour', 9).press('ArrowLeft')
  await expect(option(panel, 'minute', 30)).toBeFocused()
  await option(panel, 'minute', 30).press('End')
  await expect(option(panel, 'minute', 45)).toBeFocused()
  await activate(option(panel, 'minute', 45), mobile)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await panel.screenshot({
    path: 'output/playwright/datetime-narrow-rtl-' + info.project.name + '.png',
  })
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('2024-02-29 09:45')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const dynamic = demo
    .getByRole('textbox', { name: '动态日期时间', exact: true })
    .locator('xpath=ancestor::*[@data-datetimepicker]')
  await activate(
    dynamic.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  const toggle = demo.getByRole('button', { name: '停用日期时间选项' })
  await toggle.press('Enter')
  await expect(
    demo.getByRole('button', { name: '恢复日期时间选项' }),
  ).toBeFocused()
  await expect(dynamic.getByRole('option')).toHaveCount(0)
})

test('date-time forms submit only confirmed values, show required errors and reset both panels', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openDateTime(page, '日期时间预约表单')
  await activate(day(panel, '2024-03-01'), mobile)
  const formData = () =>
    input.evaluate((element) =>
      String(
        new FormData((element as HTMLInputElement).form!).get('appointment'),
      ),
    )
  expect(await formData()).toBe('2024-02-29T09:30')
  expect(
    await input.evaluate((element) =>
      (element as HTMLInputElement).checkValidity(),
    ),
  ).toBe(false)
  await activate(
    panel.getByRole('button', { name: '调整时间', exact: true }),
    mobile,
  )
  await activate(option(panel, 'hour', 10), mobile)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await demo.getByRole('button', { name: '提交日期时间表单' }).click()
  await expect(
    demo.getByRole('status', { name: '日期时间表单结果' }),
  ).toHaveText('预约：2024-03-01T10:30')
  await demo.getByRole('button', { name: '重置日期时间表单' }).click()
  await expect(input).toHaveValue('2024-02-29 09:30')
  await demo.getByRole('button', { name: '清空日期时间预约表单' }).click()
  await demo.getByRole('button', { name: '提交日期时间表单' }).click()
  await expect(
    demo.getByText('请选择完整预约时刻', { exact: true }),
  ).toBeVisible()
})

test('native date-time adapter normalizes omitted zero seconds and respects external form reset', async ({
  page,
}) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  const native = demo.locator('input[type="datetime-local"]')
  await native.fill('2024-03-01T10:45')
  await demo.getByRole('button', { name: '提交原生日期时间' }).click()
  await expect(
    demo.getByRole('status', { name: '原生日期时间结果' }),
  ).toHaveText('2024-03-01T10:45')
  await demo.getByRole('button', { name: '重置原生日期时间' }).click()
  await expect(native).toHaveValue('2024-02-29T09:30:15')
})

test('combined date-time popup fits every logical placement on a narrow viewport', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  if (!info.project.name.startsWith('mobile-'))
    await page.setViewportSize({ width: 360, height: 740 })
  await demo.getByRole('button', { name: '使用 RTL 日期时间' }).click()
  for (const placement of ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']) {
    await demo
      .getByLabel('日期时间弹出位置', { exact: true })
      .selectOption(placement)
    const { input, panel } = await openDateTime(page, '跨闰月预约')
    const box = await panel.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(7)
    expect(box!.y).toBeGreaterThanOrEqual(7)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 7)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - 7)
    await expect(panel.getByRole('grid')).toBeVisible()
    await expect(panel.getByRole('listbox')).toHaveCount(0)
    await input.press('Escape')
  }
})

test('resizing a desktop combined panel restores focus from a newly hidden time part', async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith('mobile-'),
    'desktop wide-to-narrow transition',
  )
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期时间组合预览' })
  const input = demo.getByRole('textbox', {
    name: '响应式日期时间',
    exact: true,
  })
  const panel = input
    .locator('xpath=ancestor::*[@data-datetimepicker]')
    .locator('[id$="-popup"]')
  await expect(panel.getByRole('grid')).toBeVisible()
  await expect(panel.getByRole('listbox')).toHaveCount(2)
  await option(panel, 'hour', 9).focus()
  await page.setViewportSize({ width: 360, height: 740 })
  await expect(
    panel.locator('[data-calendar-date][tabindex="0"]'),
  ).toBeFocused()
  await expect(panel.getByRole('listbox')).toHaveCount(0)
})
