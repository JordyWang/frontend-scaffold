import { expect, test, type Locator, type Page } from '@playwright/test'

const demoFor = (page: Page) =>
  page.getByRole('region', { name: '日期输入悬停预览', exact: true })
const day = (panel: Locator, value: string) =>
  panel.locator('[data-calendar-date="' + value + '"]').first()
const unit = (panel: Locator, value: string) =>
  panel.locator('[data-picker-value="' + value + '"]').first()
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
async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('date mouse preview preserves ARIA, callbacks and hidden values, then selects only on explicit activation', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '悬停确认日期')
  await day(panel, '2024-02-12').hover()
  await expect(input).toHaveValue('2024-02-12')
  await expect(input).toHaveAttribute('data-picker-preview', 'hover')
  await expect(day(panel, '2024-02-10').locator('xpath=..')).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(day(panel, '2024-02-12').locator('xpath=..')).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await expect(demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-10',
  )
  await expect(
    demo.getByRole('status', { name: '日期预览值回调次数', exact: true }),
  ).toHaveText('0')
  await panel.getByRole('button', { name: '确定', exact: true }).press('Enter')
  await expect(input).toHaveValue('2024-02-10')
  const off = await open(page, '关闭日期预览')
  await day(off.panel, '2024-02-12').hover()
  await expect(off.input).toHaveValue('2024-02-10')
  await off.input.press('Escape')
  const actual = await open(page, '悬停确认日期')
  await day(actual.panel, '2024-02-12').hover()
  await day(actual.panel, '2024-02-12').click()
  await expect(actual.input).not.toHaveAttribute('data-picker-preview')
  await expect(demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-10',
  )
  await actual.panel
    .getByRole('button', { name: '确定', exact: true })
    .press('Enter')
  await expect(demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-12',
  )
  await expect(
    demo.getByRole('status', { name: '日期预览值回调次数', exact: true }),
  ).toHaveText('1')
})

test('week month quarter and year preview only final units and restore on keyboard navigation', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  for (const [label, current, next] of [
    ['悬停周', '2024-W08', '2024-W09'],
    ['悬停月', '2024-02', '2024-03'],
    ['悬停季度', '2024-Q1', '2024-Q2'],
    ['悬停年', '2024', '2025'],
  ]) {
    const { input, panel } = await open(page, label)
    await unit(panel, next).hover()
    await expect(input).toHaveValue(next)
    await expect(unit(panel, current).locator('xpath=..')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await unit(panel, current).press('ArrowRight')
    await expect(input).toHaveValue(current)
    await expect(input).not.toHaveAttribute('data-picker-preview')
    if (label !== '悬停周') {
      await panel.getByRole('button', { name: /^浏览\d/ }).press('Enter')
      await panel.locator('[data-picker-value]:not(:disabled)').first().hover()
      await expect(input).toHaveValue(current)
    }
    await input.press('Escape')
  }
})

test('range previews retain opposite endpoint and callbacks even when hovering across it', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(
    page,
    '悬停日期范围',
    '预览开始日期',
  )
  const end = demo.getByRole('combobox', { name: '预览结束日期', exact: true })
  await day(panel, '2024-02-18').hover()
  await expect(input).toHaveValue('2024-02-18')
  await expect(end).toHaveValue('2024-02-15')
  await expect(demo.locator('input[name="previewDateRange"]')).toHaveValue(
    '["2024-02-10","2024-02-15"]',
  )
  await expect(
    demo.getByRole('status', { name: '日期范围预览临时回调次数', exact: true }),
  ).toHaveText('0')
  await panel.getByRole('button', { name: /^预览结束日期：/ }).press('Enter')
  await expect(input).toHaveValue('2024-02-10')
  await day(panel, '2024-02-20').hover()
  await expect(end).toHaveValue('2024-02-20')
  await panel.getByRole('button', { name: '确定', exact: true }).press('Enter')
  await expect(end).toHaveValue('2024-02-15')
})

test('multiple hover does not create a tag or add the preview when finishing with Enter', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '悬停多选日期')
  await day(panel, '2024-02-12').hover()
  await expect(input).toHaveValue('2024-02-12')
  await expect(
    demo.getByRole('button', { name: '移除日期 2024-02-12', exact: true }),
  ).toHaveCount(0)
  await expect(demo.locator('input[name="previewMultiple"]')).toHaveValue(
    '["2024-02-10"]',
  )
  await input.press('Enter')
  await expect(input).toHaveValue('')
  await expect(demo.locator('input[name="previewMultiple"]')).toHaveValue(
    '["2024-02-10"]',
  )
  const actual = await open(page, '悬停多选日期')
  await day(actual.panel, '2024-02-12').click()
  await actual.panel
    .getByRole('button', { name: '确定', exact: true })
    .press('Enter')
  await expect(demo.locator('input[name="previewMultiple"]')).toHaveValue(
    '["2024-02-10","2024-02-12"]',
  )
})

