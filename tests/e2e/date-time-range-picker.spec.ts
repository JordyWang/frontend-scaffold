import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
const demoFor = (page: Page) =>
  page.getByRole('region', { name: '日期时间范围组合预览' })
const day = (panel: Locator, date: string) =>
  panel.locator('[data-calendar-date="' + date + '"]')
const option = (panel: Locator, unit: string, value: number) =>
  panel.locator(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )
const part = (panel: Locator, time = true) =>
  panel.getByRole('button', {
    name: time ? '调整时间' : '选择日期',
    exact: true,
  })
const confirm = (panel: Locator) =>
  panel.getByRole('button', { name: '确定', exact: true })
async function openRange(page: Page, label: string, field: string) {
  const demo = demoFor(page),
    input = demo.getByRole('combobox', { name: field, exact: true })
  await input.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await input.press('ArrowDown')
  const panel = page.getByRole('dialog', { name: label + '选择面板' })
  await expect(panel).toBeVisible()
  return { demo, input, panel }
}

test('cross-day range switches endpoints and date/time parts through one confirmation', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openRange(
    page,
    '跨日预约范围',
    '预约开始日期时间',
  )
  const status = demo.getByRole('status', {
    name: '日期时间范围提交值',
    exact: true,
  })
  const end = demo.getByRole('combobox', {
    name: '预约结束日期时间',
    exact: true,
  })
  const hidden = demo.locator('input[type="hidden"][name="datetimeRange"]')
  const original = '["2024-02-29T23:30","2024-03-01T00:30"]'
  await expect(day(panel, '2024-02-29')).toBeFocused()
  await expect(day(panel, '2024-02-29')).toHaveAccessibleName(
    /范围开始，闰日预约/,
  )
  await day(panel, '2024-02-29').press('ArrowRight')
  await expect(input).toHaveValue('2024-02-29 23:30')
  await activate(
    panel.getByRole('button', { name: /^预约结束日期时间：/ }),
    mobile,
  )
  await expect(day(panel, '2024-03-01')).toBeFocused()
  await expect(day(panel, '2024-03-02')).toBeDisabled()
  await activate(part(panel), mobile)
  await expect(option(panel, 'hour', 0)).toBeFocused()
  await expect(option(panel, 'hour', 1)).toBeDisabled()
  await expect(option(panel, 'minute', 15)).toBeDisabled()
  await option(panel, 'hour', 0).press('ArrowRight')
  await expect(option(panel, 'minute', 30)).toBeFocused()
  const scroll = await page.evaluate(() => window.scrollY),
    top = (await panel.boundingBox())!.y
  await option(panel, 'minute', 30).press('ArrowDown')
  await expect(option(panel, 'minute', 45)).toBeFocused()
  const cell = (await option(panel, 'minute', 45).boundingBox())!
  expect(cell.width).toBeGreaterThanOrEqual(44)
  expect(cell.height).toBeGreaterThanOrEqual(44)
  await activate(option(panel, 'minute', 45), mobile)
  await expect(end).toHaveValue('2024-03-01 00:45')
  await expect(status).toHaveText(original)
  await expect(hidden).toHaveValue(original)
  await expect(
    demo.getByRole('status', { name: '日期时间范围失焦次数' }),
  ).toHaveText('0')
  expect(
    await input.evaluate(
      (element) => (element as HTMLInputElement).validity.customError,
    ),
  ).toBe(true)
  expect(Math.abs((await panel.boundingBox())!.y - top)).toBeLessThan(2)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await panel.screenshot({
    path: 'output/playwright/datetime-range-' + info.project.name + '.png',
  })
  await activate(confirm(panel), mobile)
  await expect(panel).toHaveCount(0)
  await expect(end).toBeFocused()
  await expect(status).toHaveText('["2024-02-29T23:30","2024-03-01T00:45"]')
  await expect(hidden).toHaveValue('["2024-02-29T23:30","2024-03-01T00:45"]')
})

test('second ranges enforce date-aware callbacks and clamp the final boundary time', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { input, panel } = await openRange(
    page,
    '秒精度跨午夜',
    '媒体结束日期时间',
  )
  await activate(part(panel), mobile)
  await expect(option(panel, 'second', 30)).toBeDisabled()
  await expect(option(panel, 'second', 45)).toHaveAccessibleName(
    '45秒，媒体标记',
  )
  await activate(option(panel, 'second', 45), mobile)
  await expect(input).toHaveValue('2024-03-01 00:30:45')
  await activate(option(panel, 'hour', 2), mobile)
  await expect(input).toHaveValue('2024-03-01 02:00:00')
  await expect(option(panel, 'hour', 3)).toBeDisabled()
  await expect(option(panel, 'minute', 1)).toBeDisabled()
  await expect(option(panel, 'second', 15)).toBeDisabled()
  await activate(confirm(panel), mobile)
  await expect(input).toHaveValue('2024-03-01 02:00:00')
})

