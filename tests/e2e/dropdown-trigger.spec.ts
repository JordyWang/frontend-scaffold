import { expect, test } from '@playwright/test'

test('Dropdown hover keeps the Portal menu reachable and touch has a click path', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await page.goto('/__ui', { waitUntil: 'domcontentloaded' })
  await page.setViewportSize({ width: 360, height: 844 })
  const group = page.getByRole('group', {
    name: 'Dropdown 触发与位置预览',
  })
  const trigger = group.getByRole('button', { name: '悬停打开菜单' })
  const menu = page.getByRole('menu', { name: '悬停菜单' })
  if (testInfo.project.name.startsWith('mobile-')) {
    const box = await trigger.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await trigger.tap()
    await expect(menu).toBeVisible()
    await page.waitForTimeout(150)
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: '分享项目' }).tap()
  } else {
    await trigger.hover()
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: '分享项目' }).hover()
    await expect(menu).toBeVisible()
    await menu.getByRole('menuitem', { name: '分享项目' }).click()
  }
  await expect(menu).toHaveCount(0)
  await expect(group.getByRole('status')).toContainText('分享项目')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('Dropdown context menu uses the pointer, keyboard and H5 tap', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const group = page.getByRole('group', {
    name: 'Dropdown 触发与位置预览',
  })
  const trigger = group.getByRole('button', { name: '右键打开菜单' })
  const menu = page.getByRole('menu', { name: '右键菜单' })
  await trigger.scrollIntoViewIfNeeded()
  const triggerBox = await trigger.boundingBox()
  if (testInfo.project.name.startsWith('mobile-')) {
    await trigger.tap()
  } else {
    await trigger.click({ button: 'right', position: { x: 20, y: 20 } })
  }
  await expect(menu).toBeVisible()
  await expect(menu).toHaveAttribute(
    'data-ui-floating-placement',
    /^(left|right)-start$/,
  )
  const menuBox = await menu.boundingBox()
  const viewport = page.viewportSize()!
  expect(menuBox!.x).toBeGreaterThanOrEqual(0)
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width)
  if (!testInfo.project.name.startsWith('mobile-')) {
    const anchorX = triggerBox!.x + 20
    const anchorY = triggerBox!.y + 20
    const side = (await menu.getAttribute('data-ui-floating-placement'))!.split(
      '-',
    )[0]
    if (side === 'right')
      expect(Math.abs(menuBox!.x - anchorX - 4)).toBeLessThanOrEqual(2)
    else
      expect(
        Math.abs(menuBox!.x + menuBox!.width - anchorX + 4),
      ).toBeLessThanOrEqual(2)
    expect(Math.abs(menuBox!.y - anchorY)).toBeLessThanOrEqual(2)
  }
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.focus()
  await trigger.press('Shift+F10')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '打开项目' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
})

test('Dropdown placement picker covers twelve directions and a controlled menu', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop geometry')
  test.setTimeout(60_000)
  await page.goto('/__ui')
  const group = page.getByRole('group', {
    name: 'Dropdown 触发与位置预览',
  })
  const select = group.getByRole('combobox', { name: '菜单位置' })
  const trigger = group.getByRole('button', { name: '查看位置菜单' })
  const menu = page.getByRole('menu', { name: '位置菜单' })
  for (const placement of [
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
  ]) {
    await select.click()
    await page.getByRole('option', { name: placement, exact: true }).click()
    await trigger.click()
    await expect(menu).toBeVisible()
    const [side, alignment] = placement.split('-')
    const actual = await menu.getAttribute('data-ui-floating-placement')
    const [actualSide, actualAlignment] = actual!.split('-')
    expect(actualAlignment).toBe(alignment)
    expect(['top', 'bottom'].includes(actualSide)).toBe(
      ['top', 'bottom'].includes(side),
    )
    const box = await menu.boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
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
  await expect(menu).toHaveAttribute('data-ui-floating-placement', 'left')
  await page.keyboard.press('Escape')

  await select.click()
  await page.getByRole('option', { name: 'top', exact: true }).click()
  await trigger.locator('..').evaluate((element) => {
    const root = element as HTMLElement
    root.style.top = '8px'
  })
  await trigger.click()
  await expect(menu).toHaveAttribute('data-ui-floating-placement', 'bottom')
  await page.keyboard.press('Escape')

  const controlled = page.getByRole('menu', { name: '受控菜单' })
  await group.getByRole('button', { name: '外部打开菜单' }).click()
  await expect(controlled).toBeVisible()
  await expect(group.getByRole('status')).toContainText('受控菜单：已打开')
  await group.getByRole('button', { name: '外部关闭菜单' }).click()
  await expect(controlled).toHaveCount(0)
  await expect(group.getByRole('status')).toContainText('受控菜单：已关闭')
})
