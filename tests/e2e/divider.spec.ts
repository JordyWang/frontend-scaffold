import { expect, test } from '@playwright/test'

test('Divider titles and lines remain readable on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const group = page.getByRole('group', { name: '分隔线样式' })
  const start = group.getByRole('separator', { name: '任务概览' })
  const end = group.getByRole('separator', { name: '更多信息' })
  const longTitle = group.getByRole('separator', {
    name: '窄容器中的较长分隔线标题',
  })
  const vertical = group.locator('hr[aria-orientation="vertical"]')
  const firstLine = start.locator('span[aria-hidden="true"]').first()

  await expect(start).toBeVisible()
  await expect(end).toBeVisible()
  await expect(longTitle).toBeVisible()
  await expect(vertical).toBeVisible()
  expect(
    await firstLine.evaluate(
      (element) => getComputedStyle(element).borderTopStyle,
    ),
  ).toBe('dashed')
  expect(
    await end
      .locator('span[aria-hidden="true"]')
      .last()
      .evaluate((element) => getComputedStyle(element).borderTopStyle),
  ).toBe('dotted')
  expect(
    await longTitle.evaluate((element) => element.clientWidth),
  ).toBeLessThanOrEqual(224)
  expect(
    await vertical.evaluate((element) => element.clientHeight),
  ).toBeGreaterThan(0)
  const lightBorder = await firstLine.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  )
  const themeToggle = page.getByRole('button', { name: '切换预览主题' })
  if (testInfo.project.name.startsWith('mobile-')) await themeToggle.tap()
  else await themeToggle.press('Enter')
  await expect
    .poll(() =>
      firstLine.evaluate((element) => getComputedStyle(element).borderTopColor),
    )
    .not.toBe(lightBorder)
  await expect(longTitle).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
