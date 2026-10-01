import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('cascader loads nested paths once, keeps visible keyboard focus and caches across reopening', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择异步加载预览' })
  const trigger = demo.getByRole('combobox', { name: '异步地区级联' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '异步地区级联' })
  const search = page.getByRole('searchbox', { name: '搜索异步地区级联' })
  const root = tree.getByRole('treeitem', { name: '远程地区', exact: true })
  await search.press('ArrowDown')
  await root.press('ArrowRight')
  await expect(root).toHaveAttribute('aria-busy', 'true')
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 1 次请求')
  const file = tree.getByRole('treeitem', { name: '远程中心城区', exact: true })
  await expect(file).toBeFocused()
  await expect(trigger).toContainText('远程地区 / 远程中心城区')
  await file.press('ArrowDown')
  const folder = tree.getByRole('treeitem', {
    name: '远程街道目录',
    exact: true,
  })
  await folder.press('ArrowRight')
  await expect(folder).toHaveAttribute('aria-busy', 'true')
  await folder.press('Tab')
  const cancel = page.getByRole('button', { name: '取消加载远程街道目录' })
  await expect(cancel).toBeFocused()
  const box = (await cancel.boundingBox())!
  const viewport = (await tree.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.x).toBeGreaterThanOrEqual(viewport.x + 8)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.x + viewport.width - 8)
  await tree.screenshot({
    path:
      'output/playwright/cascader-loading-action-' +
      testInfo.project.name +
      '.png',
  })
  await cancel.press('Shift+Tab')
  await expect(folder).toBeFocused()
  const leaf = tree.getByRole('treeitem', {
    name: '覆盖长名称与多行显示的上海浦东新区街道服务区域',
  })
  await expect(leaf).toBeFocused()
  await tree.screenshot({
    path:
      'output/playwright/cascader-loading-nested-' +
      testInfo.project.name +
      '.png',
  })
  await activate(leaf, mobile)
  await expect(trigger).toBeFocused()
  await expect(demo.getByRole('status', { name: '异步级联值' })).toHaveText(
    '["remote","folder","street"]',
  )
  await activate(trigger, mobile)
  await expect(leaf).toBeVisible()
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 2 次请求')
  await search.fill('覆盖长名称')
  await expect(
    page.getByRole('listbox', { name: '异步地区级联' }).getByRole('option'),
  ).toHaveCount(1)
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 2 次请求')
})

test('cascader cancels an ignored abort response, resumes and refreshes the successful cache', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择异步加载预览' })
  await activate(demo.getByRole('button', { name: '模拟忽略级联取消' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '异步地区级联' })
  await activate(trigger, mobile)
  const popup = page.getByRole('dialog', { name: '异步地区级联选项' })
  await activate(
    popup.getByRole('button', { name: '取消加载远程地区' }),
    mobile,
  )
  await expect(popup.getByRole('status')).toHaveText('加载已取消')
  await expect(
    demo.getByRole('status', { name: '异步级联响应次数' }),
  ).toHaveText('已返回 1 次响应')
  await expect(
    demo.getByRole('status', { name: '异步级联读取结果' }),
  ).toHaveText('请求已取消')
  await expect(
    popup.getByRole('treeitem', { name: '远程中心城区' }),
  ).toHaveCount(0)
  await activate(
    popup.getByRole('button', { name: '继续加载远程地区' }),
    mobile,
  )
  await expect(
    popup.getByRole('treeitem', { name: '远程中心城区' }),
  ).toBeVisible()
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 2 次请求')
  await popup
    .getByRole('treeitem', { name: '远程地区', exact: true })
    .press('Escape')
  await activate(demo.getByRole('button', { name: '刷新异步级联缓存' }), mobile)
  await activate(trigger, mobile)
  await expect(
    popup.getByRole('button', { name: '取消加载远程地区' }),
  ).toBeVisible()
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 3 次请求')
  await expect(
    popup.getByRole('treeitem', { name: '远程中心城区' }),
  ).toBeVisible()
})

test('cascader retries failures, aborts removed data and allows selecting a resolved empty directory', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择异步加载预览' })
  await activate(demo.getByRole('button', { name: '模拟级联加载失败' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '异步地区级联' })
  await activate(trigger, mobile)
  const popup = page.getByRole('dialog', { name: '异步地区级联选项' })
  await expect(popup.getByRole('alert')).toHaveText('加载失败，请重试')
  await activate(demo.getByRole('button', { name: '恢复级联响应' }), mobile)
  await activate(trigger, mobile)
  await activate(
    popup.getByRole('button', { name: '重试加载远程地区' }),
    mobile,
  )
  await expect(
    popup.getByRole('treeitem', { name: '远程中心城区' }),
  ).toBeVisible()
  await popup
    .getByRole('treeitem', { name: '远程地区', exact: true })
    .press('Escape')
  await activate(demo.getByRole('button', { name: '禁用异步级联' }), mobile)
  await expect(trigger).toBeDisabled()
  await activate(demo.getByRole('button', { name: '启用异步级联' }), mobile)
  await activate(demo.getByRole('button', { name: '刷新异步级联缓存' }), mobile)
  await activate(trigger, mobile)
  await expect(
    popup.getByRole('button', { name: '取消加载远程地区' }),
  ).toBeVisible()
  await activate(demo.getByRole('button', { name: '删除远程地区' }), mobile)
  await expect(
    demo.getByRole('status', { name: '异步级联读取结果' }),
  ).toHaveText('请求已取消')
  await expect(trigger).toContainText('请选择')
  await expect(demo.getByRole('status', { name: '异步级联值' })).toHaveText(
    '["remote","file"]',
  )
  await activate(demo.getByRole('button', { name: '恢复远程地区' }), mobile)
  await activate(trigger, mobile)
  const empty = popup.getByRole('treeitem', { name: '空远程地区', exact: true })
  if (mobile) await empty.tap()
  else await empty.press('ArrowRight')
  await expect(empty).not.toHaveAttribute('aria-expanded')
  await activate(empty, mobile)
  await expect(trigger).toContainText('空远程地区')
  await expect(trigger).toBeFocused()
  await expect(demo.getByRole('status', { name: '异步级联值' })).toHaveText(
    '["empty"]',
  )
})

