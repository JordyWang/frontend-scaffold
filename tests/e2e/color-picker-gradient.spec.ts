import { expect, test, type Locator, type Page } from '@playwright/test'

const initial = 'linear-gradient(90deg, #1677ff 0%, #13c2c2 100%)'
async function activate(target: Locator, mobile: boolean) {
  if (mobile) await target.tap()
  else await target.click()
}
async function gesture(
  page: Page,
  target: Locator,
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
    for (let step = 1; step <= 6; step++)
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * step) / 6,
            y: start.y + ((end.y - start.y) * step) / 6,
          },
        ],
      })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await session.detach()
  } else if (project === 'mobile-webkit') {
    for (const [type, point] of [
      ['pointerdown', start],
      ['pointermove', end],
      ['pointerup', end],
    ] as const)
      await target.dispatchEvent(type, {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        clientX: point.x,
        clientY: point.y,
      })
  } else {
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(end.x, end.y, { steps: 6 })
    await page.mouse.up()
  }
}
test.beforeEach(async ({ page }) => {
  await page.goto('/__ui')
})

test('gradient selected stops share color formats and alpha; mode switches keep canonical values and keyboard focus', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', {
    name: '渐变颜色能力预览',
    exact: true,
  })
  const mobile = info.project.name.startsWith('mobile-')
  const trigger = preview.getByRole('button', {
    name: '渐变主题色',
    exact: true,
  })
  await activate(trigger, mobile)
  const panel = page.getByRole('dialog', {
    name: '渐变主题色选择面板',
    exact: true,
  })
  const editor = panel.getByRole('group', {
    name: '渐变主题色渐变编辑',
    exact: true,
  })
  const first = editor.getByRole('slider').first()
  await first.focus()
  await first.press('ArrowRight')
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0.01%, #13c2c2 100%)',
  )
  await activate(editor.getByRole('button', { name: /选择第 2 色标/ }), mobile)
  const input = panel.getByRole('textbox', {
    name: '渐变主题色颜色值',
    exact: true,
  })
  await input.fill('rgba(0,255,0,.5)')
  await input.press('Enter')
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0.01%, #00ff0080 100%)',
  )
  await expect(
    preview.getByRole('status', { name: '渐变完成值' }),
  ).toContainText('完成 2 次')
  await panel
    .getByRole('combobox', { name: '渐变主题色编码格式' })
    .selectOption('rgb')
  await expect(input).toHaveValue('rgba(0, 255, 0, 0.5)')
  await expect(input).toHaveCSS('font-size', '16px')
  const mode = panel.getByRole('radiogroup', { name: '渐变主题色颜色类型' })
  await mode.getByRole('radio', { name: '渐变', exact: true }).focus()
  await mode
    .getByRole('radio', { name: '渐变', exact: true })
    .press('ArrowLeft')
  await expect(
    mode.getByRole('radio', { name: '单色', exact: true }),
  ).toBeFocused()
  await expect(trigger).toHaveAttribute('value', '#00ff0080')
  await mode
    .getByRole('radio', { name: '单色', exact: true })
    .press('ArrowRight')
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #00ff0080 0%, #00ff0080 100%)',
  )
  await expect(
    mode.getByRole('radio', { name: '渐变', exact: true }),
  ).toBeFocused()
})

test('gradient stop actions recover adjacent focus, protect the two-stop floor and continue portal Tab order', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '渐变颜色能力预览',
    exact: true,
  })
  const trigger = preview.getByRole('button', {
    name: '渐变主题色',
    exact: true,
  })
  await activate(trigger, mobile)
  const panel = page.getByRole('dialog', {
    name: '渐变主题色选择面板',
    exact: true,
  })
  const editor = panel.getByRole('group', {
    name: '渐变主题色渐变编辑',
    exact: true,
  })
  await activate(
    editor.getByRole('button', { name: '添加色标', exact: true }),
    mobile,
  )
  await expect(editor.getByRole('slider')).toHaveCount(3)
  await expect(editor.getByRole('slider').nth(1)).toBeFocused()
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0%, #159de1 50%, #13c2c2 100%)',
  )
  await editor.getByRole('slider').nth(1).press('Delete')
  await expect(editor.getByRole('slider')).toHaveCount(2)
  await expect(editor.getByRole('slider').nth(1)).toBeFocused()
  await expect(trigger).toHaveAttribute('value', initial)
  await expect(
    editor.getByRole('button', { name: '移除第 2 色标' }),
  ).toBeDisabled()
  const last = panel.getByRole('button', {
    name: '清除渐变主题色',
    exact: true,
  })
  await last.focus()
  await last.press('Tab')
  await expect(panel).toHaveCount(0)
  await expect(
    preview.getByRole('button', { name: '仅完成时渐变', exact: true }),
  ).toBeFocused()
})

