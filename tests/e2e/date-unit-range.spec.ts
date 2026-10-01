import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
const target = (popup: Locator, value: string) =>
  popup.locator('[data-picker-value="' + value + '"]').first()

for (const [label, initial, first, last, key] of [
  ['跨年周范围', '2020-W53 → 2021-W02', '2021-W01', '2021-W03', 'ArrowDown'],
  ['结算月份范围', '2024-02 → 2024-05', '2024-04', '2024-06', 'ArrowRight'],
  ['发布季度范围', '2024-Q1 → 2024-Q3', '2024-Q2', '2024-Q4', 'ArrowRight'],
  ['报告年份范围', '2024 → 2026', '2025', '2027', 'ArrowRight'],
]) {
  test(
    'date unit range ' +
      label +
      ' previews then submits two endpoints with keyboard and touch',
    async ({ page }, testInfo) => {
      await page.goto('/__ui')
      const mobile = testInfo.project.name.startsWith('mobile-')
      const demo = page.getByRole('region', { name: '日期单位范围预览' })
      const start = demo.getByRole('combobox', {
        name: label + '开始',
        exact: true,
      })
      const end = demo.getByRole('combobox', {
        name: label + '结束',
        exact: true,
      })
      const status = demo.getByRole('status', {
        name: label + '提交值',
        exact: true,
      })
      await start.evaluate((element) =>
        element.scrollIntoView({ block: 'center' }),
      )
      const scroll = await page.evaluate(() => window.scrollY)
      await start.press('ArrowDown')
      const popup = page.getByRole('dialog', { name: label + '选择面板' })
      await expect(popup.getByRole('grid').first()).toHaveAttribute(
        'aria-multiselectable',
        'true',
      )
      const focused = popup.locator('[data-picker-value]:focus')
      await focused.press(key)
      await expect(target(popup, first)).toBeFocused()
      await expect(status).toHaveText(initial)
      expect(
        Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
      ).toBeLessThan(2)
      const box = (await target(popup, first).boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      await activate(target(popup, first), mobile)
      await expect(status).toHaveText(initial)
      await expect(target(popup, first)).toHaveAttribute(
        'data-picker-range',
        'start',
      )
      await popup.locator('[data-picker-value]:focus').press(key)
      await expect(target(popup, last)).toBeFocused()
      await expect(target(popup, last)).toHaveAttribute(
        'data-picker-preview',
        '',
      )
      await activate(target(popup, last), mobile)
      if (label === '发布季度范围') {
        await expect(status).toHaveText(initial)
        await expect(target(popup, last)).toHaveAccessibleName(/范围结束/)
        await activate(
          popup.getByRole('button', { name: '确定', exact: true }),
          mobile,
        )
      }
      await expect(popup).toHaveCount(0)
      await expect(end).toBeFocused()
      await expect(status).toHaveText(first + ' → ' + last)
      await expect(start).toHaveValue(first)
      await expect(end).toHaveValue(last)
    },
  )
}

test('date unit range hierarchy and paired panel browsing do not submit a month prematurely', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位范围预览' })
  const start = demo.getByRole('combobox', {
    name: '结算月份范围开始',
    exact: true,
  })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '结算月份范围选择面板' })
  const panels = popup.locator('[data-picker-unit]')
  await expect(panels.first().getByRole('grid')).toHaveAccessibleName(/2024年/)
  if (!mobile) {
    await expect(panels.nth(1)).toBeVisible()
    await expect(panels.nth(1).getByRole('grid')).toHaveAccessibleName(/2025年/)
    await activate(
      panels.nth(1).getByRole('button', { name: '下一页', exact: true }),
      mobile,
    )
    await expect(panels.first().getByRole('grid')).toHaveAccessibleName(
      /2025年/,
    )
    await expect(panels.nth(1).getByRole('grid')).toHaveAccessibleName(/2026年/)
    await activate(
      panels.first().getByRole('button', { name: '上一页', exact: true }),
      mobile,
    )
  } else await expect(panels.nth(1)).toBeHidden()
  await activate(
    panels.first().getByRole('button', { name: '浏览2024年', exact: true }),
    mobile,
  )
  await activate(
    panels.first().getByRole('button', { name: '浏览2020–2029', exact: true }),
    mobile,
  )
  await activate(panels.first().locator('[data-picker-value="2020"]'), mobile)
  await activate(panels.first().locator('[data-picker-value="2026"]'), mobile)
  await expect(
    demo.getByRole('status', { name: '结算月份范围提交值', exact: true }),
  ).toHaveText('2024-02 → 2024-05')
  await popup.screenshot({
    path:
      'output/playwright/unit-range-month-' + testInfo.project.name + '.png',
  })
  await page.screenshot({
    path:
      'output/playwright/unit-range-context-' + testInfo.project.name + '.png',
  })
  await activate(target(popup, '2026-06'), mobile)
  await expect(
    demo.getByRole('combobox', { name: '结算月份范围结束', exact: true }),
  ).toHaveValue('')
  await activate(target(popup, '2026-08'), mobile)
  await expect(
    demo.getByRole('status', { name: '结算月份范围提交值', exact: true }),
  ).toHaveText('2026-06 → 2026-08')
})

