import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(target: Locator, mobile: boolean) {
  if (mobile) await target.tap()
  else await target.click()
}
async function copiedText(page: Page, project: string) {
  return project === 'mobile-webkit'
    ? page.evaluate(() => document.documentElement.dataset.copiedText)
    : page.evaluate(() => navigator.clipboard.readText())
}
async function suffixLayout(content: Locator) {
  return content.evaluate((node) => {
    const content = node as HTMLElement
    const tail = content.querySelector<HTMLElement>('[data-typography-tail]')!
    const body = content.querySelector<HTMLElement>('[data-typography-body]')!
    const flow = content.querySelector<HTMLElement>('[data-typography-layout]')!
    const rect = content.getBoundingClientRect()
    const tailRect = tail.getBoundingClientRect()
    const style = getComputedStyle(content)
    const insetTop =
      parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth)
    const insetBottom =
      parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth)
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    let text: Node | null
    let visibleCharacters = 0,
      overlaps = 0
    while ((text = walker.nextNode())) {
      for (let index = 0; index < (text.textContent?.length ?? 0); index++) {
        const range = document.createRange()
        range.setStart(text, index)
        range.setEnd(text, index + 1)
        for (const glyph of range.getClientRects()) {
          if (glyph.width < 0.1 || glyph.top >= rect.bottom - insetBottom - 1)
            continue
          visibleCharacters++
          if (
            glyph.bottom > tailRect.top + 1 &&
            glyph.top < tailRect.bottom - 1 &&
            glyph.right > tailRect.left + 1 &&
            glyph.left < tailRect.right - 1
          )
            overlaps++
        }
      }
    }
    return {
      rowOffset:
        (tailRect.top - rect.top - insetTop) / parseFloat(style.lineHeight),
      lineHeight: parseFloat(style.lineHeight),
      tailHeight: tailRect.height,
      contentHeight: rect.height,
      clipHeight: flow.getBoundingClientRect().height,
      blockPadding: insetTop + insetBottom,
      tailFits:
        tailRect.left >= rect.left - 1 &&
        tailRect.right <= rect.right + 1 &&
        tailRect.bottom <= rect.bottom - insetBottom + 1,
      logicalEndGap:
        style.direction === 'rtl'
          ? tailRect.left - rect.left
          : rect.right - tailRect.right,
      visibleCharacters,
      overlaps,
    }
  })
}
test.beforeEach(async ({ page, context }, info) => {
  if (info.project.name === 'mobile-webkit') {
    // Isolated browser seam: WebKit's native clipboard permission is not automated.
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            document.documentElement.dataset.copiedText = text
          },
        },
      }),
    )
  } else await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/__ui')
})

test('typography editing saves once, cancels drafts and recovers its trigger on keyboard and touch', async ({
  page,
}, info) => {
  const region = page.getByRole('region', {
    name: 'Typography 能力预览',
    exact: true,
  })
  const mobile = info.project.name.startsWith('mobile-')
  const trigger = region.getByRole('button', {
    name: '编辑项目说明',
    exact: true,
  })
  await activate(trigger, mobile)
  const input = region.getByRole('textbox', {
    name: '编辑项目说明内容',
    exact: true,
  })
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('可以编辑的项目说明')
  await expect(input).toHaveCSS('font-size', '16px')
  await input.press('End')
  await input.press('Shift+Enter')
  await expect(input).toHaveValue('可以编辑的项目说明\n')
  await input.fill('新的项目说明\n第二行')
  await input.press('Enter')
  await expect(trigger).toBeFocused()
  await expect(
    region.getByRole('status', { name: '文字提交状态' }),
  ).toContainText('完成 1 次 · 新的项目说明')
  await activate(trigger, mobile)
  await input.fill('应取消的草稿')
  await activate(
    region.getByRole('button', { name: '取消编辑项目说明' }),
    mobile,
  )
  await expect(trigger).toBeFocused()
  await expect(
    region.getByRole('status', { name: '文字提交状态' }),
  ).toContainText('完成 1 次 · 新的项目说明')
  await activate(trigger, mobile)
  await input.fill('使用保存按钮')
  await activate(region.getByRole('button', { name: '保存项目说明' }), mobile)
  await expect(trigger).toBeFocused()
  await expect(
    region.getByRole('status', { name: '文字提交状态' }),
  ).toContainText('完成 2 次 · 使用保存按钮')
})

