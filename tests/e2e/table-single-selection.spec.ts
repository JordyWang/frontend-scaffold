import { expect, test } from '@playwright/test'

test('Table single selection supports keyboard, disabled rows and H5 touch across pages', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const region = page.getByRole('region', { name: '单选任务表', exact: true })
  const rows = mobile
    ? region.getByRole('list', { name: '单选任务表' }).locator('li')
    : region.getByRole('table', { name: '单选任务表' }).locator('tbody tr')
  const radio = (name: string) =>
    (mobile
      ? region.getByRole('list', { name: '单选任务表' })
      : region.getByRole('table', { name: '单选任务表' })
    ).getByRole('radio', { name: `选择${name}` })
  const pageNav = region.getByRole('navigation', {
    name: '单选任务表分页',
  })
  const activate = async (name: string) => {
    const control = pageNav.getByRole('button', { name })
    if (mobile) await control.tap()
    else await control.press('Enter')
  }

  await expect(rows).toHaveCount(3)
  await expect(radio('制定计划')).toBeChecked()
  await expect(radio('实现组件')).toBeDisabled()
  await expect(region).toContainText('已选 1 项')
  await expect(page.getByText('已选择制定计划')).toBeVisible()
  await expect(rows.first()).toHaveClass(/bg-primary\/10/)
  if (mobile)
    await expect(rows.first()).toHaveAttribute('data-ui-selected', 'true')
  else await expect(rows.first()).toHaveAttribute('aria-selected', 'true')

  for (const name of ['制定计划', '实现组件', '测试组件']) {
    const target = radio(name).locator('..')
    const box = (await target.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }

  if (mobile) {
    await radio('测试组件').locator('..').tap()
  } else {
    await radio('制定计划').press('ArrowDown')
    await expect(radio('测试组件')).toBeFocused()
  }
  await expect(radio('测试组件')).toBeChecked()
  await expect(page.getByText('已选择测试组件')).toBeVisible()
  await expect(rows.nth(2)).toHaveClass(/bg-primary\/10/)
  if (mobile)
    await expect(rows.nth(2)).toHaveAttribute('data-ui-selected', 'true')
  else await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true')

  await activate('下一页')
  await expect(rows).toHaveCount(1)
  await expect(radio('验证交互')).not.toBeChecked()
  if (mobile) await radio('验证交互').locator('..').tap()
  else await radio('验证交互').press('Space')
  await expect(radio('验证交互')).toBeChecked()
  await expect(page.getByText('已选择验证交互')).toBeVisible()
  await activate('上一页')
  await expect(radio('制定计划')).not.toBeChecked()
  await expect(radio('测试组件')).not.toBeChecked()
  await expect(region).toContainText('已选 1 项')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
