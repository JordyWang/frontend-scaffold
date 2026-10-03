import { expect, test } from '@playwright/test'

test('Space keeps separators and two-axis gaps aligned across PC and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.locator('#ds-space')
  const settings = preview.getByRole('group', { name: 'Space 展示设置' })
  const space = preview.getByLabel('Space 示例操作')
  const items = space.getByRole('button')
  const separators = space.locator('[data-space-separator]')
  const activate = async (button: ReturnType<typeof page.getByRole>) => {
    if (mobile) await button.tap()
    else await button.press('Enter')
  }
  const position = (locator: ReturnType<typeof page.locator>) =>
    locator.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, y: rect.y, bottom: rect.bottom }
    })

  await expect(items).toHaveCount(3)
  await expect(separators).toHaveCount(2)
  expect(
    await space.evaluate((element) => getComputedStyle(element).columnGap),
  ).toBe('16px')
  expect(
    await space.evaluate((element) => getComputedStyle(element).rowGap),
  ).toBe('16px')
  expect(
    await separators
      .first()
      .evaluate((element) =>
        element.parentElement?.getAttribute('aria-hidden'),
      ),
  ).toBe('true')

  const separateGaps = settings.getByRole('button', { name: '分别设置间距' })
  await activate(separateGaps)
  expect(
    await space.evaluate((element) => getComputedStyle(element).columnGap),
  ).toBe('24px')
  expect(
    await space.evaluate((element) => getComputedStyle(element).rowGap),
  ).toBe('8px')

  const narrow = settings.getByRole('button', { name: '窄容器' })
  await activate(narrow)
  const first = await position(items.first())
  const second = await position(items.nth(1))
  const separator = await position(separators.first())
  expect(second.y).toBeGreaterThan(first.y)
  expect(separator.y).toBeLessThan(first.bottom)
  expect((await position(items.nth(1))).y).toBeGreaterThan(separator.y)

  const vertical = settings.getByRole('button', { name: '纵向排列' })
  await activate(vertical)
  expect(
    await space.evaluate((element) => getComputedStyle(element).flexDirection),
  ).toBe('column')
  const verticalButton = await position(items.first())
  const verticalSeparator = await position(separators.first())
  expect(verticalSeparator.y).toBeGreaterThanOrEqual(verticalButton.bottom)

  const rtl = settings.getByRole('button', { name: 'RTL 方向' })
  await activate(rtl)
  await activate(vertical)
  await activate(narrow)
  expect(
    await space.evaluate((element) => getComputedStyle(element).direction),
  ).toBe('rtl')
  expect((await position(separators.first())).x).toBeLessThan(
    (await position(items.first())).x,
  )

  expect(await items.allTextContents()).toEqual(['查看', '编辑', '分享'])
  if (testInfo.project.name !== 'mobile-webkit') {
    await items.first().focus()
    await page.keyboard.press('Tab')
    await expect(items.nth(1)).toBeFocused()
  }
  await activate(items.nth(1))
  await expect(preview.getByRole('status')).toHaveText('已选择编辑')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
