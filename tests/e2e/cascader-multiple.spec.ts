import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
async function check(control: Locator, mobile: boolean) {
  if (mobile) await control.locator('[data-cascader-checkbox]').tap()
  else {
    await control.focus()
    await control.press('Space')
  }
}

test('cascader multiple conducts full branches and protects disabled check boundaries', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联多选完整预览' })
  await activate(demo.getByRole('button', { name: '设置多选受控空值' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '关联级联多选' })
  await activate(trigger, mobile)
  const tree = page.getByRole('tree', { name: '关联级联多选' })
  const team = tree.getByRole('treeitem', { name: '产品团队', exact: true })
  if (mobile) await team.locator(':scope > span').nth(1).tap()
  else await team.press('ArrowRight')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[]',
  )
  const design = tree.getByRole('treeitem', { name: '设计团队', exact: true })
  const box = (await design.locator('[data-cascader-checkbox]').boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await check(design, mobile)
  await expect(team).toHaveAttribute('aria-checked', 'mixed')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team","design"]]',
  )
  await check(
    tree.getByRole('treeitem', { name: '研发团队', exact: true }),
    mobile,
  )
  await expect(team).toHaveAttribute('aria-checked', 'true')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team"]]',
  )
  const directory = tree.getByRole('treeitem', {
    name: '不可勾选目录',
    exact: true,
  })
  await expect(directory).toHaveAttribute('aria-description', '勾选已禁用')
  await check(directory, mobile)
  await expect(directory).toHaveAttribute('aria-checked', 'false')
  if (mobile) await directory.locator(':scope > span').nth(1).tap()
  else await directory.press('ArrowRight')
  const independent = tree.getByRole('treeitem', {
    name: '独立团队',
    exact: true,
  })
  await expect(independent).toHaveAttribute('aria-checked', 'false')
  await check(independent, mobile)
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team"],["team","readonly","independent"]]',
  )
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await tree.screenshot({
    path:
      'output/playwright/cascader-multiple-checks-' +
      testInfo.project.name +
      '.png',
  })
})

test('cascader multiple search keeps invisible checks and disambiguates repeated values', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联多选完整预览' })
  await activate(demo.getByRole('button', { name: '回填叶路径' }), mobile)
  await activate(demo.getByRole('button', { name: '保留多选搜索' }), mobile)
  const trigger = demo.getByRole('combobox', { name: '关联级联多选' })
  await activate(trigger, mobile)
  const search = page.getByRole('searchbox', { name: '搜索关联级联多选' })
  await search.fill('网页')
  const results = page.getByRole('listbox', { name: '关联级联多选' })
  await expect(results.getByRole('option')).toHaveCount(3)
  await expect(
    results.getByRole('option', { name: '产品团队 / 设计团队 / 网页设计' }),
  ).toHaveAttribute('aria-checked', 'true')
  await check(
    results.getByRole('option', { name: '支持团队 / 网页支持' }),
    mobile,
  )
  await expect(search).toHaveValue('网页')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team","design","web"],["support","web"]]',
  )
  await search.fill('停用团队后代')
  const blocked = results.getByRole('option')
  await expect(blocked).toHaveAttribute('aria-disabled', 'true')
  if (mobile)
    await blocked.locator('[data-cascader-checkbox]').tap({ force: true })
  else await blocked.locator('[data-cascader-checkbox]').click({ force: true })
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team","design","web"],["support","web"]]',
  )
  await search.fill('没有对应团队')
  await expect(results.getByRole('status')).toHaveText('暂无匹配选项')
  await search.press('Escape')
  await expect(trigger).toBeFocused()
})

