import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile && (await control.getAttribute('role')) === 'combobox') {
    // Tap the dropdown arrow; the control center may contain a tag removal button.
    await control.scrollIntoViewIfNeeded()
    const box = (await control.boundingBox())!
    const rtl = (await control.locator('..').getAttribute('dir')) === 'rtl'
    await control.tap({
      position: { x: rtl ? 12 : box.width - 12, y: box.height / 2 },
    })
  } else if (mobile) await control.tap()
  else await control.press('Enter')
}
async function expand(node: Locator, mobile: boolean, key = 'ArrowRight') {
  if (mobile)
    await node.locator(':scope > [data-ui-tree-row] [data-tree-toggle]').tap()
  else await node.press(key)
}

test('lazy tree select caches labels and nested options, conducts selection and recognizes empty folders', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择异步加载预览' })
  const trigger = demo.getByRole('combobox', { name: '异步团队选择' })
  const tree = page.getByRole('tree', { name: '异步团队选择' })
  const count = demo.getByRole('status', { name: '异步树选择请求次数' })
  await expect(trigger).toContainText('remote-file')
  await activate(trigger, mobile)
  const remote = tree.getByRole('treeitem', { name: '远程团队', exact: true })
  await expand(remote, mobile)
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  const design = tree.getByRole('treeitem', { name: '远程设计组', exact: true })
  await expect(design).toBeVisible()
  await expect(design).toHaveAttribute('aria-checked', 'true')
  await expect(trigger).toContainText('远程设计组')
  await expect(count).toHaveText('已发起 1 次请求')
  await remote.press('Escape')
  await expect(trigger).toBeFocused()
  await activate(trigger, mobile)
  await expect(design).toBeVisible()
  await expect(count).toHaveText('已发起 1 次请求')
  const folder = tree.getByRole('treeitem', {
    name: '远程研发目录',
    exact: true,
  })
  await expand(folder, mobile)
  const nested = tree.getByRole('treeitem', {
    name: '嵌套研发团队',
    exact: true,
  })
  await expect(nested).toBeVisible()
  if (mobile) await nested.locator('[data-tree-label]').tap()
  else await nested.press('Space')
  await expect(demo.getByRole('status', { name: '异步树选择值' })).toHaveText(
    '["remote-file","nested-file"]',
  )
  await expect(trigger).toContainText('2/3')
  const empty = tree.getByRole('treeitem', { name: '空远程目录', exact: true })
  await expand(empty, mobile)
  await expect(count).toHaveText('已发起 3 次请求')
  await expect(empty).not.toHaveAttribute('aria-expanded')
  const search = page.getByRole('searchbox', { name: '搜索异步团队选择' })
  await search.fill('嵌套研发')
  await expect(nested).toHaveAttribute('aria-checked', 'true')
  await expect(count).toHaveText('已发起 3 次请求')
  await tree.screenshot({
    path:
      'output/playwright/tree-select-async-loaded-' +
      testInfo.project.name +
      '.png',
  })
})

