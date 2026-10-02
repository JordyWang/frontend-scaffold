import { expect, test, type Locator } from '@playwright/test'
async function activate(target: Locator, mobile: boolean) {
  if (mobile) await target.tap()
  else await target.click()
}
test.beforeEach(async ({ page }) => {
  await page.goto('/__ui')
})

test('editable cards close independently, select accepted additions and emit one value change', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: 'Tabs 能力预览',
    exact: true,
  })
  const workspace = preview.getByRole('region', {
    name: '编辑工作区预览',
    exact: true,
  })
  const list = workspace.getByRole('tablist', {
    name: '编辑工作区',
    exact: true,
  })
  const status = workspace.getByRole('status', { name: '工作区标签状态' })
  await expect(
    list.getByRole('tab', { name: '草稿 1', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  const visibleTab = list.getByRole('tab', { name: '草稿 1', exact: true })
  const tabBox = (await visibleTab.boundingBox())!
  const closeBox = (await list
    .getByRole('button', { name: '关闭草稿 1', exact: true })
    .boundingBox())!
  const listBox = (await list.boundingBox())!
  // WebKit rounds fractional scroll offsets, leaving up to about 1.5 CSS px.
  const edgeTolerance = 2
  for (const box of [tabBox, closeBox]) {
    expect(box.x).toBeGreaterThanOrEqual(listBox.x - edgeTolerance)
    expect(box.x + box.width).toBeLessThanOrEqual(
      listBox.x + listBox.width + edgeTolerance,
    )
  }
  expect(
    await list
      .getByRole('tab')
      .evaluateAll((tabs) => tabs.every((tab) => !tab.querySelector('button'))),
  ).toBe(true)
  await expect(list.getByRole('button', { name: '关闭项目概览' })).toHaveCount(
    0,
  )
  await expect(
    list.getByRole('button', { name: '关闭不可用文档' }),
  ).toBeDisabled()
  for (const control of await list.locator('button').all()) {
    const box = (await control.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await activate(
    list.getByRole('button', { name: '关闭草稿 1', exact: true }),
    mobile,
  )
  await expect(
    list.getByRole('tab', { name: '草稿 1', exact: true }),
  ).toHaveCount(0)
  await expect(
    list.getByRole('tab', { name: '项目概览', exact: true }),
  ).toBeFocused()
  await expect(status).toHaveText('选择 summary · 变化 1 次 · 标签 3 项')
  await activate(
    list.getByRole('button', { name: '关闭草稿 2', exact: true }),
    mobile,
  )
  await expect(status).toHaveText('选择 summary · 变化 1 次 · 标签 2 项')
  await activate(
    list.getByRole('button', { name: '新增标签页', exact: true }),
    mobile,
  )
  await expect(
    list.getByRole('tab', { name: '草稿 3', exact: true }),
  ).toBeFocused()
  await expect(
    list.getByRole('tab', { name: '草稿 3', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(status).toHaveText('选择 note3 · 变化 2 次 · 标签 3 项')
  await expect(
    workspace.getByRole('textbox', { name: '草稿 3正文', exact: true }),
  ).toHaveValue('尚未修改')
  await preview
    .getByRole('button', { name: '切换标签尺寸', exact: true })
    .focus()
  await workspace.screenshot({
    path: 'output/playwright/tabs-editable-' + info.project.name + '.png',
  })
})

test('tabs keyboard roving skips disabled tabs and Delete and Tab keep close and add controls reachable', async ({
  page,
}, info) => {
  const workspace = page.getByRole('region', {
    name: '编辑工作区预览',
    exact: true,
  })
  const list = workspace.getByRole('tablist', {
    name: '编辑工作区',
    exact: true,
  })
  const first = list.getByRole('tab', { name: '草稿 1', exact: true })
  await first.focus()
  const forward = info.project.name === 'mobile-webkit' ? 'Alt+Tab' : 'Tab'
  const backward =
    info.project.name === 'mobile-webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'
  await first.press(forward)
  await expect(
    list.getByRole('button', { name: '关闭草稿 1', exact: true }),
  ).toBeFocused()
  await list
    .getByRole('button', { name: '关闭草稿 1', exact: true })
    .press(backward)
  await expect(first).toBeFocused()
  await first.press('End')
  const second = list.getByRole('tab', { name: '草稿 2', exact: true })
  await expect(second).toBeFocused()
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await second.press('Delete')
  await expect(first).toBeFocused()
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await first.press('Delete')
  const summary = list.getByRole('tab', { name: '项目概览', exact: true })
  await expect(summary).toBeFocused()
  await summary.press('Delete')
  await expect(summary).toBeVisible()
  await summary.press(forward)
  await expect(
    list.getByRole('button', { name: '新增标签页', exact: true }),
  ).toBeFocused()
  await list
    .getByRole('button', { name: '新增标签页', exact: true })
    .press('Enter')
  await expect(
    list.getByRole('tab', { name: '草稿 3', exact: true }),
  ).toBeFocused()
})

test('visited panels retain drafts, hide inactive controls and support explicit destruction and empty recovery', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: 'Tabs 能力预览',
    exact: true,
  })
  const workspace = preview.getByRole('region', {
    name: '编辑工作区预览',
    exact: true,
  })
  const list = workspace.getByRole('tablist', {
    name: '编辑工作区',
    exact: true,
  })
  const input = workspace.getByRole('textbox', {
    name: '草稿 1正文',
    exact: true,
  })
  await input.fill('应保留的草稿')
  await activate(list.getByRole('tab', { name: '草稿 2', exact: true }), mobile)
  await expect(input).toHaveCount(0)
  await expect(workspace.getByRole('tabpanel')).toHaveCount(1)
  await activate(list.getByRole('tab', { name: '草稿 1', exact: true }), mobile)
  await expect(input).toHaveValue('应保留的草稿')
  await activate(
    preview.getByRole('button', { name: '销毁隐藏面板', exact: true }),
    mobile,
  )
  await activate(list.getByRole('tab', { name: '草稿 2', exact: true }), mobile)
  await activate(list.getByRole('tab', { name: '草稿 1', exact: true }), mobile)
  await expect(input).toHaveValue('尚未修改')
  await activate(
    preview.getByRole('button', { name: '清空工作区标签', exact: true }),
    mobile,
  )
  await expect(workspace.getByText('暂无可用标签页')).toBeVisible()
  await activate(
    list.getByRole('button', { name: '新增标签页', exact: true }),
    mobile,
  )
  const added = list.getByRole('tab', { name: '草稿 3', exact: true })
  await expect(added).toBeFocused()
  await added.press('Delete')
  await expect(
    list.getByRole('button', { name: '新增标签页', exact: true }),
  ).toBeFocused()
  await expect(workspace.getByText('暂无可用标签页')).toBeVisible()
})

test('controlled edit requests wait for item and value acceptance without reclaiming outside focus', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '受控标签更新预览',
    exact: true,
  })
  const list = preview.getByRole('tablist', {
    name: '受控编辑标签',
    exact: true,
  })
  const status = preview.getByRole('status', { name: '受控标签状态' })
  await activate(list.getByRole('button', { name: '关闭受控二' }), mobile)
  await expect(preview.getByRole('tabpanel')).toHaveText('受控第二面板')
  await expect(status).toContainText('请求 remove:two')
  await activate(preview.getByRole('button', { name: '接受标签数据' }), mobile)
  await expect(list.getByRole('tab', { name: '受控二' })).toHaveCount(0)
  await expect(preview.getByRole('tabpanel')).toHaveCount(0)
  await expect(status).toContainText('当前 two · 请求 无 · 待选择 one')
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[data-ui-tabs]'),
    ),
  ).toBe(false)
  await activate(preview.getByRole('button', { name: '接受标签选择' }), mobile)
  await expect(preview.getByRole('tabpanel')).toHaveText('受控第一面板')
  await activate(list.getByRole('button', { name: '新增标签页' }), mobile)
  await expect(status).toContainText('请求 add:new3')
  await expect(list.getByRole('tab', { name: '受控新增 3' })).toHaveCount(0)
  await activate(preview.getByRole('button', { name: '接受标签数据' }), mobile)
  await expect(list.getByRole('tab', { name: '受控新增 3' })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  await expect(preview.getByRole('tabpanel')).toHaveText('受控第一面板')
  await activate(preview.getByRole('button', { name: '接受标签选择' }), mobile)
  await expect(preview.getByRole('tabpanel')).toHaveText('受控新增面板 new3')
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[data-ui-tabs]'),
    ),
  ).toBe(false)
})

