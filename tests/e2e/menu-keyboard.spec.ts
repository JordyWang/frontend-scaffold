import { expect, test } from '@playwright/test'

test('horizontal Menu enters and leaves a submenu with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const menu = page.getByRole('navigation', { name: '横向导航' })
  const catalog = menu.getByRole('menuitem', { name: '目录' })
  const status = page.getByRole('status', { name: '横向菜单选择' })

  await catalog.focus()
  await catalog.press('ArrowDown')
  const all = page.getByRole('menuitem', { name: '全部组件' })
  const guides = page.getByRole('menuitem', { name: '组件示例' })
  const disabled = page.getByRole('menuitem', { name: '暂不可选' })
  await expect(all).toBeFocused()
  await expect(disabled).toBeDisabled()
  await all.press('ArrowDown')
  await expect(guides).toBeFocused()
  await guides.press('ArrowDown')
  await expect(guides).toBeFocused()
  await guides.press('Enter')
  await expect(status).toHaveText('已选择：guides')
  await expect(guides).toHaveCount(0)
  await expect(catalog).toBeFocused()

  if (testInfo.project.name.startsWith('mobile-')) await catalog.tap()
  else await catalog.click()
  await expect(all).toBeVisible()
  const box = await all.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await all.tap()
  else await all.click()
  await expect(status).toHaveText('已选择：all-components')
  await expect(all).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
