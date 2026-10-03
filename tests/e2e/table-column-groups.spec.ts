import { expect, test } from '@playwright/test'

test('Table column groups keep headers, leaf controls and summaries aligned on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const region = page.getByRole('region', { name: '交付概览表', exact: true })
  const rows = mobile
    ? region.getByRole('list', { name: '交付概览表' }).locator('li')
    : region.getByRole('table', { name: '交付概览表' }).locator('tbody tr')
  const table = region.locator('table')
  const summary = mobile
    ? region.getByRole('group', { name: '交付概览表汇总' })
    : table.locator('tfoot')

  await expect(rows).toHaveCount(3)
  await expect(summary).toContainText('9')
  await expect(summary).toContainText('6')
  if (!mobile) {
    await expect(table.locator('thead tr')).toHaveCount(3)
    await expect(
      table.getByRole('columnheader', { name: '项目' }),
    ).toHaveAttribute('rowspan', '3')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '4')
    await expect(
      table.getByRole('columnheader', { name: '成员' }),
    ).toHaveAttribute('colspan', '2')
    await expect(table.locator('tbody tr').first().locator('>*')).toHaveCount(7)
    await expect(table.locator('tfoot tr').locator('>*')).toHaveCount(7)
  }

  const sort = region.getByRole('button', { name: '按已完成排序，未排序' })
  const sortBox = (await sort.boundingBox())!
  expect(sortBox.width).toBeGreaterThanOrEqual(44)
  expect(sortBox.height).toBeGreaterThanOrEqual(44)
  if (mobile) await sort.tap()
  else await sort.press('Enter')
  await expect(rows.first()).toContainText('表单完善')

  const filter = region.getByRole('button', { name: '筛选负责人' })
  if (mobile) await filter.tap()
  else await filter.press('Enter')
  const dialog = page.getByRole('dialog', { name: '筛选负责人' })
  const team = dialog.getByRole('checkbox', { name: '团队 A' })
  if (mobile) await team.tap()
  else await team.press('Space')
  const apply = dialog.getByRole('button', { name: '应用' })
  if (mobile) await apply.tap()
  else await apply.press('Enter')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('表单完善')
  await expect(summary).toContainText('4')

  const expand = region.getByRole('button', { name: '展开表单完善' })
  if (mobile) await expand.tap()
  else await expand.press('Enter')
  await expect(region).toContainText('表单完善由团队 A负责，丙评审。')
  if (!mobile)
    await expect(table.locator('tbody tr:nth-child(2) td')).toHaveAttribute(
      'colspan',
      '7',
    )
  const collapse = region.getByRole('button', { name: '收起表单完善' })
  if (mobile) await collapse.tap()
  else await collapse.press('Enter')

  const settings = page.getByRole('group', { name: '可见列设置' })
  const toggle = async (name: string) => {
    const button = settings.getByRole('button', { name })
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    if (mobile) await button.tap()
    else await button.press('Space')
  }
  const reviewerButton = settings.getByRole('button', { name: '评审列' })
  const pressedBackground = await reviewerButton.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  await toggle('评审列')
  await expect(reviewerButton).toHaveAttribute('aria-pressed', 'false')
  await expect
    .poll(() =>
      reviewerButton.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    )
    .not.toBe(pressedBackground)
  if (mobile) await expect(rows.first()).not.toContainText('丙评审')
  else {
    await expect(
      table.getByRole('columnheader', { name: '成员' }),
    ).toHaveAttribute('colspan', '1')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '3')
    await expect(
      table.getByRole('columnheader', { name: '评审人' }),
    ).toHaveCount(0)
  }

  await toggle('成员组')
  await expect(rows).toHaveCount(3)
  await expect(rows.first()).toContainText('表单完善')
  await expect(region.getByRole('button', { name: '筛选负责人' })).toHaveCount(
    0,
  )
  await expect(summary).toContainText('9')
  if (mobile) await expect(rows.first()).not.toContainText('团队 A')
  else
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '2')

  await toggle('任务组')
  await expect(rows.first()).toContainText('设计系统')
  await expect(
    region.getByRole('button', { name: /按已完成排序/ }),
  ).toHaveCount(0)
  if (!mobile) {
    await expect(table.locator('thead tr')).toHaveCount(1)
    await expect(table.locator('tbody tr').first().locator('>*')).toHaveCount(3)
  }
  await toggle('成员组')
  await toggle('任务组')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('表单完善')
  await expect(region.getByRole('button', { name: '筛选负责人' })).toBeVisible()
  await expect(
    region.getByRole('button', { name: '按已完成排序，升序' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
