import { expect, test } from '@playwright/test'

test('Tour keeps the requested side when there is enough room', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop geometry')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  await preview.getByRole('button', { name: '预览边缘放置' }).click()
  const card = page.getByRole('dialog', { name: '发布内容' })
  const target = preview.locator('#tour-publish')
  await expect
    .poll(async () => {
      const cardBox = await card.boundingBox()
      const targetBox = await target.boundingBox()
      return Boolean(
        cardBox && targetBox && cardBox.x >= targetBox.x + targetBox.width + 8,
      )
    })
    .toBe(true)
})

test('Tour flips away from a viewport-edge target and keeps the card usable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 320 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '预览边缘放置' })
  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()

  const card = page.getByRole('dialog', { name: '发布内容' })
  const target = preview.locator('#tour-publish')
  await expect(card).toBeVisible()
  await target.evaluate((element) => element.scrollIntoView({ block: 'end' }))
  await expect
    .poll(async () => {
      const cardBox = await card.boundingBox()
      const targetBox = await target.boundingBox()
      return Boolean(
        cardBox &&
        targetBox &&
        cardBox.y >= 12 &&
        cardBox.y + cardBox.height <= targetBox.y - 8 &&
        cardBox.y + cardBox.height <= 308,
      )
    })
    .toBe(true)

  const finish = card.getByRole('button', { name: '完成' })
  const box = await finish.boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await finish.tap()
  else await finish.click()
  await expect(card).toHaveCount(0)
  await expect(begin).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('Tour keeps expanded content and actions reachable in a short viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 240 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '开始引导' })
  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()
  const card = page.getByRole('dialog', { name: '上传素材' })
  const expand = card.getByRole('button', { name: '展开说明' })
  if (testInfo.project.name.startsWith('mobile-')) await expand.tap()
  else await expand.click()
  await expect(card.getByText(/引导卡片会在说明展开后重新定位/)).toBeVisible()
  const metrics = await card.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    height: element.getBoundingClientRect().height,
    scrollHeight: element.scrollHeight,
  }))
  expect(metrics.top).toBeGreaterThanOrEqual(12)
  expect(metrics.bottom).toBeLessThanOrEqual(228)
  expect(metrics.height).toBeLessThanOrEqual(216)
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.height)
  const next = card.getByRole('button', { name: '下一步' })
  if (testInfo.project.name.startsWith('mobile-')) await next.tap()
  else await next.click()
  await expect(page.getByRole('dialog', { name: '保存草稿' })).toBeVisible()
})
