import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
const option = (panel: Locator, unit: string, value: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )
async function openTime(page: Page, label: string) {
  const demo = page.getByRole('region', { name: '时间选择面板预览' })
  const input = demo.getByRole('combobox', { name: label, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: label + '选择面板' })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}

test('time columns browse without submitting and complete a constrained hour before confirmation', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openTime(page, '预约时分')
  const status = demo.getByRole('status', { name: '预约时间提交值' })
  await expect(option(panel, 'hour', 9)).toBeFocused()
  const scroll = await page.evaluate(() => window.scrollY)
  await option(panel, 'hour', 9).press('ArrowDown')
  await expect(option(panel, 'hour', 10)).toBeFocused()
  await expect(option(panel, 'hour', 9)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(status).toHaveText('09:30')
  await expect(option(panel, 'hour', 11)).toBeDisabled()
  await activate(option(panel, 'hour', 10), mobile)
  await expect(input).toHaveValue('10:15')
  await expect(option(panel, 'minute', 30)).toBeDisabled()
  await option(panel, 'hour', 10).press('ArrowRight')
  await expect(option(panel, 'minute', 15)).toBeFocused()
  await option(panel, 'minute', 15).press('ArrowDown')
  await expect(option(panel, 'minute', 45)).toBeFocused()
  await activate(option(panel, 'minute', 45), mobile)
  await expect(status).toHaveText('09:30')
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await panel.screenshot({
    path: 'output/playwright/time-panel-' + testInfo.project.name + '.png',
  })
  await page.screenshot({
    path: 'output/playwright/time-context-' + testInfo.project.name + '.png',
  })
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(panel).toHaveCount(0)
  await expect(input).toBeFocused()
  await expect(status).toHaveText('10:45')
})

test('time seconds skip disabled values and expose custom cell descriptions', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openTime(page, '媒体时间点')
  await option(panel, 'hour', 9).press('ArrowRight')
  await option(panel, 'minute', 30).press('ArrowRight')
  await expect(option(panel, 'second', 15)).toBeFocused()
  await expect(option(panel, 'second', 30)).toBeDisabled()
  await option(panel, 'second', 15).press('ArrowDown')
  await expect(option(panel, 'second', 45)).toBeFocused()
  await expect(option(panel, 'second', 45)).toHaveAccessibleName(
    '45秒，媒体标记',
  )
  await activate(option(panel, 'second', 45), mobile)
  await expect(input).toHaveValue('09:30:45')
  await expect(demo.getByRole('status', { name: '媒体时间提交值' })).toHaveText(
    '09:30:15',
  )
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(demo.getByRole('status', { name: '媒体时间提交值' })).toHaveText(
    '09:30:45',
  )
})

test('twelve hour display converts midnight and noon to canonical values', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openTime(page, '十二小时预约')
  await expect(input).toHaveValue('12:30 AM')
  await expect(option(panel, 'hour', 0)).toHaveAccessibleName('12小时')
  await activate(option(panel, 'meridiem', 1), mobile)
  await expect(input).toHaveValue('12:30 PM')
  await expect(demo.getByRole('status', { name: '十二小时提交值' })).toHaveText(
    '00:30',
  )
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(demo.getByRole('status', { name: '十二小时提交值' })).toHaveText(
    '12:30',
  )
})

