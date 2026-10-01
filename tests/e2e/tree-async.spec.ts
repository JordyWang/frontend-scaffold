import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}
async function expand(item: Locator, mobile: boolean) {
  if (mobile)
    await item.locator(':scope > [data-ui-tree-row] [data-tree-toggle]').tap()
  else {
    await item.focus()
    await item.press('ArrowRight')
  }
}

test('lazy tree caches children, loads nested directories and recognizes empty results', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树异步加载预览' })
  const tree = preview.getByRole('tree', { name: '异步目录树' })
  const root = tree.getByRole('treeitem', { name: '远程目录', exact: true })
  await expand(root, mobile)
  await expect(root).toHaveAttribute('aria-busy', 'true')
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 1 次请求')
  const file = tree.getByRole('treeitem', { name: '远程文件', exact: true })
  await expect(file).toBeVisible()
  await expect(file).toHaveAttribute('aria-checked', 'true')
  await expect(root).not.toHaveAttribute('aria-busy')
  if (!mobile) await expect(root).toBeFocused()
  await activate(
    preview.getByRole('button', { name: '外部收起远程目录' }),
    mobile,
  )
  await expect(file).toHaveCount(0)
  await expand(root, mobile)
  await expect(file).toBeVisible()
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 1 次请求')
  const nested = tree.getByRole('treeitem', { name: '远程子目录', exact: true })
  await expand(nested, mobile)
  await expect(
    tree.getByRole('treeitem', { name: '嵌套远程文件' }),
  ).toBeVisible()
  const empty = tree.getByRole('treeitem', { name: '空目录', exact: true })
  await expand(empty, mobile)
  await expect(empty).toHaveAttribute('aria-busy', 'true')
  await expect(empty).not.toHaveAttribute('aria-expanded')
  await expect(empty).not.toHaveAttribute('aria-busy')
  await expect(
    tree.getByRole('treeitem', { name: '固定叶节点' }),
  ).not.toHaveAttribute('aria-expanded')
  await expect(
    tree.getByRole('treeitem', { name: '禁用远程目录' }),
  ).toHaveAttribute('aria-disabled', 'true')
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 3 次请求')
  await tree.screenshot({
    path: `output/playwright/tree-async-loaded-${testInfo.project.name}.png`,
  })
})

test('lazy tree reports failures and restores node focus after button retry', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树异步加载预览' })
  const tree = preview.getByRole('tree', { name: '异步目录树' })
  const root = tree.getByRole('treeitem', { name: '远程目录', exact: true })
  await activate(
    preview.getByRole('button', { name: '模拟树加载失败' }),
    mobile,
  )
  await expand(root, mobile)
  await expect(tree.getByRole('alert')).toHaveText('子节点加载失败，请重试。')
  await expect(root).toHaveAccessibleDescription('子节点加载失败，请重试。')
  await tree.screenshot({
    path: `output/playwright/tree-async-error-${testInfo.project.name}.png`,
  })
  await activate(
    preview.getByRole('button', { name: '恢复正常树响应' }),
    mobile,
  )
  const retry = tree.getByRole('button', { name: '重试加载远程目录' })
  const box = (await retry.boundingBox())!
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.width).toBeGreaterThanOrEqual(44)
  await retry.focus()
  await activate(retry, mobile)
  await expect(
    tree.getByRole('treeitem', { name: '远程文件', exact: true }),
  ).toBeVisible()
  await expect(tree.getByRole('alert')).toHaveCount(0)
  await expect(root).toBeFocused()
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 2 次请求')
})

