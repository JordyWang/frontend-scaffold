import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
async function nativeDrag(
  source: Locator,
  target: Locator,
  position: 'before' | 'inside' | 'after',
) {
  const box = (await target.boundingBox())!
  await source.dragTo(target, {
    targetPosition: {
      x: Math.min(200, box.width / 2),
      y:
        position === 'before'
          ? 3
          : position === 'after'
            ? box.height - 3
            : box.height / 2,
    },
  })
}
async function holdDrag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded()
  const start = (await source.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    start.x + start.width / 2 + 8,
    start.y + start.height / 2,
  )
  const end = (await target.boundingBox())!
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 8,
  })
  await page.mouse.move(end.x + end.width / 2 + 1, end.y + end.height / 2)
}

test('native tree drag reorders siblings and moves a whole branch while preserving state', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Native HTML drag is verified on desktop; H5 uses move controls.',
  )
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  const alpha = tree.getByRole('treeitem', { name: '文档 Alpha', exact: true })
  const beta = tree.getByRole('treeitem', { name: '文档 Beta', exact: true })
  const row = (item: Locator) => item.locator(':scope > [data-ui-tree-row]')
  await nativeDrag(
    tree.getByRole('button', { name: '移动文档 Alpha', exact: true }),
    row(beta),
    'after',
  )
  await expect(alpha).toHaveAttribute('aria-posinset', '2')
  await expect(alpha).toHaveAttribute('aria-selected', 'true')
  await expect(alpha).toHaveAttribute('aria-checked', 'true')
  await expect(alpha).toBeFocused()
  await preview.getByRole('button', { name: '重置可移动树' }).click()
  await nativeDrag(
    tree.getByRole('button', { name: '移动文档 Beta', exact: true }),
    row(alpha),
    'before',
  )
  await expect(beta).toHaveAttribute('aria-posinset', '1')
  await preview.getByRole('button', { name: '重置可移动树' }).click()
  const target = tree.getByRole('treeitem', { name: '目标目录', exact: true })
  await nativeDrag(
    tree.getByRole('button', { name: '移动子目录', exact: true }),
    row(target),
    'inside',
  )
  const branch = tree.getByRole('treeitem', { name: '子目录', exact: true })
  await expect(target).toHaveAttribute('aria-expanded', 'true')
  await expect(branch).toHaveAttribute('aria-level', '2')
  await expect(
    tree.getByRole('treeitem', { name: '文档 Charlie', exact: true }),
  ).toHaveAttribute('aria-level', '3')
  expect(
    await target.evaluate((element) =>
      element.textContent?.includes('文档 Charlie'),
    ),
  ).toBe(true)
  await expect(branch).toBeFocused()
  await tree.screenshot({
    path: 'output/playwright/tree-drag-branch-desktop.png',
  })
})

test('native tree drag exposes invalid cycle feedback and refuses protected positions', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Native HTML drag is verified on desktop.',
  )
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  const branch = tree.getByRole('treeitem', { name: '子目录', exact: true })
  const row = branch.locator(':scope > [data-ui-tree-row]')
  await holdDrag(
    page,
    tree.getByRole('button', { name: '移动工作目录', exact: true }),
    row,
  )
  await expect(row).toHaveAttribute('data-tree-drop-invalid', 'true')
  await expect(
    preview.getByRole('status', { name: '树节点移动状态' }),
  ).toContainText('自身或其后代')
  await tree.screenshot({
    path: 'output/playwright/tree-drag-invalid-desktop.png',
  })
  await page.mouse.up()
  await expect(
    preview.getByRole('status', { name: '树节点移动结果' }),
  ).toHaveText('尚未移动节点')
  await expect(
    tree.getByRole('button', { name: '移动禁用目录', exact: true }),
  ).toBeDisabled()
  await expect(
    tree.getByRole('button', { name: '移动禁用分支文件', exact: true }),
  ).toBeDisabled()
  await expect(
    tree.getByRole('button', { name: '移动不可移动文件', exact: true }),
  ).toBeDisabled()
})

