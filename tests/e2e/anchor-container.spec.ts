import { expect, test } from '@playwright/test'

test('Anchor follows and navigates sections inside an independent scroll container', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('group', { name: '容器页内导航预览' })
  const nav = preview.getByRole('navigation', { name: '容器页内导航' })
  const container = preview.getByRole('region', { name: '章节滚动容器' })
  const first = nav.getByRole('link', { name: '概览章节' })
  const second = nav.getByRole('link', { name: '配置章节' })
  const third = nav.getByRole('link', { name: '结果章节' })

  await expect(first).toHaveAttribute('aria-current', 'location')
  await nav.scrollIntoViewIfNeeded()
  const pageScrollBefore = await page.evaluate(() => window.scrollY)
  if (testInfo.project.name.startsWith('mobile-')) await second.tap()
  else {
    await second.focus()
    await second.press('Enter')
  }
  await expect(second).toHaveAttribute('aria-current', 'location')
  await expect
    .poll(() => container.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(100)
  expect(await page.evaluate(() => window.location.hash)).toBe(
    '#anchor-panel-two',
  )
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - pageScrollBefore),
  ).toBeLessThanOrEqual(2)

  await container.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(third).toHaveAttribute('aria-current', 'location')
  if (testInfo.project.name.startsWith('mobile-')) await first.tap()
  else {
    await first.focus()
    await first.press('Enter')
  }
  await expect(first).toHaveAttribute('aria-current', 'location')
  await expect
    .poll(() => container.evaluate((element) => element.scrollTop))
    .toBeLessThanOrEqual(8)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