test('cascader multiple portal continues Tab through clear and tag removal to the next field', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '级联多选完整预览' })
  const trigger = demo.getByRole('combobox', { name: '关联级联多选' })
  await trigger.focus()
  await trigger.press('ArrowDown')
  const search = page.getByRole('searchbox', { name: '搜索关联级联多选' })
  await search.press('Tab')
  const team = page
    .getByRole('tree', { name: '关联级联多选' })
    .getByRole('treeitem', { name: '产品团队', exact: true })
  await expect(team).toBeFocused()
  await team.press('Shift+Tab')
  await expect(search).toBeFocused()
  await search.press('Tab')
  await team.press('Tab')
  const clear = demo.getByRole('button', { name: '清空关联级联多选' })
  await expect(clear).toBeFocused()
  await clear.press('Tab')
  const remove = demo.getByRole('button', {
    name: '移除产品团队 / 设计团队 / 网页设计',
  })
  await expect(remove).toBeFocused()
  const box = (await remove.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await remove.press('Tab')
  await expect(
    demo.getByRole('textbox', { name: '多选后的输入' }),
  ).toBeFocused()
  await demo.getByRole('textbox', { name: '多选后的输入' }).press('Shift+Tab')
  await expect(remove).toBeFocused()
  await remove.press('Shift+Tab')
  await expect(clear).toBeFocused()
  await clear.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await remove.press('Enter')
  await expect(trigger).toBeFocused()
  await expect(trigger).toContainText('请选择')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[]',
  )
  expect(await trigger.locator('button').count()).toBe(0)
  const folded = demo.getByRole('combobox', { name: '折叠多选路径' })
  await folded.locator('../..').screenshot({
    path:
      'output/playwright/cascader-multiple-tags-' +
      testInfo.project.name +
      '.png',
  })
})

test('cascader multiple keeps removed values, restores labels and renders RTL panels in narrow viewports', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '级联多选完整预览' })
  const trigger = demo.getByRole('combobox', { name: '关联级联多选' })
  await activate(demo.getByRole('button', { name: '移除设计团队' }), mobile)
  await expect(trigger).toContainText('team / design / web')
  await expect(demo.getByRole('status', { name: '级联多选值' })).toHaveText(
    '[["team","design","web"]]',
  )
  await activate(demo.getByRole('button', { name: '恢复设计团队' }), mobile)
  await expect(trigger).toContainText('产品团队 / 设计团队 / 网页设计')
  await activate(
    demo.getByRole('button', { name: '使用 RTL 级联多选' }),
    mobile,
  )
  const panel = demo.getByRole('tree', { name: '内嵌团队多选' })
  await expect(panel).toHaveAttribute('dir', 'rtl')
  const team = panel.getByRole('treeitem', { name: '产品团队', exact: true })
  await team.focus()
  await team.press('ArrowLeft')
  const design = panel.getByRole('treeitem', { name: '设计团队', exact: true })
  await expect(design).toBeFocused()
  await design.press('Space')
  await expect(team).toHaveAttribute('aria-checked', 'mixed')
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 780 })
    await expect(demo.getByLabel('另有 3 项已选路径')).toHaveText(
      '另外 3 条路径',
    )
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
    const tags = demo
      .getByRole('combobox', { name: '折叠多选路径' })
      .locator('../..')
    const box = (await tags.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    if (width === 360)
      await tags.screenshot({
        path:
          'output/playwright/cascader-multiple-rtl-' +
          testInfo.project.name +
          '.png',
      })
  }
  await activate(demo.getByRole('button', { name: '禁用级联多选' }), mobile)
  await expect(trigger).toBeDisabled()
  await expect(
    demo.getByRole('button', { name: '移除产品团队 / 设计团队 / 网页设计' }),
  ).toHaveCount(0)
})

test('cascader multiple FormItem validates complete paths and resets an array value', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const form = page.getByRole('form', { name: '级联多选表单' })
  const trigger = form.getByRole('combobox', { name: '表单级联多选' })
  await activate(form.getByRole('button', { name: '提交多选团队' }), mobile)
  await expect(form.getByText('请选择团队', { exact: true })).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-invalid', 'true')
  await activate(trigger, mobile)
  const team = page
    .getByRole('tree', { name: '表单级联多选' })
    .getByRole('treeitem', { name: '产品团队', exact: true })
  await check(team, mobile)
  await team.press('Escape')
  await activate(form.getByRole('button', { name: '提交多选团队' }), mobile)
  await expect(
    form.getByRole('status', { name: '多选团队提交结果' }),
  ).toHaveText('[["team"]]')
  await activate(form.getByRole('button', { name: '重置多选团队' }), mobile)
  await expect(trigger).toContainText('请选择')
  await expect(trigger).not.toHaveAttribute('aria-invalid', 'true')
})
