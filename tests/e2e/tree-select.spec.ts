import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
async function choose(node: Locator, mobile: boolean) {
  if (mobile)
    await node.locator(':scope > [data-ui-tree-row] [data-tree-label]').tap()
  else {
    await node.focus()
    await node.press('Enter')
  }
}

test('tree select checks filtered nodes using the full tree and switches return strategies', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '关联勾选团队' })
  await activate(trigger, mobile)
  const search = page.getByRole('searchbox', { name: '搜索关联勾选团队' })
  const tree = page.getByRole('tree', { name: '关联勾选团队' })
  await expect(search).toBeFocused()
  const team = tree.getByRole('treeitem', { name: '产品团队', exact: true })
  await expect(team).toHaveAttribute('aria-checked', 'mixed')
  await search.fill('研发')
  await expect(
    tree.getByRole('treeitem', { name: '设计团队', exact: true }),
  ).toHaveCount(0)
  await expect(team).toHaveAttribute('aria-checked', 'mixed')
  const engineering = tree.getByRole('treeitem', {
    name: '研发团队',
    exact: true,
  })
  if (mobile) await choose(engineering, true)
  else {
    await search.press('ArrowDown')
    await expect(team).toBeFocused()
    await team.press('ArrowDown')
    await expect(engineering).toBeFocused()
    await engineering.press('Space')
  }
  await expect(demo.getByRole('status', { name: '关联团队值' })).toHaveText(
    '["design","engineering"]',
  )
  await expect(team).toHaveAttribute('aria-checked', 'true')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await search.press('Escape')
  await expect(trigger).toBeFocused()
  await activate(
    demo.getByRole('button', { name: '回填父节点', exact: true }),
    mobile,
  )
  await expect(trigger).toContainText('产品团队')
  await activate(trigger, mobile)
  await expect(
    tree.getByRole('treeitem', { name: '已归档团队', exact: true }),
  ).toHaveAttribute('aria-checked', 'false')
  await tree.screenshot({
    path:
      'output/playwright/tree-select-checks-' + testInfo.project.name + '.png',
  })
  await search.press('Escape')
  await activate(demo.getByRole('button', { name: '设置受控空选择' }), mobile)
  await expect(trigger).toContainText('请选择')
  await expect(demo.getByRole('status', { name: '关联团队值' })).toHaveText(
    '[]',
  )
})

test('tree select strict checks and 44px clearing preserve keyboard and touch access', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  await activate(demo.getByRole('button', { name: '使用严格勾选' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '关联勾选团队' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '关联勾选团队' })
  const team = tree.getByRole('treeitem', { name: '产品团队', exact: true })
  await choose(team, mobile)
  await expect(team).toHaveAttribute('aria-checked', 'true')
  await expect(
    tree.getByRole('treeitem', { name: '设计团队', exact: true }),
  ).toHaveAttribute('aria-checked', 'false')
  await expect(demo.getByRole('status', { name: '关联团队值' })).toHaveText(
    '["team"]',
  )
  await team.press('Escape')
  const clear = demo.getByRole('button', { name: '清除关联勾选团队' })
  const box = (await clear.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(clear, mobile)
  await expect(trigger).toBeFocused()
  await expect(trigger).toContainText('请选择')
})

test('tree select counts actual leaves, protects the limit and allows removing a check', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '最多两个团队' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '最多两个团队' })
  const engineering = tree.getByRole('treeitem', {
    name: '研发团队',
    exact: true,
  })
  const design = tree.getByRole('treeitem', { name: '设计团队', exact: true })
  const operations = tree.getByRole('treeitem', {
    name: '运营团队',
    exact: true,
  })
  await choose(engineering, mobile)
  await expect(trigger).toContainText('产品团队')
  await expect(trigger).toContainText('2/2')
  await expect(operations).toHaveAttribute('aria-description', '勾选已禁用')
  await choose(operations, mobile)
  await expect(operations).toHaveAttribute('aria-checked', 'false')
  await choose(design, mobile)
  await expect(trigger).toContainText('1/2')
  await choose(operations, mobile)
  await expect(operations).toHaveAttribute('aria-checked', 'true')
  await expect(trigger).toContainText('2/2')
  await tree.screenshot({
    path:
      'output/playwright/tree-select-limit-' + testInfo.project.name + '.png',
  })
})