test('date unit range confirmation cancels presets with Escape and external close and follows Tab order', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位范围预览' })
  const start = demo.getByRole('combobox', {
    name: '发布季度范围开始',
    exact: true,
  })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '发布季度范围选择面板' })
  const preset = popup.getByRole('button', {
    name: '下个发布区间',
    exact: true,
  })
  await activate(preset, mobile)
  await expect(start).toHaveValue('2024-Q2')
  await preset.press('Escape')
  await expect(start).toHaveValue('2024-Q1')
  await expect(start).toBeFocused()
  await start.press('ArrowDown')
  await activate(preset, mobile)
  await activate(
    popup.getByRole('button', { name: '确定', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '发布季度范围提交值', exact: true }),
  ).toHaveText('2024-Q2 → 2024-Q4')
  await activate(
    demo.getByRole('button', { name: '外部打开季度范围', exact: true }),
    mobile,
  )
  const external = page.getByRole('dialog', {
    name: '外部开合季度范围选择面板',
  })
  const externalStart = demo.getByRole('combobox', {
    name: '外部开始季度',
    exact: true,
  })
  await externalStart.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await target(external, '2024-Q2').focus()
  await activate(target(external, '2024-Q2'), mobile)
  await expect(externalStart).toHaveValue('2024-Q2')
  await activate(
    demo.getByRole('button', { name: '外部关闭季度范围', exact: true }),
    mobile,
  )
  await expect(external).toHaveCount(0)
  await expect(externalStart).toHaveValue('2024-Q1')
  await activate(
    demo.getByRole('button', { name: '外部打开季度范围', exact: true }),
    mobile,
  )
  await externalStart.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  const first = external.getByRole('button', {
    name: '外部开始季度：2024-Q1',
    exact: true,
  })
  await first.focus()
  await first.press('Shift+Tab')
  await expect(
    demo.getByRole('combobox', { name: '外部结束季度', exact: true }),
  ).toBeFocused()
  const confirm = external.getByRole('button', { name: '确定', exact: true })
  await confirm.focus()
  await confirm.press('Tab')
  await expect(external).toHaveCount(0)
  await expect(
    demo.getByRole('button', { name: '清空外部结束季度', exact: true }),
  ).toBeFocused()
})

test('date unit range typing constraints, locked endpoints and an open interval share the selection rules', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位范围预览' })
  const end = demo.getByRole('combobox', { name: '输入结束月份', exact: true })
  const typed = demo.getByRole('group', { name: '输入月份范围', exact: true })
  await end.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  for (const invalid of ['2024-13', '2024-02', '2025-01']) {
    await end.fill(invalid)
    await end.press('Enter')
    await expect(typed.getByRole('alert')).toContainText('YYYY-MM')
  }
  await demo
    .getByRole('textbox', { name: '范围之后的字段', exact: true })
    .focus()
  await expect(end).toHaveValue('2024-05')
  await end.fill('2024-09')
  await end.press('Enter')
  await expect(end).toHaveValue('2024-09')
  const locked = demo.getByRole('combobox', {
    name: '锁定开始月份',
    exact: true,
  })
  const editable = demo.getByRole('combobox', {
    name: '可编辑结束月份',
    exact: true,
  })
  await expect(locked).toBeDisabled()
  await editable.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await editable.press('ArrowDown')
  const lockedPopup = page.getByRole('dialog', { name: '锁定月份范围选择面板' })
  await expect(target(lockedPopup, '2024-02')).toBeDisabled()
  await activate(target(lockedPopup, '2024-07'), mobile)
  await expect(locked).toHaveValue('2024-03')
  await expect(editable).toHaveValue('2024-07')
  const openStart = demo.getByRole('combobox', {
    name: '开放开始年份',
    exact: true,
  })
  await openStart.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await openStart.press('ArrowDown')
  const openPopup = page.getByRole('dialog', { name: '开放年份范围选择面板' })
  await activate(target(openPopup, '2025'), mobile)
  await activate(
    openPopup.getByRole('button', { name: '应用范围', exact: true }),
    mobile,
  )
  await expect(openStart).toHaveValue('2025')
  await expect(
    demo.getByRole('combobox', { name: '开放结束年份', exact: true }),
  ).toHaveValue('')
})

