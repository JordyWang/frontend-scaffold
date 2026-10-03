import { expect, test } from '@playwright/test'

test('List switches container grid, pages and feedback on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.locator('#ds-list')
  const region = preview.getByRole('region', { name: '任务卡片列表' })
  const list = region.getByRole('list', { name: '任务卡片列表' })
  const items = list.getByRole('listitem')
  const pagination = region.getByRole('navigation', {
    name: '任务卡片列表分页',
  })
  const settings = preview.getByRole('group', { name: '列表展示设置' })
  const stateControls = preview.getByRole('group', { name: '列表数据状态' })
  const activate = async (button: ReturnType<typeof page.getByRole>) => {
    if (mobile) await button.tap()
    else await button.press('Enter')
  }
  const columnCount = () =>
    list.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    )

  await expect(items).toHaveCount(3)
  await expect(items.first()).toContainText('设计评审')
  await expect(region).toContainText('本页任务 · 3 项')
  await expect(region).toContainText('当前页展示 3 / 7 项')
  expect(await columnCount()).toBe(mobile ? 1 : 3)
  await activate(pagination.getByRole('button', { name: '下一页' }))
  await expect(items).toHaveCount(3)
  await expect(items.first()).toContainText('文件上传')
  await expect(items.first()).toContainText('#4')
  await activate(items.first().getByRole('button', { name: '查看文件上传' }))
  await expect(preview).toContainText('已查看文件上传')

  const gridButton = settings.getByRole('button', { name: '网格布局' })
  await activate(gridButton)
  await expect(gridButton).toHaveAttribute('aria-pressed', 'false')
  await expect(list).not.toHaveClass(/\bgrid\b/)
  await expect(list).toHaveClass(/divide-y/)
  await activate(gridButton)
  await expect(gridButton).toHaveAttribute('aria-pressed', 'true')

  if (!mobile) {
    const narrowButton = settings.getByRole('button', { name: '窄容器' })
    await activate(narrowButton)
    await expect(narrowButton).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(columnCount).toBe(1)
  }

  const loading = stateControls.getByRole('button', { name: '加载中' })
  const error = stateControls.getByRole('button', { name: '错误' })
  await activate(loading)
  await expect(region).toHaveAttribute('aria-busy', 'true')
  await expect(region).toHaveAttribute('data-ui-list-state', 'loading')
  await expect(list).toHaveCount(0)
  await expect(pagination).toHaveCount(0)
  await expect(region).toContainText('本页任务 · 3 项')
  await expect(region).toContainText('当前页展示 3 / 7 项')

  await activate(error)
  await expect(region).toHaveAttribute('data-ui-list-state', 'error')
  await expect(region.getByRole('alert')).toContainText('任务列表加载失败')
  const retry = region.getByRole('button', { name: '重试' })
  const retryBox = (await retry.boundingBox())!
  expect(retryBox.width).toBeGreaterThanOrEqual(44)
  expect(retryBox.height).toBeGreaterThanOrEqual(44)
  await activate(retry)
  await expect(region).toHaveAttribute('data-ui-list-state', 'ready')
  await expect(items.first()).toContainText('文件上传')

  const size = pagination.getByRole('combobox', { name: '每页条数' })
  if (mobile) await size.tap()
  else {
    await size.focus()
    await size.press('ArrowDown')
  }
  const four = page.getByRole('option', { name: '4 条/页' })
  if (mobile) await four.tap()
  else {
    await four.focus()
    await four.press('Enter')
  }
  await expect(items).toHaveCount(4)
  await expect(items.first()).toContainText('设计评审')
  await expect(region).toContainText('本页任务 · 4 项')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
