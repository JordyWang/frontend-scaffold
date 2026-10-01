import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.press('Enter')
}

async function swipeAcross(
  page: Page,
  target: Locator,
  nativeTouch: boolean,
  reverse = false,
  vertical = false,
) {
  await target.scrollIntoViewIfNeeded()
  const box = (await target.boundingBox())!
  const start = {
    x: box.x + box.width * (reverse ? 0.25 : 0.75),
    y: box.y + 18,
  }
  const end = vertical
    ? { x: start.x + 5, y: start.y - 130 }
    : { x: box.x + box.width * (reverse ? 0.75 : 0.25), y: start.y }
  if (nativeTouch) {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [start],
    })
    for (let step = 1; step <= 8; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * step) / 8,
            y: start.y + ((end.y - start.y) * step) / 8,
          },
        ],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
  } else {
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(end.x, end.y, { steps: 8 })
    await page.mouse.up()
  }
}

test('carousel dots and viewport navigate with keyboard while hidden slides retain form state', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const group = page.getByRole('region', { name: '完整轮播预览', exact: true })
  const viewport = group.getByRole('group', { name: '轮播幻灯片' })
  const draft = group.getByRole('textbox', { name: '轮播草稿' })
  await draft.fill('保留轮播输入')
  await draft.press('End')
  await expect(draft).toBeFocused()
  await expect(group.locator('[data-carousel-status]')).toHaveText('1 / 3')
  const second = group.getByRole('button', {
    name: '切换到第 2 项',
    exact: true,
  })
  await activate(second, mobile)
  await expect(group.getByRole('textbox')).toHaveCount(0)
  await expect(
    group.locator('[data-carousel-slide][data-current="false"]'),
  ).toHaveCount(2)
  await expect(second).toHaveAttribute('aria-current', 'true')
  await second.focus()
  await second.press('ArrowRight')
  const third = group.getByRole('button', { name: '切换到第 3 项' })
  await expect(third).toBeFocused()
  await expect(third).toHaveAttribute('tabindex', '0')
  await third.press('Home')
  await expect(
    group.getByRole('button', { name: '切换到第 1 项' }),
  ).toBeFocused()
  await expect(draft).toHaveValue('保留轮播输入')
  await viewport.focus()
  await viewport.press('End')
  await expect(group.locator('[data-carousel-status]')).toHaveText('3 / 3')
  const contentAction = group.getByRole('button', { name: '从内容回到第一张' })
  await contentAction.focus()
  await contentAction.press('Enter')
  await expect(viewport).toBeFocused()
  await expect(draft).toHaveValue('保留轮播输入')
  await expect(page.getByRole('status', { name: '轮播切换状态' })).toHaveText(
    '第 1 项切换完成',
  )
  await expect(
    group.locator('[data-carousel-slide][data-current="false"]').first(),
  ).toHaveCSS('visibility', 'hidden')
})

test('carousel finite boundaries, external control, fade completion and data truncation remain usable', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '轮播状态预览',
    exact: true,
  })
  const group = preview.getByRole('region', {
    name: '完整轮播预览',
    exact: true,
  })
  await activate(preview.getByRole('button', { name: '使用渐显轮播' }), mobile)
  await expect(group).toHaveAttribute('data-carousel-effect', 'fade')
  await activate(preview.getByRole('button', { name: '关闭循环轮播' }), mobile)
  await expect(
    group.getByRole('button', { name: '上一项', exact: true }),
  ).toBeDisabled()
  const external = preview.getByRole('button', { name: '外部跳转第三张' })
  await external.focus()
  await external.press('Enter')
  await expect(external).toBeFocused()
  await expect(
    group.getByRole('button', { name: '下一项', exact: true }),
  ).toBeDisabled()
  await expect(
    preview.getByRole('status', { name: '轮播切换状态' }),
  ).toHaveText('第 3 项切换完成')
  await activate(
    preview.getByRole('button', { name: '无动画回到首张' }),
    mobile,
  )
  await expect(group.locator('[data-carousel-status]')).toHaveText('1 / 3')
  await expect(group.locator('[data-carousel-slide]').first()).toHaveJSProperty(
    'id',
    await group
      .getByRole('button', { name: '切换到第 1 项' })
      .getAttribute('aria-controls'),
  )
  await activate(
    group.getByRole('button', { name: '下一项', exact: true }),
    mobile,
  )
  await expect(
    preview.getByRole('status', { name: '轮播切换状态' }),
  ).toHaveText('第 2 项切换完成')
  await activate(preview.getByRole('button', { name: '缩减轮播数据' }), mobile)
  await expect(group.locator('[data-carousel-status]')).toHaveText('1 / 1')
  await expect(
    group.getByRole('button', { name: '下一项', exact: true }),
  ).toHaveCount(0)
  await activate(
    preview.getByRole('button', { name: '无动画回到首张' }),
    mobile,
  )
  await activate(preview.getByRole('button', { name: '恢复轮播数据' }), mobile)
  await expect(group.locator('[data-carousel-status]')).toHaveText('1 / 3')
})

