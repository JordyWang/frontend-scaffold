import { expect, test } from '@playwright/test'

test('Flex keeps layout and keyboard order across width, RTL and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.locator('#ds-flex')
  const settings = preview.getByRole('group', { name: 'Flex 展示设置' })
  const flex = preview.locator('[data-ui-flex]')
  const items = flex.getByRole('button')
  const activate = async (button: ReturnType<typeof page.getByRole>) => {
    if (mobile) await button.tap()
    else await button.press('Enter')
  }
  const rectangles = () =>
    items.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { x: rect.x, y: rect.y }
      }),
    )

  await expect(items).toHaveCount(4)
  expect(
    await flex.evaluate((element) => getComputedStyle(element).flexDirection),
  ).toBe('row')
  expect(await flex.evaluate((element) => getComputedStyle(element).gap)).toBe(
    '24px',
  )
  const wide = await rectangles()
  if (mobile) expect(wide[3].y).toBeGreaterThan(wide[0].y)
  else expect(wide[0].y).toBeCloseTo(wide[3].y, 0)
  expect(wide[0].y).toBeCloseTo(wide[1].y, 0)
  expect(wide[0].x).toBeLessThan(wide[1].x)

  const narrow = settings.getByRole('button', { name: '窄容器' })
  await activate(narrow)
  await expect(narrow).toHaveAttribute('aria-pressed', 'true')
  const wrapped = await rectangles()
  expect(wrapped[0].y).toBeCloseTo(wrapped[1].y, 0)
  expect(wrapped[2].y).toBeGreaterThan(wrapped[0].y)

  const wrapping = settings.getByRole('button', { name: '自动换行' })
  await activate(wrapping)
  await expect(wrapping).toHaveAttribute('aria-pressed', 'false')
  const unwrapped = await rectangles()
  expect(unwrapped[0].y).toBeCloseTo(unwrapped[3].y, 0)
  expect(
    await flex.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true)
  await activate(wrapping)
  await expect(wrapping).toHaveAttribute('aria-pressed', 'true')

  const rtl = settings.getByRole('button', { name: 'RTL 方向' })
  await activate(rtl)
  const reversed = await rectangles()
  expect(reversed[0].x).toBeGreaterThan(reversed[1].x)
  expect(
    await flex.evaluate((element) => getComputedStyle(element).direction),
  ).toBe('rtl')

  expect(await items.allTextContents()).toEqual([
    '概览',
    '任务',
    '文件',
    '设置',
  ])
  if (testInfo.project.name !== 'mobile-webkit') {
    await items.first().focus()
    await page.keyboard.press('Tab')
    await expect(items.nth(1)).toBeFocused()
  }

  const vertical = settings.getByRole('button', { name: '纵向排列' })
  await activate(vertical)
  expect(
    await flex.evaluate((element) => getComputedStyle(element).flexDirection),
  ).toBe('column')
  const column = await rectangles()
  expect(column[1].y).toBeGreaterThan(column[0].y)

  await activate(items.nth(2))
  await expect(preview.getByRole('status')).toHaveText('已选择文件')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
