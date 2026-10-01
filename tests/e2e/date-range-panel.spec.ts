import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('range panel browses leap months, previews both endpoints and commits a complete range', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  const start = demo.getByRole('combobox', { name: '行程开始', exact: true })
  const end = demo.getByRole('combobox', { name: '行程结束', exact: true })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const scroll = await page.evaluate(() => window.scrollY)
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '行程范围选择面板' })
  await expect(popup.getByRole('grid')).toHaveCount(mobile ? 1 : 2)
  const day = popup.locator('[data-calendar-date="2024-02-28"]')
  await expect(day).toBeFocused()
  const box = (await day.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await day.press('ArrowRight')
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  await expect(leap).toHaveAttribute('data-calendar-preview')
  await expect(demo.getByRole('status', { name: '行程范围值' })).toHaveText(
    '2024-02-28 → 2024-03-02',
  )
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(2)
  await popup.screenshot({
    path: 'output/playwright/range-leap-' + testInfo.project.name + '.png',
  })
  await activate(leap, mobile)
  await expect(start).toHaveValue('2024-02-29')
  await expect(end).toHaveAttribute('aria-expanded', 'true')
  await expect(demo.getByRole('status', { name: '行程范围值' })).toHaveText(
    '2024-02-28 → 2024-03-02',
  )
  await expect(popup.locator('[data-calendar-date="2024-03-02"]')).toBeFocused()
  await activate(popup.locator('[data-calendar-date="2024-03-03"]'), mobile)
  await expect(popup).toHaveCount(0)
  await expect(end).toBeFocused()
  await expect(demo.getByRole('status', { name: '行程范围值' })).toHaveText(
    '2024-02-29 → 2024-03-03',
  )
})

test('range confirmation keeps presets pending, supports cancellation and the footer Tab order', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  const start = demo.getByRole('combobox', { name: '确认开始', exact: true })
  const end = demo.getByRole('combobox', { name: '确认结束', exact: true })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '确认范围选择面板' })
  await expect(
    popup.getByRole('button', { name: '不可选范围', exact: true }),
  ).toBeDisabled()
  await expect(
    popup.locator('[data-calendar-date="2024-02-12"]'),
  ).toBeDisabled()
  await activate(
    popup.getByRole('button', { name: '闰月预设范围', exact: true }),
    mobile,
  )
  await expect(start).toHaveValue('2024-02-28')
  await expect(end).toHaveValue('2024-03-02')
  await expect(demo.getByRole('status', { name: '确认范围值' })).toHaveText(
    '2024-02-10 → 2024-02-14',
  )
  await popup.locator('[data-calendar-date="2024-02-28"]').press('Escape')
  await expect(start).toHaveValue('2024-02-10')
  await expect(start).toBeFocused()
  await start.press('ArrowDown')
  await activate(
    popup.getByRole('button', { name: '闰月预设范围', exact: true }),
    mobile,
  )
  await popup.getByRole('button', { name: '取消', exact: true }).focus()
  await popup.getByRole('button', { name: '取消', exact: true }).press('Tab')
  const confirm = popup.getByRole('button', { name: '确定', exact: true })
  await expect(confirm).toBeFocused()
  await activate(confirm, mobile)
  await expect(popup).toHaveCount(0)
  await expect(demo.getByRole('status', { name: '确认范围值' })).toHaveText(
    '2024-02-28 → 2024-03-02',
  )
})

test('range input commits ordered ISO dates and restores rejected input with visible feedback', async ({
  page,
}) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  const start = demo.getByRole('combobox', { name: '输入开始', exact: true })
  const end = demo.getByRole('combobox', { name: '输入结束', exact: true })
  await start.fill('2024-02-20')
  await start.press('Enter')
  await expect(end).toHaveValue('')
  await end.fill('2024-02-29')
  await end.press('Enter')
  for (const invalid of ['2023-02-29', '2024-02-12', '2024-04-01']) {
    await start.fill(invalid)
    await start.press('Enter')
    await expect(start).toHaveAttribute('aria-invalid', 'true')
    await expect(
      demo.getByText('请输入可选的日期范围（YYYY-MM-DD）', { exact: true }),
    ).toBeVisible()
  }
  await demo.getByRole('textbox', { name: '范围之后的输入' }).focus()
  await expect(start).toHaveValue('2024-02-20')
  await expect(end).toHaveValue('2024-02-29')
  await expect(
    demo.getByText('日期范围不可选，已恢复原范围', { exact: true }),
  ).toBeVisible()
})

