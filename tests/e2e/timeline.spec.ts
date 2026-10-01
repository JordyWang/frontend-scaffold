import { expect, test, type Locator } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

test('timeline maintains native reading order and operates loading, reverse, variants and content actions', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '时间轴状态预览' })
  const timeline = preview.getByRole('group', {
    name: '完整时间轴预览',
    exact: true,
  })
  const list = timeline.getByRole('list')
  await expect(list.getByRole('listitem')).toHaveCount(5)
  const loadingItem = list.getByRole('listitem').filter({ hasText: '生成媒体' })
  await expect(loadingItem).toHaveAttribute('aria-busy', 'true')
  const finish = timeline.getByRole('button', { name: '完成时间轴任务' })
  const box = (await finish.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(finish, mobile)
  await expect(loadingItem).toHaveCount(0)
  await expect(
    timeline.getByRole('heading', { name: '生成完成' }),
  ).toBeVisible()
  await expect(timeline.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(
    preview.getByRole('status', { name: '时间轴操作状态' }),
  ).toHaveText('生成完成')
  const reverse = preview.getByRole('button', { name: '倒序时间轴' })
  await activate(reverse, mobile)
  await expect(list).toHaveAttribute('reversed')
  await expect(list.getByRole('heading').first()).toHaveText('发布失败')
  await expect(list.getByRole('heading').last()).toHaveText('提交任务')
  await activate(preview.getByRole('button', { name: '使用填充节点' }), mobile)
  await expect(timeline).toHaveAttribute('data-ui-variant', 'filled')
  const dot = timeline.locator('[data-ui-timeline-dot]').last().locator('span')
  expect(
    await dot.evaluate(
      (element) =>
        getComputedStyle(element).backgroundColor ===
        getComputedStyle(element).borderTopColor,
    ),
  ).toBe(true)
  await activate(
    timeline.getByRole('button', { name: '重试时间轴发布' }),
    mobile,
  )
  await expect(
    preview.getByRole('status', { name: '时间轴操作状态' }),
  ).toHaveText('已请求重新发布')
  await activate(preview.getByRole('button', { name: '隐藏时间标签' }), mobile)
  await expect(timeline.locator('[data-ui-timeline-label]')).toHaveCount(0)
  await activate(preview.getByRole('button', { name: '显示时间标签' }), mobile)
  await expect(timeline.locator('[data-ui-timeline-label]')).toHaveCount(5)
  await expect(
    preview
      .getByRole('group', { name: '单项时间轴', exact: true })
      .locator('[data-ui-timeline-rail]'),
  ).toHaveCount(0)
  await expect(
    preview.getByRole('group', { name: '空时间轴', exact: true }),
  ).toContainText('暂无记录')
})

test('timeline modes and responsive container fallback align connected markers without page overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '时间轴状态预览' })
  const timeline = preview.getByRole('group', {
    name: '完整时间轴预览',
    exact: true,
  })
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 850 })
    for (const [mode, name] of [
      ['start', '内容在起始侧'],
      ['end', '内容在末端侧'],
      ['alternate', '内容交替排列'],
    ] as const) {
      await activate(preview.getByRole('button', { name, exact: true }), mobile)
      await expect(timeline).toHaveAttribute('data-ui-mode', mode)
      const wide = (await timeline.boundingBox())!.width >= 640
      const nodes = timeline.locator('[data-ui-timeline-item]')
      for (let index = 0; index < 2; index++) {
        const node = nodes.nth(index)
        const marker = (await node
          .locator('[data-ui-timeline-dot]')
          .boundingBox())!
        const content = (await node
          .locator('[data-ui-timeline-content]')
          .boundingBox())!
        const label = (await node
          .locator('[data-ui-timeline-label]')
          .boundingBox())!
        const end = mode === 'end' || (mode === 'alternate' && index === 1)
        if (wide) {
          if (end) expect(content.x + content.width).toBeLessThan(marker.x)
          else expect(content.x).toBeGreaterThan(marker.x + marker.width)
          expect(Math.abs(content.y - label.y)).toBeLessThan(1)
        } else {
          expect(content.x).toBeGreaterThan(marker.x + marker.width)
          expect(content.y).toBeGreaterThan(label.y)
        }
      }
      const rail = (await nodes
        .first()
        .locator('[data-ui-timeline-rail]')
        .boundingBox())!
      const next = (await nodes
        .nth(1)
        .locator('[data-ui-timeline-dot]')
        .boundingBox())!
      expect(
        Math.abs(rail.y + rail.height - (next.y + next.height / 2)),
      ).toBeLessThan(2)
      expect(
        await timeline.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true)
    }
  }
  await timeline.screenshot({
    path: `output/playwright/timeline-vertical-${testInfo.project.name}.png`,
  })
  if (!mobile) {
    await activate(
      preview.getByRole('button', { name: '使用固定标签宽度' }),
      false,
    )
    await expect(timeline).toHaveCSS('--timeline-label-width', '180px')
    await activate(
      preview.getByRole('button', { name: '收窄时间轴容器' }),
      false,
    )
    expect((await timeline.boundingBox())!.width).toBeLessThan(640)
    const first = timeline.locator('[data-ui-timeline-item]').first()
    expect(
      (await first.locator('[data-ui-timeline-content]').boundingBox())!.y,
    ).toBeGreaterThan(
      (await first.locator('[data-ui-timeline-label]').boundingBox())!.y,
    )
    await timeline.screenshot({
      path: 'output/playwright/timeline-narrow-desktop.png',
    })
  }
})