test('crossed endpoints clear or sort, while locked endpoints retain their full date-time identity', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-'),
    demo = demoFor(page)
  let current = await openRange(
    page,
    '交叉清空日期时间范围',
    '交叉开始日期时间',
  )
  await activate(day(current.panel, '2024-03-02'), mobile)
  const end = demo.getByRole('combobox', {
    name: '交叉结束日期时间',
    exact: true,
  })
  await expect(end).toHaveValue('')
  await expect(confirm(current.panel)).toBeDisabled()
  await activate(
    current.panel.getByRole('button', { name: /^交叉结束日期时间：/ }),
    mobile,
  )
  await activate(day(current.panel, '2024-03-03'), mobile)
  await activate(confirm(current.panel), mobile)
  await expect(end).toHaveValue('2024-03-03 09:30')
  current = await openRange(page, '自动排序日期时间范围', '排序开始日期时间')
  await activate(day(current.panel, '2024-03-02'), mobile)
  await expect(current.input).toHaveValue('2024-03-02 09:30')
  await activate(confirm(current.panel), mobile)
  await expect(current.input).toHaveValue('2024-03-01 17:00')
  await expect(
    demo.getByRole('combobox', { name: '排序结束日期时间', exact: true }),
  ).toHaveValue('2024-03-02 09:30')
  current = await openRange(page, '锁定日期时间起点', '可编辑结束日期时间')
  await expect(
    current.panel.getByRole('button', { name: /^锁定开始日期时间：/ }),
  ).toBeDisabled()
  await activate(
    current.panel.getByRole('button', { name: '上个月', exact: true }),
    mobile,
  )
  await expect(day(current.panel, '2024-02-28')).toBeDisabled()
  await activate(day(current.panel, '2024-02-29'), mobile)
  await expect(current.input).toHaveValue('2024-02-29 23:30')
  await activate(part(current.panel), mobile)
  await expect(option(current.panel, 'hour', 22)).toBeDisabled()
  await expect(option(current.panel, 'minute', 15)).toBeDisabled()
  await activate(confirm(current.panel), mobile)
  await expect(
    demo.getByRole('combobox', { name: '锁定开始日期时间', exact: true }),
  ).toHaveValue('2024-02-29 23:30')
})

test('open intervals and immediate selections use per-endpoint default times', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-'),
    demo = demoFor(page)
  const { input, panel } = await openRange(
    page,
    '开放日期时间范围',
    '开放开始日期时间',
  )
  await expect(input).toHaveValue('')
  await expect(confirm(panel)).toBeDisabled()
  await activate(day(panel, '2024-02-29'), mobile)
  await expect(input).toHaveValue('2024-02-29 09:30')
  await activate(confirm(panel), mobile)
  await expect(
    demo.getByRole('combobox', { name: '开放结束日期时间', exact: true }),
  ).toHaveValue('')
  const ending = await openRange(page, '开放日期时间范围', '开放结束日期时间')
  await activate(day(ending.panel, '2024-03-01'), mobile)
  await expect(ending.input).toHaveValue('2024-03-01 17:00')
  await activate(confirm(ending.panel), mobile)
  const immediate = await openRange(
    page,
    '立即提交日期时间范围',
    '即时开始日期时间',
  )
  await activate(day(immediate.panel, '2024-02-29'), mobile)
  await activate(
    immediate.panel.getByRole('button', { name: /^即时结束日期时间：/ }),
    mobile,
  )
  await activate(day(immediate.panel, '2024-03-01'), mobile)
  await activate(part(immediate.panel), mobile)
  await activate(option(immediate.panel, 'hour', 18), mobile)
  await option(immediate.panel, 'hour', 18).press('Escape')
  await expect(immediate.input).toHaveValue('2024-02-29 09:30')
  await expect(
    demo.getByRole('combobox', { name: '即时结束日期时间', exact: true }),
  ).toHaveValue('2024-03-01 18:00')
})

