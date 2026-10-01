import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('cascader browses columns without committing parents and confirms a complete leaf path', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  await activate(demo.getByRole('button', { name: '设置受控空路径' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '地区列式选择' })
  await activate(trigger, mobile)
  const search = page.getByRole('searchbox', { name: '搜索地区列式选择' })
  await expect(search).toBeFocused()
  const tree = page.getByRole('tree', { name: '地区列式选择' })
  const country = tree.getByRole('treeitem', { name: '中国', exact: true })
  const city = tree.getByRole('treeitem', { name: '上海', exact: true })
  const leaf = tree.getByRole('treeitem', { name: '中心城区', exact: true })
  if (mobile) {
    await country.tap()
    await city.tap()
  } else {
    await search.press('ArrowDown')
    await expect(country).toBeFocused()
    await country.press('ArrowRight')
    await expect(city).toBeFocused()
    await city.press('ArrowRight')
    await expect(leaf).toBeFocused()
    await expect(leaf).toHaveCSS('outline-style', 'solid')
  }
  await expect(demo.getByRole('status', { name: '级联选择值' })).toHaveText(
    '[]',
  )
  await activate(leaf, mobile)
  await expect(trigger).toContainText('中国 / 上海 / 中心城区')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()
  await expect(demo.getByRole('status', { name: '级联选择值' })).toHaveText(
    '["cn","sh","center"]',
  )
  const clear = demo.getByRole('button', { name: '清空地区列式选择' })
  const box = (await clear.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(clear, mobile)
  await expect(trigger).toContainText('请选择')
  await expect(trigger).toBeFocused()
})

test('cascader searches full paths and protects disabled ancestors and empty results', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '地区列式选择' })
  await activate(trigger, mobile)
  const search = page.getByRole('searchbox', { name: '搜索地区列式选择' })
  const results = page.getByRole('listbox', { name: '地区列式选择' })
  await search.fill('中心')
  await expect(results.getByRole('option')).toHaveCount(3)
  const beijing = results.getByRole('option', {
    name: '中国 / 北京 / 中心城区',
  })
  await activate(beijing, mobile)
  await expect(demo.getByRole('status', { name: '级联选择值' })).toHaveText(
    '["cn","bj","center"]',
  )
  await activate(trigger, mobile)
  await search.fill('禁用地区后代')
  const blocked = results.getByRole('option')
  await expect(blocked).toHaveAttribute('aria-disabled', 'true')
  // Exercise our disabled guard while bypassing Playwright's aria-disabled check.
  if (mobile) await blocked.tap({ force: true })
  else await blocked.click({ force: true })
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(demo.getByRole('status', { name: '级联选择值' })).toHaveText(
    '["cn","bj","center"]',
  )
  await search.fill('不存在的路径')
  await expect(results.getByRole('status')).toHaveText('暂无匹配选项')
  await search.fill('')
  await expect(page.getByRole('tree', { name: '地区列式选择' })).toBeVisible()
  await search.press('Escape')
  await expect(trigger).toBeFocused()
})

test('cascader portal preserves forward and reverse Tab and closes on outside focus', async ({
  page,
}) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '地区列式选择' })
  await trigger.focus()
  await trigger.press('ArrowDown')
  const search = page.getByRole('searchbox', { name: '搜索地区列式选择' })
  await search.press('Tab')
  const leaf = page
    .getByRole('tree', { name: '地区列式选择' })
    .getByRole('treeitem', { name: '中心城区', exact: true })
  await expect(leaf).toBeFocused()
  await leaf.press('Shift+Tab')
  await expect(search).toBeFocused()
  await search.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.press('ArrowDown')
  await search.press('ArrowDown')
  await leaf.press('Tab')
  const clear = demo.getByRole('button', { name: '清空地区列式选择' })
  await expect(clear).toBeFocused()
  await clear.press('Tab')
  const next = demo.getByRole('textbox', { name: '级联选择后的输入' })
  await expect(next).toBeFocused()
  await trigger.press('ArrowDown')
  await next.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(next).toBeFocused()
})

test('cascader hover expands on a mouse and click browsing remains available on H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '悬停级联' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '悬停级联' })
  const country = tree.getByRole('treeitem', { name: '中国', exact: true })
  if (mobile) await country.tap()
  else await country.hover()
  const city = tree.getByRole('treeitem', { name: '上海', exact: true })
  await expect(city).toBeVisible()
  if (mobile) await city.tap()
  else await city.hover()
  await expect(trigger).toContainText('请选择')
  await activate(
    tree.getByRole('treeitem', { name: '中心城区', exact: true }),
    mobile,
  )
  await expect(trigger).toContainText('中国 / 上海 / 中心城区')
  await expect(trigger).toBeFocused()
})