test('gradient mouse and native H5 gestures move and insert stops with one completion per gesture', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '渐变颜色能力预览',
    exact: true,
  })
  await activate(
    preview.getByRole('button', { name: '渐变主题色', exact: true }),
    mobile,
  )
  const panel = page.getByRole('dialog', {
    name: '渐变主题色选择面板',
    exact: true,
  })
  const editor = panel.getByRole('group', {
    name: '渐变主题色渐变编辑',
    exact: true,
  })
  const rail = editor.locator('[data-slider-rail]')
  await rail.scrollIntoViewIfNeeded()
  let box = (await rail.boundingBox())!
  const first = editor.getByRole('slider').first()
  const handle = first.locator('xpath=ancestor::*[@data-slider-thumb-index]')
  await gesture(
    page,
    info.project.name === 'mobile-webkit' ? handle : rail,
    { x: box.x, y: box.y + 22 },
    { x: box.x + box.width * 0.2, y: box.y + 22 },
    info.project.name,
  )
  expect(Number(await first.inputValue())).toBeCloseTo(20, 1)
  await expect(
    preview.getByRole('status', { name: '渐变完成值' }),
  ).toContainText('完成 1 次')
  await expect(
    panel.getByRole('textbox', { name: '渐变主题色颜色值' }),
  ).toHaveValue('#1677ff')
  const position = editor.getByRole('spinbutton', {
    name: '渐变主题色选中色标位置',
  })
  await position.fill('0')
  await position.press('Tab')
  await expect(
    preview.getByRole('status', { name: '渐变完成值' }),
  ).toContainText('完成 2 次')
  await rail.scrollIntoViewIfNeeded()
  box = (await rail.boundingBox())!
  await gesture(
    page,
    rail,
    { x: box.x + box.width * 0.5, y: box.y + 22 },
    { x: box.x + box.width * 0.7, y: box.y + 22 },
    info.project.name,
  )
  await expect(editor.getByRole('slider')).toHaveCount(3)
  expect(
    Number(await editor.getByRole('slider').nth(1).inputValue()),
  ).toBeCloseTo(70, 1)
  await expect(
    preview.getByRole('status', { name: '渐变完成值' }),
  ).toContainText('完成 3 次')
  await expect(editor.getByRole('slider').nth(1)).toBeFocused()
})

test('gradient presets, opacity restrictions and completion-only control preserve full strings', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const preview = page.getByRole('region', {
    name: '渐变颜色能力预览',
    exact: true,
  })
  const trigger = preview.getByRole('button', {
    name: '渐变主题色',
    exact: true,
  })
  await activate(trigger, mobile)
  let panel = page.getByRole('dialog', {
    name: '渐变主题色选择面板',
    exact: true,
  })
  await activate(
    panel.getByRole('button', { name: '透明蓝渐变', exact: true }),
    mobile,
  )
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0%, #1677ff00 100%)',
  )
  await expect(
    panel.getByRole('button', { name: '透明蓝渐变', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await panel
    .getByRole('button', { name: '透明蓝渐变', exact: true })
    .press('Escape')
  await activate(
    preview.getByRole('button', { name: '禁用渐变透明度' }),
    mobile,
  )
  await activate(trigger, mobile)
  panel = page.getByRole('dialog', { name: '渐变主题色选择面板', exact: true })
  await expect(
    panel.getByRole('slider', { name: '渐变主题色透明度', exact: true }),
  ).toHaveCount(0)
  await expect(trigger).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0%, #1677ff 100%)',
  )
  await panel
    .getByRole('slider', { name: '渐变主题色色相', exact: true })
    .press('Escape')
  const completion = preview.getByRole('button', {
    name: '仅完成时渐变',
    exact: true,
  })
  await activate(completion, mobile)
  panel = page.getByRole('dialog', {
    name: '仅完成时渐变选择面板',
    exact: true,
  })
  const first = panel
    .getByRole('group', { name: '仅完成时渐变渐变编辑', exact: true })
    .getByRole('slider')
    .first()
  await first.focus()
  await page.keyboard.down('ArrowRight')
  await expect(completion).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0%, #1677ff00 100%)',
  )
  await page.keyboard.up('ArrowRight')
  await expect(completion).toHaveAttribute(
    'value',
    'linear-gradient(90deg, #1677ff 0.01%, #1677ff00 100%)',
  )
})