test('card placement and container responsive side tabs preserve selection and manual activation', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '卡片与位置预览',
    exact: true,
  })
  const bottom = preview.getByRole('tablist', {
    name: '底部卡片标签',
    exact: true,
  })
  const bottomRoot = bottom.locator('..')
  const panelBox = (await bottomRoot.getByRole('tabpanel').boundingBox())!
  expect((await bottom.boundingBox())!.y).toBeGreaterThanOrEqual(
    panelBox.y + panelBox.height,
  )
  const group = preview.getByRole('group', {
    name: '响应式标签容器',
    exact: true,
  })
  const list = group.getByRole('tablist', { name: '逻辑位置标签', exact: true })
  await expect(list).toHaveAttribute(
    'aria-orientation',
    mobile ? 'horizontal' : 'vertical',
  )
  const first = list.getByRole('tab', { name: '项目概览', exact: true })
  await first.focus()
  await first.press(mobile ? 'ArrowRight' : 'ArrowDown')
  const second = list.getByRole('tab', { name: '草稿 1', exact: true })
  await expect(second).toBeFocused()
  await expect(second).toHaveAttribute('aria-selected', 'false')
  await second.press('Enter')
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await activate(preview.getByRole('button', { name: '收窄标签容器' }), mobile)
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal')
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await activate(preview.getByRole('button', { name: '切换标签位置' }), mobile)
  await expect(list.locator('..')).toHaveAttribute('data-ui-placement', 'top')
  await activate(preview.getByRole('button', { name: '放宽标签容器' }), mobile)
  await expect(list.locator('..')).toHaveAttribute(
    'data-ui-placement',
    mobile ? 'top' : 'end',
  )
  await preview.screenshot({
    path: 'output/playwright/tabs-placement-' + info.project.name + '.png',
  })
})