test('native tree drag expands and loads an asynchronous receiving directory before dropping', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Native hover is verified on desktop.',
  )
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  const target = tree.getByRole('treeitem', {
    name: '异步接收目录',
    exact: true,
  })
  const row = target.locator(':scope > [data-ui-tree-row]')
  await holdDrag(
    page,
    tree.getByRole('button', { name: '移动文档 Alpha', exact: true }),
    row,
  )
  await expect(
    preview.getByRole('status', { name: '树节点移动状态' }),
  ).toContainText('完成目录加载')
  await expect(target).toHaveAttribute('aria-expanded', 'true')
  await expect(
    tree.getByRole('treeitem', { name: '远程目录文件', exact: true }),
  ).toBeVisible()
  const box = (await row.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2)
  await expect(row).not.toHaveAttribute('data-tree-drop-invalid')
  await page.mouse.up()
  await expect(
    preview.getByRole('status', { name: '树节点移动结果' }),
  ).toHaveText('文档 Alpha → 异步接收目录（内部）')
  await expect(
    target.getByRole('treeitem', { name: '文档 Alpha', exact: true }),
  ).toHaveAttribute('aria-checked', 'true')
  await tree.screenshot({
    path: 'output/playwright/tree-drag-async-desktop.png',
  })
})

test('tree move controls provide 44px touch actions and directory placement with focus recovery', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  const handle = tree.getByRole('button', {
    name: '移动文档 Alpha',
    exact: true,
  })
  const box = (await handle.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(handle, mobile)
  const controls = preview.getByRole('region', { name: '节点移动操作' })
  await expect(controls).toBeVisible()
  const target = tree.getByRole('treeitem', { name: '目标目录', exact: true })
  if (mobile) await target.locator('[data-tree-label]').first().tap()
  else {
    await target.focus()
    await target.press('ArrowRight')
  }
  const inside = controls.getByRole('button', { name: '目标内部', exact: true })
  if (mobile) await inside.tap()
  else {
    for (let index = 0; index < 4; index++)
      await page.keyboard.press('Shift+Tab')
    await expect(inside).toBeFocused()
    await page.keyboard.press('Enter')
  }
  await expect(
    controls.getByRole('button', { name: '目标内部' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await preview.screenshot({
    path: `output/playwright/tree-drag-controls-${testInfo.project.name}.png`,
  })
  const confirm = controls.getByRole('button', { name: '确认移动节点' })
  if (mobile) await confirm.tap()
  else {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(confirm).toBeFocused()
    await page.keyboard.press('Enter')
  }
  const alpha = tree.getByRole('treeitem', { name: '文档 Alpha', exact: true })
  await expect(alpha).toBeFocused()
  await expect(alpha).toHaveAttribute('aria-checked', 'true')
  await expect(alpha).toHaveAttribute('aria-selected', 'true')
  await expect(target).toHaveAttribute('aria-expanded', 'true')
  expect(
    await target.evaluate((element) =>
      element.textContent?.includes('文档 Alpha'),
    ),
  ).toBe(true)
  await expect(controls).toHaveCount(0)
  await tree.screenshot({
    path: `output/playwright/tree-drag-moved-${testInfo.project.name}.png`,
  })
})

test('tree keyboard movement preserves checks, supports custom rules and cancels without moving', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  const alpha = tree.getByRole('treeitem', { name: '文档 Alpha', exact: true })
  const beta = tree.getByRole('treeitem', { name: '文档 Beta', exact: true })
  await alpha.focus()
  await alpha.press('Control+Space')
  await alpha.press('ArrowDown')
  await expect(beta).toBeFocused()
  await beta.press('Enter')
  await expect(alpha).toHaveAttribute('aria-posinset', '2')
  await expect(alpha).toHaveAttribute('aria-checked', 'true')
  await activate(preview.getByRole('button', { name: '重置可移动树' }), mobile)
  await activate(
    preview.getByRole('button', { name: '仅允许目标目录内部' }),
    mobile,
  )
  await alpha.focus()
  await alpha.press('Control+Space')
  await alpha.press('ArrowDown')
  const controls = preview.getByRole('region', { name: '节点移动操作' })
  await expect(
    controls.getByRole('button', { name: '确认移动节点' }),
  ).toBeDisabled()
  await expect(
    preview.getByRole('status', { name: '树节点移动状态' }),
  ).toContainText('不允许放置')
  await beta.press('Enter')
  await expect(
    preview.getByRole('status', { name: '树节点移动结果' }),
  ).toHaveText('尚未移动节点')
  await beta.press('Escape')
  await expect(controls).toHaveCount(0)
  await expect(alpha).toBeFocused()
  await activate(
    preview.getByRole('button', { name: '禁用树节点移动' }),
    mobile,
  )
  await expect(
    tree.getByRole('button', { name: '移动文档 Alpha', exact: true }),
  ).toBeDisabled()
})

test('native virtual tree drag scrolls to distant targets without unmounting its source', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Native drag autoscroll is verified on desktop.',
  )
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  await preview.getByRole('button', { name: '启用虚拟拖动预览' }).click()
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  await tree.scrollIntoViewIfNeeded()
  const handle = tree.getByRole('button', {
    name: '移动文档 Alpha',
    exact: true,
  })
  const start = (await handle.boundingBox())!
  const viewport = (await tree.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    start.x + start.width / 2 + 8,
    start.y + start.height / 2,
  )
  await page.mouse.move(
    viewport.x + viewport.width / 2,
    viewport.y + viewport.height - 12,
    { steps: 8 },
  )
  const target = tree.getByRole('treeitem', { name: '目标目录', exact: true })
  await expect
    .poll(
      async () => {
        const box = await target.boundingBox()
        return Boolean(
          box &&
          box.y + box.height / 2 > viewport.y + 50 &&
          box.y + box.height / 2 < viewport.y + viewport.height - 50,
        )
      },
      { timeout: 12_000, intervals: [100, 100, 100] },
    )
    .toBe(true)
  await expect(handle).toBeAttached()
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(30)
  // Leave the scroll edge before measuring the moving target's coordinates.
  await page.mouse.move(
    viewport.x + viewport.width / 2,
    viewport.y + viewport.height / 2,
    { steps: 4 },
  )
  await page.mouse.move(
    viewport.x + viewport.width / 2 + 2,
    viewport.y + viewport.height / 2,
  )
  let previousTop = -1
  await expect
    .poll(
      async () => {
        const top = await tree.evaluate((element) => element.scrollTop)
        const stopped = top === previousTop
        previousTop = top
        return stopped
      },
      { intervals: [100] },
    )
    .toBe(true)
  const row = target.locator(':scope > [data-ui-tree-row]')
  let box = (await row.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 4,
  })
  box = (await row.boundingBox())!
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2)
  await expect(row).toHaveAttribute('data-tree-drop-position', 'inside')
  await page.mouse.up()
  await expect(
    preview.getByRole('status', { name: '树节点移动结果' }),
  ).toHaveText('文档 Alpha → 目标目录（内部）')
  await expect(
    tree.getByRole('treeitem', { name: '文档 Alpha', exact: true }),
  ).toBeFocused()
  await tree.screenshot({
    path: 'output/playwright/tree-drag-virtual-desktop.png',
  })
})

