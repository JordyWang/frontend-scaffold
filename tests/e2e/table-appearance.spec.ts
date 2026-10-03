import { expect, test } from '@playwright/test'

test('Table display settings work with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const card = page.locator('#ds-table')
  const settings = card.getByRole('group', { name: '表格展示设置' })
  const table = card.getByRole('region', {
    name: '展示状态任务表',
    exact: true,
  })
  const compact = settings.getByRole('button', { name: '紧凑尺寸' })
  const spacious = settings.getByRole('button', { name: '宽松尺寸' })
  const borders = settings.getByRole('button', { name: '网格边框' })
  const hover = settings.getByRole('button', { name: '行悬停' })
  const mobile = testInfo.project.name.startsWith('mobile-')
  const summary = mobile
    ? card.getByRole('group', { name: '展示状态任务表汇总' })
    : card.getByRole('table', { name: '展示状态任务表' }).locator('tfoot')

  await expect(card.getByText('任务清单')).toBeVisible()
  await expect(card.getByText('当前显示 2 条任务')).toBeVisible()
  await expect(summary).toContainText('当前页汇总')
  await expect(summary).toContainText('2 项')
  if (mobile) {
    await expect(summary.locator('dt').first()).toHaveText('任务')
    await expect(summary.locator('dd').first()).toHaveText('当前页汇总')
  }

  for (const control of [compact, spacious, borders, hover]) {
    const box = (await control.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  if (mobile) await compact.tap()
  else await compact.press('Enter')
  await expect(table).toHaveAttribute('data-ui-size', 'small')
  if (mobile) await borders.tap()
  else await borders.press('Space')
  await expect(table).toHaveAttribute('data-ui-bordered', 'true')
  if (!mobile)
    await expect(summary.locator('td').last()).toHaveClass(/bg-primary\/5/)

  if (mobile) {
    const row = card
      .getByRole('list', { name: '展示状态任务表' })
      .locator('li')
      .first()
    await expect(row).toHaveCSS('padding-left', '8px')
    await expect(row).toHaveCSS('border-left-width', '1px')
    await expect(row).toHaveClass(/bg-primary\/5/)
  } else {
    const rowHeader = card.getByRole('rowheader', { name: '设计评审' })
    await expect(rowHeader).toHaveCSS('padding-left', '12px')
    await expect(rowHeader).toHaveCSS('border-left-width', '1px')
    await expect(
      card.getByRole('columnheader', { name: /^按任务排序/ }),
    ).toHaveClass(/\btext-primary\b/)
  }

  if (mobile) await spacious.tap()
  else await spacious.press('Enter')
  await expect(table).toHaveAttribute('data-ui-size', 'large')
  const desktopRow = mobile
    ? undefined
    : card.getByRole('rowheader', { name: '设计评审' }).locator('..')
  const restingBackground = desktopRow
    ? await desktopRow.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )
    : undefined
  if (desktopRow) {
    await desktopRow.hover()
    await expect
      .poll(() =>
        desktopRow.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .not.toBe(restingBackground)
  }
  if (mobile) await hover.tap()
  else await hover.press('Space')
  await expect(table).toHaveAttribute('data-ui-row-hoverable', 'false')
  if (desktopRow) {
    await desktopRow.hover()
    await expect
      .poll(() =>
        desktopRow.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .toBe(restingBackground)
  }

  if (mobile) {
    const row = card
      .getByRole('list', { name: '展示状态任务表' })
      .locator('li')
      .first()
    await expect(row).toHaveCSS('padding-left', '24px')
  } else {
    await expect(card.getByRole('rowheader', { name: '设计评审' })).toHaveCSS(
      'padding-left',
      '24px',
    )
    expect(
      await card
        .getByRole('columnheader', { name: /^按任务排序/ })
        .evaluate((element) =>
          parseFloat(getComputedStyle(element).letterSpacing),
        ),
    ).toBeGreaterThan(0)
  }

  const expand = card.getByRole('button', { name: '展开设计评审' })
  const box = (await expand.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  if (mobile) await expand.tap()
  else await expand.press('Enter')
  await expect(
    card.getByRole('button', { name: '收起设计评审' }),
  ).toHaveAttribute('aria-expanded', 'true')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