test('timeline horizontal subgrid shares a rail, scrolls by keyboard and keeps mobile fallback usable', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '时间轴状态预览' })
  const long = preview.getByRole('group', { name: '水平长时间轴', exact: true })
  const list = long.getByRole('list')
  if (!mobile) await page.setViewportSize({ width: 1280, height: 850 })
  if (mobile) {
    await expect(list).not.toHaveAttribute('tabindex')
    const first = list.locator('[data-ui-timeline-item]').first()
    const second = list.locator('[data-ui-timeline-item]').nth(1)
    expect((await second.boundingBox())!.y).toBeGreaterThan(
      (await first.boundingBox())!.y,
    )
    await activate(long.getByRole('button', { name: '查看最后里程碑' }), true)
    await expect(
      preview.getByRole('status', { name: '时间轴操作状态' }),
    ).toHaveText('已查看最后一个里程碑')
    // Also exercise horizontal layout in mobile browser engines at tablet width.
    await page.setViewportSize({ width: 1100, height: 850 })
  }
  await expect(list).toHaveAttribute('tabindex', '0')
  await expect(list).toHaveAccessibleDescription(
    '左右方向键滚动时间轴，Home / End 到首尾，Tab 进入内容操作。',
  )
  await list.scrollIntoViewIfNeeded()
  const nodes = list.locator('[data-ui-timeline-item]')
  const firstMarker = (await nodes
    .first()
    .locator('[data-ui-timeline-dot]')
    .boundingBox())!
  const secondMarker = (await nodes
    .nth(1)
    .locator('[data-ui-timeline-dot]')
    .boundingBox())!
  expect(Math.abs(firstMarker.y - secondMarker.y)).toBeLessThan(1)
  expect(
    (await nodes.first().getByRole('heading').boundingBox())!.y,
  ).toBeGreaterThan(firstMarker.y + firstMarker.height)
  expect(
    (await nodes.nth(1).locator('[data-ui-timeline-content]').boundingBox())!.y,
  ).toBeLessThan(secondMarker.y)
  const rail = (await nodes
    .first()
    .locator('[data-ui-timeline-rail]')
    .boundingBox())!
  expect(
    Math.abs(rail.x + rail.width - (secondMarker.x + secondMarker.width / 2)),
  ).toBeLessThan(2)
  await list.focus()
  await list.press('ArrowRight')
  await expect
    .poll(() => list.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)
  await list.press('End')
  await expect
    .poll(() =>
      list.evaluate((element) =>
        Math.abs(
          element.scrollLeft - (element.scrollWidth - element.clientWidth),
        ),
      ),
    )
    .toBeLessThan(2)
  await list.press('Home')
  await expect(list).toHaveJSProperty('scrollLeft', 0)
  // WebKit's default keyboard mode skips buttons; Option+Tab includes all controls.
  await list.press(
    testInfo.project.name === 'mobile-webkit' ? 'Alt+Tab' : 'Tab',
  )
  await expect(
    long.getByRole('button', { name: '查看最后里程碑' }),
  ).toBeFocused()
  await list.evaluate((element) => {
    element.scrollLeft = 0
  })
  if (testInfo.project.name === 'mobile-chromium') {
    const box = (await list.boundingBox())!
    const touchY = box.y + Math.min(box.height - 10, 35)
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.8, y: touchY }],
    })
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: box.x + box.width * (0.8 - step * 0.075), y: touchY },
        ],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
    await expect
      .poll(() => list.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0)
    await list.evaluate((element) => {
      element.scrollLeft = 0
    })
  }
  await long.screenshot({
    path: `output/playwright/timeline-horizontal-${testInfo.project.name}.png`,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  const main = preview.getByRole('group', {
    name: '完整时间轴预览',
    exact: true,
  })
  await activate(
    preview.getByRole('button', { name: '使用水平时间轴' }),
    mobile,
  )
  await expect(main).toHaveAttribute('data-ui-orientation', 'horizontal')
  await activate(
    preview.getByRole('button', { name: '内容在末端侧', exact: true }),
    mobile,
  )
  const mainFirst = main.locator('[data-ui-timeline-item]').first()
  expect(
    (await mainFirst.locator('[data-ui-timeline-content]').boundingBox())!.y,
  ).toBeLessThan(
    (await mainFirst.locator('[data-ui-timeline-dot]').boundingBox())!.y,
  )
  await activate(
    preview.getByRole('button', { name: '收窄时间轴容器' }),
    mobile,
  )
  await expect(main.getByRole('list')).not.toHaveAttribute('tabindex')
  expect(
    await main.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true)
})

