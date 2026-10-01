import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

for (const [label, start, next, key, status] of [
  ['跨年周', '2020-W53', '2021-W01', 'ArrowDown', '跨年周提交值'],
  ['结算月份', '2024-02', '2024-04', 'ArrowRight', '月份提交值'],
  ['确认季度', '2024-Q1', '2024-Q2', 'ArrowRight', '季度提交值'],
  ['报告年份', '2024', '2025', 'ArrowRight', '年份提交值'],
]) {
  test(
    'date unit ' +
      label +
      ' keeps browsing separate from selection and supports keyboard and touch',
    async ({ page }, testInfo) => {
      await page.goto('/__ui')
      const mobile = testInfo.project.name.startsWith('mobile-')
      const demo = page.getByRole('region', { name: '日期单位预览' })
      const field = demo.getByRole('combobox', { name: label, exact: true })
      await field.evaluate((element) =>
        element.scrollIntoView({ block: 'center' }),
      )
      const scroll = await page.evaluate(() => window.scrollY)
      await field.press('ArrowDown')
      const popup = page.getByRole('dialog', { name: label + '选择面板' })
      const initial = popup.locator('[data-picker-value="' + start + '"]')
      await expect(initial).toBeFocused()
      await initial.press(key)
      const target = popup.locator('[data-picker-value="' + next + '"]')
      await expect(target).toBeFocused()
      await expect(
        demo.getByRole('status', { name: status, exact: true }),
      ).toHaveText(start)
      expect(
        Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
      ).toBeLessThan(2)
      const box = (await target.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      await activate(target, mobile)
      if (label === '确认季度') {
        await expect(
          demo.getByRole('status', { name: status, exact: true }),
        ).toHaveText(start)
        await activate(
          popup.getByRole('button', { name: '确定', exact: true }),
          mobile,
        )
      }
      await expect(popup).toHaveCount(0)
      await expect(field).toBeFocused()
      await expect(
        demo.getByRole('status', { name: status, exact: true }),
      ).toHaveText(next)
    },
  )
}

test('date unit hierarchy browses decades and years without submitting a month', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  const field = demo.getByRole('combobox', { name: '结算月份', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '结算月份选择面板' })
  await activate(
    popup.getByRole('button', { name: '浏览2024年', exact: true }),
    mobile,
  )
  await expect(popup.locator('[data-picker-value="2024"]')).toBeFocused()
  await activate(
    popup.getByRole('button', { name: '浏览2020–2029', exact: true }),
    mobile,
  )
  await expect(popup.locator('[data-picker-value="2030"]')).toBeDisabled()
  await activate(popup.locator('[data-picker-value="2020"]'), mobile)
  await activate(popup.locator('[data-picker-value="2026"]'), mobile)
  await expect(
    demo.getByRole('status', { name: '月份提交值', exact: true }),
  ).toHaveText('2024-02')
  await popup.screenshot({
    path:
      'output/playwright/date-units-month-' + testInfo.project.name + '.png',
  })
  await page.screenshot({
    path:
      'output/playwright/date-units-context-' + testInfo.project.name + '.png',
  })
  await activate(popup.locator('[data-picker-value="2026-06"]'), mobile)
  await expect(field).toHaveValue('2026-06')
  await expect(field).toBeFocused()
})

test('date unit multiple months defer presets, cancel with Escape and Tab then confirm and remove tags', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  const field = demo.getByRole('combobox', { name: '多个结算月', exact: true })
  const root = demo.locator('[data-datepicker-multiple]').filter({
    has: page.getByRole('combobox', { name: '多个结算月', exact: true }),
  })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '多个结算月选择面板' })
  const preset = popup.getByRole('button', { name: '夏季月份', exact: true })
  await activate(preset, mobile)
  await expect(popup.getByRole('grid')).toHaveAttribute(
    'aria-multiselectable',
    'true',
  )
  await expect(popup.locator('[data-picker-value="2024-09"]')).toBeDisabled()
  await expect(
    popup.locator('[data-picker-value="2024-06"]').locator('..'),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(
    demo.getByRole('status', { name: '多个结算月提交值', exact: true }),
  ).toHaveText('2024-02、2024-05')
  await preset.press('Shift+Tab')
  await expect(field).toBeFocused()
  await expect(popup).toBeVisible()
  const confirm = popup.getByRole('button', { name: '确定', exact: true })
  await confirm.focus()
  await confirm.press('Tab')
  await expect(popup).toHaveCount(0)
  await expect(
    demo.getByRole('status', { name: '多个结算月提交值', exact: true }),
  ).toHaveText('2024-02、2024-05')
  await field.press('ArrowDown')
  await activate(preset, mobile)
  await preset.press('Escape')
  await expect(field).toBeFocused()
  await expect(popup).toHaveCount(0)
  await field.press('ArrowDown')
  await activate(preset, mobile)
  await activate(confirm, mobile)
  await expect(
    demo.getByRole('status', { name: '多个结算月提交值', exact: true }),
  ).toHaveText('2024-06、2024-07、2024-08')
  await activate(
    root.getByRole('button', { name: '另外 2 项', exact: true }),
    mobile,
  )
  const remove = root.getByRole('button', {
    name: '移除月份 2024-07',
    exact: true,
  })
  const box = (await remove.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(remove, mobile)
  await expect(field).toBeFocused()
  await field.press('Backspace')
  await expect(
    demo.getByRole('status', { name: '多个结算月提交值', exact: true }),
  ).toHaveText('2024-06')
})