test('typography native edit limits, text triggers, external updates and disabled actions remain usable', async ({
  page,
}, info) => {
  const region = page.getByRole('region', {
    name: 'Typography 能力预览',
    exact: true,
  })
  const mobile = info.project.name.startsWith('mobile-')
  await activate(
    region.getByRole('button', { name: '编辑项目说明', exact: true }),
    mobile,
  )
  let input = region.getByRole('textbox', {
    name: '编辑项目说明内容',
    exact: true,
  })
  await input.fill('')
  await input.pressSequentially('x'.repeat(125))
  await expect(input).toHaveValue('x'.repeat(120))
  await input.press('Escape')
  await activate(
    region.getByRole('button', { name: '编辑纯文本编辑', exact: true }),
    mobile,
  )
  input = region.getByRole('textbox', {
    name: '编辑纯文本编辑内容',
    exact: true,
  })
  await input.fill('按文字入口编辑')
  await input.press('Enter')
  await expect(
    region.getByRole('button', { name: '编辑纯文本编辑', exact: true }),
  ).toBeFocused()
  await activate(region.getByRole('button', { name: '外部更新文字' }), mobile)
  await activate(
    region.getByRole('button', { name: '编辑项目说明', exact: true }),
    mobile,
  )
  await expect(
    region.getByRole('textbox', { name: '编辑项目说明内容' }),
  ).toHaveValue('外部更新的项目说明')
  await region
    .getByRole('textbox', { name: '编辑项目说明内容' })
    .press('Escape')
  await activate(region.getByRole('button', { name: '禁用文字操作' }), mobile)
  await expect(
    region.getByRole('button', { name: '编辑项目说明', exact: true }),
  ).toBeDisabled()
  await expect(
    region.getByRole('button', { name: '复制项目说明', exact: true }),
  ).toBeDisabled()
})

test('typography copies complete clamped content, suffixes and asynchronous retries', async ({
  page,
}, info) => {
  const region = page.getByRole('region', {
    name: 'Typography 能力预览',
    exact: true,
  })
  const mobile = info.project.name.startsWith('mobile-')
  const copy = region.getByRole('button', { name: '复制任务描述', exact: true })
  await activate(copy, mobile)
  await expect(copy).not.toHaveAttribute('aria-busy', 'true')
  await expect(region.getByText('复制成功', { exact: true })).toBeVisible()
  await expect
    .poll(() => copiedText(page, info.project.name))
    .toBe(
      '组件库统一文字、复制和编辑操作。长内容按容器宽度省略，展开后可以完整阅读，复制始终保留完整内容。'.repeat(
        5,
      ),
    )
  await activate(
    region.getByRole('button', { name: '复制文件名称', exact: true }),
    mobile,
  )
  expect(await copiedText(page, info.project.name)).toBe(
    '年度项目成果与产品使用说明视频文件名称_abcdefghijklmnopqrstuvwxyz_0123456789.mp4',
  )
  const asyncCopy = region.getByRole('button', {
    name: '复制异步说明',
    exact: true,
  })
  await activate(asyncCopy, mobile)
  await expect(asyncCopy).toHaveAttribute('aria-busy', 'true')
  await expect(region.getByRole('alert')).toHaveText('复制失败，请重试')
  await activate(asyncCopy, mobile)
  await expect(
    region.getByText('异步说明已复制', { exact: true }),
  ).toBeVisible()
  expect(await copiedText(page, info.project.name)).toBe(
    '异步取得的完整任务说明',
  )
  await expect(asyncCopy).toBeFocused()
})

