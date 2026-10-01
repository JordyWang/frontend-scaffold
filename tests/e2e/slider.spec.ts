import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.click()
}
async function dragSlider(
  page: Page,
  target: Locator,
  root: Locator,
  start: { x: number; y: number },
  end: { x: number; y: number },
  project: string,
) {
  if (project === 'mobile-chromium') {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [start],
    })
    for (let index = 1; index <= 8; index++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * index) / 8,
            y: start.y + ((end.y - start.y) * index) / 8,
          },
        ],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
  } else if (project === 'mobile-webkit') {
    // Native tap is covered separately; WebKit lacks CDP touch-drag control.
    await target.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: start.x,
      clientY: start.y,
    })
    for (let index = 1; index <= 8; index++)
      await root.dispatchEvent('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        clientX: start.x + ((end.x - start.x) * index) / 8,
        clientY: start.y + ((end.y - start.y) * index) / 8,
      })
    await root.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: end.x,
      clientY: end.y,
    })
  } else {
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(end.x, end.y, { steps: 8 })
    await page.mouse.up()
  }
}
test.beforeEach(async ({ page }) => {
  await page.goto('/__ui')
})

test('range handles have 44px targets, preserve Tab order and complete repeated keys once', async ({
  page,
}) => {
  const preview = page.getByRole('region', { name: '滑块能力预览' })
  const lower = preview.getByRole('slider', {
    name: '播放区间 下限',
    exact: true,
  })
  const upper = preview.getByRole('slider', {
    name: '播放区间 上限',
    exact: true,
  })
  for (const handle of [lower, upper]) {
    const box = (await handle.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await lower.focus()
  for (let repeat = 0; repeat < 3; repeat++)
    await page.keyboard.down('ArrowRight')
  await expect(lower).toHaveValue('35')
  await expect(
    preview.getByRole('status', { name: '播放区间完成值' }),
  ).toContainText('完成 0 次')
  await page.keyboard.up('ArrowRight')
  await expect(
    preview.getByRole('status', { name: '播放区间完成值' }),
  ).toContainText('[35,60] · 完成 1 次')
  await lower.press('Tab')
  await expect(upper).toBeFocused()
  await upper.press('Home')
  await expect(upper).toHaveValue('35')
  await expect(lower).toHaveAttribute('max', '35')
  await upper.press('Shift+Tab')
  await expect(lower).toBeFocused()
})

test('pointer and H5 gestures move one thumb and shift the whole interval without changing its width', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '滑块能力预览' })
  const group = preview.getByRole('group', { name: '播放区间', exact: true })
  const rail = group.locator('[data-slider-rail]')
  const lower = group.getByRole('slider', {
    name: '播放区间 下限',
    exact: true,
  })
  await rail.scrollIntoViewIfNeeded()
  let box = (await rail.boundingBox())!
  await dragSlider(
    page,
    lower,
    group,
    { x: box.x + box.width * 0.2, y: box.y + 22 },
    { x: box.x + box.width * 0.35, y: box.y + 22 },
    info.project.name,
  )
  await expect(
    preview.getByRole('status', { name: '播放区间实时值' }),
  ).toHaveText('[35,60]')
  await expect(
    preview.getByRole('status', { name: '播放区间完成值' }),
  ).toContainText('[35,60] · 完成 1 次')
  await activate(
    preview.getByRole('button', { name: '重置范围预览' }),
    info.project.name.startsWith('mobile-'),
  )
  await rail.scrollIntoViewIfNeeded()
  box = (await rail.boundingBox())!
  await dragSlider(
    page,
    group.locator('[data-slider-draggable-track]'),
    group,
    { x: box.x + box.width * 0.4, y: box.y + 22 },
    { x: box.x + box.width * 0.6, y: box.y + 22 },
    info.project.name,
  )
  await expect(
    preview.getByRole('status', { name: '播放区间实时值' }),
  ).toHaveText('[40,80]')
  await expect(
    preview.getByRole('status', { name: '播放区间完成值' }),
  ).toContainText('[40,80] · 完成 1 次')
})

