import { expect, test } from '@playwright/test'

test('Table keeps grouped headers and summary in a local vertical scroller', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const tableRegion = page.getByRole('region', {
    name: '纵向滚动任务表',
    exact: true,
  })
  const scrollRegion = tableRegion.getByRole('region', {
    name: '纵向滚动任务表滚动区域',
  })
  const list = tableRegion.getByRole('list', { name: '纵向滚动任务表' })

  if (mobile) {
    await expect(scrollRegion).toBeHidden()
    await expect(list).toBeVisible()
    await expect(list.locator('li')).toHaveCount(12)
    await expect(list.locator('li').first()).toContainText('任务 1')
    await expect(list.locator('li').last()).toContainText('任务 12')
  } else {
    await expect(scrollRegion).toBeVisible()
    const table = scrollRegion.getByRole('table', {
      name: '纵向滚动任务表',
    })
    const header = table.locator('thead')
    const summary = table.locator('tfoot')
    await expect(table.locator('thead tr')).toHaveCount(2)
    expect(
      await scrollRegion.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true)
    await scrollRegion.focus()
    await scrollRegion.press('PageDown')
    await expect
      .poll(() => scrollRegion.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
    const scrollerBox = (await scrollRegion.boundingBox())!
    const headerBox = (await header.boundingBox())!
    const summaryBox = (await summary.boundingBox())!
    expect(headerBox.y).toBeGreaterThanOrEqual(scrollerBox.y - 2)
    expect(headerBox.y + headerBox.height).toBeLessThan(
      scrollerBox.y + scrollerBox.height,
    )
    expect(summaryBox.y + summaryBox.height).toBeLessThanOrEqual(
      scrollerBox.y + scrollerBox.height + 2,
    )
    await scrollRegion.press('End')
    await expect
      .poll(() => scrollRegion.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(100)
    await expect(scrollRegion).toBeFocused()
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
