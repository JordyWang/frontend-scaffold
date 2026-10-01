import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) {
    const target =
      (await control.getAttribute('role')) === 'treeitem'
        ? control.locator('[data-tree-label]').first()
        : control
    await target.tap()
  } else await control.press('Enter')
}

test('tree conducts checks, keeps selection independent and respects disabled branch boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const tree = page.getByRole('tree', { name: '完整树形控件', exact: true })
  const root = tree.getByRole('treeitem', { name: '基础组件', exact: true })
  const button = tree.getByRole('treeitem', { name: 'Button', exact: true })
  const input = tree.getByRole('treeitem', { name: 'Input', exact: true })
  await expect(root).toHaveAttribute('aria-checked', 'mixed')
  await expect(button).toHaveAttribute('aria-checked', 'true')
  const mark = root.locator('[data-tree-checkbox]').first()
  const bounds = (await mark.boundingBox())!
  expect(bounds.width).toBeGreaterThanOrEqual(44)
  expect(bounds.height).toBeGreaterThanOrEqual(44)
  if (mobile) await mark.tap()
  else {
    await root.focus()
    await root.press('Space')
  }
  await expect(input).toHaveAttribute('aria-checked', 'true')
  await expect(root).toHaveAttribute('aria-selected', 'false')
  const disabled = tree.getByRole('treeitem', { name: '禁用分支', exact: true })
  const locked = tree.getByRole('treeitem', { name: '锁定字段', exact: true })
  await expect(disabled).toHaveAttribute('aria-checked', 'false')
  await expect(locked).toHaveAttribute('aria-checked', 'false')
  if (mobile) await input.locator('[data-tree-checkbox]').tap()
  else {
    await input.focus()
    await input.press('Space')
  }
  await expect(root).toHaveAttribute('aria-checked', 'mixed')
  await expect(input).toHaveAttribute('aria-selected', 'false')
  await activate(input, mobile)
  await expect(input).toHaveAttribute('aria-selected', 'true')
  await activate(button, mobile)
  await expect(input).toHaveAttribute('aria-selected', 'true')
  await expect(button).toHaveAttribute('aria-selected', 'true')
  await activate(button, mobile)
  await expect(button).toHaveAttribute('aria-selected', 'false')
  await locked.locator('[data-tree-checkbox]').click()
  await expect(locked).toHaveAttribute('aria-checked', 'false')
  await activate(locked, mobile)
  await expect(locked).toHaveAttribute('aria-selected', 'true')
  const onlyCheck = tree.getByRole('treeitem', {
    name: '仅勾选节点',
    exact: true,
  })
  await activate(onlyCheck, mobile)
  await expect(onlyCheck).not.toHaveAttribute('aria-selected')
  await expect(
    tree.getByRole('treeitem', { name: '仅选择节点', exact: true }),
  ).not.toHaveAttribute('aria-checked')
})

test('tree strict mode and global disabled state work with keyboard and H5 controls', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树形控件状态预览' })
  const tree = preview.getByRole('tree', { name: '完整树形控件', exact: true })
  await activate(preview.getByRole('button', { name: '清空树状态' }), mobile)
  await activate(preview.getByRole('button', { name: '独立节点勾选' }), mobile)
  const root = tree.getByRole('treeitem', { name: '基础组件', exact: true })
  const button = tree.getByRole('treeitem', { name: 'Button', exact: true })
  if (mobile) await root.locator('[data-tree-checkbox]').first().tap()
  else {
    await root.focus()
    await root.press('Space')
  }
  await expect(root).toHaveAttribute('aria-checked', 'true')
  await expect(button).toHaveAttribute('aria-checked', 'false')
  await activate(preview.getByRole('button', { name: '禁用整棵树' }), mobile)
  await expect(tree).toHaveAttribute('aria-disabled', 'true')
  await button.locator('[data-tree-label]').click()
  await expect(button).toHaveAttribute('aria-selected', 'false')
  await root.locator('[data-tree-checkbox]').first().click()
  await expect(root).toHaveAttribute('aria-checked', 'true')
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(0)
  await activate(preview.getByRole('button', { name: '启用整棵树' }), mobile)
  await activate(preview.getByRole('button', { name: '改为树单选' }), mobile)
  await activate(root, mobile)
  await activate(button, mobile)
  await expect(root).toHaveAttribute('aria-selected', 'false')
  await expect(button).toHaveAttribute('aria-selected', 'true')
  await activate(preview.getByRole('button', { name: '隐藏树复选框' }), mobile)
  await expect(tree.locator('[data-tree-checkbox]')).toHaveCount(0)
  await expect(root).not.toHaveAttribute('aria-checked')
})

