import { expect, test } from '@playwright/test'

test('Table columns respond to container width on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const region = page.getByRole('region', {
    name: '响应式交付表',
    exact: true,
  })
  const table = region.getByRole('table', { name: '响应式交付表' })
  const rows = mobile
    ? region.getByRole('list', { name: '响应式交付表' }).locator('li')
    : table.locator('tbody tr')
  const settings = page.getByRole('group', { name: '表格容器宽度' })
  const wide = settings.getByRole('button', { name: '宽容器' })
  const medium = settings.getByRole('button', { name: '中容器' })
  const narrow = settings.getByRole('button', { name: '窄容器' })

  if (mobile) {
    await expect(rows).toHaveCount(3)
    await expect(rows.first()).toContainText('设计系统')
    await expect(rows.first()).not.toContainText('团队 A')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveCount(0)
    const box = (await narrow.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    await narrow.tap()
    await expect(narrow).toHaveAttribute('aria-pressed', 'true')
    await wide.tap()
    await expect(wide).toHaveAttribute('aria-pressed', 'true')
    await expect(rows).toHaveCount(3)
  } else {
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '4')
    await expect(rows).toHaveCount(3)
    await region
      .getByRole('button', { name: '按已完成排序，未排序' })
      .press('Enter')
    await expect(rows.first()).toContainText('表单完善')

    await medium.press('Space')
    await expect(medium).toHaveAttribute('aria-pressed', 'true')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '2')
    await expect(
      table.getByRole('columnheader', { name: '评审人' }),
    ).toHaveCount(0)
    await expect(
      table.getByRole('columnheader', { name: '待处理' }),
    ).toHaveCount(0)
    const filter = region.getByRole('button', { name: '筛选负责人' })
    await filter.press('Enter')
    const dialog = page.getByRole('dialog', { name: '筛选负责人' })
    await dialog.getByRole('checkbox', { name: '团队 A' }).press('Space')
    await dialog.getByRole('button', { name: '应用' }).press('Enter')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('表单完善')

    await narrow.press('Space')
    await expect(narrow).toHaveAttribute('aria-pressed', 'true')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveCount(0)
    await expect(rows).toHaveCount(3)
    await expect(rows.first()).toContainText('设计系统')
    await expect(
      region.getByRole('button', { name: /按已完成排序/ }),
    ).toHaveCount(0)
    await expect(
      region.getByRole('button', { name: /筛选负责人/ }),
    ).toHaveCount(0)

    await wide.press('Space')
    await expect(wide).toHaveAttribute('aria-pressed', 'true')
    await expect(
      table.getByRole('columnheader', { name: '交付信息' }),
    ).toHaveAttribute('colspan', '4')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('表单完善')
    await expect(
      table.getByRole('columnheader', { name: '已完成' }),
    ).toHaveAttribute('aria-sort', 'ascending')
    await expect(
      region.getByRole('button', { name: /筛选负责人/ }),
    ).toBeVisible()
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
