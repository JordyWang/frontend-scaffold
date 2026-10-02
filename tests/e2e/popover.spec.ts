import { expect, test } from '@playwright/test'

test('Popover hover and focus modes work with pointer, keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const demo = page.getByRole('group', { name: 'Popover 触发与位置预览' })
  const hoverTrigger = demo.getByRole('button', { name: '悬停查看气泡' })
  const hoverPanel = page.getByRole('dialog', { name: '悬停气泡' })

  if (testInfo.project.name.startsWith('mobile-')) {
    await hoverTrigger.tap()
    await expect(hoverPanel).toBeVisible()
    await page.waitForTimeout(150)
    await expect(hoverPanel).toBeVisible()
    await hoverPanel.getByRole('button', { name: '悬停气泡内操作' }).tap()
    await expect(hoverPanel).toBeVisible()
    await demo.getByRole('button', { name: '外部关闭气泡' }).tap()
    await expect(hoverPanel).toHaveCount(0)
  } else {
    await hoverTrigger.hover()
    await expect(hoverPanel).toBeVisible()
    await expect(hoverPanel).toHaveAttribute(
      'data-ui-floating-placement',
      /^(top|bottom)-end$/,
    )
    await hoverPanel.getByRole('button', { name: '悬停气泡内操作' }).hover()
    await expect(hoverPanel).toBeVisible()
    await page.mouse.move(0, 0)
    await expect(hoverPanel).toHaveCount(0)
  }

  const focusTrigger = demo.getByRole('button', { name: '聚焦查看气泡' })
  if (testInfo.project.name.startsWith('mobile-')) await focusTrigger.tap()
  else await focusTrigger.focus()
  const focusPanel = page.getByRole('dialog', { name: '聚焦气泡' })
  await expect(focusPanel).toBeVisible()
  await expect(focusPanel).toHaveAttribute(
    'data-ui-floating-placement',
    /^(left|right)-start$/,
  )
  await focusTrigger.focus()
  await page.keyboard.press('Tab')
  await expect(
    focusPanel.getByRole('button', { name: '聚焦气泡内操作' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(focusPanel).toHaveCount(0)
  await expect(focusTrigger).toBeFocused()
  await expect(focusTrigger).toHaveAttribute('aria-expanded', 'false')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('Popover controlled state and floating placement stay in the viewport', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const demo = page.getByRole('group', { name: 'Popover 触发与位置预览' })
  const trigger = demo.getByRole('button', { name: '切换受控气泡' })
  const panel = page.getByRole('dialog', { name: '受控气泡' })
  const status = demo.getByRole('status')
  await expect(status).toHaveText('受控气泡：已关闭')
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  await expect(panel).toBeVisible()
  await expect(status).toHaveText('受控气泡：已打开')
  await expect(panel).toHaveAttribute(
    'data-ui-floating-placement',
    /^(left|right)-end$/,
  )
  const box = await panel.boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
  if (testInfo.project.name.startsWith('mobile-'))
    await demo.getByRole('button', { name: '外部关闭气泡' }).tap()
  else await demo.getByRole('button', { name: '外部关闭气泡' }).click()
  await expect(panel).toHaveCount(0)
  await expect(status).toHaveText('受控气泡：已关闭')
  if (testInfo.project.name.startsWith('mobile-'))
    await demo.getByRole('button', { name: '外部打开气泡' }).tap()
  else await demo.getByRole('button', { name: '外部打开气泡' }).click()
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Popover exposes every requested placement and flips at viewport edges', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop geometry')
  test.setTimeout(60_000)
  await page.goto('/__ui')
  const demo = page.getByRole('group', { name: 'Popover 触发与位置预览' })
  const select = demo.getByRole('combobox', { name: '气泡位置' })
  const trigger = demo.getByRole('button', { name: '查看位置气泡' })
  const panel = page.getByRole('dialog', { name: '位置气泡' })
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
    await trigger.click()
    await expect(panel).toBeVisible()
    await expect(panel).toContainText(`当前请求位置：${placement}`)
    const actual = await panel.getAttribute('data-ui-floating-placement')
    const [requestedSide, alignment] = placement.split('-')
    const [actualSide, actualAlignment] = actual!.split('-')
    expect(actualAlignment).toBe(alignment)
    expect(['top', 'bottom'].includes(actualSide)).toBe(
      ['top', 'bottom'].includes(requestedSide),
    )
    const box = await panel.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    await trigger.click()
    await expect(panel).toHaveCount(0)
  }

  await select.click()
  await page.getByRole('option', { name: 'right', exact: true }).click()
  await trigger.locator('..').evaluate((element) => {
    const root = element as HTMLElement
    root.style.position = 'fixed'
    root.style.right = '8px'
    root.style.top = '200px'
  })
  await trigger.click()
  await expect(panel).toHaveAttribute('data-ui-floating-placement', 'left')
  await trigger.click()

  await select.click()
  await page.getByRole('option', { name: 'top', exact: true }).click()
  await trigger.locator('..').evaluate((element) => {
    const root = element as HTMLElement
    root.style.top = '8px'
  })
  await trigger.click()
  await expect(panel).toHaveAttribute('data-ui-floating-placement', 'bottom')
})