test('manual drafts, presets, cancellation and controlled close preserve submitted ranges', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-'),
    demo = demoFor(page)
  const start = demo.getByRole('combobox', {
      name: '输入开始日期时间',
      exact: true,
    }),
    end = demo.getByRole('combobox', { name: '输入结束日期时间', exact: true })
  await start.fill('2024-02-30 10:45')
  await start.press('Enter')
  await expect(
    demo
      .getByRole('group', { name: '输入日期时间范围', exact: true })
      .getByRole('alert'),
  ).toContainText('请输入可选的日期时间范围')
  await demo
    .getByRole('textbox', { name: '日期时间范围之后的字段', exact: true })
    .focus()
  await expect(start).toHaveValue('2024-02-29 09:30')
  await start.fill('2024-02-29 10:45')
  await end.fill('2024-03-01T18:15')
  await end.press('Enter')
  await expect(start).toHaveValue('2024-02-29 10:45')
  await expect(end).toHaveValue('2024-03-01 18:15')
  const main = await openRange(page, '跨日预约范围', '预约开始日期时间')
  await activate(
    main.panel.getByRole('button', { name: '次日清晨范围', exact: true }),
    mobile,
  )
  await expect(main.input).toHaveValue('2024-03-01 00:00')
  await expect(
    demo.getByRole('status', { name: '日期时间范围提交值', exact: true }),
  ).toHaveText('["2024-02-29T23:30","2024-03-01T00:30"]')
  await main.input.press('Escape')
  await expect(main.input).toHaveValue('2024-02-29 23:30')
  await demo
    .getByRole('button', { name: '外部打开日期时间范围', exact: true })
    .click()
  const controlled = page.getByRole('dialog', {
    name: '外部控制日期时间范围选择面板',
  })
  await demo
    .getByRole('combobox', { name: '外部开始日期时间', exact: true })
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(controlled).toBeVisible()
  await activate(day(controlled, '2024-03-01'), mobile)
  await demo
    .getByRole('button', { name: '外部关闭日期时间范围', exact: true })
    .click()
  await expect(controlled).toHaveCount(0)
  await expect(
    demo.getByRole('combobox', { name: '外部开始日期时间', exact: true }),
  ).toHaveValue('2024-02-29 09:30')
})

test('12-hour dates change AM/PM without changing canonical endpoint dates', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { input, panel } = await openRange(
    page,
    '12 小时日期时间范围',
    '12 小时结束日期时间',
  )
  await activate(part(panel), mobile)
  await expect(option(panel, 'hour', 0)).toBeFocused()
  await activate(option(panel, 'meridiem', 1), mobile)
  await activate(confirm(panel), mobile)
  await expect(input).toHaveValue('2024-03-01 12:30 PM')
})

test('popup Tab and shift Tab continue through fields and cancel unconfirmed changes', async ({
  page,
}) => {
  await page.goto('/__ui')
  const { input, panel } = await openRange(
    page,
    '输入日期时间范围',
    '输入开始日期时间',
  )
  const first = panel.getByRole('button', { name: /^输入开始日期时间：/ })
  await first.focus()
  await first.press('Shift+Tab')
  await expect(input).toBeFocused()
  await expect(panel).toBeVisible()
  await input.press('ArrowDown')
  await day(panel, '2024-03-01').press('Enter')
  await confirm(panel).focus()
  await confirm(panel).press('Tab')
  await expect(panel).toHaveCount(0)
  await expect(input).toHaveValue('2024-02-29 09:30')
  await expect(
    demoFor(page).getByRole('button', {
      name: '清空输入结束日期时间',
      exact: true,
    }),
  ).toBeFocused()
})

test('narrow RTL panels keep 44px targets and local scroll, and dynamic changes preserve focus ownership', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-'),
    demo = demoFor(page)
  await demo
    .getByRole('button', { name: '使用 RTL 日期时间范围', exact: true })
    .click()
  const root = demo.getByRole('group', {
    name: '内嵌日期时间范围',
    exact: true,
  })
  await root.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(root).toHaveAttribute('dir', 'rtl')
  await expect(root.getByRole('grid')).toBeVisible()
  await expect(root.getByRole('listbox')).toHaveCount(0)
  await activate(
    root.getByRole('button', { name: /^内嵌结束日期时间：/ }),
    mobile,
  )
  await activate(part(root), mobile)
  await expect(root.getByRole('grid')).toHaveCount(0)
  const scroll = await page.evaluate(() => window.scrollY)
  await option(root, 'hour', 0).press('ArrowLeft')
  await expect(option(root, 'minute', 30)).toBeFocused()
  await option(root, 'minute', 30).press('End')
  await activate(option(root, 'minute', 45), mobile)
  const box = (await option(root, 'minute', 45).boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await root.screenshot({
    path:
      'output/playwright/datetime-range-narrow-rtl-' +
      info.project.name +
      '.png',
  })
  await activate(confirm(root), mobile)
  await expect(
    root.getByRole('textbox', { name: '内嵌结束日期时间', exact: true }),
  ).toHaveValue('2024-03-01 12:45:15 AM')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const dynamic = demo.getByRole('group', {
    name: '动态日期时间范围',
    exact: true,
  })
  await day(dynamic, '2024-02-29').focus()
  await demo
    .getByRole('button', { name: '停用范围开始端点', exact: true })
    .evaluate((element) => (element as HTMLButtonElement).click())
  await expect(day(dynamic, '2024-03-01')).toBeFocused()
  await activate(part(dynamic), mobile)
  await demo
    .getByRole('button', { name: '停用日期时间范围选项', exact: true })
    .press('Enter')
  await expect(dynamic.getByRole('option')).toHaveCount(0)
  await expect(
    demo.getByRole('button', { name: '恢复日期时间范围选项', exact: true }),
  ).toBeFocused()
})

