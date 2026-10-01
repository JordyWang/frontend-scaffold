import { expect, test } from '@playwright/test'

test('avatar falls back, recovers and fits long text at responsive sizes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '头像状态预览' })
  const avatar = preview.getByRole('img', { name: '失败回退头像' })
  await avatar.scrollIntoViewIfNeeded()
  await expect(avatar).toHaveText('回退')
  await expect(avatar.locator('img')).toHaveCount(0)
  const recover = preview.getByRole('button', { name: '替换为可用头像' })
  if (testInfo.project.name.startsWith('mobile-')) await recover.tap()
  else await recover.press('Enter')
  await expect(avatar.locator('img')).toBeVisible()
  await expect
    .poll(() =>
      avatar
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0)
  const fail = preview.getByRole('button', { name: '恢复失败头像' })
  if (testInfo.project.name.startsWith('mobile-')) await fail.tap()
  else await fail.press('Enter')
  await expect(avatar).toHaveText('回退')

  const long = preview.getByRole('img', { name: '长文字头像' })
  await expect
    .poll(() =>
      long.evaluate((element) => {
        const text = element.querySelector('span')!
        const box = element.getBoundingClientRect()
        const textBox = text.getBoundingClientRect()
        return {
          scaled: new DOMMatrix(getComputedStyle(text).transform).a < 1,
          fits: textBox.width <= box.width - 12 + 1,
          centered:
            Math.abs(
              (textBox.left + textBox.right) / 2 - (box.left + box.right) / 2,
            ) < 1,
        }
      }),
    )
    .toEqual({ scaled: true, fits: true, centered: true })

  const responsive = preview.getByRole('img', { name: '响应式头像' })
  if (testInfo.project.name === 'desktop-chromium') {
    for (const [width, size] of [
      [360, 32],
      [390, 32],
      [768, 48],
      [1280, 64],
    ]) {
      await page.setViewportSize({ width, height: 800 })
      await expect(responsive).toHaveCSS('width', `${size}px`)
      await expect(responsive).toHaveCSS('height', `${size}px`)
    }
  } else await expect(responsive).toHaveCSS('width', '32px')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('avatar groups reveal every hidden member with keyboard and touch, including RTL', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '头像状态预览' })
  for (const [label, names, direction] of [
    ['项目成员', ['项目测试者', '项目负责人'], 'ltr'],
    ['RTL 成员组', ['RTL 开发者', 'RTL 测试者'], 'rtl'],
  ] as const) {
    const group = preview.getByRole('group', { name: label, exact: true })
    const trigger = group.getByRole('button', { name: '查看其余 2 位成员' })
    await trigger.scrollIntoViewIfNeeded()
    const triggerBox = await trigger.boundingBox()
    expect(triggerBox!.width).toBeGreaterThanOrEqual(44)
    expect(triggerBox!.height).toBeGreaterThanOrEqual(44)
    if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
    else await trigger.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = page.getByRole('dialog', { name: `${label} · 其余成员` })
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('dir', direction)
    for (const name of names)
      await expect(panel.getByText(name, { exact: true })).toBeVisible()
    const panelBox = await panel.boundingBox()
    expect(panelBox!.x).toBeGreaterThanOrEqual(0)
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    )
    await page.screenshot({
      path: `output/playwright/avatar-${direction}-${testInfo.project.name}.png`,
    })
    await trigger.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
    if (direction === 'rtl') {
      const member = await group
        .getByRole('img', { name: 'RTL 设计师' })
        .boundingBox()
      expect(member!.x).toBeGreaterThan(triggerBox!.x)
      expect(triggerBox!.x + triggerBox!.width).toBeGreaterThan(member!.x)
    } else {
      const first = await group
        .getByRole('img', { name: '项目设计师' })
        .boundingBox()
      const second = await group
        .getByRole('img', { name: '项目开发者' })
        .boundingBox()
      expect(second!.x).toBeGreaterThan(first!.x)
      expect(second!.x).toBeLessThan(first!.x + first!.width)
    }
  }
  await expect(preview.getByRole('group', { name: '空成员组' })).toHaveText(
    '暂无成员',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