test('tree select tab order returns from its portal to the following form field', async ({
  page,
}) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '搜索后继续输入' })
  await trigger.focus()
  await trigger.press('ArrowDown')
  const search = page.getByRole('searchbox', { name: '搜索搜索后继续输入' })
  await expect(search).toBeFocused()
  await search.press('Tab')
  const tree = page.getByRole('tree', { name: '搜索后继续输入' })
  const team = tree.getByRole('treeitem', { name: '产品团队', exact: true })
  await expect(team).toBeFocused()
  await team.press('Shift+Tab')
  await expect(search).toBeFocused()
  await search.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.press('ArrowDown')
  await search.fill('研发')
  await search.press('ArrowDown')
  await team.press('ArrowDown')
  await tree
    .getByRole('treeitem', { name: '研发团队', exact: true })
    .press('Enter')
  await expect(search).toHaveValue('')
  await expect(trigger).toContainText('研发团队')
  await tree
    .getByRole('treeitem', { name: '产品团队', exact: true })
    .press('Tab')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  const remove = demo.getByRole('button', { name: '移除研发团队' })
  await expect(remove).toBeFocused()
  await remove.press('Tab')
  const clear = demo.getByRole('button', { name: '清除搜索后继续输入' })
  await expect(clear).toBeFocused()
  await clear.press('Tab')
  await expect(
    demo.getByRole('textbox', { name: '树选择后的输入' }),
  ).toBeFocused()
})

test('tree select tag removal is a separate 44px action that preserves conducted values and focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '折叠多选标签' })
  const remove = demo
    .getByRole('button', { name: '移除设计团队', exact: true })
    .last()
  await remove.scrollIntoViewIfNeeded()
  const box = (await remove.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(await trigger.locator('button').count()).toBe(0)
  await activate(remove, mobile)
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toContainText('研发团队')
  await expect(trigger).not.toContainText('设计团队')
  await expect(trigger).toContainText('+1')
  await activate(
    demo.getByRole('button', { name: '回填父节点', exact: true }),
    mobile,
  )
  const linked = demo.getByRole('combobox', { name: '关联勾选团队' })
  await activate(linked, mobile)
  const tree = page.getByRole('tree', { name: '关联勾选团队' })
  await choose(
    tree.getByRole('treeitem', { name: '研发团队', exact: true }),
    mobile,
  )
  await tree
    .getByRole('treeitem', { name: '产品团队', exact: true })
    .press('Escape')
  await activate(
    demo.getByRole('button', { name: '移除产品团队', exact: true }),
    mobile,
  )
  await expect(linked).toBeFocused()
  await expect(demo.getByRole('status', { name: '关联团队值' })).toHaveText(
    '[]',
  )
  await demo.screenshot({
    path:
      'output/playwright/tree-select-tags-' + testInfo.project.name + '.png',
  })
})

test('tree select respects logical popup placements and viewport bounds in LTR and RTL', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  for (const rtl of [false, true]) {
    if (rtl)
      await activate(
        demo.getByRole('button', { name: '使用 RTL 树选择' }),
        mobile,
      )
    for (const placement of [
      'topStart',
      'topEnd',
      'bottomStart',
      'bottomEnd',
    ]) {
      const trigger = demo.getByRole('combobox', {
        name: placement + ' 弹出位置',
      })
      await trigger.evaluate((element) =>
        element.scrollIntoView({ block: 'center' }),
      )
      await activate(trigger, mobile)
      const tree = page.getByRole('tree', { name: placement + ' 弹出位置' })
      const popup = tree.locator('../..')
      await expect(tree).toBeVisible()
      await expect(popup).toHaveAttribute('data-placement', placement)
      const anchor = (await trigger.boundingBox())!
      const box = (await popup.boundingBox())!
      expect(Math.abs(box.width - 240)).toBeLessThan(2)
      expect(box.x).toBeGreaterThanOrEqual(7)
      expect(box.x + box.width).toBeLessThanOrEqual(
        page.viewportSize()!.width - 7,
      )
      const alignRight = rtl !== placement.endsWith('End')
      expect(
        Math.abs(
          alignRight
            ? box.x + box.width - anchor.x - anchor.width
            : box.x - anchor.x,
        ),
      ).toBeLessThan(2)
      if (placement.startsWith('top'))
        expect(box.y + box.height).toBeLessThanOrEqual(anchor.y)
      else expect(box.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
      await tree.getByRole('treeitem').first().press('Escape')
      await expect(trigger).toBeFocused()
    }
  }
})

