import { expect, test } from '@playwright/test'

test('external tab bar item rendering composes native drag with keyboard and H5 movement', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const demo = page.getByRole('region', { name: '标签拖拽组合预览' })
  const list = demo.getByRole('tablist', { name: '可排序标签' })
  const status = demo.getByRole('status')
  const order = () =>
    list
      .locator('[data-tabs-item]')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-tabs-value')),
      )
  const first = list.getByRole('tab', { name: '概览' })
  const draftA = list.getByRole('tab', { name: '草稿甲' })
  const draftB = list.getByRole('tab', { name: '草稿乙' })
  await expect(draftA).toHaveAttribute('aria-selected', 'true')
  await demo.getByRole('textbox', { name: '草稿甲正文' }).fill('已保留的草稿')

  if (testInfo.project.name === 'desktop-chromium') {
    await draftB.dragTo(first)
    await expect.poll(order).toEqual(['draft-b', 'overview', 'draft-a'])
    await expect(status).toContainText('draft-b → overview → draft-a')
    const forward = demo.getByRole('button', { name: '前移当前标签' })
    await forward.focus()
    await forward.press('Enter')
    await expect.poll(order).toEqual(['draft-b', 'draft-a', 'overview'])
  } else {
    await draftB.tap()
    const forward = demo.getByRole('button', { name: '前移当前标签' })
    const box = await forward.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await forward.tap()
    await expect.poll(order).toEqual(['overview', 'draft-b', 'draft-a'])
    await forward.tap()
    await expect.poll(order).toEqual(['draft-b', 'overview', 'draft-a'])
    await expect(forward).toBeDisabled()
    await draftA.tap()
  }

  await expect(draftA).toHaveAttribute('aria-selected', 'true')
  await expect(demo.getByRole('textbox', { name: '草稿甲正文' })).toHaveValue(
    '已保留的草稿',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
