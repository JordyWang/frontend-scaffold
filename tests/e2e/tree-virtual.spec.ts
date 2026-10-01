import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
async function insideViewport(tree: Locator, item: Locator) {
  const viewport = (await tree.boundingBox())!
  const row = (await item.boundingBox())!
  expect(row.y).toBeGreaterThanOrEqual(viewport.y - 1)
  expect(row.y + row.height).toBeLessThanOrEqual(
    viewport.y + viewport.height + 1,
  )
}

test('virtual tree bounds mounted nodes and navigates across the window with keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  const root = tree.getByRole('treeitem', { name: '资源库', exact: true })
  await expect(tree).toHaveAttribute('data-ui-tree-virtual', 'true')
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  await root.focus()
  await root.press('ArrowDown')
  const folder = tree.getByRole('treeitem', { name: '目录 01', exact: true })
  await expect(folder).toBeFocused()
  await folder.press('ArrowDown')
  const longFile = tree.getByRole('treeitem', { name: /^文件 01-01/ })
  await expect(longFile).toBeFocused()
  await longFile.press('ArrowDown')
  await expect(
    tree.getByRole('treeitem', { name: '文件 01-03', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('End')
  const remote = tree.getByRole('treeitem', {
    name: '远程虚拟目录',
    exact: true,
  })
  await expect(remote).toBeFocused()
  await insideViewport(tree, remote)
  await activate(preview.getByRole('button', { name: '聚焦末尾文件' }), mobile)
  const last = tree.getByRole('treeitem', { name: '文件 20-50', exact: true })
  await expect(last).toBeFocused()
  await insideViewport(tree, last)
  await expect(last).toHaveAttribute('aria-level', '3')
  await expect(last).toHaveAttribute('aria-posinset', '50')
  await expect(last).toHaveAttribute('aria-setsize', '50')
  if (mobile) {
    const checkbox = last.locator('[data-tree-checkbox]')
    const bounds = (await checkbox.boundingBox())!
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
    await checkbox.tap()
    await last.locator('[data-tree-label]').tap()
  } else {
    await last.press('Space')
    await last.press('Enter')
  }
  await expect(last).toHaveAttribute('aria-checked', 'true')
  await expect(last).toHaveAttribute('aria-selected', 'true')
  await last.press('Home')
  await expect(root).toBeFocused()
  await insideViewport(tree, root)
  await activate(preview.getByRole('button', { name: '聚焦末尾文件' }), mobile)
  await expect(last).toHaveAttribute('aria-checked', 'true')
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1)
  await tree.screenshot({
    path: `output/playwright/tree-virtual-end-${testInfo.project.name}.png`,
  })
})

test('virtual tree expands a controlled nested path, centers its target and clamps shrinking data', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  await activate(preview.getByRole('button', { name: '收起虚拟树' }), mobile)
  await expect(tree.getByRole('treeitem')).toHaveCount(2)
  const locate = preview.getByRole('button', { name: '定位文件 13-41' })
  await locate.focus()
  await locate.press('Enter')
  const target = tree.getByRole('treeitem', { name: '文件 13-41', exact: true })
  await expect(target).toBeVisible()
  await insideViewport(tree, target)
  const viewport = (await tree.boundingBox())!
  const box = (await target.boundingBox())!
  expect(box.y + box.height / 2).toBeCloseTo(
    viewport.y + viewport.height / 2,
    0,
  )
  await expect(locate).toBeFocused()
  await expect(
    preview.getByRole('status', { name: '虚拟树定位路径' }),
  ).toHaveText('资源库 / 目录 13 / 文件 13-41')
  await activate(preview.getByRole('button', { name: '聚焦末尾文件' }), mobile)
  const shrink = preview.getByRole('button', { name: '缩减虚拟树数据' })
  await shrink.focus()
  await shrink.press('Enter')
  const root = tree.getByRole('treeitem', { name: '资源库', exact: true })
  await expect(root).toBeVisible()
  await insideViewport(tree, root)
  await expect(
    tree.getByRole('treeitem', { name: '目录 01', exact: true }),
  ).toBeVisible()
  await expect(
    preview.getByRole('button', { name: '恢复虚拟树数据' }),
  ).toBeFocused()
  expect(
    await tree.evaluate(
      (element) =>
        element.scrollTop <=
        Math.max(0, element.scrollHeight - element.clientHeight) + 1,
    ),
  ).toBe(true)
  await activate(locate, mobile)
  await expect(
    preview.getByRole('status', { name: '虚拟树定位路径' }),
  ).toHaveText('目标不在当前数据中')
  await tree.screenshot({
    path: `output/playwright/tree-virtual-shrunk-${testInfo.project.name}.png`,
  })
})