test('tree uses a single tab entry, reveals keyboard focus and restores removed or collapsed focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '树形控件状态预览' })
  const tree = preview.getByRole('tree', { name: '完整树形控件', exact: true })
  const root = tree.getByRole('treeitem', { name: '基础组件', exact: true })
  const fields = tree.getByRole('treeitem', { name: '表单字段', exact: true })
  const input = tree.getByRole('treeitem', { name: 'Input', exact: true })
  const textarea = tree.getByRole('treeitem', { name: /^Textarea：/ })
  await root.focus()
  await root.press('ArrowDown')
  const button = tree.getByRole('treeitem', { name: 'Button', exact: true })
  await expect(button).toBeFocused()
  await button.press('ArrowDown')
  await expect(fields).toBeFocused()
  await expect(fields).toHaveCSS('outline-style', 'none')
  await expect(fields.locator('[data-tree-label]').first()).toHaveCSS(
    'outline-style',
    'solid',
  )
  await expect(input.locator('[data-tree-label]')).toHaveCSS(
    'outline-style',
    'none',
  )
  await fields.press('ArrowRight')
  await expect(input).toBeFocused()
  await input.press('ArrowDown')
  await expect(textarea).toBeFocused()
  await preview
    .getByRole('button', { name: '删除树节点' })
    .evaluate((element) => (element as HTMLButtonElement).click())
  await expect(fields).toBeFocused()
  await fields.press('ArrowLeft')
  await expect(fields).toHaveAttribute('aria-expanded', 'false')
  await fields.press('ArrowDown')
  await expect(tree.getByRole('treeitem', { name: '仅勾选节点' })).toBeFocused()
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1)
  await page.keyboard.press('Tab')
  expect(
    await tree.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(false)
  await root.focus()
  await root.press('End')
  await expect(tree.getByRole('treeitem', { name: '媒体能力' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(root).toBeFocused()
  await root.press('b')
  await expect(button).toBeFocused()
  await tree.screenshot({
    path: `output/playwright/tree-keyboard-${testInfo.project.name}.png`,
  })
})

test('tree wraps long titles, draws connected branches and adapts to narrow containers without overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树形控件状态预览' })
  const tree = preview.getByRole('tree', { name: '完整树形控件', exact: true })
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
    await expect(
      tree.getByRole('treeitem', { name: /^Textarea：/ }),
    ).toBeVisible()
  }
  const fields = tree.getByRole('treeitem', { name: '表单字段', exact: true })
  const rail = fields.locator(':scope > [data-ui-tree-line]')
  expect((await rail.boundingBox())!.height).toBeGreaterThan(
    (await fields.locator(':scope > [data-ui-tree-row]').boundingBox())!.height,
  )
  await tree.screenshot({
    path: `output/playwright/tree-default-${testInfo.project.name}.png`,
  })
  await activate(preview.getByRole('button', { name: '收窄树容器' }), mobile)
  expect((await tree.boundingBox())!.width).toBeLessThanOrEqual(320)
  expect(
    await tree.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true)
  await tree.screenshot({
    path: `output/playwright/tree-narrow-${testInfo.project.name}.png`,
  })
  await activate(preview.getByRole('button', { name: '隐藏树连接线' }), mobile)
  await expect(tree.locator('[data-ui-tree-line]')).toHaveCount(0)
  await activate(
    preview.getByRole('button', { name: '隐藏树节点图标' }),
    mobile,
  )
  await expect(tree.locator('[data-tree-label] svg')).toHaveCount(0)
  await expect(
    preview.getByRole('tree', { name: '空树', exact: true }),
  ).toContainText('暂无节点')
  await expect(
    preview
      .getByRole('tree', { name: '默认展开父级树' })
      .getByRole('treeitem', { name: '文件', exact: true }),
  ).toBeVisible()
})

test('tree RTL keyboard expansion, checking and reduced motion remain usable', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const tree = page.getByRole('tree', { name: 'RTL 勾选树', exact: true })
  await expect(tree).toHaveAttribute('dir', 'rtl')
  const root = tree.getByRole('treeitem', { name: 'RTL 根节点', exact: true })
  const alpha = tree.getByRole('treeitem', { name: 'Alpha', exact: true })
  await root.focus()
  await root.press('ArrowRight')
  await expect(root).toHaveAttribute('aria-expanded', 'false')
  await root.press('ArrowLeft')
  await expect(root).toHaveAttribute('aria-expanded', 'true')
  await root.press('ArrowLeft')
  await expect(alpha).toBeFocused()
  await alpha.press('Space')
  await expect(root).toHaveAttribute('aria-checked', 'mixed')
  await alpha.press('ArrowRight')
  await expect(root).toBeFocused()
  await expect(
    root.locator(':scope > [data-ui-tree-row] [data-tree-toggle] svg'),
  ).toHaveCSS('transition-property', 'none')
  const parentBox = (await root
    .locator(':scope > [data-ui-tree-row]')
    .boundingBox())!
  const childBox = (await alpha.locator('[data-ui-tree-row]').boundingBox())!
  expect(childBox.x + childBox.width).toBeCloseTo(
    parentBox.x + parentBox.width,
    0,
  )
  const parentMark = (await root
    .locator('[data-tree-checkbox]')
    .first()
    .boundingBox())!
  const childMark = (await alpha.locator('[data-tree-checkbox]').boundingBox())!
  expect(childMark.x).toBeLessThan(parentMark.x)
  await tree.screenshot({
    path: `output/playwright/tree-rtl-${testInfo.project.name}.png`,
  })
})
