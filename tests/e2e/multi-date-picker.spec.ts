import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('multiple dates browse and toggle across leap months, preserve page scroll and commit on composite blur', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const field = demo.getByRole('combobox', { name: '多选日程', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const scroll = await page.evaluate(() => window.scrollY)
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '多选日程选择面板' })
  await expect(popup.getByRole('grid')).toHaveAttribute(
    'aria-multiselectable',
    'true',
  )
  const day = popup.locator('[data-calendar-date="2024-02-28"]')
  await expect(day).toBeFocused()
  await day.press('ArrowRight')
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  const box = (await leap.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(leap, mobile)
  await expect(leap.locator('..')).toHaveAttribute('aria-selected', 'true')
  await leap.press('ArrowRight')
  const march = popup.locator('[data-calendar-date="2024-03-01"]')
  await expect(march).toBeFocused()
  await activate(march, mobile)
  await expect(demo.getByRole('status', { name: '多日期提交值' })).toHaveText(
    '2024-02-28',
  )
  await expect(demo.getByRole('status', { name: '多日期临时选择' })).toHaveText(
    '2024-02-28、2024-02-29、2024-03-01',
  )
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await popup.screenshot({
    path: 'output/playwright/multiple-dates-' + testInfo.project.name + '.png',
  })
  await demo
    .getByRole('textbox', { name: '多日期之后的输入', exact: true })
    .focus()
  await expect(popup).toHaveCount(0)
  await expect(demo.getByRole('status', { name: '多日期提交值' })).toHaveText(
    '2024-02-28、2024-02-29、2024-03-01',
  )
})

test('multiple date confirmation keeps presets pending and handles Escape, reverse Tab and forward footer Tab', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const field = demo.getByRole('combobox', { name: '确认多日期', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '确认多日期选择面板' })
  const preset = popup.getByRole('button', {
    name: '闰月多个日期',
    exact: true,
  })
  await expect(
    popup.getByRole('button', { name: '禁选日期集合', exact: true }),
  ).toBeDisabled()
  await expect(
    popup.locator('[data-calendar-date="2024-02-12"]'),
  ).toBeDisabled()
  await activate(preset, mobile)
  await expect(demo.getByRole('status', { name: '确认多日期值' })).toHaveText(
    '2024-02-10、2024-02-14',
  )
  await preset.press('Escape')
  await expect(field).toBeFocused()
  await field.press('ArrowDown')
  await activate(preset, mobile)
  await preset.press('Shift+Tab')
  await expect(field).toBeFocused()
  await expect(popup).toBeVisible()
  const confirm = popup.getByRole('button', { name: '确定', exact: true })
  await confirm.focus()
  await confirm.press('Tab')
  await expect(popup).toHaveCount(0)
  await expect(
    demo.getByRole('button', { name: '清空确认多日期', exact: true }),
  ).toBeFocused()
  await expect(demo.getByRole('status', { name: '确认多日期值' })).toHaveText(
    '2024-02-10、2024-02-14',
  )
  await field.press('ArrowDown')
  await activate(preset, mobile)
  await activate(confirm, mobile)
  await expect(field).toBeFocused()
  await expect(demo.getByRole('status', { name: '确认多日期值' })).toHaveText(
    '2024-02-29、2024-03-02',
  )
})

test('multiple date input deduplicates additions, rejects invalid dates and restores the committed selection', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const field = demo.getByRole('combobox', {
    name: '输入多个日期',
    exact: true,
  })
  const root = demo.locator('[data-datepicker-multiple]').filter({
    has: page.getByRole('combobox', { name: '输入多个日期', exact: true }),
  })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  for (const date of ['2024-02-29', '2024-02-29']) {
    await field.fill(date)
    await field.press('Enter')
  }
  await expect(root.getByRole('button', { name: /移除日期/ })).toHaveCount(2)
  const popup = page.getByRole('dialog', { name: '输入多个日期选择面板' })
  await activate(
    popup.getByRole('button', { name: '完成', exact: true }),
    mobile,
  )
  for (const invalid of ['2023-02-29', '2024-02-12', '2024-04-01']) {
    await field.fill(invalid)
    await field.press('Enter')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(root.getByRole('alert')).toHaveText(
      '请输入可选日期（YYYY-MM-DD）',
    )
  }
  await demo
    .getByRole('textbox', { name: '多日期之后的输入', exact: true })
    .focus()
  await expect(field).toHaveValue('')
  await expect(root.getByRole('alert')).toHaveText('日期不可选，已恢复已选日期')
  await expect(
    root.getByRole('button', { name: '移除日期 2024-02-29' }),
  ).toBeVisible()
})