test('cascader search cancels a column, never fetches unknown matches and distinguishes duplicate leaf values', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择异步加载预览' })
  await activate(
    demo.getByRole('button', { name: '清空待载入级联路径' }),
    mobile,
  )
  const trigger = demo.getByRole('combobox', { name: '异步地区级联' })
  await activate(trigger, mobile)
  const search = page.getByRole('searchbox', { name: '搜索异步地区级联' })
  await search.fill('远程')
  await expect(
    page.getByRole('listbox', { name: '异步地区级联' }).getByRole('option'),
  ).toHaveCount(0)
  await expect(
    demo.getByRole('status', { name: '异步级联请求次数' }),
  ).toHaveText('已发起 0 次请求')
  await search.fill('')
  const tree = page.getByRole('tree', { name: '异步地区级联' })
  await activate(
    tree.getByRole('treeitem', { name: '远程地区', exact: true }),
    mobile,
  )
  await expect(
    tree.getByRole('treeitem', { name: '远程地区', exact: true }),
  ).toHaveAttribute('aria-busy', 'true')
  await search.fill('本地')
  await expect(
    demo.getByRole('status', { name: '异步级联读取结果' }),
  ).toHaveText('请求已取消')
  await activate(
    page
      .getByRole('listbox', { name: '异步地区级联' })
      .getByRole('option', { name: '本地地区', exact: true }),
    mobile,
  )
  await activate(trigger, mobile)
  await activate(
    tree.getByRole('treeitem', { name: '其他远程地区', exact: true }),
    mobile,
  )
  const other = tree.getByRole('treeitem', {
    name: '其他中心城区',
    exact: true,
  })
  await expect(other).toBeVisible()
  await activate(other, mobile)
  await expect(demo.getByRole('status', { name: '异步级联值' })).toHaveText(
    '["other","file"]',
  )
  await activate(trigger, mobile)
  await activate(
    tree.getByRole('treeitem', { name: '远程地区', exact: true }),
    mobile,
  )
  const remote = tree.getByRole('treeitem', {
    name: '远程中心城区',
    exact: true,
  })
  await expect(remote).toBeVisible()
  await activate(remote, mobile)
  await expect(demo.getByRole('status', { name: '异步级联值' })).toHaveText(
    '["remote","file"]',
  )
})

test('cascader async checks, native required fields and RTL panel loading stay keyboard and touch accessible', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联选择异步加载预览' })
  const trigger = demo.getByRole('combobox', { name: '异步多选地区' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '异步多选地区' })
  const file = tree.getByRole('treeitem', { name: '远程中心城区', exact: true })
  await expect(file).toHaveAttribute('aria-checked', 'true')
  if (mobile) await file.locator('[data-cascader-checkbox]').tap()
  else await file.press('Space')
  await expect(demo.getByRole('status', { name: '异步级联多选值' })).toHaveText(
    '[["remote","folder"]]',
  )
  const folder = tree.getByRole('treeitem', {
    name: '远程街道目录',
    exact: true,
  })
  await activate(folder, mobile)
  const leaf = tree.getByRole('treeitem', {
    name: '覆盖长名称与多行显示的上海浦东新区街道服务区域',
  })
  await expect(leaf).toHaveAttribute('aria-checked', 'true')
  if (mobile) await leaf.locator('[data-cascader-checkbox]').tap()
  else await leaf.press('Space')
  await expect(demo.getByRole('status', { name: '异步级联多选值' })).toHaveText(
    '[]',
  )
  await leaf.press('Escape')
  const country = demo.getByRole('combobox', {
    name: '异步原生分级地区',
    exact: true,
  })
  await country.selectOption('remote')
  expect(
    await country.evaluate((element) =>
      (element as HTMLSelectElement).checkValidity(),
    ),
  ).toBe(false)
  const city = demo.getByRole('combobox', { name: '异步原生分级地区第2级' })
  await expect(city).toBeVisible()
  expect(
    await city.evaluate((element) =>
      (element as HTMLSelectElement).checkValidity(),
    ),
  ).toBe(false)
  await city.selectOption('file')
  expect(
    await city.evaluate((element) =>
      (element as HTMLSelectElement).checkValidity(),
    ),
  ).toBe(true)
  await activate(
    demo.getByRole('button', { name: '使用 RTL 异步级联' }),
    mobile,
  )
  await page.setViewportSize({ width: 360, height: 780 })
  const panel = demo.getByRole('tree', { name: '异步内嵌地区' })
  await panel.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const before = await page.evaluate(() => window.scrollY)
  const root = panel.getByRole('treeitem', { name: '远程地区', exact: true })
  await root.focus()
  await root.press('ArrowLeft')
  await expect(root).toHaveAttribute('aria-busy', 'true')
  await expect(root.locator('svg').last()).toHaveCSS('animation-name', 'none')
  await expect(panel).toHaveAttribute('dir', 'rtl')
  await panel.screenshot({
    path:
      'output/playwright/cascader-loading-rtl-' +
      testInfo.project.name +
      '.png',
  })
  await expect(
    panel.getByRole('treeitem', { name: '远程中心城区', exact: true }),
  ).toBeFocused()
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThan(2)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