test('time presets, Escape, outside close and forward and reverse Tab preserve session boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openTime(page, '预约时分')
  const preset = panel.getByRole('button', { name: '下午预约', exact: true })
  await activate(preset, mobile)
  await expect(input).toHaveValue('14:30')
  await preset.press('Shift+Tab')
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('14:30')
  await input.press('Escape')
  await expect(input).toHaveValue('09:30')
  await expect(panel).toHaveCount(0)
  await input.press('ArrowDown')
  await activate(preset, mobile)
  const confirm = panel.getByRole('button', { name: '确定', exact: true })
  await confirm.focus()
  await confirm.press('Tab')
  await expect(panel).toHaveCount(0)
  await expect(input).toHaveValue('09:30')
  await expect(
    demo.getByRole('button', { name: '清空预约时分', exact: true }),
  ).toBeFocused()
  await activate(
    demo.getByRole('button', { name: '外部打开时间', exact: true }),
    mobile,
  )
  const externalInput = demo.getByRole('combobox', {
    name: '外部开合时间',
    exact: true,
  })
  const external = page.getByRole('dialog', { name: '外部开合时间选择面板' })
  await externalInput.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await activate(option(external, 'hour', 10), mobile)
  await expect(externalInput).toHaveValue('10:30')
  await activate(
    demo.getByRole('button', { name: '外部关闭时间', exact: true }),
    mobile,
  )
  await expect(external).toHaveCount(0)
  await expect(externalInput).toHaveValue('09:30')
})

test('typed times, immediate mode and an overnight availability window share constraints', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间选择面板预览' })
  const typed = demo.getByRole('combobox', {
    name: '输入预约时间',
    exact: true,
  })
  for (const value of ['25:00', '08:00', '10:10']) {
    await typed.fill(value)
    await typed.press('Enter')
    await expect(typed).toHaveAttribute('aria-invalid', 'true')
    await expect(typed.locator('xpath=../..').getByRole('alert')).toContainText(
      'HH:mm',
    )
  }
  await demo
    .getByRole('textbox', { name: '时间之后的字段', exact: true })
    .focus()
  await expect(typed).toHaveValue('09:30')
  await typed.fill('14:45')
  await typed.press('Enter')
  await expect(typed).toHaveValue('14:45')
  const immediate = await openTime(page, '即时选择时间')
  await activate(option(immediate.panel, 'hour', 10), mobile)
  await expect(immediate.input).toHaveValue('10:30')
  await expect(immediate.panel.getByRole('status')).toHaveText(
    '已选时间：10:30',
  )
  await option(immediate.panel, 'hour', 10).press('Escape')
  await expect(immediate.input).toHaveValue('10:30')
  const midnight = await openTime(page, '午夜时段')
  await expect(option(midnight.panel, 'hour', 2)).toBeDisabled()
  await activate(option(midnight.panel, 'hour', 23), mobile)
  await expect(midnight.input).toHaveValue('23:30')
  await activate(
    midnight.panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(midnight.input).toHaveValue('23:30')
})

test('project Form validates only after combined blur, submits confirmed time and resets', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间选择面板预览' })
  const input = demo.getByRole('combobox', {
    name: '时间预约表单',
    exact: true,
  })
  await activate(
    demo.getByRole('button', { name: '清空时间预约表单', exact: true }),
    mobile,
  )
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: '时间预约表单选择面板' })
  await expect(demo.getByText('请选择预约时刻', { exact: true })).toHaveCount(0)
  await activate(option(panel, 'hour', 10), mobile)
  await activate(option(panel, 'minute', 45), mobile)
  await expect(demo.getByText('请选择预约时刻', { exact: true })).toHaveCount(0)
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await activate(
    demo.getByRole('button', { name: '提交时间预约表单', exact: true }),
    mobile,
  )
  await expect(demo.getByRole('status', { name: '时间表单结果' })).toHaveText(
    '预约时间：10:45',
  )
  await activate(
    demo.getByRole('button', { name: '重置时间预约表单', exact: true }),
    mobile,
  )
  await expect(input).toHaveValue('09:30')
  await activate(
    demo.getByRole('button', { name: '清空时间预约表单', exact: true }),
    mobile,
  )
  await activate(
    demo.getByRole('button', { name: '提交时间预约表单', exact: true }),
    mobile,
  )
  await expect(demo.getByText('请选择预约时刻', { exact: true })).toBeVisible()
})

