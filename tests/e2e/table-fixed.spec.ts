import { expect, test } from '@playwright/test'

test('Table fixed columns stay at logical edges across scroll, responsive groups and RTL', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const region = page.getByRole('region', {
    name: '固定列任务表',
    exact: true,
  })
  const scroller = region.getByRole('region', {
    name: '固定列任务表滚动区域',
  })
  const table = scroller.getByRole('table', { name: '固定列任务表' })
  const selection = table.locator(
    'thead th[data-ui-table-structure="selection"]',
  )
  const name = table.locator('thead th[data-ui-table-leaf="name"]')
  const owner = table.locator('thead th[data-ui-table-leaf="owner"]')
  const group = table.getByRole('columnheader', { name: '成员' })
  const updated = table.locator('thead th[data-ui-table-leaf="updated"]')
  const status = table.locator('thead th[data-ui-table-leaf="status"]')

  await expect(scroller).toBeVisible()
  expect(
    await scroller.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  expect(
    await scroller.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
  await expect(name).toHaveAttribute('data-ui-fixed', 'start')
  await expect(updated).toHaveAttribute('data-ui-fixed', 'end')
  if (mobile) {
    await expect(group).toHaveCount(0)
    await expect(owner).toHaveCount(0)
  } else {
    await expect(group).toHaveAttribute('colspan', '2')
    await expect(group).toHaveAttribute('data-ui-fixed', 'start')
  }

  const before = {
    selection: (await selection.boundingBox())!,
    name: (await name.boundingBox())!,
    updated: (await updated.boundingBox())!,
    status: (await status.boundingBox())!,
  }
  await scroller.focus()
  await scroller.press('End')
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)
  const box = (await scroller.boundingBox())!
  const after = {
    selection: (await selection.boundingBox())!,
    name: (await name.boundingBox())!,
    updated: (await updated.boundingBox())!,
    status: (await status.boundingBox())!,
  }
  expect(Math.abs(after.selection.x - box.x)).toBeLessThan(3)
  expect(
    Math.abs(after.name.x - (after.selection.x + after.selection.width)),
  ).toBeLessThan(3)
  expect(
    Math.abs(after.updated.x + after.updated.width - (box.x + box.width)),
  ).toBeLessThan(3)
  expect(Math.abs(after.name.x - before.name.x)).toBeLessThan(3)
  expect(Math.abs(after.updated.x - before.updated.x)).toBeLessThan(3)
  expect(after.status.x).toBeLessThan(before.status.x - 30)
  const bodyName = (await table
    .locator('tbody tr:first-child [headers$="-column-name"]')
    .boundingBox())!
  const summaryUpdated = (await table
    .locator('tfoot [headers$="-column-updated"]')
    .boundingBox())!
  expect(Math.abs(bodyName.x - after.name.x)).toBeLessThan(3)
  expect(Math.abs(summaryUpdated.x - after.updated.x)).toBeLessThan(3)

  if (!mobile) {
    const ownerBox = (await owner.boundingBox())!
    const teamBox = (await table
      .locator('thead th[data-ui-table-leaf="team"]')
      .boundingBox())!
    const groupBox = (await group.boundingBox())!
    expect(Math.abs(groupBox.x - ownerBox.x)).toBeLessThan(3)
    expect(
      Math.abs(groupBox.width - ownerBox.width - teamBox.width),
    ).toBeLessThan(3)
    await scroller.press('PageDown')
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
    const verticalBox = (await scroller.boundingBox())!
    const headerBox = (await table.locator('thead').boundingBox())!
    const footerBox = (await table.locator('tfoot').boundingBox())!
    expect(headerBox.y).toBeGreaterThanOrEqual(verticalBox.y - 2)
    expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(
      verticalBox.y + verticalBox.height + 2,
    )
    await region.evaluate((element) => {
      element.parentElement!.style.width = '380px'
    })
    await expect(group).toHaveCount(0)
    await expect(owner).toHaveCount(0)
    const narrowBox = (await scroller.boundingBox())!
    const narrowName = (await name.boundingBox())!
    const narrowUpdated = (await updated.boundingBox())!
    expect(
      Math.abs(
        narrowName.x -
          (await selection.boundingBox())!.x -
          (await selection.boundingBox())!.width,
      ),
    ).toBeLessThan(3)
    expect(
      Math.abs(
        narrowUpdated.x + narrowUpdated.width - narrowBox.x - narrowBox.width,
      ),
    ).toBeLessThan(3)
  }

  if (mobile && testInfo.project.name === 'mobile-chromium') {
    await scroller.evaluate((element) => {
      element.scrollLeft = 0
    })
    const session = await page.context().newCDPSession(page)
    const y = box.y + box.height * 0.6
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.8, y }],
    })
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: box.x + box.width * (0.8 - step * 0.075), y }],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0)
    expect(
      Math.abs((await name.boundingBox())!.x - before.name.x),
    ).toBeLessThan(3)
  }

  if (!mobile) {
    await region.evaluate((element) => element.setAttribute('dir', 'rtl'))
    await scroller.focus()
    await scroller.press('End')
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollLeft))
      .toBeLessThan(0)
    const rtlBox = (await scroller.boundingBox())!
    const rtlSelection = (await selection.boundingBox())!
    const rtlUpdated = (await updated.boundingBox())!
    expect(
      Math.abs(rtlSelection.x + rtlSelection.width - (rtlBox.x + rtlBox.width)),
    ).toBeLessThan(3)
    expect(Math.abs(rtlUpdated.x - rtlBox.x)).toBeLessThan(3)
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
