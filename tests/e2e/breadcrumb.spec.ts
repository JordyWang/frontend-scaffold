import { expect, test } from '@playwright/test'

test('breadcrumb expands hidden path items with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  await page.setViewportSize({ width: 360, height: 780 })
  const preview = page.locator('[data-breadcrumb-preview]')
  const trail = preview.getByRole('navigation', { name: '长路径导航' })
  const expand = trail.getByRole('button', {
    name: '展开完整路径，隐藏 3 项',
  })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expect(trail.getByRole('link', { name: '项目列表' })).toHaveCount(0)
  const bounds = await expand.boundingBox()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)

  if (testInfo.project.name.startsWith('mobile-')) await expand.tap()
  else {
    await expand.focus()
    await expand.press('Enter')
  }
  const collapse = trail.getByRole('button', { name: '收起中间路径' })
  await expect(collapse).toHaveAttribute('aria-expanded', 'true')
  await expect(trail.getByRole('link', { name: '项目列表' })).toHaveAttribute(
    'href',
    '#preview-result',
  )
  const project = trail.getByRole('button', { name: '项目 A' })
  if (testInfo.project.name.startsWith('mobile-')) await project.tap()
  else {
    await project.focus()
    await project.press('Enter')
  }
  await expect(preview.getByRole('status')).toHaveText('已打开项目 A')
  if (testInfo.project.name.startsWith('mobile-')) await collapse.tap()
  else {
    await collapse.focus()
    await collapse.press('Enter')
  }
  await expect(trail.getByRole('link', { name: '项目列表' })).toHaveCount(0)
  await expect(expand).toHaveAttribute('aria-expanded', 'false')

  const rtl = preview.getByRole('navigation', { name: 'RTL 长路径导航' })
  await expect(rtl).toHaveCSS('direction', 'rtl')
  await expect(rtl.getByRole('button', { name: /展开完整路径/ })).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