test('date-time previews use actual time, day boundaries and endpoint constraints without committing', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  const single = await open(page, '悬停日期时间')
  await day(single.panel, '2024-03-01').hover()
  await expect(single.input).toHaveValue('2024-03-01 08:00')
  await expect(
    single.demo.locator('input[name="previewDateTime"]'),
  ).toHaveValue('2024-02-29T09:30')
  await single.panel
    .getByRole('button', { name: '确定', exact: true })
    .press('Enter')
  await expect(single.input).toHaveValue('2024-02-29 09:30')
  const range = await open(page, '悬停跨日范围', '预览结束日期时间')
  await day(range.panel, '2024-03-01').hover()
  await expect(range.input).toHaveValue('2024-03-01 09:29')
  await expect(
    range.demo.getByRole('combobox', { name: '预览开始日期时间', exact: true }),
  ).toHaveValue('2024-02-28 23:30')
  await expect(
    range.demo.locator('input[name="previewDateTimeRange"]'),
  ).toHaveValue('["2024-02-28T23:30","2024-02-29T09:30"]')
  await range.input.press('Escape')
  await expect(range.input).toHaveValue('2024-02-29 09:30')
})

test('a required empty field stays invalid while displaying a hovered value and only submits an actual confirmed date', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('mobile-'), 'mouse preview on desktop')
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '必填日期预览')
  const form = demo.getByRole('form', { name: '预览必填校验', exact: true })
  await day(panel, '2024-02-12').hover()
  await expect(input).toHaveValue('2024-02-12')
  expect(
    await form.evaluate((element: HTMLFormElement) => element.checkValidity()),
  ).toBe(false)
  await expect(form.locator('input[name="previewRequired"]')).toHaveValue('')
  await form.evaluate((element: HTMLFormElement) => element.requestSubmit())
  await expect(
    form.getByRole('status', { name: '预览必填表单提交次数', exact: true }),
  ).toHaveText('0')
  await day(panel, '2024-02-12').click()
  await panel.getByRole('button', { name: '确定', exact: true }).press('Enter')
  await form
    .getByRole('button', { name: '提交预览必填表单', exact: true })
    .press('Enter')
  await expect(
    form.getByRole('status', { name: '预览必填表单提交次数', exact: true }),
  ).toHaveText('1')
  await expect(form.locator('input[name="previewRequired"]')).toHaveValue(
    '2024-02-12',
  )
})

test('keyboard browsing and Escape keep selection independent and actual activation preserves confirmation', async ({
  page,
}) => {
  await page.goto('/__ui')
  const { demo, input, panel } = await open(page, '悬停确认日期')
  await day(panel, '2024-02-10').press('ArrowRight')
  await expect(day(panel, '2024-02-11')).toBeFocused()
  await expect(input).toHaveValue('2024-02-10')
  await expect(input).not.toHaveAttribute('data-picker-preview')
  await day(panel, '2024-02-11').press('Enter')
  await expect(input).toHaveValue('2024-02-11')
  await expect(demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-10',
  )
  await input.press('Escape')
  await expect(input).toHaveValue('2024-02-10')
  const again = await open(page, '悬停确认日期')
  await day(again.panel, '2024-02-12').press('Enter')
  await again.panel
    .getByRole('button', { name: '确定', exact: true })
    .press('Enter')
  await expect(demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-12',
  )
})

test('H5 taps select actual dates and ranges without exposing mouse previews', async ({
  page,
}, info) => {
  test.skip(!info.project.name.startsWith('mobile-'), 'mobile touch activation')
  await page.goto('/__ui')
  const single = await open(page, '悬停确认日期')
  await day(single.panel, '2024-02-12').tap()
  await expect(single.input).toHaveValue('2024-02-12')
  await expect(single.input).not.toHaveAttribute('data-picker-preview')
  await single.panel.getByRole('button', { name: '确定', exact: true }).tap()
  await expect(single.demo.locator('input[name="previewDate"]')).toHaveValue(
    '2024-02-12',
  )
  const range = await open(page, '悬停日期范围', '预览开始日期')
  await day(range.panel, '2024-02-12').tap()
  await day(range.panel, '2024-02-20').tap()
  await expect(range.input).not.toHaveAttribute('data-picker-preview')
  await range.panel.getByRole('button', { name: '确定', exact: true }).tap()
  await expect(
    range.demo.locator('input[name="previewDateRange"]'),
  ).toHaveValue('["2024-02-12","2024-02-20"]')
  const multiple = await open(page, '悬停多选日期')
  await day(multiple.panel, '2024-02-12').tap()
  await expect(multiple.input).toHaveValue('')
  await multiple.panel.getByRole('button', { name: '确定', exact: true }).tap()
  await expect(
    multiple.demo.locator('input[name="previewMultiple"]'),
  ).toHaveValue('["2024-02-10","2024-02-12"]')
})

test('240px RTL date preview retains local scrolling and 44px targets without page overflow', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const demo = demoFor(page),
    mobile = info.project.name.startsWith('mobile-')
  await demo
    .getByRole('button', { name: '使用 RTL 日期预览', exact: true })
    .click()
  const input = demo.getByRole('textbox', {
    name: '窄容器日期预览',
    exact: true,
  })
  const root = input.locator('xpath=ancestor::*[@data-datepicker-unit]')
  await root.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(root).toHaveAttribute('dir', 'rtl')
  const before = await page.evaluate(() => window.scrollY)
  if (!mobile) {
    await day(root, '2024-02-12').hover()
    await expect(input).toHaveValue('2024-02-12')
    await day(root, '2024-02-10').press('ArrowRight')
    await expect(input).toHaveValue('2024-02-10')
  }
  await activate(day(root, '2024-02-12'), mobile)
  await expect(input).toHaveValue('2024-02-12')
  await expect(input).not.toHaveAttribute('data-picker-preview')
  const box = (await day(root, '2024-02-12').boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThan(2)
  await root.screenshot({
    path:
      'output/playwright/date-input-preview-rtl-' + info.project.name + '.png',
  })
  await activate(
    root.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