test('tree move controls follow RTL and fit narrow H5 and desktop containers', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树节点移动预览' })
  await activate(
    preview.getByRole('button', { name: '使用 RTL 移动树' }),
    mobile,
  )
  const tree = preview.getByRole('tree', { name: '可移动目录树' })
  await activate(
    tree.getByRole('button', { name: '移动文档 Alpha', exact: true }),
    mobile,
  )
  const controls = preview.getByRole('region', { name: '节点移动操作' })
  await expect(controls).toHaveAttribute('dir', 'rtl')
  const empty = tree.getByRole('treeitem', { name: '空接收目录', exact: true })
  if (mobile) await empty.locator('[data-tree-label]').tap()
  else await empty.focus()
  await activate(controls.getByRole('button', { name: '目标内部' }), mobile)
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 850 })
    expect(
      await tree.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true)
    expect(
      await controls.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await controls.screenshot({
    path: `output/playwright/tree-drag-controls-rtl-${testInfo.project.name}.png`,
  })
  await activate(controls.getByRole('button', { name: '确认移动节点' }), mobile)
  await expect(empty).toHaveAttribute('aria-expanded', 'true')
  await expect(
    tree.getByRole('treeitem', { name: '文档 Alpha', exact: true }),
  ).toBeFocused()
})
