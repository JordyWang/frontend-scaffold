import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('date picker browses across leap months without committing and restores field focus after selection', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期选择面板预览' })
  const field = demo.getByRole('combobox', { name: '项目日期', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const before = await page.evaluate(() => window.scrollY)
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '项目日期选择面板' })
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  await leap.press('ArrowRight')
  const march = popup.locator('[data-calendar-date="2024-03-01"]')
  await expect(march).toBeFocused()
  await expect(demo.getByRole('status', { name: '项目日期值' })).toHaveText(
    '2024-02-29',
  )
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThan(2)
  const box = (await march.boundingBox())!
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.width).toBeGreaterThanOrEqual(44)
  await popup.screenshot({
    path:
      'output/playwright/date-picker-leap-' + testInfo.project.name + '.png',
  })
  await activate(march, mobile)
  await expect(popup).toHaveCount(0)
  await expect(field).toBeFocused()
  await expect(demo.getByRole('status', { name: '项目日期值' })).toHaveText(
    '2024-03-01',
  )
  await field.press('Tab')
  await expect(demo.getByRole('button', { name: '清空项目日期' })).toBeFocused()
  await activate(demo.getByRole('button', { name: '清空项目日期' }), mobile)
  await expect(field).toBeFocused()
  await expect(demo.getByRole('status', { name: '项目日期值' })).toHaveText(
    '未选择',
  )
})

test('date picker pending confirmation survives browsing and can be cancelled or confirmed with touch and Tab', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期选择面板预览' })
  const field = demo.getByRole('combobox', { name: '确认日期', exact: true })
  await field.scrollIntoViewIfNeeded()
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '确认日期选择面板' })
  await expect(
    popup.locator('[data-calendar-date="2024-02-12"]'),
  ).toBeDisabled()
  await expect(popup.getByRole('button', { name: '不可选预设' })).toBeDisabled()
  await activate(popup.locator('[data-calendar-date="2024-02-14"]'), mobile)
  await expect(field).toHaveValue('2024-02-14')
  await expect(demo.getByRole('status', { name: '确认日期值' })).toHaveText(
    '2024-02-10',
  )
  if (mobile) await field.tap()
  else await field.click()
  await expect(field).toHaveValue('2024-02-14')
  await popup.locator('[data-calendar-date="2024-02-14"]').press('Escape')
  await expect(field).toHaveValue('2024-02-10')
  await expect(field).toBeFocused()
  await field.press('ArrowDown')
  await activate(popup.getByRole('button', { name: '本月闰日' }), mobile)
  await expect(field).toHaveValue('2024-02-29')
  await expect(demo.getByRole('status', { name: '确认日期值' })).toHaveText(
    '2024-02-10',
  )
  const selected = popup.locator('[data-calendar-date="2024-02-29"]')
  await selected.focus()
  await selected.press('Tab')
  await expect(
    popup.getByRole('button', { name: '取消', exact: true }),
  ).toBeFocused()
  await popup.getByRole('button', { name: '取消', exact: true }).press('Tab')
  await expect(
    popup.getByRole('button', { name: '确定', exact: true }),
  ).toBeFocused()
  await activate(
    popup.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(popup).toHaveCount(0)
  await expect(field).toBeFocused()
  await expect(demo.getByRole('status', { name: '确认日期值' })).toHaveText(
    '2024-02-29',
  )
})

test('date picker rejects invalid input and dates outside its availability rules', async ({
  page,
}) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期选择面板预览' })
  const field = demo.getByRole('combobox', { name: '输入日期', exact: true })
  for (const value of ['2023-02-29', '2024-02-12', '2024-03-01']) {
    await field.fill(value)
    await field.press('Enter')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(
      demo.getByText('请输入可选日期（YYYY-MM-DD）', { exact: true }),
    ).toBeVisible()
  }
  await field.fill('2024-02-29')
  await field.press('Enter')
  await expect(field).toHaveValue('2024-02-29')
  await expect(field).not.toHaveAttribute('aria-invalid', 'true')
  await field.fill('invalid')
  await demo.getByRole('textbox', { name: '日期之后的输入' }).focus()
  await expect(field).toHaveValue('2024-02-29')
  await expect(
    demo.getByText('日期不可选，已恢复原日期', { exact: true }),
  ).toBeVisible()
})

test('date picker positions in narrow RTL viewports and protects disabled panels', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期选择面板预览' })
  await activate(demo.getByRole('button', { name: '使用 RTL 日期' }), mobile)
  await page.setViewportSize({ width: 360, height: 780 })
  const field = demo.getByRole('combobox', { name: '项目日期', exact: true })
  await demo.getByLabel('日期弹出位置').selectOption('topEnd')
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '项目日期选择面板' })
  await expect(popup).toHaveAttribute('dir', 'rtl')
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  await leap.press('ArrowLeft')
  await expect(popup.locator('[data-calendar-date="2024-03-01"]')).toBeFocused()
  const bounds = (await popup.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(773)
  await popup.screenshot({
    path: 'output/playwright/date-picker-rtl-' + testInfo.project.name + '.png',
  })
  await popup.locator('[data-calendar-date="2024-03-01"]').press('Escape')
  await activate(demo.getByRole('button', { name: '禁用日期面板' }), mobile)
  await expect(field).toBeDisabled()
  await expect(
    demo.getByRole('textbox', { name: '内嵌日期', exact: true }),
  ).toBeDisabled()
  await expect(
    demo.locator('[data-calendar-date="2024-02-10"]').first(),
  ).toBeDisabled()
  await activate(demo.getByRole('button', { name: '启用日期面板' }), mobile)
  await expect(popup).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('date picker project form validates a cleared date, selects from the panel and restores its initial date', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期选择面板预览' })
  const field = demo.getByRole('combobox', {
    name: '表单预约日期',
    exact: true,
  })
  await activate(demo.getByRole('button', { name: '清空表单预约日期' }), mobile)
  await field.scrollIntoViewIfNeeded()
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '表单预约日期选择面板' })
  await expect(popup.locator('[data-calendar-date="2024-02-01"]')).toBeFocused()
  await expect(
    demo.getByText('请选择表单预约日期', { exact: true }),
  ).toHaveCount(0)
  await popup.locator('[data-calendar-date="2024-02-01"]').press('Shift+Tab')
  await expect(
    popup.getByRole('button', { name: '下个月', exact: true }),
  ).toBeFocused()
  await expect(
    demo.getByText('请选择表单预约日期', { exact: true }),
  ).toHaveCount(0)
  await popup
    .getByRole('button', { name: '下个月', exact: true })
    .press('Escape')
  await field.press('Tab')
  const toggle = demo.getByRole('button', { name: '打开表单预约日期面板' })
  await expect(toggle).toBeFocused()
  await expect(
    demo.getByText('请选择表单预约日期', { exact: true }),
  ).toHaveCount(0)
  await toggle.press('Tab')
  await expect(
    demo.getByText('请选择表单预约日期', { exact: true }),
  ).toBeVisible()
  await activate(demo.getByRole('button', { name: '提交日期预约' }), mobile)
  await expect(
    demo.getByText('请选择表单预约日期', { exact: true }),
  ).toBeVisible()
  await field.press('ArrowDown')
  await activate(popup.locator('[data-calendar-date="2024-02-14"]'), mobile)
  await activate(demo.getByRole('button', { name: '提交日期预约' }), mobile)
  await expect(demo.getByRole('status', { name: '日期表单结果' })).toHaveText(
    '预约：2024-02-14',
  )
  await activate(demo.getByRole('button', { name: '重置日期预约' }), mobile)
  await expect(field).toHaveValue('2024-02-10')
})