test('mark selection uses native touch, discrete values and independent included states', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '滑块能力预览' })
  const group = preview.getByRole('group', { name: '离散温度', exact: true })
  const handle = group.getByRole('slider', { name: '离散温度', exact: true })
  await handle.focus()
  await handle.press('ArrowRight')
  await expect(handle).toHaveValue('37')
  const mark = group.getByRole('button', { name: '100°C', exact: true })
  const box = (await mark.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await activate(mark, info.project.name.startsWith('mobile-'))
  await expect(handle).toHaveValue('100')
  await expect(handle).toBeFocused()
  await activate(
    preview.getByRole('button', { name: '显示独立刻度' }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(group.locator('[data-slider-track]')).toHaveCount(0)
  await expect(group.locator('[data-slider-dot="100"]')).toHaveAttribute(
    'data-active',
    'true',
  )
  await expect(group.locator('[data-slider-dot="26"]')).not.toHaveAttribute(
    'data-active',
  )
})

test('vertical and reversed sliders follow visual movement and keep value tooltips readable', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '滑块能力预览' })
  const vertical = preview.getByRole('slider', {
    name: '垂直比例',
    exact: true,
  })
  const reversed = preview.getByRole('slider', {
    name: '反向垂直比例',
    exact: true,
  })
  await vertical.focus()
  await vertical.press('ArrowUp')
  await expect(vertical).toHaveValue('35')
  await expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
  await reversed.focus()
  await reversed.press('ArrowUp')
  await expect(reversed).toHaveValue('25')
  for (const [handle, startRatio, endRatio, expected] of [
    [vertical, 0.65, 0.4, '60'],
    [reversed, 0.25, 0.5, '50'],
  ] as const) {
    const root = handle.locator('xpath=ancestor::*[@data-slider-root]')
    const rail = root.locator('[data-slider-rail]')
    await rail.scrollIntoViewIfNeeded()
    const box = (await rail.boundingBox())!
    await dragSlider(
      page,
      handle,
      root,
      { x: box.x + 22, y: box.y + box.height * startRatio },
      { x: box.x + 22, y: box.y + box.height * endRatio },
      info.project.name,
    )
    await expect(handle).toHaveValue(expected)
  }
  const horizontal = preview.getByRole('slider', {
    name: '反向比例',
    exact: true,
  })
  await horizontal.focus()
  await horizontal.press('ArrowRight')
  await expect(horizontal).toHaveValue('25')
  await expect(
    preview.getByRole('slider', { name: '错误滑块', exact: true }),
  ).toHaveAttribute('aria-invalid', 'true')
  await activate(
    preview.getByRole('button', { name: '显示固定滑块提示' }),
    info.project.name.startsWith('mobile-'),
  )
  const tip = page.getByRole('tooltip', { name: '40%', exact: true })
  await expect(tip).toBeVisible()
  const tipBox = (await tip.boundingBox())!
  expect(tipBox.x).toBeGreaterThanOrEqual(8)
  expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(
    page.viewportSize()!.width - 8,
  )
  await activate(
    preview.getByRole('button', { name: '隐藏固定滑块提示' }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(tip).toHaveCount(0)
})

test('disabled handles remain boundaries and range disabling blocks all mark actions', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '滑块能力预览' })
  const group = preview.getByRole('group', { name: '多点区间', exact: true })
  const handles = group.getByRole('slider')
  await expect(handles.nth(1)).toBeDisabled()
  await handles.nth(0).focus()
  await handles.nth(0).press('End')
  await expect(preview.getByRole('status', { name: '多点区间值' })).toHaveText(
    '[50,50,80]',
  )
  await handles.nth(2).focus()
  await handles.nth(2).press('Home')
  await expect(preview.getByRole('status', { name: '多点区间值' })).toHaveText(
    '[50,50,50]',
  )
  await expect(group.locator('[data-slider-draggable-track]')).toHaveCount(0)
  await activate(
    preview.getByRole('button', { name: '解锁中间滑块' }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(handles.nth(1)).toBeEnabled()
  await handles.nth(2).focus()
  await handles.nth(2).press('End')
  await expect(group.locator('[data-slider-draggable-track]')).toHaveCount(1)
  await activate(
    preview.getByRole('button', { name: '禁用范围滑块' }),
    info.project.name.startsWith('mobile-'),
  )
  const range = preview.getByRole('group', { name: '播放区间', exact: true })
  for (const handle of await range.getByRole('slider').all())
    await expect(handle).toBeDisabled()
  for (const mark of await range.getByRole('button').all())
    await expect(mark).toBeDisabled()
  const keyboardOff = preview.getByRole('slider', {
    name: '禁用键盘滑块',
    exact: true,
  })
  await keyboardOff.focus()
  await keyboardOff.press('End')
  await expect(keyboardOff).toHaveValue('40')
})