test('carousel drag and native Chromium touch swipe obey direction and leave vertical motion and inputs alone', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const nativeTouch = testInfo.project.name === 'mobile-chromium'
  const preview = page.getByRole('region', {
    name: '轮播状态预览',
    exact: true,
  })
  const group = preview.getByRole('region', {
    name: '完整轮播预览',
    exact: true,
  })
  const viewport = group.getByRole('group', { name: '轮播幻灯片' })
  await swipeAcross(page, viewport, nativeTouch)
  await expect(group.locator('[data-carousel-status]')).toHaveText('2 / 3')
  await swipeAcross(page, viewport, nativeTouch, false, true)
  await expect(group.locator('[data-carousel-status]')).toHaveText('2 / 3')
  await activate(
    preview.getByRole('button', { name: '禁用手势切换' }),
    testInfo.project.name.startsWith('mobile-'),
  )
  await swipeAcross(page, viewport, nativeTouch)
  await expect(group.locator('[data-carousel-status]')).toHaveText('2 / 3')
  const rtl = preview.getByRole('region', { name: 'RTL 深色轮播', exact: true })
  await swipeAcross(
    page,
    rtl.getByRole('group', { name: '轮播幻灯片' }),
    nativeTouch,
    true,
  )
  await expect(rtl.locator('[data-carousel-status]')).toHaveText('2 / 2')
})

test('carousel autoplay drives dot progress, pauses on focus and resumes explicitly', async ({
  page,
}, testInfo) => {
  await page.clock.install()
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '自动轮播进度预览',
    exact: true,
  })
  const group = preview.getByRole('region', { name: '进度轮播', exact: true })
  await activate(preview.getByRole('button', { name: '启用进度轮播' }), mobile)
  const status = group.locator('[data-carousel-status]')
  await expect(status).toHaveAttribute('aria-live', 'off')
  const fill = group.locator('[data-carousel-progress]')
  expect(
    await fill.evaluate(
      (element) => element.getAnimations()[0]?.effect?.getTiming().duration,
    ),
  ).toBe(2000)
  await page.clock.runFor(2000)
  await expect(status).toHaveText('2 / 3')
  await group.getByRole('button', { name: '停止自动播放' }).focus()
  await expect(status).toHaveAttribute('aria-live', 'polite')
  await page.clock.runFor(6000)
  await expect(status).toHaveText('2 / 3')
  await activate(group.getByRole('button', { name: '开始自动播放' }), mobile)
  await expect(status).toHaveAttribute('aria-live', 'off')
  await page.clock.runFor(2000)
  await expect(status).toHaveText('3 / 3')
})