test('typography measures container overflow and preserves rich links through expansion and shrinking', async ({
  page,
}, info) => {
  const region = page.getByRole('region', {
    name: 'Typography 能力预览',
    exact: true,
  })
  const mobile = info.project.name.startsWith('mobile-')
  const group = region.getByRole('group', { name: '文字容器预览', exact: true })
  let action = group.getByRole('button', { name: '展开任务描述', exact: true })
  await expect(action).toHaveAttribute('aria-expanded', 'false')
  const text = group.locator('[data-typography-layout]')
  expect(
    await text.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true)
  await activate(action, mobile)
  action = group.getByRole('button', { name: '收起任务描述', exact: true })
  await expect(action).toHaveAttribute('aria-expanded', 'true')
  await expect(action).toBeFocused()
  expect(
    await text.evaluate((node) => node.scrollHeight <= node.clientHeight + 1),
  ).toBe(true)
  await activate(action, mobile)
  await activate(region.getByRole('button', { name: '放宽文字容器' }), mobile)
  await expect(
    group.getByRole('button', { name: '展开任务描述' }),
  ).toBeVisible()
  await activate(region.getByRole('button', { name: '切换短文字' }), mobile)
  await expect(group.getByRole('button', { name: '展开任务描述' })).toHaveCount(
    0,
  )
  const link = region.getByRole('link', { name: '查看文字约定', exact: true })
  await link.focus()
  await expect(
    region.getByRole('button', { name: '收起富文本说明' }),
  ).toBeVisible()
  await expect(link).toBeVisible()
  await expect(link).toBeFocused()
})