test('tree select virtual windows reach distant values and retain visible focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  const trigger = demo.getByRole('combobox', { name: '一千个部门' })
  await trigger.scrollIntoViewIfNeeded()
  const before = await trigger.boundingBox()
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '一千个部门' })
  const first = tree.getByRole('treeitem', { name: '部门 0000', exact: true })
  await expect(first).toBeFocused()
  expect(await tree.getByRole('treeitem').count()).toBeLessThan(25)
  await first.press('End')
  const last = tree.getByRole('treeitem', { name: '部门 0999', exact: true })
  await expect(last).toBeFocused()
  await expect(last).toHaveAttribute('aria-posinset', '1000')
  const styles = await last.locator('[data-tree-label]').evaluate((element) => {
    const css = getComputedStyle(element)
    return { outline: css.outlineStyle, width: parseFloat(css.outlineWidth) }
  })
  expect(styles.outline).not.toBe('none')
  expect(styles.width).toBeGreaterThan(0)
  await tree.screenshot({
    path:
      'output/playwright/tree-select-virtual-' + testInfo.project.name + '.png',
  })
  await last.press('Enter')
  await expect(trigger).toContainText('部门 0999')
  await expect(trigger).toBeFocused()
  const after = await trigger.boundingBox()
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(2)
  await activate(
    demo.getByRole('button', { name: '关闭树选择虚拟窗口' }),
    mobile,
  )
  await activate(trigger, mobile)
  await expect(tree.getByRole('treeitem')).toHaveCount(1000)
  await expect(last).toBeFocused()
})

test('tree select states, empty results and RTL popup stay inside narrow containers', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择完整预览' })
  await expect(
    demo.getByRole('combobox', { name: 'underlined 树选择' }),
  ).toHaveAttribute('aria-invalid', 'true')
  await expect(
    demo.getByRole('combobox', { name: 'filled 树选择' }),
  ).toHaveAttribute('data-status', 'warning')
  const empty = demo.getByRole('combobox', { name: '空树选择' })
  await activate(empty, mobile)
  await expect(page.getByRole('tree', { name: '空树选择' })).toContainText(
    '没有可选的团队',
  )
  await page.getByRole('searchbox', { name: '搜索空树选择' }).press('Escape')
  await activate(demo.getByRole('button', { name: '使用 RTL 树选择' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '关联勾选团队' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '关联勾选团队' })
  await expect(tree).toHaveAttribute('dir', 'rtl')
  await expect(tree.locator('..')).toHaveAttribute('dir', 'rtl')
  const team = tree.getByRole('treeitem', { name: '产品团队', exact: true })
  await page
    .getByRole('searchbox', { name: '搜索关联勾选团队' })
    .press('ArrowDown')
  await team.press('ArrowRight')
  await expect(team).toHaveAttribute('aria-expanded', 'false')
  await team.press('ArrowLeft')
  await expect(team).toHaveAttribute('aria-expanded', 'true')
  for (const width of mobile
    ? [page.viewportSize()!.width]
    : [360, 390, 768, 1280]) {
    if (!mobile) await page.setViewportSize({ width, height: 850 })
    await trigger.scrollIntoViewIfNeeded()
    if ((await trigger.getAttribute('aria-expanded')) !== 'true')
      await activate(trigger, mobile)
    await expect(tree).toBeVisible()
    const box = (await tree.locator('../..').boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(7)
    expect(box.x + box.width).toBeLessThanOrEqual(
      page.viewportSize()!.width - 7,
    )
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
  }
  await tree.screenshot({
    path: 'output/playwright/tree-select-rtl-' + testInfo.project.name + '.png',
  })
})
