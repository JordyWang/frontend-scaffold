import { expect, test } from '@playwright/test'

test('Tooltip supports twelve placements and flips near viewport edges', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop geometry')
  test.setTimeout(60_000)
  await page.goto('/__ui')
  const group = page.getByRole('group', { name: '提示状态' })
  const select = group.getByRole('combobox', { name: '提示位置' })
  const trigger = group.getByRole('button', { name: '查看位置提示' })
  const tooltip = page.getByRole('tooltip')
  const placements = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ]

  for (const placement of placements) {
    await select.click()
    await page.getByRole('option', { name: placement, exact: true }).click()
    await trigger.focus()
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveText(`当前请求位置：${placement}`)
    const id = await tooltip.getAttribute('id')
    expect(id).not.toBeNull()
    await expect(trigger).toHaveAttribute('aria-describedby', id!)
    const actual = await tooltip.getAttribute('data-ui-floating-placement')
    const [requestedSide, alignment] = placement.split('-')
    const [actualSide, actualAlignment] = actual!.split('-')
    expect(actualAlignment).toBe(alignment)
    expect(['top', 'bottom'].includes(actualSide)).toBe(
      ['top', 'bottom'].includes(requestedSide),
    )
    const box = await tooltip.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
  }

  await select.click()
  await page.getByRole('option', { name: 'right', exact: true }).click()
  await trigger.locator('..').evaluate((element) => {
    const root = element as HTMLElement
    root.style.position = 'fixed'
    root.style.right = '8px'
    root.style.top = '200px'
  })
  await trigger.focus()
  await expect(tooltip).toHaveAttribute('data-ui-floating-placement', 'left')
  await page.keyboard.press('Escape')

  await select.click()
  await page.getByRole('option', { name: 'top', exact: true }).click()
  await trigger.locator('..').evaluate((element) => {
    const root = element as HTMLElement
    root.style.top = '8px'
  })
  await trigger.focus()
  await expect(tooltip).toHaveAttribute('data-ui-floating-placement', 'bottom')
})

test('Tooltip start alignment follows RTL and stays usable on H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  await page.setViewportSize({ width: 360, height: 844 })
  const trigger = page.getByRole('button', { name: '打开 RTL 提示' })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.focus()
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox!.width).toBeGreaterThanOrEqual(44)
  expect(triggerBox!.height).toBeGreaterThanOrEqual(44)
  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveAttribute('dir', 'rtl')
  await expect(tooltip).toHaveCSS('direction', 'rtl')
  await expect(tooltip).toHaveAttribute(
    'data-ui-floating-placement',
    /^(top|bottom)-start$/,
  )
  const tooltipBox = await tooltip.boundingBox()
  expect(tooltipBox!.x + tooltipBox!.width).toBeCloseTo(
    triggerBox!.x + triggerBox!.width,
    0,
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
})