test('lazy tree select offers 44px failure retry and cancellation, ignores cancelled results and refreshes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择异步加载预览' })
  const trigger = demo.getByRole('combobox', { name: '异步团队选择' })
  const tree = page.getByRole('tree', { name: '异步团队选择' })
  const remote = tree.getByRole('treeitem', { name: '远程团队', exact: true })
  const count = demo.getByRole('status', { name: '异步树选择请求次数' })
  await activate(
    demo.getByRole('button', { name: '模拟树选择加载失败' }),
    mobile,
  )
  await activate(trigger, mobile)
  await expand(remote, mobile)
  await expect(tree.getByRole('alert')).toHaveText('子节点加载失败，请重试。')
  await tree.screenshot({
    path:
      'output/playwright/tree-select-async-error-' +
      testInfo.project.name +
      '.png',
  })
  await activate(demo.getByRole('button', { name: '恢复树选择响应' }), mobile)
  await activate(trigger, mobile)
  const retry = tree.getByRole('button', { name: '重试加载远程团队' })
  const retryBox = (await retry.boundingBox())!
  expect(retryBox.width).toBeGreaterThanOrEqual(44)
  expect(retryBox.height).toBeGreaterThanOrEqual(44)
  await activate(retry, mobile)
  await expect(tree.getByRole('treeitem', { name: '远程设计组' })).toBeVisible()
  await expect(remote).toBeFocused()
  await expect(count).toHaveText('已发起 2 次请求')
  await activate(
    demo.getByRole('button', { name: '刷新异步树选择缓存' }),
    mobile,
  )
  await expect(trigger).toContainText('remote-file')
  await activate(trigger, mobile)
  const cancel = tree.getByRole('button', { name: '取消加载远程团队' })
  await expect(cancel).toBeVisible()
  const cancelBox = (await cancel.boundingBox())!
  expect(cancelBox.width).toBeGreaterThanOrEqual(44)
  expect(cancelBox.height).toBeGreaterThanOrEqual(44)
  await activate(cancel, mobile)
  await expect(remote).toHaveAttribute('aria-expanded', 'false')
  await expect(remote).toBeFocused()
  await expect(
    demo.getByRole('status', { name: '异步树选择读取结果' }),
  ).toHaveText('请求已取消')
  await expand(remote, mobile)
  await expect(tree.getByRole('treeitem', { name: '远程设计组' })).toBeVisible()
  await expect(count).toHaveText('已发起 4 次请求')
  await remote.press('Escape')
  await expect(trigger).toBeFocused()
})

test('lazy tree select aborts when closing, disabling, removing or searching without losing keyboard access', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const demo = page.getByRole('region', { name: '树选择异步加载预览' })
  const trigger = demo.getByRole('combobox', { name: '异步团队选择' })
  const tree = page.getByRole('tree', { name: '异步团队选择' })
  const remote = tree.getByRole('treeitem', { name: '远程团队', exact: true })
  const status = demo.getByRole('status', { name: '异步树选择读取结果' })
  await activate(trigger, mobile)
  await expand(remote, mobile)
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  await remote.press('Escape')
  await expect(status).toHaveText('请求已取消')
  await activate(trigger, mobile)
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  await activate(demo.getByRole('button', { name: '禁用异步树选择' }), mobile)
  await expect(trigger).toBeDisabled()
  await expect(status).toHaveText('请求已取消')
  await activate(demo.getByRole('button', { name: '启用异步树选择' }), mobile)
  await activate(trigger, mobile)
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  const search = page.getByRole('searchbox', { name: '搜索异步团队选择' })
  await search.fill('远程')
  await expect(status).toHaveText('请求已取消')
  await expect(remote).not.toHaveAttribute('aria-busy')
  await expect(
    demo.getByRole('status', { name: '异步树选择请求次数' }),
  ).toHaveText('已发起 3 次请求')
  await search.fill('')
  await expect(remote).toHaveAttribute('aria-busy', 'true')
  await activate(
    demo.getByRole('button', { name: '删除树选择远程团队' }),
    mobile,
  )
  await expect(status).toHaveText('请求已取消')
  await activate(trigger, mobile)
  await expect(remote).toHaveCount(0)
  await page
    .getByRole('searchbox', { name: '搜索异步团队选择' })
    .press('Escape')
  await activate(
    demo.getByRole('button', { name: '恢复树选择远程团队' }),
    mobile,
  )
  await activate(
    demo.getByRole('button', { name: '使用 RTL 异步树选择' }),
    mobile,
  )
  await activate(trigger, mobile)
  await expect(tree).toHaveAttribute('dir', 'rtl')
  await expand(remote, mobile, 'ArrowLeft')
  await expect(tree.getByRole('treeitem', { name: '远程设计组' })).toBeVisible()
  await tree.screenshot({
    path:
      'output/playwright/tree-select-async-rtl-' +
      testInfo.project.name +
      '.png',
  })
  await remote.press('Escape')
  await expect(trigger).toBeFocused()
})
