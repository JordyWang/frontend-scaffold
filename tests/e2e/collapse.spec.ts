import { expect, test, type Locator } from '@playwright/test'

const descriptionTitle = '带独立操作的说明与较长标题'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('collapse extra actions, icon triggers and nested keyboard navigation stay independent', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '折叠面板状态预览' })
  const group = preview.getByRole('group', {
    name: '完整折叠预览',
    exact: true,
  })
  const description = group.getByRole('button', { name: descriptionTitle })
  await expect(description).toHaveAttribute('aria-expanded', 'true')
  const action = group.getByRole('button', { name: '查看面板记录' })
  await activate(action, mobile)
  await expect(
    preview.getByRole('status', { name: '折叠操作状态' }),
  ).toHaveText('已查看面板记录 1 次')
  await expect(description).toHaveAttribute('aria-expanded', 'true')
  const icon = group.getByRole('button', {
    name: '仅箭头触发展开',
    exact: true,
  })
  const iconLabel = group
    .getByRole('heading', { name: '仅箭头触发展开', exact: true })
    .locator('span[id]')
  if (mobile) await iconLabel.tap()
  else await iconLabel.click()
  await expect(icon).toHaveAttribute('aria-expanded', 'false')
  await activate(icon, mobile)
  await expect(
    group.getByRole('region', { name: '仅箭头触发展开', exact: true }),
  ).toBeVisible()
  const hiddenArrow = group.getByRole('button', { name: '隐藏箭头的面板' })
  await activate(hiddenArrow, mobile)
  await expect(hiddenArrow).toHaveAttribute('aria-expanded', 'true')
  await expect(
    group.getByRole('button', { name: '禁用的完整面板' }),
  ).toBeDisabled()
  await description.focus()
  await description.press('ArrowDown')
  await expect(icon).toBeFocused()
  await icon.press('ArrowDown')
  await expect(hiddenArrow).toBeFocused()
  await hiddenArrow.press('ArrowDown')
  const nestedTrigger = group.getByRole('button', {
    name: '嵌套折叠面板',
    exact: true,
  })
  await expect(nestedTrigger).toBeFocused()
  await nestedTrigger.press(' ')
  const nested = group.getByRole('group', { name: '内部折叠预览', exact: true })
  const nestedFirst = nested.getByRole('button', { name: '内部第一项' })
  const nestedLast = nested.getByRole('button', { name: '内部第二项' })
  await nestedFirst.focus()
  await nestedFirst.press('End')
  await expect(nestedLast).toBeFocused()
  await nestedLast.press('ArrowDown')
  await expect(nestedFirst).toBeFocused()
  await nestedTrigger.focus()
  await nestedTrigger.press('Home')
  await expect(description).toBeFocused()
  await description.press('ArrowUp')
  await expect(nestedTrigger).toBeFocused()
  await action.focus()
  await action.press('Home')
  await expect(action).toBeFocused()
})

