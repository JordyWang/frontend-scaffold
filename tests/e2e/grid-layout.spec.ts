import { expect, test } from '@playwright/test'

test('24-column Grid responds to its container, RTL and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.locator('#ds-grid')
  const row = preview.locator('[data-grid-row][aria-label="响应式模块栅格"]')
  const columns = row.locator('[data-grid-col]')
  const offsetRow = preview.locator(
    '[data-grid-row][aria-label="起始偏移栅格"]',
  )
  const offsetColumn = offsetRow.locator('[data-grid-col]').first()
  const settings = preview.getByRole('group', { name: '栅格展示设置' })
  const activate = async (button: ReturnType<typeof page.getByRole>) => {
    if (mobile) await button.tap()
    else await button.press('Enter')
  }

  await expect(row).toBeVisible()
  await expect(columns).toHaveCount(4)
  if (mobile) {
    await expect(columns.nth(3)).toBeHidden()
    await expect(row.getByRole('button', { name: '报表模块' })).toHaveCount(0)
  } else await expect(columns.nth(3)).toBeVisible()
  const firstWidth = await columns
    .first()
    .evaluate((element) => element.getBoundingClientRect().width)
  const rowWidth = await row.evaluate((element) => element.clientWidth)
  expect(firstWidth / rowWidth).toBeCloseTo(mobile ? 1 : 1 / 3, 1)
  expect(
    await columns
      .first()
      .evaluate((element) => getComputedStyle(element).paddingInlineStart),
  ).toBe(mobile ? '4px' : '12px')

  const fileButton = columns.nth(1).getByRole('button', { name: '文件模块' })
  await activate(fileButton)
  await expect(preview).toContainText('已打开文件模块')

  const rtl = settings.getByRole('button', { name: 'RTL 方向' })
  await activate(rtl)
  await expect(rtl).toHaveAttribute('aria-pressed', 'true')
  expect(
    await row.evaluate((element) => getComputedStyle(element).direction),
  ).toBe('rtl')
  await expect(offsetColumn).toBeVisible()
  const inlineStartMargin = await offsetColumn.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).marginInlineStart),
  )
  if (mobile) expect(inlineStartMargin).toBe(0)
  else {
    expect(inlineStartMargin).toBeGreaterThan(100)
    expect(
      await offsetColumn.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).marginRight),
      ),
    ).toBeGreaterThan(100)
  }

  if (!mobile) {
    const medium = settings.getByRole('button', { name: '中容器' })
    await activate(medium)
    await expect(medium).toHaveAttribute('aria-pressed', 'true')
    await expect(columns.nth(3)).toBeVisible()
    await expect
      .poll(async () => {
        const width = await columns
          .first()
          .evaluate((element) => element.getBoundingClientRect().width)
        const container = await row.evaluate((element) => element.clientWidth)
        return width / container
      })
      .toBeCloseTo(0.5, 1)
    expect(
      await columns
        .first()
        .evaluate((element) => getComputedStyle(element).paddingInlineStart),
    ).toBe('8px')

    const narrow = settings.getByRole('button', { name: '窄容器' })
    await activate(narrow)
    await expect(narrow).toHaveAttribute('aria-pressed', 'true')
    await expect(columns.nth(3)).toBeHidden()
    await expect(row.getByRole('button', { name: '报表模块' })).toHaveCount(0)
    await expect
      .poll(async () => {
        const width = await columns
          .first()
          .evaluate((element) => element.getBoundingClientRect().width)
        const container = await row.evaluate((element) => element.clientWidth)
        return Math.abs(width - container)
      })
      .toBeLessThan(1)
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