test('RTL dark tabs follow logical keys and narrow headers scroll locally with 44px touch targets', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const rtl = page.getByRole('group', {
    name: '窄容器 RTL 标签预览',
    exact: true,
  })
  const list = rtl.getByRole('tablist', { name: 'RTL 编辑标签', exact: true })
  for (const control of await list.locator('button').all()) {
    const box = (await control.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  const first = list.getByRole('tab', { name: '项目概览', exact: true })
  await first.focus()
  await first.press('ArrowLeft')
  await expect(
    list.getByRole('tab', { name: '草稿 1', exact: true }),
  ).toBeFocused()
  await list.getByRole('tab', { name: '草稿 1', exact: true }).press('End')
  await expect(
    list.getByRole('tab', { name: '草稿 2', exact: true }),
  ).toBeFocused()
  await activate(
    list.getByRole('button', { name: '关闭草稿 2', exact: true }),
    mobile,
  )
  await expect(
    list.getByRole('tab', { name: '草稿 1', exact: true }),
  ).toBeFocused()
  await expect(
    list.getByRole('tab', { name: '草稿 1', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  const rtlBox = (await list.boundingBox())!
  for (const target of [
    list.getByRole('tab', { name: '草稿 1', exact: true }),
    list.getByRole('button', { name: '关闭草稿 1', exact: true }),
  ]) {
    const box = (await target.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(rtlBox.x - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(rtlBox.x + rtlBox.width + 1)
  }
  const root = page.getByRole('region', { name: '编辑工作区预览', exact: true })
  const ltr = root.getByRole('tablist', { name: '编辑工作区', exact: true })
  const ltrScroll = ltr.locator('[data-tabs-scroll]')
  await ltrScroll.scrollIntoViewIfNeeded()
  await ltrScroll.evaluate((node) => {
    node.scrollLeft = 0
  })
  if (info.project.name === 'mobile-chromium') {
    const box = (await ltrScroll.boundingBox())!
    const session = await page.context().newCDPSession(page)
    const y = box.y + box.height / 2
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.8, y }],
    })
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: box.x + box.width * (0.8 - step * 0.075), y }],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
    await expect
      .poll(() => ltrScroll.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0)
  }
  await page.getByRole('button', { name: '切换标签尺寸', exact: true }).focus()
  await rtl.screenshot({
    path: 'output/playwright/tabs-rtl-' + info.project.name + '.png',
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('more menu searches hidden tabs, keeps indicator and extra actions usable', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '标签栏扩展预览',
    exact: true,
  })
  const list = preview.getByRole('tablist', { name: '扩展标签', exact: true })
  await expect(preview.getByText('工作区', { exact: true })).toBeVisible()
  await expect(
    preview.getByRole('button', { name: '扩展标签设置', exact: true }),
  ).toBeVisible()
  await expect(list.locator('[data-tabs-indicator]')).toHaveCount(1)
  const more = preview.getByRole('button', { name: '更多标签', exact: true })
  await expect(more).toBeVisible()
  await activate(more, mobile)
  const menu = page.getByRole('menu', { name: '更多标签', exact: true })
  await expect(menu).toBeVisible()
  const search = menu.getByRole('searchbox', {
    name: '搜索更多标签',
    exact: true,
  })
  await expect(search).toBeFocused()
  await search.fill('数据标签 7')
  const result = menu.getByRole('menuitem', {
    name: '数据标签 7',
    exact: true,
  })
  await expect(result).toBeVisible()
  await result.press('Enter')
  await expect(menu).toBeHidden()
  await expect(
    list.getByRole('tab', { name: '数据标签 7', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await preview.getByRole('button', { name: /指示条对齐/ }).press('Enter')
  await expect(list.locator('[data-tabs-indicator]')).toHaveCount(1)
})