test('carousel four dot placements, adaptive height and touch controls fit desktop and H5 widths', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '轮播状态预览',
    exact: true,
  })
  const group = preview.getByRole('region', {
    name: '完整轮播预览',
    exact: true,
  })
  const viewport = group.getByRole('group', { name: '轮播幻灯片' })
  const dots = group.getByRole('group', { name: '轮播页码' })
  const widths = mobile ? [page.viewportSize()!.width] : [360, 390, 768, 1280]
  for (const width of widths) {
    if (!mobile) await page.setViewportSize({ width, height: 800 })
    for (const [name, placement] of [
      ['页码在上方', 'top'],
      ['页码在下方', 'bottom'],
      ['页码在起始', 'start'],
      ['页码在末端', 'end'],
    ] as const) {
      await activate(preview.getByRole('button', { name, exact: true }), mobile)
      const contentBox = (await viewport.boundingBox())!
      const dotBox = (await dots.boundingBox())!
      if (placement === 'top')
        expect(dotBox.y + dotBox.height).toBeLessThanOrEqual(contentBox.y + 1)
      if (placement === 'bottom')
        expect(dotBox.y).toBeGreaterThanOrEqual(
          contentBox.y + contentBox.height - 1,
        )
      if (placement === 'start')
        expect(dotBox.x + dotBox.width).toBeLessThanOrEqual(contentBox.x + 1)
      if (placement === 'end')
        expect(dotBox.x).toBeGreaterThanOrEqual(
          contentBox.x + contentBox.width - 1,
        )
      expect(
        await group.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await activate(preview.getByRole('button', { name: '页码在下方' }), mobile)
  const initialHeight = (await viewport.boundingBox())!.height
  await activate(group.getByRole('button', { name: '切换到第 2 项' }), mobile)
  await expect(
    preview.getByRole('status', { name: '轮播切换状态' }),
  ).toHaveText('第 2 项切换完成')
  expect((await viewport.boundingBox())!.height).toBeCloseTo(initialHeight, 0)
  await activate(group.getByRole('button', { name: '切换到第 1 项' }), mobile)
  await activate(
    preview.getByRole('button', { name: '自适应轮播高度' }),
    mobile,
  )
  const shortHeight = (await viewport.boundingBox())!.height
  await activate(group.getByRole('button', { name: '切换到第 2 项' }), mobile)
  expect((await viewport.boundingBox())!.height).toBeGreaterThan(shortHeight)
  const boxes = await group.locator('button').evaluateAll((elements) =>
    elements
      .filter((element) => !element.closest('[inert]'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      }),
  )
  expect(boxes.every((box) => box.width >= 44 && box.height >= 44)).toBe(true)
  await expect(
    preview.getByRole('status', { name: '轮播切换状态' }),
  ).toHaveText('第 2 项切换完成')
  await expect(
    group.locator('[data-carousel-slide][data-current="false"]').first(),
  ).toHaveCSS('visibility', 'hidden')
  await group.screenshot({
    path: `output/playwright/carousel-${testInfo.project.name}.png`,
  })
})

test('carousel reduced motion stops automatic transitions until requested, and RTL navigation remains logical', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const mobile = testInfo.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '轮播状态预览',
    exact: true,
  })
  const group = preview.getByRole('region', {
    name: '完整轮播预览',
    exact: true,
  })
  await activate(
    group.getByRole('button', { name: '下一项', exact: true }),
    mobile,
  )
  await expect(
    preview.getByRole('status', { name: '轮播切换状态' }),
  ).toHaveText('第 2 项切换完成')
  expect(
    await group
      .locator('[data-carousel-slide]')
      .evaluateAll(
        (elements) =>
          elements.flatMap((element) => element.getAnimations()).length,
      ),
  ).toBe(0)
  const auto = preview.getByRole('region', { name: '进度轮播', exact: true })
  await activate(preview.getByRole('button', { name: '启用进度轮播' }), mobile)
  await expect(auto.getByRole('button', { name: '开始自动播放' })).toBeVisible()
  await expect(auto.locator('[data-carousel-status]')).toHaveAttribute(
    'aria-live',
    'polite',
  )
  const rtl = preview.getByRole('region', { name: 'RTL 深色轮播', exact: true })
  await expect(rtl).toHaveAttribute('dir', 'rtl')
  await expect(rtl).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  const content = (await rtl
    .getByRole('group', { name: '轮播幻灯片' })
    .boundingBox())!
  const dots = (await rtl
    .getByRole('group', { name: '轮播页码' })
    .boundingBox())!
  expect(dots.x).toBeGreaterThanOrEqual(content.x + content.width - 1)
  const first = rtl.getByRole('button', { name: '切换到第 1 项' })
  await first.focus()
  await first.press('ArrowLeft')
  await expect(rtl.getByRole('button', { name: '切换到第 2 项' })).toBeFocused()
  await expect(rtl.locator('[data-carousel-status]')).toHaveText('2 / 2')
  await expect(
    preview
      .getByRole('region', { name: '单项轮播', exact: true })
      .getByRole('button'),
  ).toHaveCount(0)
  await expect(
    preview
      .getByRole('region', { name: '空轮播', exact: true })
      .getByText('暂无轮播内容'),
  ).toBeVisible()
  await rtl.screenshot({
    path: `output/playwright/carousel-rtl-${testInfo.project.name}.png`,
  })
})
