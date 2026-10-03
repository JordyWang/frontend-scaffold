import { expect, test } from '@playwright/test'

test('Spin progress, estimate and custom indicator work on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 844 })
  await page.goto('/__ui')
  const preview = page.getByRole('group', {
    name: 'Spin 进度与自定义状态',
  })
  const progress = preview.getByRole('progressbar', { name: '任务进度' })
  await expect(progress).toHaveAttribute('aria-valuenow', '28', {
    timeout: 15_000,
  })
  await expect(preview.getByText('已处理的任务')).toBeVisible()
  await expect(
    preview.getByRole('status', { name: '自定义指示器' }).locator('svg'),
  ).toHaveCount(1)

  const advance = preview.getByRole('button', { name: '推进任务进度' })
  const mobile = testInfo.project.name.startsWith('mobile-')
  const advanceBox = await advance.boundingBox()
  expect(advanceBox!.width).toBeGreaterThanOrEqual(44)
  expect(advanceBox!.height).toBeGreaterThanOrEqual(44)
  if (mobile) await advance.tap()
  else await advance.press('Enter')
  await expect(progress).toHaveAttribute('aria-valuenow', '64')
  if (mobile) await advance.tap()
  else await advance.press('Enter')
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await expect(preview.getByRole('status', { name: '任务进度' })).toHaveClass(
    /text-\[var\(--ui-color-success\)\]/,
  )

  const toggleAuto = preview.getByRole('button', { name: '开始估算进度' })
  if (mobile) await toggleAuto.tap()
  else await toggleAuto.press('Enter')
  const estimated = preview.getByRole('progressbar', { name: '估算进度' })
  await expect
    .poll(async () => Number(await estimated.getAttribute('aria-valuenow')))
    .toBeGreaterThan(0)
  const value = Number(await estimated.getAttribute('aria-valuenow'))
  expect(value).toBeLessThan(100)
  await expect(estimated).toHaveAttribute('aria-valuetext', /^\d+%（估算）$/)
  const stop = preview.getByRole('button', { name: '结束估算进度' })
  if (mobile) await stop.tap()
  else await stop.press('Enter')
  await expect(estimated).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
