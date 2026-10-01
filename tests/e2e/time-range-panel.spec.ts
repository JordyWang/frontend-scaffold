import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
const option = (panel: Locator, unit: string, value: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )
async function openRange(page: Page, label: string, field: string) {
  const demo = page.getByRole('region', { name: '时间范围面板预览' })
  const input = demo.getByRole('combobox', { name: field, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: label + '选择面板' })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}

test('time range columns retain both pending endpoints and confirm one constrained tuple', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openRange(
    page,
    '营业时段',
    '营业开始时间',
  )
  const status = demo.getByRole('status', { name: '营业时段提交值' })
  const scroll = await page.evaluate(() => window.scrollY)
  await option(panel, 'hour', 9).press('ArrowDown')
  await expect(option(panel, 'hour', 10)).toBeFocused()
  await expect(status).toHaveText('09:30 → 17:00')
  await activate(option(panel, 'hour', 10), mobile)
  await expect(input).toHaveValue('10:30')
  await activate(panel.getByRole('button', { name: /^营业结束时间：/ }), mobile)
  await expect(option(panel, 'hour', 17)).toBeFocused()
  await expect(option(panel, 'hour', 11)).toBeDisabled()
  await expect(option(panel, 'hour', 9)).toBeDisabled()
  await activate(option(panel, 'hour', 18), mobile)
  await activate(option(panel, 'minute', 45), mobile)
  await expect(status).toHaveText('09:30 → 17:00')
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await panel.screenshot({
    path: 'output/playwright/time-range-' + testInfo.project.name + '.png',
  })
  await page.screenshot({
    path:
      'output/playwright/time-range-context-' + testInfo.project.name + '.png',
  })
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(panel).toHaveCount(0)
  await expect(
    demo.getByRole('combobox', { name: '营业结束时间', exact: true }),
  ).toBeFocused()
  await expect(status).toHaveText('10:30 → 18:45')
})

test('time range seconds and AM PM preserve canonical tuples', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const media = await openRange(page, '媒体片段', '片段结束时间')
  await option(media.panel, 'hour', 10).press('ArrowRight')
  await option(media.panel, 'minute', 30).press('ArrowRight')
  await option(media.panel, 'second', 15).press('ArrowDown')
  await expect(option(media.panel, 'second', 45)).toBeFocused()
  await expect(option(media.panel, 'second', 30)).toBeDisabled()
  await expect(option(media.panel, 'second', 45)).toHaveAccessibleName(
    '45秒，片段结束标记',
  )
  await activate(option(media.panel, 'second', 45), mobile)
  await activate(
    media.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    media.demo.getByRole('status', { name: '媒体片段提交值' }),
  ).toHaveText('09:30:15 → 10:30:45')
  const twelve = await openRange(page, '十二小时范围', '十二小时开始')
  await expect(twelve.input).toHaveValue('12:30 AM')
  await activate(option(twelve.panel, 'meridiem', 1), mobile)
  await expect(twelve.input).toHaveValue('12:30 PM')
  await activate(
    twelve.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    twelve.demo.getByRole('status', { name: '十二小时范围提交值' }),
  ).toHaveText('12:30 → 13:30')
})

