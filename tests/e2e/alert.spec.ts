import { expect, test } from '@playwright/test'

test('controlled banner alert closes and restores with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.locator('[data-alert-preview]')
  const banner = preview.getByRole('status').filter({ hasText: 'Banner 提示' })
  const close = banner.getByRole('button', { name: '关闭Banner 提示' })
  const restore = preview.getByRole('button', { name: '恢复 Banner' })

  await expect(banner).toHaveAttribute('data-alert-banner', 'true')
  const bounds = await close.boundingBox()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)

  if (testInfo.project.name.startsWith('mobile-')) await close.tap()
  else {
    await close.focus()
    await close.press('Enter')
  }
  await expect(banner).toHaveCount(0)
  await expect(preview.getByTestId('banner-alert-state')).toHaveText(
    'Banner 已关闭',
  )

  if (testInfo.project.name.startsWith('mobile-')) await restore.tap()
  else {
    await restore.focus()
    await restore.press('Enter')
  }
  await expect(banner).toBeVisible()
  await expect(preview.getByTestId('banner-alert-state')).toHaveText(
    'Banner 已恢复',
  )
})
