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
  await expect(input).toHaveValue('¥12.50')
  await input.fill('13.25')
  await expect(input).toHaveValue('13.25')
  await input.press('Tab')
  await expect(input).toHaveValue('¥13.25')
  if (info.project.name.startsWith('mobile-')) await increase.tap()
  else await increase.click()
  await expect(input).toHaveValue('¥13.75')
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})