test('crossed time ranges clear editable ends, can sort and respect locked and open endpoints', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const range = await openRange(page, '营业时段', '营业开始时间')
  await activate(option(range.panel, 'hour', 18), mobile)
  await expect(
    range.demo.getByRole('combobox', { name: '营业结束时间', exact: true }),
  ).toHaveValue('')
  await expect(
    range.panel.getByRole('button', { name: '确定', exact: true }),
  ).toBeDisabled()
  await activate(
    range.panel.getByRole('button', { name: /^营业结束时间：/ }),
    mobile,
  )
  await activate(option(range.panel, 'hour', 19), mobile)
  await activate(
    range.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    range.demo.getByRole('status', { name: '营业时段提交值' }),
  ).toHaveText('18:30 → 19:30')
  const sorted = await openRange(page, '自动排序时段', '排序开始时间')
  await activate(option(sorted.panel, 'hour', 18), mobile)
  await expect(sorted.input).toHaveValue('18:30')
  await activate(
    sorted.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(sorted.input).toHaveValue('17:00')
  await expect(
    sorted.demo.getByRole('combobox', { name: '排序结束时间', exact: true }),
  ).toHaveValue('18:30')
  const locked = await openRange(page, '锁定开始时刻', '可编辑结束时间')
  await expect(option(locked.panel, 'hour', 9)).toBeDisabled()
  await expect(
    locked.demo.getByRole('combobox', { name: '锁定开始时间', exact: true }),
  ).toBeDisabled()
  await activate(option(locked.panel, 'hour', 13), mobile)
  await activate(
    locked.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(locked.input).toHaveValue('13:00')
  const opened = await openRange(page, '开放结束时刻', '开放开始时间')
  await activate(option(opened.panel, 'hour', 10), mobile)
  await activate(
    opened.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(opened.input).toHaveValue('10:30')
  await expect(
    opened.demo.getByRole('combobox', { name: '开放结束时间', exact: true }),
  ).toHaveValue('')
})

test('range presets, outside close, Escape and Tab preserve confirmation and focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openRange(
    page,
    '营业时段',
    '营业开始时间',
  )
  const preset = panel.getByRole('button', { name: '下午营业', exact: true })
  await activate(preset, mobile)
  await expect(input).toHaveValue('14:30')
  await panel.getByRole('button', { name: /^营业开始时间：/ }).focus()
  await panel
    .getByRole('button', { name: /^营业开始时间：/ })
    .press('Shift+Tab')
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('14:30')
  await input.press('Escape')
  await expect(input).toHaveValue('09:30')
  await input.press('ArrowDown')
  await activate(preset, mobile)
  const confirm = panel.getByRole('button', { name: '确定', exact: true })
  await confirm.focus()
  await confirm.press('Tab')
  await expect(panel).toHaveCount(0)
  await expect(input).toHaveValue('09:30')
  await expect(
    demo.getByRole('button', { name: '清空营业结束时间', exact: true }),
  ).toBeFocused()
  await activate(
    demo.getByRole('button', { name: '外部打开时间范围', exact: true }),
    mobile,
  )
  const external = page.getByRole('dialog', { name: '外部开合时段选择面板' })
  const externalStart = demo.getByRole('combobox', {
    name: '外部开始时间',
    exact: true,
  })
  await externalStart.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await activate(option(external, 'hour', 10), mobile)
  await expect(externalStart).toHaveValue('10:30')
  await activate(
    demo.getByRole('button', { name: '外部关闭时间范围', exact: true }),
    mobile,
  )
  await expect(external).toHaveCount(0)
  await expect(externalStart).toHaveValue('09:30')
})

test('typed ranges reject invalid values, retain two drafts and immediate selection persists on cancellation', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间范围面板预览' })
  const typed = demo.getByRole('combobox', {
    name: '输入开始时间',
    exact: true,
  })
  for (const value of ['25:00', '08:00', '10:10']) {
    await typed.fill(value)
    await typed.press('Enter')
    await expect(
      demo
        .getByRole('group', { name: '输入时间范围', exact: true })
        .getByRole('alert'),
    ).toContainText('HH:mm')
  }
  await demo
    .getByRole('textbox', { name: '时间范围之后的字段', exact: true })
    .focus()
  await expect(typed).toHaveValue('09:30')
  await typed.fill('10:45')
  await demo
    .getByRole('combobox', { name: '输入结束时间', exact: true })
    .fill('18:15')
  await typed.press('Enter')
  await expect(typed).toHaveValue('10:45')
  await expect(
    demo.getByRole('combobox', { name: '输入结束时间', exact: true }),
  ).toHaveValue('18:15')
  const immediate = await openRange(page, '即时提交时段', '即时开始时间')
  await activate(option(immediate.panel, 'hour', 10), mobile)
  await expect(immediate.input).toHaveValue('10:30')
  await option(immediate.panel, 'hour', 10).press('Escape')
  await expect(immediate.input).toHaveValue('10:30')
})