test('timeline RTL respects logical placements and reduced motion removes the loading animation', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', { name: '时间轴状态预览' })
  const indicator = preview
    .locator('[data-ui-timeline-loading-indicator]')
    .first()
  await expect(indicator).toHaveCSS('animation-name', 'none')
  const rtl = preview.getByRole('group', {
    name: 'RTL 时间轴预览',
    exact: true,
  })
  await expect(rtl).toHaveAttribute('dir', 'rtl')
  if (!mobile) await page.setViewportSize({ width: 1280, height: 850 })
  const wide = (await rtl.boundingBox())!.width >= 640
  for (let index = 0; index < 2; index++) {
    const node = rtl.locator('[data-ui-timeline-item]').nth(index)
    const marker = (await node.locator('[data-ui-timeline-dot]').boundingBox())!
    const content = (await node
      .locator('[data-ui-timeline-content]')
      .boundingBox())!
    if (wide && index === 1)
      expect(content.x).toBeGreaterThan(marker.x + marker.width)
    else expect(content.x + content.width).toBeLessThan(marker.x)
  }
  await activate(rtl.getByRole('button', { name: '查看 RTL 记录' }), mobile)
  await expect(
    preview.getByRole('status', { name: '时间轴操作状态' }),
  ).toHaveText('已查看 RTL 记录')
  await rtl.screenshot({
    path: `output/playwright/timeline-rtl-${testInfo.project.name}.png`,
  })
  if (mobile) await page.setViewportSize({ width: 1100, height: 850 })
  await activate(
    preview.getByRole('button', { name: '使用水平时间轴' }),
    mobile,
  )
  const nodes = rtl.locator('[data-ui-timeline-item]')
  const first = (await nodes
    .first()
    .locator('[data-ui-timeline-dot]')
    .boundingBox())!
  const second = (await nodes
    .nth(1)
    .locator('[data-ui-timeline-dot]')
    .boundingBox())!
  expect(first.x).toBeGreaterThan(second.x)
  expect(Math.abs(first.y - second.y)).toBeLessThan(1)
  const rail = (await nodes
    .first()
    .locator('[data-ui-timeline-rail]')
    .boundingBox())!
  expect(Math.abs(rail.x - (second.x + second.width / 2))).toBeLessThan(2)
  await rtl.screenshot({
    path: `output/playwright/timeline-rtl-horizontal-${testInfo.project.name}.png`,
  })
})