test('date unit multiple weeks quarters and years toggle with touch before committing the collection', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  for (const [label, next] of [
    ['多个跨年周', '2021-W01'],
    ['多个发布季度', '2024-Q2'],
    ['多个报告年份', '2026'],
  ]) {
    const field = demo.getByRole('combobox', { name: label, exact: true })
    await field.evaluate((element) =>
      element.scrollIntoView({ block: 'center' }),
    )
    await field.press('ArrowDown')
    const popup = page.getByRole('dialog', { name: label + '选择面板' })
    const target = popup.locator('[data-picker-value="' + next + '"]')
    await activate(target, mobile)
    await expect(target.locator('..')).toHaveAttribute('aria-selected', 'true')
    await activate(target, mobile)
    await expect(target.locator('..')).toHaveAttribute('aria-selected', 'false')
    await activate(target, mobile)
    await activate(
      popup.getByRole('button', { name: '完成', exact: true }),
      mobile,
    )
    const root = demo.locator('[data-datepicker-multiple]').filter({
      has: page.getByRole('combobox', { name: label, exact: true }),
    })
    await expect(root.getByRole('list')).toContainText(next)
    await expect(popup).toHaveCount(0)
    await expect(field).toBeFocused()
  }
})

test('date unit typed month rejects invalid or off-step values and resets a required project form', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  const field = demo.getByRole('combobox', { name: '输入月份', exact: true })
  const root = demo.locator('[data-datepicker-unit="month"]').filter({
    has: page.getByRole('combobox', { name: '输入月份', exact: true }),
  })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  for (const invalid of ['2024-13', '2024-02', '2025-01']) {
    await field.fill(invalid)
    await field.press('Enter')
    await expect(root.getByRole('alert')).toHaveText(
      '请输入可选日期（YYYY-MM）',
    )
  }
  await demo
    .getByRole('textbox', { name: '输入之后的字段', exact: true })
    .focus()
  await expect(field).toHaveValue('2024-01')
  await expect(root.getByRole('alert')).toHaveText('日期不可选，已恢复原日期')
  await field.fill('2024-07')
  await field.press('Enter')
  await expect(field).toHaveValue('2024-07')
  const formField = demo.getByRole('combobox', {
    name: '月份表单',
    exact: true,
  })
  await activate(
    demo.getByRole('button', { name: '清空月份表单', exact: true }),
    mobile,
  )
  await formField.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await formField.press('ArrowDown')
  await expect(demo.getByText('请选择结算月份', { exact: true })).toHaveCount(0)
  const popup = page.getByRole('dialog', { name: '月份表单选择面板' })
  await activate(popup.locator('[data-picker-value="2024-06"]'), mobile)
  await activate(
    demo.getByRole('button', { name: '提交月份表单', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '月份表单结果', exact: true }),
  ).toHaveText('结算月：2024-06')
  await activate(
    demo.getByRole('button', { name: '重置月份表单', exact: true }),
    mobile,
  )
  await expect(formField).toHaveValue('2024-02')
})

test('date unit controlled confirmation closes without committing and follows explicit Tab order', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  const toggle = demo.getByRole('button', { name: '外部打开季度', exact: true })
  await activate(toggle, mobile)
  const field = demo.getByRole('combobox', {
    name: '外部开合季度',
    exact: true,
  })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const popup = page.getByRole('dialog', { name: '外部开合季度选择面板' })
  await activate(popup.locator('[data-picker-value="2024-Q2"]'), mobile)
  await expect(field).toHaveValue('2024-Q2')
  await activate(
    demo.getByRole('button', { name: '外部关闭季度', exact: true }),
    mobile,
  )
  await expect(popup).toHaveCount(0)
  await expect(field).toHaveAttribute('aria-expanded', 'false')
  await expect(field).toHaveValue('2024-Q1')
  await activate(toggle, mobile)
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await popup.getByRole('button', { name: '确定', exact: true }).focus()
  await popup.getByRole('button', { name: '确定', exact: true }).press('Tab')
  await expect(popup).toHaveCount(0)
  await expect(
    demo.getByRole('button', { name: '清空外部开合季度', exact: true }),
  ).toBeFocused()
  await expect(field).toHaveValue('2024-Q1')
})

test('date unit panels fit a narrow RTL container and preserve disabled and readonly boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 日期单位', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await demo.getByLabel('日期单位弹出位置').selectOption('topEnd')
  const field = demo.getByRole('combobox', { name: '结算月份', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '结算月份选择面板' })
  await expect(popup).toHaveAttribute('dir', 'rtl')
  await popup.locator('[data-picker-value="2024-02"]').press('ArrowLeft')
  await expect(popup.locator('[data-picker-value="2024-04"]')).toBeFocused()
  const bounds = (await popup.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await popup.screenshot({
    path: 'output/playwright/date-units-rtl-' + testInfo.project.name + '.png',
  })
  await popup.locator('[data-picker-value="2024-04"]').press('Escape')
  const inline = demo.locator('[data-datepicker-unit="month"]').filter({
    has: page.getByRole('textbox', { name: '内嵌月份', exact: true }),
  })
  expect(
    await inline.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  await expect(inline.locator('[data-picker-value="2024-02"]')).toHaveAttribute(
    'tabindex',
    '0',
  )
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  await activate(
    demo.getByRole('button', { name: '禁用日期单位', exact: true }),
    mobile,
  )
  await expect(field).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '打开结算月份面板', exact: true }),
  ).toBeDisabled()
  await demo
    .getByRole('combobox', { name: '只读周', exact: true })
    .press('ArrowDown')
  await expect(
    page.getByRole('dialog', { name: '只读周选择面板' }),
  ).toHaveCount(0)
})
