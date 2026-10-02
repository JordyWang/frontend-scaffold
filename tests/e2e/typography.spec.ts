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
  const text = group.locator('[data-typography-content]')
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
