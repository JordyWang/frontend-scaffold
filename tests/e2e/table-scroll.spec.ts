import { expect, test } from '@playwright/test'

test('a narrow RTL Table scrolls locally with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('group', { name: '窄 RTL 表格预览' })
  const region = preview.getByRole('region', {
    name: '窄 RTL 数据表横向滚动',
  })
  await expect(
    region.getByRole('table', { name: '窄 RTL 数据表' }),
  ).toBeVisible()
  expect(
    await region.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  await region.focus()
  await region.press('End')
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeLessThan(0)
  await region.press('Home')
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBe(0)
  await region.press('ArrowLeft')
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeLessThan(0)
  await region.evaluate((element) => {
    element.scrollLeft = 0
  })

  if (testInfo.project.name === 'mobile-chromium') {
    const box = (await region.boundingBox())!
    const session = await page.context().newCDPSession(page)
    const y = box.y + box.height * 0.65
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.2, y }],
    })
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: box.x + box.width * (0.2 + step * 0.075), y }],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
    await expect
      .poll(() => region.evaluate((element) => element.scrollLeft))
      .toBeLessThan(0)
  }
  await expect(region).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