test('time range Form confirms both endpoints before submission and resets its tuple', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间范围面板预览' })
  await activate(
    demo.getByRole('button', { name: '清空表单开始时间', exact: true }),
    mobile,
  )
  const { input, panel } = await openRange(page, '时间范围表单', '表单开始时间')
  await expect(
    demo.getByText('请选择完整预约时段', { exact: true }),
  ).toHaveCount(0)
  await activate(option(panel, 'hour', 10), mobile)
  await activate(panel.getByRole('button', { name: /^表单结束时间：/ }), mobile)
  await activate(option(panel, 'hour', 18), mobile)
  await activate(option(panel, 'minute', 45), mobile)
  await expect(
    demo.getByText('请选择完整预约时段', { exact: true }),
  ).toHaveCount(0)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await activate(
    demo.getByRole('button', { name: '提交时间范围表单', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '时间范围表单结果' }),
  ).toHaveText('预约时段：10:00 → 18:45')
  await activate(
    demo.getByRole('button', { name: '重置时间范围表单', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('09:30')
  await expect(
    demo.getByRole('combobox', { name: '表单结束时间', exact: true }),
  ).toHaveValue('17:00')
  await activate(
    demo.getByRole('button', { name: '清空表单开始时间', exact: true }),
    mobile,
  )
  await activate(
    demo.getByRole('button', { name: '提交时间范围表单', exact: true }),
    mobile,
  )
  await expect(
    demo.getByText('请选择完整预约时段', { exact: true }),
  ).toBeVisible()
})

test('narrow RTL time ranges retain 44px targets, local scroll, layout and disabled boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间范围面板预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 时间范围', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await demo.getByLabel('时间范围弹出位置').selectOption('topEnd')
  const { input, panel } = await openRange(page, '媒体片段', '片段结束时间')
  await expect(panel).toHaveAttribute('dir', 'rtl')
  const scroll = await page.evaluate(() => window.scrollY)
  await option(panel, 'hour', 10).press('ArrowLeft')
  await expect(option(panel, 'minute', 30)).toBeFocused()
  await option(panel, 'minute', 30).press('End')
  await expect(option(panel, 'minute', 59)).toBeFocused()
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  const cell = (await option(panel, 'minute', 59).boundingBox())!
  expect(cell.width).toBeGreaterThanOrEqual(44)
  expect(cell.height).toBeGreaterThanOrEqual(44)
  const bounds = (await panel.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await panel.screenshot({
    path: 'output/playwright/time-range-rtl-' + testInfo.project.name + '.png',
  })
  await option(panel, 'minute', 59).press('Escape')
  const inline = demo.getByRole('group', { name: '内嵌时间范围', exact: true })
  expect(
    await inline.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  const inlineCell = (await inline
    .getByRole('option', { name: '15秒', exact: true })
    .boundingBox())!
  expect(inlineCell.width).toBeGreaterThanOrEqual(44)
  const inlineStart = (await inline
    .getByRole('textbox', { name: '内嵌开始时间', exact: true })
    .boundingBox())!
  const inlineEnd = (await inline
    .getByRole('textbox', { name: '内嵌结束时间', exact: true })
    .boundingBox())!
  expect(inlineEnd.y).toBeGreaterThan(inlineStart.y)
  await demo
    .getByRole('combobox', { name: '只读开始时间', exact: true })
    .press('ArrowDown')
  await expect(
    page.getByRole('dialog', { name: '只读时段选择面板' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  await activate(
    demo.getByRole('button', { name: '禁用时间范围', exact: true }),
    mobile,
  )
  await expect(input).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '打开片段结束时间面板', exact: true }),
  ).toBeDisabled()
})