test('date unit range from restrictions and project Form retain complete tuples and reset', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位范围预览' })
  const start = demo.getByRole('combobox', {
    name: '受限开始月份',
    exact: true,
  })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '受限月份范围选择面板' })
  await activate(target(popup, '2024-03'), mobile)
  await expect(target(popup, '2024-07')).toBeDisabled()
  await expect(target(popup, '2024-02')).toBeDisabled()
  await expect(
    demo.getByRole('status', { name: '受限月份临时值', exact: true }),
  ).toHaveText('start：2024-03 → 2024-05')
  await activate(target(popup, '2024-06'), mobile)
  const formStart = demo.getByRole('combobox', {
    name: '表单开始月份',
    exact: true,
  })
  await activate(
    demo.getByRole('button', { name: '清空表单开始月份', exact: true }),
    mobile,
  )
  await formStart.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await formStart.press('ArrowDown')
  await expect(
    demo.getByText('请选择完整月份范围', { exact: true }),
  ).toHaveCount(0)
  const formPopup = page.getByRole('dialog', { name: '月份范围表单选择面板' })
  await activate(target(formPopup, '2024-03'), mobile)
  await activate(target(formPopup, '2024-06'), mobile)
  await activate(
    demo.getByRole('button', { name: '提交月份范围表单', exact: true }),
    mobile,
  )
  await expect(
    demo.getByRole('status', { name: '月份范围表单结果', exact: true }),
  ).toHaveText('月份范围：2024-03 → 2024-06')
  await activate(
    demo.getByRole('button', { name: '重置月份范围表单', exact: true }),
    mobile,
  )
  await expect(formStart).toHaveValue('2024-02')
  await expect(
    demo.getByRole('combobox', { name: '表单结束月份', exact: true }),
  ).toHaveValue('2024-05')
})

test('date unit range narrow RTL panels preserve touch targets, responsive layout and readonly boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '日期单位范围预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 日期单位范围', exact: true }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await demo.getByLabel('日期单位范围弹出位置').selectOption('topEnd')
  const start = demo.getByRole('combobox', {
    name: '结算月份范围开始',
    exact: true,
  })
  await start.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await start.press('ArrowDown')
  const popup = page.getByRole('dialog', { name: '结算月份范围选择面板' })
  await expect(popup).toHaveAttribute('dir', 'rtl')
  await target(popup, '2024-02').press('ArrowLeft')
  await expect(target(popup, '2024-04')).toBeFocused()
  const box = (await target(popup, '2024-04').boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  const bounds = (await popup.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(8)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352)
  expect(bounds.y).toBeGreaterThanOrEqual(8)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(772)
  await popup.screenshot({
    path: 'output/playwright/unit-range-rtl-' + testInfo.project.name + '.png',
  })
  await target(popup, '2024-04').press('Escape')
  const inline = demo.getByRole('group', { name: '内嵌月份范围', exact: true })
  expect(
    await inline.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  await expect(inline.locator('[data-picker-unit]').nth(1)).toBeHidden()
  const readonly = demo.getByRole('combobox', {
    name: '只读开始年份',
    exact: true,
  })
  await readonly.press('ArrowDown')
  await expect(
    page.getByRole('dialog', { name: '只读年份范围选择面板' }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  await activate(
    demo.getByRole('button', { name: '禁用日期单位范围', exact: true }),
    mobile,
  )
  await expect(start).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '打开结算月份范围开始面板', exact: true }),
  ).toBeDisabled()
})