test('virtual tree measures multiline and interactive rows without overlap after resizing', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  const file = tree.getByRole('treeitem', { name: /^文件 01-01/ })
  const next = tree.getByRole('treeitem', { name: '文件 01-02', exact: true })
  const before = (await file.boundingBox())!.height
  const expand = file.getByRole('button', { name: '展开文件说明' })
  await expand.focus()
  await activate(expand, mobile)
  await expect(
    file.getByText(
      '文件说明会增加这一行的实际高度，后续节点应重新排列，保留当前滚动位置并继续支持键盘浏览。',
    ),
  ).toBeVisible()
  expect((await file.boundingBox())!.height).toBeGreaterThan(before)
  const assertNoOverlap = async () => {
    const first = (await file.boundingBox())!
    const second = (await next.boundingBox())!
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1)
    expect(
      await tree.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true)
  }
  await assertNoOverlap()
  await tree.screenshot({
    path: `output/playwright/tree-virtual-detail-${testInfo.project.name}.png`,
  })
  await activate(
    preview.getByRole('button', { name: '收窄虚拟树容器' }),
    mobile,
  )
  expect((await tree.boundingBox())!.width).toBeLessThanOrEqual(320)
  await assertNoOverlap()
  await activate(
    preview.getByRole('button', { name: '降低虚拟树高度' }),
    mobile,
  )
  expect((await tree.boundingBox())!.height).toBe(200)
  await assertNoOverlap()
  await tree.screenshot({
    path: `output/playwright/tree-virtual-narrow-${testInfo.project.name}.png`,
  })
})

test('virtual tree preserves focus during native scrolling and can switch virtualization off', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  const root = tree.getByRole('treeitem', { name: '资源库', exact: true })
  await root.focus()
  await tree.scrollIntoViewIfNeeded()
  if (testInfo.project.name === 'mobile-chromium') {
    const client = await page.context().newCDPSession(page)
    const box = (await tree.boundingBox())!
    const x = box.x + box.width / 2
    const start = box.y + box.height - 30
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: start }],
    })
    for (let step = 1; step <= 6; step++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: start - step * 35 }],
      })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await client.detach()
  } else if (testInfo.project.name === 'mobile-webkit') {
    // Playwright does not expose wheel or swipe input for mobile WebKit.
    await tree.evaluate((element) =>
      element.scrollBy({ top: 1200, behavior: 'instant' }),
    )
  } else {
    await tree.hover()
    await page.mouse.wheel(0, 1200)
  }
  await expect
    .poll(() => tree.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(100)
  await expect(root).toBeFocused()
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  await expect(tree).toHaveCSS('touch-action', 'pan-y')
  await activate(preview.getByRole('button', { name: '关闭树虚拟化' }), mobile)
  await expect(tree.getByRole('treeitem')).toHaveCount(1022)
  await activate(preview.getByRole('button', { name: '开启树虚拟化' }), mobile)
  await expect(tree).toHaveAttribute('data-ui-tree-virtual', 'true')
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  const viewport = (await tree.boundingBox())!
  const boxes = await tree.getByRole('treeitem').evaluateAll((elements) =>
    elements.map((element) => ({
      top: element.getBoundingClientRect().top,
      bottom: element.getBoundingClientRect().bottom,
    })),
  )
  expect(
    boxes.some(
      (box) =>
        box.bottom > viewport.y && box.top < viewport.y + viewport.height,
    ),
  ).toBe(true)
})

test('virtual tree measures async feedback and supports retry with focus recovery', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  await activate(
    preview.getByRole('button', { name: '模拟虚拟树失败' }),
    mobile,
  )
  await activate(
    preview.getByRole('button', { name: '定位远程虚拟目录' }),
    mobile,
  )
  const remote = tree.getByRole('treeitem', {
    name: '远程虚拟目录',
    exact: true,
  })
  await remote.press('ArrowRight')
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  await expect(tree.getByRole('alert')).toBeVisible()
  await insideViewport(tree, remote)
  await tree.screenshot({
    path: `output/playwright/tree-virtual-error-${testInfo.project.name}.png`,
  })
  await activate(
    preview.getByRole('button', { name: '恢复虚拟树响应' }),
    mobile,
  )
  // Changing the version clears the failed request and starts the expanded directory again.
  const cancel = tree.getByRole('button', { name: '取消加载远程虚拟目录' })
  await expect(cancel).toBeVisible()
  await activate(cancel, mobile)
  await expect(remote).toHaveAttribute('aria-expanded', 'false')
  await remote.focus()
  await remote.press('ArrowRight')
  await expect(
    tree.getByRole('treeitem', { name: '虚拟窗口远程文件', exact: true }),
  ).toBeVisible()
  await remote.press('ArrowRight')
  const file = tree.getByRole('treeitem', {
    name: '虚拟窗口远程文件',
    exact: true,
  })
  await expect(file).toBeFocused()
  await insideViewport(tree, file)
  await expect(tree.getByRole('alert')).toHaveCount(0)
  await tree.screenshot({
    path: `output/playwright/tree-virtual-async-${testInfo.project.name}.png`,
  })
})

test('virtual tree follows RTL keys and stays responsive under reduced motion', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树虚拟滚动预览' })
  const tree = preview.getByRole('tree', { name: '虚拟资源树' })
  await activate(
    preview.getByRole('button', { name: '使用 RTL 虚拟树' }),
    mobile,
  )
  const root = tree.getByRole('treeitem', { name: '资源库', exact: true })
  await expect(tree).toHaveAttribute('dir', 'rtl')
  await root.focus()
  await root.press('ArrowRight')
  await expect(root).toHaveAttribute('aria-expanded', 'false')
  await root.press('ArrowLeft')
  await expect(root).toHaveAttribute('aria-expanded', 'true')
  await root.press('ArrowLeft')
  await expect(
    tree.getByRole('treeitem', { name: '目录 01', exact: true }),
  ).toBeFocused()
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 850 })
    expect(
      await tree.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  }
  await tree.screenshot({
    path: `output/playwright/tree-virtual-rtl-${testInfo.project.name}.png`,
  })
})