test('typography RTL dark previews keep 44px targets, bounded editor height and no page overflow', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const rtl = page.getByRole('group', {
    name: '窄容器 RTL 文字预览',
    exact: true,
  })
  for (const button of await rtl.getByRole('button').all()) {
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await activate(
    rtl.getByRole('button', { name: '编辑RTL 说明', exact: true }),
    mobile,
  )
  const input = rtl.getByRole('textbox', {
    name: '编辑RTL 说明内容',
    exact: true,
  })
  await expect(input).toHaveCSS('font-size', '16px')
  await input.fill('第一行\n第二行\n第三行\n第四行\n第五行')
  expect((await input.boundingBox())!.height).toBeLessThanOrEqual(96)
  await activate(
    rtl.getByRole('button', { name: '取消编辑RTL 说明', exact: true }),
    mobile,
  )
  await expect(
    rtl.getByRole('button', { name: '编辑RTL 说明', exact: true }),
  ).toBeFocused()
  await page
    .getByRole('region', { name: 'Typography 能力预览', exact: true })
    .getByRole('button', { name: '放宽文字容器', exact: true })
    .focus()
  await rtl.screenshot({
    path: 'output/playwright/typography-rtl-' + info.project.name + '.png',
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('typography suffix occupies the actual final row without overlapping text across sizes and RTL', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '行内后缀预览',
    exact: true,
  })
  const group = preview.getByRole('group', {
    name: '后缀尺寸预览',
    exact: true,
  })
  for (const [label, rows] of [
    ['单行文件名', 1],
    ['多行摘要', 2],
  ] as const) {
    const action = group.getByRole('button', {
      name: '展开' + label,
      exact: true,
    })
    await expect(action).toBeVisible()
    const content = page.locator(
      '#' + (await action.getAttribute('aria-controls')),
    )
    const layout = await suffixLayout(content)
    expect(layout.rowOffset).toBeCloseTo(rows - 1, 1)
    expect(layout.overlaps).toBe(0)
    expect(layout.visibleCharacters).toBeGreaterThan(0)
    expect(layout.tailFits).toBe(true)
    expect(layout.contentHeight).toBeCloseTo(
      rows * layout.lineHeight + layout.blockPadding,
      0,
    )
    expect(layout.clipHeight).toBeCloseTo(rows * layout.lineHeight, 0)
    await expect(content.locator('[data-typography-layout]')).toHaveCSS(
      'overflow',
      'hidden',
    )
    await activate(action, mobile)
    await expect(content.locator('[data-typography-tail]')).toBeHidden()
    await expect(
      content.locator('[data-typography-suffix-source]'),
    ).not.toHaveClass(/sr-only/)
    expect(
      await content.evaluate(
        (node) => node.scrollHeight <= node.clientHeight + 1,
      ),
    ).toBe(true)
    await activate(
      group.getByRole('button', { name: '收起' + label, exact: true }),
      mobile,
    )
  }
  await activate(preview.getByRole('button', { name: '后缀改为三行' }), mobile)
  const action = group.getByRole('button', {
    name: '展开多行摘要',
    exact: true,
  })
  const content = page.locator(
    '#' + (await action.getAttribute('aria-controls')),
  )
  await expect
    .poll(async () => (await suffixLayout(content)).rowOffset)
    .toBeCloseTo(2, 1)
  await activate(preview.getByRole('button', { name: '放宽后缀容器' }), mobile)
  await expect
    .poll(async () => (await suffixLayout(content)).rowOffset)
    .toBeCloseTo(2, 1)
  expect((await suffixLayout(content)).overlaps).toBe(0)
  const rtl = page.getByRole('group', {
    name: '窄容器 RTL 文字预览',
    exact: true,
  })
  const rtlAction = rtl.getByRole('button', {
    name: '展开RTL 文件名',
    exact: true,
  })
  const rtlContent = page.locator(
    '#' + (await rtlAction.getAttribute('aria-controls')),
  )
  const rtlLayout = await suffixLayout(rtlContent)
  expect(rtlLayout.rowOffset).toBeCloseTo(1, 1)
  expect(rtlLayout.logicalEndGap).toBeCloseTo(0, 0)
  expect(rtlLayout.overlaps).toBe(0)
  expect(rtlLayout.tailFits).toBe(true)
  await activate(preview.getByRole('button', { name: '收窄后缀容器' }), mobile)
  await preview.getByRole('button', { name: '后缀恢复两行' }).focus()
  await group.screenshot({
    path: 'output/playwright/typography-suffix-' + info.project.name + '.png',
  })
  await rtl.screenshot({
    path:
      'output/playwright/typography-rtl-suffix-' + info.project.name + '.png',
  })
})

test('typography keeps short suffix inline, preserves oversized suffix and copies rich child state once', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '行内后缀预览',
    exact: true,
  })
  const group = preview.getByRole('group', {
    name: '后缀尺寸预览',
    exact: true,
  })
  const short = group.locator('[data-typography]').filter({
    has: page.locator('[data-typography-body]').filter({ hasText: /^预览$/ }),
  })
  await expect(short).toHaveCount(1)
  await expect(short.locator('[data-typography-tail]')).toBeHidden()
  const body = (await short.locator('[data-typography-body]').boundingBox())!
  const suffix = (await short
    .locator('[data-typography-suffix-source]')
    .boundingBox())!
  expect(suffix.y).toBeCloseTo(body.y, 0)
  expect(suffix.x).toBeCloseTo(body.x + body.width, 0)
  await expect(
    group.getByRole('button', { name: '展开简短文件名' }),
  ).toHaveCount(0)
  const longAction = group.getByRole('button', {
    name: '展开长后缀',
    exact: true,
  })
  const longContent = page.locator(
    '#' + (await longAction.getAttribute('aria-controls')),
  )
  const longLayout = await suffixLayout(longContent)
  expect(longLayout.tailHeight).toBeGreaterThan(longLayout.lineHeight)
  expect(longLayout.tailFits).toBe(true)
  expect(longLayout.overlaps).toBe(0)
  expect(
    await longContent
      .locator('[data-typography-tail]')
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true)
  await activate(group.getByRole('button', { name: '复制长后缀' }), mobile)
  expect(await copiedText(page, info.project.name)).toBe(
    '组件库统一文字、复制和编辑操作。长内容按容器宽度省略，展开后可以完整阅读，复制始终保留完整内容。'.repeat(
      5,
    ) + '_完整保存的超长文件后缀_abcdefghijklmnopqrstuvwxyz_0123456789.mp4',
  )
  const rich = group.getByRole('link', { name: /^已阅读 \d+ 次$/ })
  await rich.focus()
  await activate(rich, mobile)
  await expect(rich).toHaveText('已阅读 1 次')
  await preview.getByRole('button', { name: '放宽后缀容器' }).focus()
  await activate(group.getByRole('button', { name: '收起有状态后缀' }), mobile)
  await activate(group.getByRole('button', { name: '展开有状态后缀' }), mobile)
  await expect(rich).toHaveText('已阅读 1 次')
  await activate(group.getByRole('button', { name: '复制有状态后缀' }), mobile)
  const copied = await copiedText(page, info.project.name)
  expect(copied).toMatch(/^已阅读 1 次/)
  expect(copied).toMatch(/（查看原文）$/)
  expect(copied).not.toContain('…')
  await preview.getByRole('button', { name: '放宽后缀容器' }).focus()
  await group.screenshot({
    path:
      'output/playwright/typography-long-suffix-' + info.project.name + '.png',
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('typography native table preserves caption, cell overrides and independent keyboard and touch scrolling', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', {
    name: '原生文档表格预览',
    exact: true,
  })
  const region = preview.getByRole('region', {
    name: '文字约定表格滚动区域',
    exact: true,
  })
  const table = region.getByRole('table', { name: '文字约定' })
  await expect(table).toBeVisible()
  await expect(table.getByRole('rowheader', { name: '复制' })).toHaveAttribute(
    'scope',
    'row',
  )
  const normal = table.getByRole('columnheader', { name: '能力' })
  const custom = table.getByRole('columnheader', { name: '操作' })
  await expect(normal).toHaveCSS('border-top-width', '1px')
  await expect(normal).toHaveCSS('padding-left', '12px')
  await expect(custom).toHaveCSS('text-align', 'center')
  expect(
    await normal.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).not.toBe(
    await custom.evaluate((node) => getComputedStyle(node).backgroundColor),
  )
  expect(
    await region.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true)
  await region.focus()
  await region.press('ArrowRight')
  await expect
    .poll(() => region.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0)
  await expect(region).toBeFocused()
  await region.evaluate((node) => {
    node.scrollLeft = 0
  })
  if (info.project.name === 'mobile-chromium') {
    const box = (await region.boundingBox())!
    const session = await page.context().newCDPSession(page)
    const y = box.y + box.height * 0.65
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
      .poll(() => region.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0)
  }
  await region.evaluate((node) => {
    node.scrollLeft = 0
  })
  await page.getByRole('button', { name: '放宽后缀容器' }).focus()
  await preview.screenshot({
    path: 'output/playwright/typography-table-' + info.project.name + '.png',
  })
  const rtl = page.getByRole('region', {
    name: 'RTL 文档表格滚动区域',
    exact: true,
  })
  await expect(rtl.getByRole('columnheader', { name: 'الحالة' })).toHaveCSS(
    'text-align',
    'start',
  )
  await rtl.focus()
  await rtl.press('ArrowLeft')
  await expect
    .poll(() => rtl.evaluate((node) => node.scrollLeft))
    .toBeLessThan(0)
  await expect(rtl).toBeFocused()
  await rtl.press('End')
  expect(await rtl.evaluate((node) => node.scrollLeft)).toBeLessThan(-100)
  await rtl.press('Home')
  await expect(rtl).toHaveJSProperty('scrollLeft', 0)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