test('time column scrolling and keyboard page navigation stay inside the popup', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const { input, panel } = await openTime(page, '媒体时间点')
  const hour = panel.getByRole('listbox', {
    name: '媒体时间点小时',
    exact: true,
  })
  const scroll = await page.evaluate(() => window.scrollY)
  const before = (await panel.boundingBox())!
  await option(panel, 'hour', 9).press('End')
  await expect(option(panel, 'hour', 23)).toBeFocused()
  const last = (await option(panel, 'hour', 23).boundingBox())!
  const column = (await hour.boundingBox())!
  expect(last.y).toBeGreaterThanOrEqual(column.y)
  expect(last.y + last.height).toBeLessThanOrEqual(column.y + column.height)
  await option(panel, 'hour', 23).press('PageUp')
  await expect(option(panel, 'hour', 18)).toBeFocused()
  await option(panel, 'hour', 18).press('Home')
  await expect(option(panel, 'hour', 0)).toBeFocused()
  if (testInfo.project.name === 'mobile-webkit') {
    // Playwright does not support wheel input in mobile WebKit.
    await hour.evaluate((element) => element.scrollBy({ top: 450 }))
  } else {
    await hour.hover()
    await page.mouse.wheel(0, 450)
  }
  await expect
    .poll(() => hour.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  await expect(input).toHaveValue('09:30:15')
  const after = (await panel.boundingBox())!
  expect(Math.abs(after.y - before.y)).toBeLessThan(2)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await option(panel, 'hour', 0).press('End')
  await activate(option(panel, 'hour', 23), mobile)
  await expect(input).toHaveValue('23:30:15')
})

test('narrow RTL time panels retain touch targets, direction, theme and readonly boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间选择面板预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 时间面板', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await demo.getByLabel('时间弹出位置').selectOption('topEnd')
  const { input, panel } = await openTime(page, '媒体时间点')
  await expect(panel).toHaveAttribute('dir', 'rtl')
  await option(panel, 'hour', 9).press('ArrowLeft')
  await expect(option(panel, 'minute', 30)).toBeFocused()
  await option(panel, 'minute', 30).press('ArrowLeft')
  await expect(option(panel, 'second', 15)).toBeFocused()
  const cell = (await option(panel, 'second', 15).boundingBox())!
  expect(cell.width).toBeGreaterThanOrEqual(44)
  expect(cell.height).toBeGreaterThanOrEqual(44)
  const bounds = (await panel.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await panel.screenshot({
    path: 'output/playwright/time-rtl-' + testInfo.project.name + '.png',
  })
  await option(panel, 'second', 15).press('Escape')
  const inline = demo
    .getByRole('textbox', { name: '内嵌时间', exact: true })
    .locator('xpath=../..')
  expect(
    await inline.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  const inlineCell = (await inline
    .getByRole('option', { name: '15秒', exact: true })
    .boundingBox())!
  expect(inlineCell.width).toBeGreaterThanOrEqual(44)
  const readonly = demo.getByRole('combobox', { name: '只读时间', exact: true })
  await readonly.press('ArrowDown')
  await expect(
    page.getByRole('dialog', { name: '只读时间选择面板' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  await activate(
    demo.getByRole('button', { name: '禁用时间面板', exact: true }),
    mobile,
  )
  await expect(input).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '打开媒体时间点面板', exact: true }),
  ).toBeDisabled()
})

test('dynamic time availability hides unavailable options without stealing outside focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '时间选择面板预览' })
  const inline = demo
    .getByRole('textbox', { name: '动态时间', exact: true })
    .locator('xpath=../..')
  await activate(
    demo.getByRole('button', { name: '停用所有时间', exact: true }),
    mobile,
  )
  await expect(inline.getByRole('option')).toHaveCount(0)
  await expect(inline.getByText('无可选小时', { exact: true })).toBeVisible()
  await expect(
    inline.getByRole('button', { name: '确定', exact: true }),
  ).toBeDisabled()
  const restore = demo.getByRole('button', {
    name: '恢复可选时间',
    exact: true,
  })
  await restore.focus()
  await expect(restore).toBeFocused()
  await activate(restore, mobile)
  await expect(option(inline, 'hour', 9)).toBeEnabled()
})