test('cascader End reveals a distant item inside its column without scrolling the page', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '六十个部门' })
  await trigger.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  const before = await page.evaluate(() => window.scrollY)
  await trigger.press('ArrowDown')
  const tree = page.getByRole('tree', { name: '六十个部门' })
  await tree
    .getByRole('treeitem', { name: '全部部门', exact: true })
    .press('ArrowRight')
  await tree
    .getByRole('treeitem', { name: '部门 00', exact: true })
    .press('End')
  const last = tree.getByRole('treeitem', { name: '部门 59', exact: true })
  await expect(last).toBeFocused()
  await expect(last).toHaveAttribute('aria-posinset', '60')
  expect(
    await last.locator('..').evaluate((element) => element.scrollTop),
  ).toBeGreaterThan(0)
  const row = (await last.boundingBox())!
  const viewport = (await tree.boundingBox())!
  expect(row.y).toBeGreaterThanOrEqual(viewport.y)
  expect(row.y + row.height).toBeLessThanOrEqual(viewport.y + viewport.height)
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThan(2)
  await tree.screenshot({
    path: 'output/playwright/cascader-scroll-' + testInfo.project.name + '.png',
  })
  await last.press('Enter')
  await expect(trigger).toContainText('部门 59')
  await expect(trigger).toBeFocused()
})

test('cascader panel and RTL dark mode keep long paths inside responsive viewports', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  await activate(
    demo.getByRole('button', { name: '使用 RTL 级联选择' }),
    mobile,
  )
  const panel = demo.getByRole('tree', { name: '内嵌地区选择' })
  await expect(panel).toHaveAttribute('dir', 'rtl')
  const country = panel.getByRole('treeitem', { name: '中国', exact: true })
  await country.focus()
  await country.press('ArrowLeft')
  const city = panel.getByRole('treeitem', { name: '上海', exact: true })
  await expect(city).toBeFocused()
  await city.press('ArrowLeft')
  const leaf = panel.getByRole('treeitem', { name: '中心城区', exact: true })
  await expect(leaf).toBeFocused()
  await leaf.press('ArrowRight')
  await expect(city).toBeFocused()
  await city.press('ArrowLeft')
  await leaf.press('Enter')
  await expect(demo.getByRole('status', { name: '级联面板路径' })).toHaveText(
    '["cn","sh","center"]',
  )
  const trigger = demo.getByRole('combobox', { name: '地区列式选择' })
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 780 })
    await trigger.evaluate((element) =>
      element.scrollIntoView({ block: 'center' }),
    )
    await activate(trigger, mobile)
    const popup = page.getByRole('dialog', { name: '地区列式选择选项' })
    await expect(popup).toHaveAttribute('dir', 'rtl')
    const search = page.getByRole('searchbox', { name: '搜索地区列式选择' })
    await search.fill('覆盖长名称')
    const result = popup.getByRole('option')
    await expect(result).toHaveCSS('white-space', 'normal')
    const box = (await popup.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(7)
    expect(box.x + box.width).toBeLessThanOrEqual(width - 7)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(780)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
    if (width === 360)
      await popup.screenshot({
        path:
          'output/playwright/cascader-rtl-' + testInfo.project.name + '.png',
      })
    await search.press('Escape')
  }
})

test('cascader logical popup placements align and flip when the viewport has less room', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择完整预览' })
  for (const placement of ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']) {
    const trigger = demo.getByRole('combobox', {
      name: placement + ' 级联位置',
    })
    await trigger.evaluate((element) =>
      element.scrollIntoView({ block: 'center' }),
    )
    await activate(trigger, mobile)
    const popup = page.getByRole('dialog', {
      name: placement + ' 级联位置选项',
    })
    await expect(popup).toHaveAttribute('data-placement', placement)
    const anchor = (await trigger.boundingBox())!
    const box = (await popup.boundingBox())!
    expect(Math.abs(box.width - 280)).toBeLessThan(2)
    expect(box.x).toBeGreaterThanOrEqual(7)
    expect(box.x + box.width).toBeLessThanOrEqual(
      page.viewportSize()!.width - 7,
    )
    const preferred = placement.endsWith('End')
      ? anchor.x + anchor.width - box.width
      : anchor.x
    const clamped = Math.max(
      8,
      Math.min(preferred, page.viewportSize()!.width - box.width - 8),
    )
    expect(Math.abs(box.x - clamped)).toBeLessThan(2)
    if (placement.startsWith('top'))
      expect(box.y + box.height).toBeLessThanOrEqual(anchor.y)
    else expect(box.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
    await popup.getByRole('treeitem').first().press('Escape')
    await expect(trigger).toBeFocused()
  }
  const trigger = demo.getByRole('combobox', { name: 'bottomStart 级联位置' })
  await trigger.evaluate((element) => element.scrollIntoView({ block: 'end' }))
  await activate(trigger, mobile)
  await expect(
    page.getByRole('dialog', { name: 'bottomStart 级联位置选项' }),
  ).toHaveAttribute('data-placement', 'topStart')
})