test('collapse content is lazy, preserves edits by default and destroys only when requested', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const retained = page.getByRole('group', {
    name: '保留内容预览',
    exact: true,
  })
  const retainedTrigger = retained.getByRole('button', {
    name: '保留草稿',
    exact: true,
  })
  await expect(
    retained.getByRole('textbox', { name: '保留的草稿', includeHidden: true }),
  ).toHaveCount(0)
  await activate(retainedTrigger, mobile)
  const draft = retained.getByRole('textbox', { name: '保留的草稿' })
  await draft.fill('保留修改内容')
  await draft.press('Home')
  await expect(draft).toBeFocused()
  await activate(retainedTrigger, mobile)
  await expect(
    retained.getByRole('textbox', { name: '保留的草稿' }),
  ).toHaveCount(0)
  await expect(
    retained.getByRole('textbox', { name: '保留的草稿', includeHidden: true }),
  ).toHaveValue('保留修改内容')
  await activate(retainedTrigger, mobile)
  await expect(draft).toHaveValue('保留修改内容')
  const destroyed = page.getByRole('group', {
    name: '销毁内容预览',
    exact: true,
  })
  const destroyedTrigger = destroyed.getByRole('button', {
    name: '关闭时销毁草稿',
  })
  await activate(destroyedTrigger, mobile)
  await destroyed.getByRole('textbox', { name: '销毁的草稿' }).fill('将被移除')
  await activate(destroyedTrigger, mobile)
  await expect(
    destroyed.getByRole('textbox', { includeHidden: true }),
  ).toHaveCount(0)
  await expect(
    destroyed.getByRole('region', { includeHidden: true }),
  ).toHaveCount(1)
  await activate(destroyedTrigger, mobile)
  await expect(
    destroyed.getByRole('textbox', { name: '销毁的草稿' }),
  ).toHaveValue('初始草稿')
  const forced = page.getByRole('group', {
    name: '预渲染内容预览',
    exact: true,
  })
  await expect(
    forced.getByRole('textbox', { name: '预渲染草稿', includeHidden: true }),
  ).toBeAttached()
  const forcedTrigger = forced.getByRole('button', { name: '始终挂载的草稿' })
  await activate(forcedTrigger, mobile)
  await forced.getByRole('textbox', { name: '预渲染草稿' }).fill('始终保留')
  await activate(forcedTrigger, mobile)
  await activate(forcedTrigger, mobile)
  await expect(forced.getByRole('textbox', { name: '预渲染草稿' })).toHaveValue(
    '始终保留',
  )
})

test('controlled collapse restores focus on internal close and removal while preserving external focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const state = page.getByRole('region', { name: '动态折叠状态', exact: true })
  const group = state.getByRole('group', { name: '受控草稿预览', exact: true })
  const draftTrigger = group.getByRole('button', {
    name: '动态草稿',
    exact: true,
  })
  const close = group.getByRole('button', { name: '从内容中关闭草稿' })
  await close.focus()
  await close.press('Enter')
  await expect(draftTrigger).toBeFocused()
  await expect(draftTrigger).toHaveAttribute('aria-expanded', 'false')
  await activate(draftTrigger, mobile)
  const remove = group.getByRole('button', { name: '从内容中移除草稿' })
  await remove.focus()
  await remove.press('Enter')
  const backup = group.getByRole('button', { name: '备用面板', exact: true })
  await expect(backup).toBeFocused()
  await expect(draftTrigger).toHaveCount(0)
  await activate(state.getByRole('button', { name: '恢复草稿面板' }), mobile)
  await expect(draftTrigger).toHaveAttribute('aria-expanded', 'false')
  await activate(draftTrigger, mobile)
  const external = state.getByRole('button', {
    name: '外部关闭草稿',
    exact: true,
  })
  await external.focus()
  await external.press('Enter')
  await expect(
    state.getByRole('button', { name: '外部展开草稿', exact: true }),
  ).toBeFocused()
  await expect(draftTrigger).toHaveAttribute('aria-expanded', 'false')
  await activate(
    state.getByRole('button', { name: '禁用草稿面板', exact: true }),
    mobile,
  )
  await expect(draftTrigger).toBeDisabled()
  await activate(
    state.getByRole('button', { name: '外部展开草稿', exact: true }),
    mobile,
  )
  await expect(draftTrigger).toHaveAttribute('aria-expanded', 'true')
  await expect(
    group.getByRole('textbox', { name: '受控面板草稿' }),
  ).toBeVisible()
})

