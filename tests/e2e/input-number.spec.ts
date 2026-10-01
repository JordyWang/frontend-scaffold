import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
})

test('formatted number keeps canonical values while stepping on PC and H5', async ({
  page,
}, info) => {
  const input = page.getByRole('spinbutton', {
    name: '格式化金额',
    exact: true,
  })
  const increase = page.getByRole('button', {
    name: '格式化金额增加',
    exact: true,
  })
  await input.scrollIntoViewIfNeeded()
  for (const button of [
    increase,
    page.getByRole('button', { name: '格式化金额减少', exact: true }),
  ]) {
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await expect(input).toHaveValue('¥12.50')
  await input.fill('13.25')
  await expect(input).toHaveValue('13.25')
  await input.press('Tab')
  await expect(input).toHaveValue('¥13.25')
  if (info.project.name.startsWith('mobile-')) await increase.tap()
  else await increase.click()
  await expect(input).toHaveValue('¥13.75')
  await input.locator('..').screenshot({
    path:
      'output/playwright/input-number-controls-' + info.project.name + '.png',
  })
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})