test('Form range validation, confirmed JSON values and external native resets cooperate', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const mobile = info.project.name.startsWith('mobile-')
  const { demo, input, panel } = await openRange(
    page,
    '日期时间范围表单',
    '表单结束日期时间',
  )
  await activate(day(panel, '2024-03-02'), mobile)
  expect(
    await input.evaluate((element) =>
      String(new FormData((element as HTMLInputElement).form!).get('range')),
    ),
  ).toBe('["2024-02-29T09:30","2024-03-01T17:00"]')
  expect(
    await input.evaluate((element) =>
      (element as HTMLInputElement).checkValidity(),
    ),
  ).toBe(false)
  await activate(part(panel), mobile)
  await activate(option(panel, 'hour', 16), mobile)
  await activate(confirm(panel), mobile)
  await demo
    .getByRole('button', { name: '提交日期时间范围表单', exact: true })
    .click()
  await expect(
    demo.getByRole('status', { name: '日期时间范围表单结果' }),
  ).toHaveText('预约范围：["2024-02-29T09:30","2024-03-02T16:00"]')
  await demo
    .getByRole('button', { name: '重置日期时间范围表单', exact: true })
    .click()
  await expect(input).toHaveValue('2024-03-01 17:00')
  await demo
    .getByRole('button', { name: '清空表单结束日期时间', exact: true })
    .click()
  await demo
    .getByRole('button', { name: '提交日期时间范围表单', exact: true })
    .click()
  await expect(
    demo.getByText('请选择完整日期时间范围', { exact: true }),
  ).toBeVisible()
  const native = demo.getByLabel('原生结束日期时间', { exact: true })
  await native.fill('2024-03-01T01:00')
  await demo
    .getByRole('button', { name: '提交原生日期时间范围', exact: true })
    .click()
  await expect(
    demo.getByRole('status', { name: '原生日期时间范围结果' }),
  ).toHaveText('["2024-02-29T23:30:15","2024-03-01T01:00:00"]')
  await demo
    .getByRole('button', { name: '重置原生日期时间范围', exact: true })
    .click()
  await expect(native).toHaveValue('2024-03-01T00:30:15')
})

test('all logical popup placements fit narrow viewports and retain visible date navigation', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const demo = demoFor(page)
  if (!info.project.name.startsWith('mobile-'))
    await page.setViewportSize({ width: 360, height: 740 })
  await demo
    .getByRole('button', { name: '使用 RTL 日期时间范围', exact: true })
    .click()
  for (const placement of ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']) {
    await demo
      .getByLabel('日期时间范围弹出位置', { exact: true })
      .selectOption(placement)
    const { input, panel } = await openRange(
      page,
      '跨日预约范围',
      '预约开始日期时间',
    )
    const box = (await panel.boundingBox())!,
      viewport = page.viewportSize()!
    expect(box.x).toBeGreaterThanOrEqual(7)
    expect(box.y).toBeGreaterThanOrEqual(7)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 7)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 7)
    await expect(panel.getByRole('grid')).toBeVisible()
    await expect(panel.getByRole('listbox')).toHaveCount(0)
    await input.press('Escape')
  }
})

test('resizing restores focus from a newly hidden range time panel', async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith('mobile-'),
    'desktop wide-to-narrow transition',
  )
  await page.goto('/__ui')
  const root = demoFor(page).getByRole('group', {
    name: '响应式日期时间范围',
    exact: true,
  })
  await expect(root.getByRole('grid')).toBeVisible()
  await expect(root.getByRole('listbox')).toHaveCount(2)
  await option(root, 'hour', 9).focus()
  await page.setViewportSize({ width: 360, height: 740 })
  await expect(root.locator('[data-calendar-date][tabindex="0"]')).toBeFocused()
  await expect(root.getByRole('listbox')).toHaveCount(0)
})
