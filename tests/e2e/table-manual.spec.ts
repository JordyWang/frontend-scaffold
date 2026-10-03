import { expect, test } from '@playwright/test'

test('manual Table composes external paging, sorting and filtering on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const card = page.locator('#ds-table-manual')
  const table = card.locator('[data-ui-table]')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const rows = mobile
    ? card.getByRole('list', { name: '手动数据任务表' }).locator('li')
    : card.getByRole('table', { name: '手动数据任务表' }).locator('tbody tr')
  const pagination = card.getByRole('navigation', {
    name: '手动数据任务表分页',
  })
  const summary = mobile
    ? card.getByRole('group', { name: '手动数据任务表汇总' })
    : card.getByRole('table', { name: '手动数据任务表' }).locator('tfoot')
  const activate = async (name: string) => {
    const button = card.getByRole('button', { name })
    if (mobile) await button.tap()
    else await button.press('Enter')
  }

  await expect(table).toHaveAttribute('data-ui-data-mode', 'manual')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('任务 C')
  await expect(rows.nth(1)).toContainText('任务 A')
  await expect(pagination).toContainText('共 6 条')
  await expect(card.getByText('服务端任务')).toBeVisible()
  await expect(card.getByText('当前页返回 2 条')).toBeVisible()
  await expect(summary).toContainText('2 项')

  await activate('下一页')
  await expect(rows.first()).toContainText('任务 F')
  await expect(rows.nth(1)).toContainText('任务 B')

  await activate('按任务排序，未排序')
  await expect(rows.first()).toContainText('任务 A')
  await expect(rows.nth(1)).toContainText('任务 B')
  await expect(
    pagination.getByRole('button', { name: '前往第 1 页' }),
  ).toHaveAttribute('aria-current', 'page')

  await activate('筛选状态')
  const filter = page.getByRole('dialog', { name: '筛选状态' })
  const done = filter.getByRole('checkbox', { name: '已完成' })
  if (mobile) await done.tap()
  else await done.press('Space')
  const apply = filter.getByRole('button', { name: '应用' })
  if (mobile) await apply.tap()
  else await apply.press('Enter')
  await expect(pagination).toContainText('共 3 条')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('任务 A')
  await expect(rows.nth(1)).toContainText('任务 B')
  await activate('下一页')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('任务 D')
  await expect(card.getByText('当前页返回 1 条')).toBeVisible()
  await expect(summary).toContainText('1 项')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
