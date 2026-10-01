import { expect, test, type Locator } from '@playwright/test'

const idLabel = '记录编号（自动生成的任务标识）'

function item(region: Locator, label: string) {
  return region.locator('[data-ui-description-item]').filter({ hasText: label })
}

function definition(region: Locator, label: string) {
  return item(region, label).getByRole('definition')
}

test('descriptions pack responsive spans without overflow or extra grid columns', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const region = page.getByRole('region', {
    name: '响应式任务详情',
    exact: true,
  })
  await region.scrollIntoViewIfNeeded()
  const body = region.locator('dl')
  const widths =
    testInfo.project.name === 'desktop-chromium'
      ? [360, 390, 768, 1280]
      : [page.viewportSize()!.width]
  for (const width of widths) {
    if (testInfo.project.name === 'desktop-chromium')
      await page.setViewportSize({ width, height: 800 })
    const containerWidth = (await region.boundingBox())!.width
    const columns =
      containerWidth >= 1024
        ? 4
        : containerWidth >= 768
          ? 3
          : containerWidth >= 640
            ? 2
            : 1
    await expect
      .poll(() =>
        body.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      )
      .toBe(columns)
    const bodyBox = await body.boundingBox()
    const team = await item(region, '归属团队').boundingBox()
    const identifier = await item(region, idLabel).boundingBox()
    const phase = await item(region, '任务阶段').boundingBox()
    const notes = await item(region, '实现说明').boundingBox()
    if (columns > 1) expect(Math.abs(team!.y - identifier!.y)).toBeLessThan(1)
    else expect(identifier!.y).toBeGreaterThan(team!.y)
    if (columns >= 3)
      expect(identifier!.width).toBeCloseTo(team!.width * 2 + 1, 0)
    expect(notes!.width).toBeCloseTo(bodyBox!.width - 2, 0)
    if (columns === 4) {
      expect(Math.abs(phase!.y - team!.y)).toBeLessThan(1)
      expect(phase!.width).toBeCloseTo(team!.width, 0)
    } else expect(phase!.width).toBeCloseTo(bodyBox!.width - 2, 0)
    expect(
      await region.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await region.screenshot({
    path: `output/playwright/descriptions-horizontal-${testInfo.project.name}.png`,
  })
  if (testInfo.project.name === 'desktop-chromium') {
    await region.evaluate((element) => {
      element.style.width = '240px'
    })
    await expect
      .poll(() =>
        body.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      )
      .toBe(1)
    await expect
      .poll(() =>
        region.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true)
    const narrowTeam = await item(region, '归属团队').boundingBox()
    const narrowId = await item(region, idLabel).boundingBox()
    expect(narrowId!.y).toBeGreaterThan(narrowTeam!.y)
  }
})

test('description layout, borders, sizes and extra action work with keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', {
    name: '描述列表状态预览',
    exact: true,
  })
  const region = preview.getByRole('region', {
    name: '响应式任务详情',
    exact: true,
  })
  const activate = async (name: string) => {
    const control = preview.getByRole('button', { name, exact: true })
    if (testInfo.project.name.startsWith('mobile-')) await control.tap()
    else await control.press('Enter')
  }
  await activate('更新详情')
  await expect(region.getByRole('status', { name: '详情更新状态' })).toHaveText(
    '已更新',
  )
  await activate('切换为垂直详情')
  await expect(region).toHaveAttribute('data-ui-layout', 'vertical')
  const teamTerm = item(region, '归属团队').getByRole('term')
  const teamContent = definition(region, '归属团队')
  const termBox = await teamTerm.boundingBox()
  const contentBox = await teamContent.boundingBox()
  expect(contentBox!.y).toBeCloseTo(termBox!.y + termBox!.height + 1, 0)
  if (testInfo.project.name === 'desktop-chromium') {
    const identifierBox = await definition(region, idLabel).boundingBox()
    expect(identifierBox!.y).toBeCloseTo(contentBox!.y, 0)
  }
  await region.screenshot({
    path: `output/playwright/descriptions-vertical-${testInfo.project.name}.png`,
  })
  await activate('隐藏详情边框')
  await expect(region.locator('dt [aria-hidden="true"]')).toHaveCount(4)
  await expect(teamTerm).toHaveCSS('border-inline-end-width', '0px')
  await activate('使用小号详情')
  await expect(region).toHaveAttribute('data-ui-size', 'small')
  await expect(teamTerm).toHaveCSS('padding-top', '8px')
  await activate('使用大号详情')
  await expect(region).toHaveAttribute('data-ui-size', 'large')
  await expect(teamTerm).toHaveCSS('padding-top', '16px')
  await activate('恢复默认详情尺寸')
  await expect(region).toHaveAttribute('data-ui-size', 'default')
  await expect(teamTerm).toHaveCSS('padding-top', '12px')
  await activate('切换为水平详情')
  await expect(region).toHaveAttribute('data-ui-layout', 'horizontal')
  const controls = await preview.locator('button').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
  )
  expect(
    controls.every((control) => control.width >= 44 && control.height >= 44),
  ).toBe(true)
  await region.screenshot({
    path: `output/playwright/descriptions-unbordered-${testInfo.project.name}.png`,
  })
  const geometry = await region.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    overflowing: [
      ...element.querySelectorAll<HTMLElement>(
        'dl, dt, dd, [data-ui-description-item]',
      ),
    ]
      .filter((child) => child.scrollWidth > child.clientWidth)
      .map((child) => ({
        tag: child.tagName,
        text: child.textContent?.slice(0, 60),
        client: child.clientWidth,
        scroll: child.scrollWidth,
        width: child.getBoundingClientRect().width,
      })),
  }))
  expect(geometry.scroll <= geometry.client, JSON.stringify(geometry)).toBe(
    true,
  )
})

test('vertical descriptions inherit RTL, dark theme and small size', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const region = page.getByRole('region', { name: 'RTL 垂直详情', exact: true })
  await region.scrollIntoViewIfNeeded()
  await expect(region).toHaveAttribute('dir', 'rtl')
  await expect(region).toHaveAttribute('data-ui-size', 'small')
  await expect(definition(region, '界面方向')).toHaveText('从右向左')
  await expect(definition(region, '局部主题')).toHaveText('深色 · 小号')
  const first = await item(region, '界面方向').boundingBox()
  const second = await item(region, '局部主题').boundingBox()
  if (testInfo.project.name === 'desktop-chromium')
    expect(first!.x).toBeGreaterThan(second!.x)
  else expect(second!.y).toBeGreaterThan(first!.y)
  await expect(definition(region, '界面方向')).toHaveCSS(
    'background-color',
    'rgb(30, 41, 59)',
  )
  await region.screenshot({
    path: `output/playwright/descriptions-rtl-${testInfo.project.name}.png`,
  })
  await expect(
    page.getByRole('region', { name: '空详情预览' }).getByText('暂无详情'),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