test('collapse sizes, appearance and independent extra actions adapt to narrow containers', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '折叠面板状态预览',
    exact: true,
  })
  const group = preview.getByRole('group', {
    name: '完整折叠预览',
    exact: true,
  })
  const header = group.locator('[data-ui-collapse-header]').first()
  const normalBackground = await header.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  const title = header.locator('h3')
  const extra = header.locator('[data-ui-collapse-extra]')
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 800 })
    await group.scrollIntoViewIfNeeded()
    const rootBox = await group.boundingBox()
    const titleBox = await title.boundingBox()
    const extraBox = await extra.boundingBox()
    if (rootBox!.width < 362)
      expect(extraBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height)
    else expect(extraBox!.y).toBeLessThan(titleBox!.y + titleBox!.height)
    expect(titleBox!.width).toBeGreaterThan(180)
    expect(
      await group.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  for (const [label, size, height] of [
    ['小号折叠', 'small', 44],
    ['大号折叠', 'large', 64],
    ['默认折叠', 'default', 52],
  ] as const) {
    await activate(
      preview.getByRole('button', { name: label, exact: true }),
      mobile,
    )
    await expect(group).toHaveAttribute('data-ui-size', size)
    const item = group.locator('[data-ui-collapse-header]').nth(2)
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(height)
    const boxes = await group.locator('button').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      }),
    )
    expect(boxes.every((box) => box.width >= 44 && box.height >= 44)).toBe(true)
  }
  await activate(
    preview.getByRole('button', { name: '无边框折叠', exact: true }),
    mobile,
  )
  await expect(group).toHaveCSS('border-top-width', '0px')
  await expect(header).toHaveCSS('background-color', normalBackground)
  await activate(
    preview.getByRole('button', { name: '透明折叠', exact: true }),
    mobile,
  )
  await expect(group).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(group.locator('[data-ui-collapse-body]').first()).toHaveCSS(
    'border-top-width',
    '0px',
  )
  await activate(
    preview.getByRole('button', { name: '有边框折叠', exact: true }),
    mobile,
  )
  await expect(group).toHaveCSS('border-top-width', '1px')
  const trigger = group.getByRole('button', { name: descriptionTitle })
  const arrow = trigger.locator('[data-ui-collapse-icon]')
  const label = trigger.locator('span[id]')
  expect((await arrow.boundingBox())!.x).toBeLessThan(
    (await label.boundingBox())!.x,
  )
  await activate(
    preview.getByRole('button', { name: '箭头放在末端', exact: true }),
    mobile,
  )
  expect((await arrow.boundingBox())!.x).toBeGreaterThan(
    (await label.boundingBox())!.x,
  )
  await group.screenshot({
    path: `output/playwright/collapse-${testInfo.project.name}.png`,
  })
  if (!mobile) {
    await group.evaluate((element) => {
      element.style.width = '260px'
    })
    await expect
      .poll(() =>
        group.evaluate((element) => element.scrollWidth <= element.clientWidth),
      )
      .toBe(true)
    expect((await extra.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await title.boundingBox())!.y + (await title.boundingBox())!.height,
    )
  }
})

test('collapse respects RTL, inherited size, custom icons and reduced motion', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const group = page.getByRole('group', { name: 'RTL 深色折叠', exact: true })
  await group.scrollIntoViewIfNeeded()
  await expect(group).toHaveAttribute('dir', 'rtl')
  await expect(group).toHaveAttribute('data-ui-size', 'small')
  await expect(group).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  const first = group.getByRole('button', { name: '深色与从右向左' })
  const arrow = first.locator('[data-ui-collapse-icon] svg')
  const label = first.locator('span[id]')
  expect((await arrow.boundingBox())!.x).toBeLessThan(
    (await label.boundingBox())!.x,
  )
  await expect(arrow).toHaveCSS('transition-property', 'none')
  expect(
    await arrow.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    ),
  ).toBeLessThan(0.001)
  await expect(arrow).toHaveCSS('rotate', '-90deg')
  await activate(first, mobile)
  await expect(arrow).toHaveCSS('rotate', 'none')
  const custom = page.getByRole('group', {
    name: '自定义图标折叠',
    exact: true,
  })
  const trigger = custom.getByRole('button', { name: '自定义展开图标' })
  const path = trigger.locator('svg path')
  const closedPath = await path.getAttribute('d')
  await activate(trigger, mobile)
  expect(await path.getAttribute('d')).not.toBe(closedPath)
  await expect(
    page
      .getByRole('group', { name: '空折叠预览', exact: true })
      .getByText('暂无面板'),
  ).toBeVisible()
  await group.screenshot({
    path: `output/playwright/collapse-rtl-${testInfo.project.name}.png`,
  })
})
