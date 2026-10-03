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

test('controlled Tour restores focus only after the owner accepts closing', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '预览受控关闭' })
  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()

  const card = page.getByRole('dialog', { name: '受控关闭请求' })
  const close = card.getByRole('button', { name: '关闭引导' })
  await expect(close).toBeFocused()
  const bounds = await close.boundingBox()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await close.tap()
  else await close.press('Enter')
  await expect(card).toBeVisible()
  await expect(begin).not.toBeFocused()
  if (testInfo.project.name === 'mobile-webkit') {
    // WebKit can clear button focus after a tap; the next keyboard Tab must
    // still enter the guarded card instead of moving through the page.
    await page.keyboard.press('Tab')
  }
  await expect(close).toBeFocused()

  if (testInfo.project.name.startsWith('mobile-')) await close.tap()
  else await close.press('Enter')
  await expect(card).toHaveCount(0)
  await expect(begin).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('Tour arrow follows the card while disabledInteraction protects the target', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '预览禁止目标交互' })
  const target = preview.getByRole('button', { name: '上传素材' })
  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()

  const card = page.getByRole('dialog', { name: '禁止目标交互' })
  const close = card.getByRole('button', { name: '关闭引导' })
  const finish = card.getByRole('button', { name: '完成' })
  const arrow = page.locator('[data-tour-arrow]')
  await expect(card).toHaveClass(/bg-primary/)
  await expect(card).toHaveAttribute('aria-modal', 'true')
  await expect(target).toHaveAttribute('inert', '')
  await expect(arrow).toBeVisible()
  expect(
    await arrow.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe(
    await card.evaluate((element) => getComputedStyle(element).backgroundColor),
  )
  const side = await arrow.getAttribute('data-tour-arrow')
  const cardBox = await card.boundingBox()
  const arrowBox = await arrow.boundingBox()
  const arrowCenterX = arrowBox!.x + arrowBox!.width / 2
  const arrowCenterY = arrowBox!.y + arrowBox!.height / 2
  const cardEdge =
    side === 'top'
      ? cardBox!.y + cardBox!.height
      : side === 'bottom'
        ? cardBox!.y
        : side === 'left'
          ? cardBox!.x + cardBox!.width
          : cardBox!.x
  expect(
    Math.abs(
      side === 'top' || side === 'bottom'
        ? arrowCenterY - cardEdge
        : arrowCenterX - cardEdge,
    ),
  ).toBeLessThanOrEqual(2)

  const targetBox = await target.boundingBox()
  if (testInfo.project.name.startsWith('mobile-')) {
    await page.touchscreen.tap(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
    )
  } else {
    await page.mouse.click(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
    )
  }
  await expect(preview.getByText(/上传按钮已点击/)).toContainText('0 次')
  await close.focus()
  await page.keyboard.press('Tab')
  await expect(finish).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()

  if (testInfo.project.name.startsWith('mobile-')) await finish.tap()
  else await finish.click()
  await expect(card).toHaveCount(0)
  await expect(target).not.toHaveAttribute('inert')
  await expect(begin).toBeFocused()
  if (testInfo.project.name.startsWith('mobile-')) await target.tap()
  else await target.click()
  await expect(preview.getByText(/上传按钮已点击/)).toContainText('1 次')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