test('lazy tree cancels from touch controls and external collapse, then starts a fresh request', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树异步加载预览' })
  const tree = preview.getByRole('tree', { name: '异步目录树' })
  const root = tree.getByRole('treeitem', { name: '远程目录', exact: true })
  await expand(root, mobile)
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 1 次请求')
  const cancel = tree.getByRole('button', { name: '取消加载远程目录' })
  expect((await cancel.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await activate(cancel, mobile)
  await expect(root).toHaveAttribute('aria-expanded', 'false')
  await expect(
    preview.getByRole('status', { name: '异步树读取结果' }),
  ).toHaveText('请求已取消')
  await expect(root).not.toHaveAttribute('aria-busy')
  await activate(
    preview.getByRole('button', { name: '外部展开远程目录' }),
    mobile,
  )
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 2 次请求')
  await activate(
    preview.getByRole('button', { name: '外部收起远程目录' }),
    mobile,
  )
  await expect(
    preview.getByRole('status', { name: '异步树读取结果' }),
  ).toHaveText('请求已取消')
  await expand(root, mobile)
  await expect(
    tree.getByRole('treeitem', { name: '远程文件', exact: true }),
  ).toBeVisible()
  await expect(
    preview.getByRole('status', { name: '异步树请求次数' }),
  ).toHaveText('已发起 3 次请求')
})

test('lazy tree aborts on disabling and deletion, and refreshes its loaded cache', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树异步加载预览' })
  const tree = preview.getByRole('tree', { name: '异步目录树' })
  const root = tree.getByRole('treeitem', { name: '远程目录', exact: true })
  const count = preview.getByRole('status', { name: '异步树请求次数' })
  await expand(root, mobile)
  await expect(count).toHaveText('已发起 1 次请求')
  await activate(preview.getByRole('button', { name: '禁用异步树' }), mobile)
  await expect(tree).toHaveAttribute('aria-disabled', 'true')
  await expect(
    preview.getByRole('status', { name: '异步树读取结果' }),
  ).toHaveText('请求已取消')
  await expect(root).not.toHaveAttribute('aria-busy')
  await activate(preview.getByRole('button', { name: '启用异步树' }), mobile)
  await expect(count).toHaveText('已发起 2 次请求')
  await activate(preview.getByRole('button', { name: '删除远程目录' }), mobile)
  await expect(root).toHaveCount(0)
  await expect(
    preview.getByRole('status', { name: '异步树读取结果' }),
  ).toHaveText('请求已取消')
  await activate(preview.getByRole('button', { name: '恢复远程目录' }), mobile)
  const file = tree.getByRole('treeitem', { name: '远程文件', exact: true })
  await expect(file).toBeVisible()
  await expect(count).toHaveText('已发起 3 次请求')
  await activate(
    preview.getByRole('button', { name: '刷新异步树缓存' }),
    mobile,
  )
  await expect(root).toHaveAttribute('aria-busy', 'true')
  await expect(file).toHaveCount(0)
  await expect(file).toBeVisible()
  await expect(count).toHaveText('已发起 4 次请求')
})

test('lazy tree supports RTL retry keys, reduced motion and responsive loading feedback', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '树异步加载预览' })
  const tree = preview.getByRole('tree', { name: '异步目录树' })
  await activate(
    preview.getByRole('button', { name: '使用 RTL 异步树' }),
    mobile,
  )
  await activate(
    preview.getByRole('button', { name: '模拟树加载失败' }),
    mobile,
  )
  const root = tree.getByRole('treeitem', { name: '远程目录', exact: true })
  await expect(tree).toHaveAttribute('dir', 'rtl')
  await root.focus()
  await root.press('ArrowLeft')
  await expect(root).toHaveAttribute('aria-busy', 'true')
  await expect(tree.locator('[data-ui-tree-loading-indicator]')).toHaveCSS(
    'animation-name',
    'none',
  )
  await tree.screenshot({
    path: `output/playwright/tree-async-loading-rtl-${testInfo.project.name}.png`,
  })
  await expect(tree.getByRole('alert')).toBeVisible()
  await activate(
    preview.getByRole('button', { name: '恢复正常树响应' }),
    mobile,
  )
  await root.focus()
  await root.press('ArrowLeft')
  const file = tree.getByRole('treeitem', { name: '远程文件', exact: true })
  await expect(file).toBeVisible()
  await root.press('ArrowLeft')
  await expect(file).toBeFocused()
  await file.press('ArrowRight')
  await expect(root).toBeFocused()
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 850 })
    expect(
      await tree.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true)
    expect(
      await preview.evaluate(
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
    path: `output/playwright/tree-async-rtl-${testInfo.project.name}.png`,
  })
})