test('gradient native and project forms validate clear, submit only canonical data and reset stop structure', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const native = page.getByRole('form', { name: '渐变原生表单', exact: true })
  const editor = native.getByRole('group', {
    name: '常驻渐变渐变编辑',
    exact: true,
  })
  await activate(
    editor.getByRole('button', { name: '添加色标', exact: true }),
    mobile,
  )
  await activate(
    native.getByRole('button', { name: '提交原生渐变', exact: true }),
    mobile,
  )
  await expect(native.getByRole('status')).toHaveText(
    '{"paint":"linear-gradient(90deg, #1677ff 0%, #159de1 50%, #13c2c2 100%)"}',
  )
  await activate(
    native.getByRole('button', { name: '清除常驻渐变', exact: true }),
    mobile,
  )
  await activate(
    native.getByRole('button', { name: '提交原生渐变', exact: true }),
    mobile,
  )
  await expect(native.getByRole('alert')).toContainText('请选择颜色')
  await activate(
    native.getByRole('button', { name: '重置原生渐变', exact: true }),
    mobile,
  )
  await expect(editor.getByRole('slider')).toHaveCount(2)
  await expect(native.getByRole('alert')).toHaveCount(0)
  const form = page.getByRole('form', { name: '项目渐变表单', exact: true })
  await activate(
    form.getByRole('button', { name: '提交项目渐变', exact: true }),
    mobile,
  )
  await expect(form.getByRole('alert')).toHaveText('请选择渐变颜色')
  await activate(
    form.getByRole('button', { name: '表单渐变', exact: true }),
    mobile,
  )
  const panel = page.getByRole('dialog', {
    name: '表单渐变选择面板',
    exact: true,
  })
  await activate(
    panel.getByRole('button', { name: '品牌蓝青渐变', exact: true }),
    mobile,
  )
  await activate(
    form.getByRole('button', { name: '提交项目渐变', exact: true }),
    mobile,
  )
  await expect(form.getByRole('status')).toHaveText(`{"paint":"${initial}"}`)
})

test('gradient 240px RTL dark panels keep color direction, mode keys, stop boundaries and H5 targets', async ({
  page,
}, info) => {
  const rtl = page.getByRole('group', {
    name: '窄容器 RTL 渐变预览',
    exact: true,
  })
  const editor = rtl.getByRole('group', {
    name: 'RTL 渐变渐变编辑',
    exact: true,
  })
  const first = editor.getByRole('slider').first()
  await first.focus()
  await first.press('ArrowLeft')
  await expect(first).toHaveValue('0.01')
  const rail = editor.locator('[data-slider-rail]')
  await expect(rail.locator('span').first()).toHaveCSS(
    'background-image',
    /rgba\(22, 119, 255, 0\).*rgb\(22, 119, 255\)/,
  )
  const mode = rtl.getByRole('radiogroup', { name: 'RTL 渐变颜色类型' })
  await mode.getByRole('radio', { name: '渐变', exact: true }).focus()
  await mode
    .getByRole('radio', { name: '渐变', exact: true })
    .press('ArrowRight')
  await expect(
    mode.getByRole('radio', { name: '单色', exact: true }),
  ).toBeFocused()
  await mode
    .getByRole('radio', { name: '单色', exact: true })
    .press('ArrowLeft')
  await expect(
    mode.getByRole('radio', { name: '渐变', exact: true }),
  ).toBeFocused()
  await activate(
    rtl.getByRole('button', { name: '透明蓝渐变', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(rail.locator('span').first()).toHaveCSS(
    'background-image',
    /rgba\(22, 119, 255, 0\).*rgb\(22, 119, 255\)/,
  )
  const box = (await rtl.boundingBox())!
  for (const target of await rtl
    .locator('button,input:not([aria-hidden="true"]),select')
    .all()) {
    const bounds = (await target.boundingBox())!
    const name = await target.getAttribute('aria-label')
    expect(bounds.width, `${name} touch width`).toBeGreaterThanOrEqual(44)
    expect(bounds.height, `${name} touch height`).toBeGreaterThanOrEqual(44)
    expect(bounds.x).toBeGreaterThanOrEqual(box.x)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(box.x + box.width)
  }
  await rtl.scrollIntoViewIfNeeded()
  await rtl.screenshot({
    path: `output/playwright/color-gradient-rtl-${info.project.name}.png`,
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