test('multiple date tags expand and remove with touch and Backspace within a narrow container', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  await page.setViewportSize({ width: 360, height: 780 })
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const field = demo.getByRole('combobox', {
    name: '折叠日期标签',
    exact: true,
  })
  const root = demo.locator('[data-datepicker-multiple]').filter({
    has: page.getByRole('combobox', { name: '折叠日期标签', exact: true }),
  })
  await activate(
    root.getByRole('button', { name: '另外 4 个日期', exact: true }),
    mobile,
  )
  const remove = root.getByRole('button', {
    name: '移除日期 2024-02-14',
    exact: true,
  })
  const box = (await remove.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(remove, mobile)
  await expect(field).toBeFocused()
  await expect(root.getByRole('button', { name: /移除日期/ })).toHaveCount(4)
  await field.press('Backspace')
  await expect(
    root.getByRole('button', { name: '移除日期 2024-02-29' }),
  ).toHaveCount(0)
  await activate(
    root.getByRole('button', { name: '清空折叠日期标签', exact: true }),
    mobile,
  )
  await expect(root.getByRole('list')).toHaveCount(0)
  await expect(field).toBeFocused()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('multiple date panels respect count limits, RTL viewport placement and disabled or readonly controls', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const limit = demo.getByRole('combobox', {
    name: '最多两个日期',
    exact: true,
  })
  await limit.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await limit.press('ArrowDown')
  const limited = page.getByRole('dialog', { name: '最多两个日期选择面板' })
  await activate(limited.locator('[data-calendar-date="2024-02-10"]'), mobile)
  await activate(limited.locator('[data-calendar-date="2024-02-14"]'), mobile)
  await expect(
    limited.locator('[data-calendar-date="2024-02-15"]'),
  ).toBeDisabled()
  await activate(limited.locator('[data-calendar-date="2024-02-10"]'), mobile)
  await expect(
    limited.locator('[data-calendar-date="2024-02-15"]'),
  ).toBeEnabled()
  await limited.locator('[data-calendar-date="2024-02-14"]').press('Escape')
  await activate(
    demo.getByRole('button', { name: '使用 RTL 多选日期', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await demo.getByLabel('多日期弹出位置').selectOption('topEnd')
  const field = demo.getByRole('combobox', { name: '多选日程', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '多选日程选择面板' })
  await expect(popup).toHaveAttribute('dir', 'rtl')
  await popup.locator('[data-calendar-date="2024-02-28"]').press('ArrowLeft')
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  const bounds = (await popup.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await popup.screenshot({
    path:
      'output/playwright/multiple-dates-rtl-' + testInfo.project.name + '.png',
  })
  await leap.press('Escape')
  await activate(
    demo.getByRole('button', { name: '外部打开多日期', exact: true }),
    mobile,
  )
  const external = page.getByRole('dialog', { name: '外部开合多日期选择面板' })
  await demo
    .getByRole('combobox', { name: '外部开合多日期', exact: true })
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(external).toBeVisible()
  await external.locator('[data-calendar-date="2024-02-14"]').press('Escape')
  await expect(external).toHaveCount(0)
  await activate(
    demo.getByRole('button', { name: '禁用日期多选', exact: true }),
    mobile,
  )
  await expect(field).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '打开多选日程面板', exact: true }),
  ).toBeDisabled()
  await demo
    .getByRole('combobox', { name: '只读多日期', exact: true })
    .press('ArrowDown')
  await expect(
    page.getByRole('dialog', { name: '只读多日期选择面板' }),
  ).toHaveCount(0)
})

test('multiple date form defers errors until composite blur, submits pending selection once and resets', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期多选预览' })
  const field = demo.getByRole('combobox', { name: '多日期表单', exact: true })
  await activate(
    demo.getByRole('button', { name: '清空多日期表单', exact: true }),
    mobile,
  )
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '多日期表单选择面板' })
  await expect(
    demo.getByText('请选择至少一个日程日期', { exact: true }),
  ).toHaveCount(0)
  await activate(popup.locator('[data-calendar-date="2024-02-29"]'), mobile)
  await expect(
    demo.getByText('请选择至少一个日程日期', { exact: true }),
  ).toHaveCount(0)
  await activate(
    demo.getByRole('button', { name: '提交多日期表单', exact: true }),
    mobile,
  )
  await expect(popup).toHaveCount(0)
  await expect(demo.getByRole('status', { name: '多日期表单结果' })).toHaveText(
    '日程：2024-02-29',
  )
  await activate(
    demo.getByRole('button', { name: '重置多日期表单', exact: true }),
    mobile,
  )
  const root = demo.locator('[data-datepicker-multiple]').filter({
    has: page.getByRole('combobox', { name: '多日期表单', exact: true }),
  })
  await expect(
    root.getByRole('button', { name: '移除日期 2024-02-10', exact: true }),
  ).toBeVisible()
  await expect(
    root.getByRole('button', { name: '移除日期 2024-02-29', exact: true }),
  ).toHaveCount(0)
})
