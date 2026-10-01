import { expect, test } from '@playwright/test'

test('single image preview supports transforms, focus and responsive geometry', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('button', {
    name: '预览：示例封面',
    exact: true,
  })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: '图片预览', exact: true })
  const image = dialog.locator('[data-ui-image-preview]')
  const close = dialog.getByRole('button', { name: '关闭图片预览' })
  await expect(image).toBeVisible()
  await expect(close).toBeFocused()
  const zoom = dialog.getByRole('button', { name: '放大图片' })
  for (let index = 0; index < 4; index++) {
    if (testInfo.project.name.startsWith('mobile-')) await zoom.tap()
    else await zoom.click()
  }
  await expect(dialog.getByRole('status', { name: '图片缩放比例' })).toHaveText(
    '400%',
  )
  await expect(zoom).toBeDisabled()

  if (testInfo.project.name === 'desktop-chromium') {
    const stage = await dialog
      .getByRole('group', { name: '图片预览区域' })
      .boundingBox()
    const center = {
      x: stage!.x + stage!.width / 2,
      y: stage!.y + stage!.height / 2,
    }
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 60, center.y + 30, { steps: 4 })
    await page.mouse.up()
    await expect(dialog).toBeVisible()
    expect(
      await image.evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).e,
      ),
    ).toBeGreaterThan(50)
  }
  await dialog.getByRole('button', { name: '重置图片' }).click()
  await dialog.getByRole('button', { name: '向右旋转图片' }).click()
  const imageBox = await image.boundingBox()
  const stageBox = await dialog
    .getByRole('group', { name: '图片预览区域' })
    .boundingBox()
  expect(imageBox!.width).toBeLessThanOrEqual(stageBox!.width + 1)
  expect(imageBox!.height).toBeLessThanOrEqual(stageBox!.height + 1)
  await dialog.getByRole('button', { name: '水平翻转图片' }).click()
  await expect(
    dialog.getByRole('button', { name: '水平翻转图片' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: '重置图片' }).click()
  await expect(dialog.getByRole('status', { name: '图片缩放比例' })).toHaveText(
    '100%',
  )
  if (testInfo.project.name === 'desktop-chromium') {
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 720 })
      await expect
        .poll(async () =>
          dialog.evaluate((element) => ({
            overflow: element.scrollWidth > element.clientWidth,
            outside: Array.from(element.querySelectorAll('button')).filter(
              (button) => {
                const rect = button.getBoundingClientRect()
                return rect.left < 0 || rect.right > window.innerWidth
              },
            ).length,
          })),
        )
        .toEqual({ overflow: false, outside: 0 })
    }
  }
  const geometry = await dialog.evaluate((element) => ({
    overflow: element.scrollWidth > element.clientWidth,
    smallButtons: Array.from(element.querySelectorAll('button')).filter(
      (button) => {
        const rect = button.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
      },
    ).length,
  }))
  expect(geometry).toEqual({ overflow: false, smallButtons: 0 })
  await page.screenshot({
    path: `output/playwright/image-preview-${testInfo.project.name}.png`,
  })
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  const external = page.getByRole('button', { name: '打开受控图片预览' })
  await external.press('Enter')
  await expect(dialog).toBeVisible()
  await close.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(external).toBeFocused()
})

test('gallery switches images and closes to the activated thumbnail', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('button', { name: '预览：相册纵向插图' })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: '媒体相册预览' })
  await expect(dialog.getByRole('img', { name: '相册纵向插图' })).toBeVisible()
  await expect(dialog.getByRole('status', { name: '图片序号' })).toHaveText(
    '2 / 2',
  )
  await expect(
    dialog.getByRole('button', { name: '下一张图片' }),
  ).toBeDisabled()
  const previous = dialog.getByRole('button', { name: '上一张图片' })
  if (testInfo.project.name.startsWith('mobile-')) await previous.tap()
  else
    await dialog
      .getByRole('button', { name: '关闭图片预览' })
      .press('ArrowLeft')
  await expect(dialog.getByRole('img', { name: '相册横向封面' })).toBeVisible()
  await expect(dialog.getByRole('status', { name: '图片序号' })).toHaveText(
    '1 / 2',
  )
  await dialog.getByRole('button', { name: '下一张图片' }).click()
  await expect(dialog.getByRole('img', { name: '相册纵向插图' })).toBeVisible()
  await expect(dialog.getByRole('status', { name: '图片缩放比例' })).toHaveText(
    '100%',
  )
  const stage = dialog.getByRole('group', { name: '图片预览区域' })
  if (testInfo.project.name.startsWith('mobile-'))
    await stage.tap({ position: { x: 8, y: 8 } })
  else await stage.click({ position: { x: 8, y: 8 } })
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('failed preview provides an accessible retry and close path', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('button', { name: '预览：预览加载失败示例' })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: '图片预览', exact: true })
  await expect(dialog.getByRole('alert')).toContainText('图片预览加载失败')
  await expect(dialog.getByRole('button', { name: '放大图片' })).toBeDisabled()
  const request = page.waitForRequest((candidate) =>
    candidate.url().endsWith('/mock/media/missing-preview.svg'),
  )
  const retry = dialog.getByRole('button', { name: '重试加载图片' })
  if (testInfo.project.name.startsWith('mobile-')) await retry.tap()
  else await retry.press('Enter')
  await request
  await expect(dialog.getByRole('alert')).toContainText('图片预览加载失败')
  await dialog.getByRole('button', { name: '关闭图片预览' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('image preview composes with a parent dialog and restores its focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const outerTrigger = page.getByRole('button', { name: '在对话框中预览图片' })
  if (testInfo.project.name.startsWith('mobile-')) await outerTrigger.tap()
  else await outerTrigger.press('Enter')
  const outer = page.getByRole('dialog', { name: '图片预览容器' })
  const trigger = outer.getByRole('button', { name: '预览：对话框中的封面' })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.press('Enter')
  const preview = page.getByRole('dialog', { name: '图片预览', exact: true })
  await expect(
    preview.getByRole('img', { name: '对话框中的封面' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(preview).toHaveCount(0)
  await expect(outer).toBeVisible()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(outer).toHaveCount(0)
  await expect(outerTrigger).toBeFocused()
})
