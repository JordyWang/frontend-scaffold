import { expect, test } from '@playwright/test'

test('affix keeps its placeholder and follows a target container on desktop and H5', async ({
  page,
}) => {
  await page.goto('/__ui')
  const preview = page.locator('[data-affix-preview]')
  const target = preview.locator('[data-affix-scroll-container]')
  const status = preview.locator('[data-affix-status]')

  await expect(target).toBeVisible()
  await expect
    .poll(() => target.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(300)
  await page.waitForTimeout(50)
  await target.evaluate((element) => {
    element.scrollTop = 130
    element.dispatchEvent(new Event('scroll'))
  })
  await expect(status).toContainText('顶部：已固定')
  await expect(status).toContainText('底部：未固定')
  const topAffix = preview.getByText('容器顶部固定条', { exact: true })
  await expect(topAffix).toBeVisible()
  await expect(topAffix.locator('../..')).toHaveAttribute(
    'data-affixed',
    'true',
  )

  await target.evaluate((element) => {
    element.scrollTop = 260
    element.dispatchEvent(new Event('scroll'))
  })
  await expect(status).toContainText('顶部：未固定')
  await expect(status).toContainText('底部：已固定')
  const bottomAffix = preview.getByText('容器底部固定条', { exact: true })
  await expect(bottomAffix.locator('../..')).toHaveAttribute(
    'data-affixed',
    'true',
  )

  const geometry = await target.evaluate((element) => {
    const targetRect = element.getBoundingClientRect()
    const fixedRect = element
      .querySelector('[data-affixed="true"] [data-affix-content]')
      ?.getBoundingClientRect()
    return {
      targetTop: targetRect.top,
      targetBottom: targetRect.bottom,
      fixedTop: fixedRect?.top ?? -1,
      fixedBottom: fixedRect?.bottom ?? -1,
    }
  })
  expect(geometry.fixedTop).toBeGreaterThanOrEqual(geometry.targetTop)
  expect(geometry.fixedBottom).toBeLessThanOrEqual(geometry.targetBottom)
})