test('240px RTL sliders retain blue tokens, direction, touch targets and viewport bounds', async ({
  page,
}, info) => {
  const preview = page.getByRole('group', { name: '窄容器 RTL 滑块预览' })
  const lower = preview.getByRole('slider', {
    name: 'RTL 窄范围 下限',
    exact: true,
  })
  await lower.focus()
  await lower.press('ArrowLeft')
  await expect(lower).toHaveValue('21')
  const reversed = preview.getByRole('slider', {
    name: 'RTL 反向比例',
    exact: true,
  })
  await reversed.focus()
  await reversed.press('ArrowRight')
  await expect(reversed).toHaveValue('35')
  await expect(
    page.getByRole('tooltip', { name: '35%', exact: true }),
  ).toBeVisible()
  await reversed.press('Escape')
  await expect(
    page.getByRole('tooltip', { name: '35%', exact: true }),
  ).toHaveCount(0)
  await preview.scrollIntoViewIfNeeded()
  const box = (await preview.boundingBox())!
  for (const input of await preview.getByRole('slider').all()) {
    const inputBox = (await input.boundingBox())!
    expect(inputBox.width).toBeGreaterThanOrEqual(44)
    expect(inputBox.height).toBeGreaterThanOrEqual(44)
    expect(inputBox.x).toBeGreaterThanOrEqual(box.x)
    expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(box.x + box.width)
  }
  const range = preview.getByRole('group', { name: 'RTL 窄范围', exact: true })
  const leftMark = range.getByRole('button', { name: '100%', exact: true })
  const centerMark = range.getByRole('button', { name: '50%', exact: true })
  const rightMark = range.getByRole('button', { name: '0%', exact: true })
  const markBoxes = await Promise.all(
    [leftMark, centerMark, rightMark].map((mark) => mark.boundingBox()),
  )
  for (const markBox of markBoxes) {
    expect(markBox!.x).toBeGreaterThanOrEqual(box.x)
    expect(markBox!.x + markBox!.width).toBeLessThanOrEqual(box.x + box.width)
    expect(markBox!.width).toBeGreaterThanOrEqual(44)
    expect(markBox!.height).toBeGreaterThanOrEqual(44)
  }
  expect(markBoxes[0]!.x).toBeLessThan(markBoxes[1]!.x)
  expect(markBoxes[1]!.x).toBeLessThan(markBoxes[2]!.x)
  await activate(rightMark, info.project.name.startsWith('mobile-'))
  await expect(lower).toHaveValue('0')
  await expect(
    preview.locator('[data-slider-track]').first().locator('span'),
  ).toHaveCSS('background-color', 'rgb(105, 177, 255)')
  await preview.screenshot({
    path: `output/playwright/slider-rtl-${info.project.name}.png`,
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('project forms validate slider values and native reset restores canonical FormData', async ({
  page,
}, info) => {
  const form = page.getByRole('form', { name: '滑块组合表单' })
  const strength = form.getByRole('slider', { name: '表单强度', exact: true })
  const submit = form.getByRole('button', { name: '提交滑块表单' })
  await strength.focus()
  await strength.press('Home')
  await activate(submit, info.project.name.startsWith('mobile-'))
  await expect(form.getByRole('alert')).toContainText('强度不能低于 10')
  await strength.focus()
  await strength.press('ArrowRight')
  await strength.press('ArrowRight')
  await activate(submit, info.project.name.startsWith('mobile-'))
  await expect(
    form.getByRole('status', { name: '滑块表单结果' }),
  ).toContainText('"strength":10')
  await activate(
    form.getByRole('button', { name: '重置滑块表单' }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(strength).toHaveValue('30')
  const native = page.getByRole('form', { name: '原生滑块重置' })
  const scalar = native.getByRole('slider', {
    name: '原生默认比例',
    exact: true,
  })
  const upper = native.getByRole('slider', {
    name: '原生默认区间 上限',
    exact: true,
  })
  await scalar.focus()
  await scalar.press('End')
  await upper.focus()
  await upper.press('End')
  await expect
    .poll(() =>
      native.evaluate((element) =>
        Object.fromEntries(new FormData(element as HTMLFormElement)),
      ),
    )
    .toEqual({ nativeRatio: '100', nativeSpan: '[20,100]' })
  await activate(
    native.getByRole('button', { name: '重置原生滑块' }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(scalar).toHaveValue('30')
  await expect(upper).toHaveValue('60')
  await expect
    .poll(() =>
      native.evaluate((element) =>
        Object.fromEntries(new FormData(element as HTMLFormElement)),
      ),
    )
    .toEqual({ nativeRatio: '30', nativeSpan: '[20,60]' })
})