test('range panel fits narrow RTL viewports and keeps disabled endpoints protected', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 范围', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await demo.getByLabel('范围弹出位置').selectOption('topEnd')
  const start = demo.getByRole('combobox', { name: '行程开始', exact: true })
  const end = demo.getByRole('combobox', { name: '行程结束', exact: true })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const first = (await start.boundingBox())!,
    last = (await end.boundingBox())!
  expect(last.y).toBeGreaterThan(first.y)
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '行程范围选择面板' })
  await expect(popup).toHaveAttribute('dir', 'rtl')
  await expect(popup.getByRole('grid')).toHaveCount(1)
  await popup.locator('[data-calendar-date="2024-02-28"]').press('ArrowLeft')
  const leap = popup.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  const bounds = (await popup.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await popup.screenshot({
    path: 'output/playwright/range-rtl-' + testInfo.project.name + '.png',
  })
  await leap.press('Escape')
  await activate(
    demo.getByRole('button', { name: '禁用范围面板', exact: true }),
    mobile,
  )
  await expect(start).toBeDisabled()
  await expect(end).toBeDisabled()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('range panel respects locked starts, dynamic availability and explicit open intervals', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  const locked = demo.getByRole('combobox', { name: '锁定开始', exact: true })
  const end = demo.getByRole('combobox', { name: '可选结束', exact: true })
  await expect(locked).toBeDisabled()
  await end.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await end.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '锁定开始范围选择面板' })
  await expect(
    popup.locator('[data-calendar-date="2024-03-08"]'),
  ).toBeDisabled()
  await activate(popup.locator('[data-calendar-date="2024-03-05"]'), mobile)
  await expect(locked).toHaveValue('2024-02-28')
  await expect(end).toHaveValue('2024-03-05')
  const optional = demo.getByRole('combobox', { name: '开放开始', exact: true })
  await optional.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await optional.press('ArrowDown')
  const interval = page.getByRole('dialog', { name: '开放日期范围选择面板' })
  await activate(interval.locator('[data-calendar-date="2024-02-28"]'), mobile)
  await activate(
    interval.getByRole('button', { name: '应用范围', exact: true }),
    mobile,
  )
  await expect(interval).toHaveCount(0)
  await expect(optional).toHaveValue('2024-02-28')
  await expect(
    demo.getByRole('combobox', { name: '开放结束', exact: true }),
  ).toHaveValue('')
})

test('range form validates composite blur and resets its completed tuple', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期范围面板预览' })
  const start = demo.getByRole('combobox', { name: '预约开始', exact: true })
  const end = demo.getByRole('combobox', { name: '预约结束', exact: true })
  await activate(
    demo.getByRole('button', { name: '清空预约开始', exact: true }),
    mobile,
  )
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '范围预约选择面板' })
  await expect(
    demo.getByText('请选择完整预约范围', { exact: true }),
  ).toHaveCount(0)
  await activate(popup.locator('[data-calendar-date="2024-02-28"]'), mobile)
  await expect(
    demo.getByText('请选择完整预约范围', { exact: true }),
  ).toHaveCount(0)
  await activate(popup.locator('[data-calendar-date="2024-03-03"]'), mobile)
  await activate(
    demo.getByRole('button', { name: '提交范围预约', exact: true }),
    mobile,
  )
  await expect(demo.getByRole('status', { name: '范围预约结果' })).toHaveText(
    '预约：2024-02-28 → 2024-03-03',
  )
  await activate(
    demo.getByRole('button', { name: '重置范围预约', exact: true }),
    mobile,
  )
  await expect(start).toHaveValue('2024-02-28')
  await expect(end).toHaveValue('2024-03-02')
})
