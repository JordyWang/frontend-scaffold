import { expect, test, type Locator, type Page } from '@playwright/test'

async function activate(control: Locator, mobile: boolean) {
  if (mobile) await control.tap()
  else await control.click()
}
async function gesture(
  page: Page,
  area: Locator,
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
    await area.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: start.x,
      clientY: start.y,
    })
    await area.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: end.x,
      clientY: end.y,
    })
    await area.dispatchEvent('pointerup', {
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
    await page.mouse.move(end.x, end.y, { steps: 6 })
    await page.mouse.up()
  }
}
test.beforeEach(async ({ page }) => {
  await page.goto('/__ui')
})

test('color picker keyboard channels preserve canonical alpha and complete interactions before format changes', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '颜色能力预览' })
  const trigger = preview.getByRole('button', {
    name: '透明主题色',
    exact: true,
  })
  const box = (await trigger.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  await trigger.focus()
  await trigger.press('ArrowDown')
  const panel = page.getByRole('dialog', {
    name: '透明主题色选择面板',
    exact: true,
  })
  const hue = panel.getByRole('slider', { name: '透明主题色色相', exact: true })
  await expect(hue).toBeFocused()
  await expect(trigger).toHaveAttribute(
    'aria-controls',
    (await panel.getAttribute('id')) as string,
  )
  await hue.press('End')
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#ff1616')
  await expect(
    preview.getByRole('status', { name: '颜色完成值', exact: true }),
  ).toHaveText('#ff1616 · 完成 1 次')
  const alpha = panel.getByRole('slider', {
    name: '透明主题色透明度',
    exact: true,
  })
  await alpha.press('Home')
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#ff161600')
  const format = panel.getByRole('combobox', {
    name: '透明主题色编码格式',
    exact: true,
  })
  await format.selectOption('rgb')
  await expect(
    panel.getByRole('textbox', { name: '透明主题色颜色值', exact: true }),
  ).toHaveValue('rgba(255, 22, 22, 0)')
  await expect(
    preview.getByRole('status', { name: '颜色完成值', exact: true }),
  ).toHaveText('#ff161600 · 完成 2 次')
  for (const slider of await panel.getByRole('slider').all()) {
    const sliderBox = (await slider.boundingBox())!
    expect(sliderBox.width).toBeGreaterThanOrEqual(44)
    expect(sliderBox.height).toBeGreaterThanOrEqual(44)
  }
  await alpha.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await activate(
    preview.getByRole('button', { name: '禁用颜色透明度', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await activate(trigger, info.project.name.startsWith('mobile-'))
  await expect(
    page
      .getByRole('dialog', { name: '透明主题色选择面板' })
      .getByRole('slider', { name: '透明主题色透明度' }),
  ).toHaveCount(0)
  await expect(trigger).toHaveAttribute('value', '#ff1616')
})

test('color picker pointer and native H5 gestures update the two color axes with one completion', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '颜色能力预览' })
  await activate(
    preview.getByRole('button', { name: '透明主题色', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  const panel = page.getByRole('dialog', {
    name: '透明主题色选择面板',
    exact: true,
  })
  const input = panel.getByRole('textbox', {
    name: '透明主题色颜色值',
    exact: true,
  })
  await input.fill('#00ff00')
  await input.press('Enter')
  const area = panel.locator('[data-color-area]')
  await area.scrollIntoViewIfNeeded()
  const box = (await area.boundingBox())!
  await gesture(
    page,
    area,
    { x: box.x + box.width * 0.8, y: box.y + box.height * 0.2 },
    { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 },
    info.project.name,
  )
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#408040')
  await expect(
    preview.getByRole('status', { name: '颜色完成值', exact: true }),
  ).toHaveText('#408040 · 完成 2 次')
  await expect(
    panel.getByRole('slider', { name: '透明主题色饱和度', exact: true }),
  ).toBeFocused()
})

test('color picker formats, channel inputs, presets and draft errors keep committed values separate', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '颜色能力预览' })
  await activate(
    preview.getByRole('button', { name: '透明主题色', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  const panel = page.getByRole('dialog', {
    name: '透明主题色选择面板',
    exact: true,
  })
  const format = panel.getByRole('combobox', {
    name: '透明主题色编码格式',
    exact: true,
  })
  await format.selectOption('rgb')
  const input = panel.getByRole('textbox', {
    name: '透明主题色颜色值',
    exact: true,
  })
  await expect(input).toHaveCSS('font-size', '16px')
  await input.fill('rgba(255, 0, 0, 0.5)')
  await input.press('Enter')
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#ff000080')
  const green = panel.getByRole('spinbutton', {
    name: '透明主题色RGB G',
    exact: true,
  })
  await green.fill('255')
  await green.press('Tab')
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#ffff0080')
  await format.selectOption('hsb')
  await expect(
    panel.getByRole('spinbutton', { name: '透明主题色HSB H', exact: true }),
  ).toHaveValue('60')
  await input.fill('invalid')
  await input.press('Enter')
  await expect(panel.getByRole('alert')).toContainText('请输入有效')
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#ffff0080')
  await input.press('Escape')
  await expect(panel.getByRole('alert')).toHaveCount(0)
  await activate(
    panel.getByRole('button', { name: '半透明蓝', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('#1677ff80')
  await expect(
    panel.getByRole('button', { name: '半透明蓝', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await activate(
    panel.getByRole('button', { name: '清除透明主题色', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(
    preview.getByRole('status', { name: '颜色实时值', exact: true }),
  ).toHaveText('空颜色')
  await expect(
    panel.getByRole('button', { name: '清除透明主题色', exact: true }),
  ).toBeDisabled()
})

test('color picker popup Tab order reconnects to the surrounding form and controlled completion retains trigger color', async ({
  page,
}, info) => {
  const form = page.getByRole('form', { name: '颜色组合表单', exact: true })
  const trigger = form.getByRole('button', { name: '表单颜色', exact: true })
  await trigger.focus()
  await trigger.press('ArrowDown')
  let panel = page.getByRole('dialog', {
    name: '表单颜色选择面板',
    exact: true,
  })
  const first = panel.getByRole('slider', { name: '表单颜色色相', exact: true })
  await expect(first).toBeFocused()
  await first.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await trigger.press('Tab')
  await expect(first).toBeFocused()
  const last = panel.getByRole('button', { name: '完全透明', exact: true })
  await last.focus()
  await last.press('Tab')
  await expect(
    form.getByRole('button', { name: '提交颜色表单', exact: true }),
  ).toBeFocused()
  await expect(panel).toHaveCount(0)
  const preview = page.getByRole('region', { name: '颜色能力预览' })
  const controlled = preview.getByRole('button', {
    name: '仅完成时受控颜色',
    exact: true,
  })
  await activate(controlled, info.project.name.startsWith('mobile-'))
  panel = page.getByRole('dialog', {
    name: '仅完成时受控颜色选择面板',
    exact: true,
  })
  const hue = panel.getByRole('slider', {
    name: '仅完成时受控颜色色相',
    exact: true,
  })
  await hue.focus()
  await page.keyboard.down('Home')
  await expect(controlled).toHaveAttribute('value', '#00ff00')
  await page.keyboard.up('Home')
  await expect(controlled).toHaveAttribute('value', '#ff0000')
})

test('color picker native and project forms validate empty colors and reset canonical data', async ({
  page,
}, info) => {
  const mobile = info.project.name.startsWith('mobile-')
  const form = page.getByRole('form', { name: '颜色组合表单', exact: true })
  await activate(
    form.getByRole('button', { name: '提交颜色表单', exact: true }),
    mobile,
  )
  await expect(form.getByRole('alert')).toContainText('请选择颜色')
  await activate(
    form.getByRole('button', { name: '表单颜色', exact: true }),
    mobile,
  )
  const panel = page.getByRole('dialog', {
    name: '表单颜色选择面板',
    exact: true,
  })
  await activate(
    panel.getByRole('button', { name: '半透明蓝', exact: true }),
    mobile,
  )
  await activate(
    form.getByRole('button', { name: '提交颜色表单', exact: true }),
    mobile,
  )
  await expect(form.getByRole('status')).toContainText('"color":"#1677ff80"')
  await activate(
    form.getByRole('button', { name: '重置颜色表单', exact: true }),
    mobile,
  )
  await expect(
    form.getByRole('button', { name: '表单颜色', exact: true }),
  ).toHaveAttribute('value', '')
  const native = page.getByRole('form', { name: '原生颜色表单', exact: true })
  await activate(
    native.getByRole('button', { name: '提交原生颜色', exact: true }),
    mobile,
  )
  await expect(native.getByRole('alert')).toContainText('请选择颜色')
  const required = native.getByRole('button', {
    name: '原生必选颜色',
    exact: true,
  })
  await expect(required).toBeFocused()
  await activate(required, mobile)
  await activate(
    page
      .getByRole('dialog', { name: '原生必选颜色选择面板' })
      .getByRole('button', { name: '半透明蓝', exact: true }),
    mobile,
  )
  await activate(
    native.getByRole('button', { name: '提交原生颜色', exact: true }),
    mobile,
  )
  await expect(native.getByRole('status')).toHaveText(
    '{"color":"#1677ff80","nativeColor":"#1677ff"}',
  )
  await activate(
    native.getByRole('button', { name: '重置原生颜色', exact: true }),
    mobile,
  )
  await expect(required).toHaveAttribute('value', '')
  await expect(native.getByLabel('原生颜色适配')).toHaveValue('#1677ff')
})

test('color picker portals escape clipping and 240px RTL panels keep blue tokens, direction and touch targets', async ({
  page,
}, info) => {
  const preview = page.getByRole('region', { name: '颜色能力预览' })
  const clipped = preview.getByRole('group', {
    name: '裁切容器颜色选择',
    exact: true,
  })
  await activate(
    clipped.getByRole('button', { name: '裁切颜色', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  const popup = page.getByRole('dialog', {
    name: '裁切颜色选择面板',
    exact: true,
  })
  await expect(popup).toBeVisible()
  expect(
    await popup.evaluate((element) =>
      Boolean(element.closest('[aria-label="裁切容器颜色选择"]')),
    ),
  ).toBe(false)
  const popupBox = (await popup.boundingBox())!
  expect(popupBox.x).toBeGreaterThanOrEqual(8)
  expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(
    page.viewportSize()!.width - 8,
  )
  await popup
    .getByRole('slider', { name: '裁切颜色色相', exact: true })
    .press('Escape')
  const rtl = preview.getByRole('group', {
    name: '窄容器 RTL 颜色预览',
    exact: true,
  })
  const hue = rtl.getByRole('slider', { name: 'RTL 常驻颜色色相', exact: true })
  await hue.focus()
  await hue.press('ArrowLeft')
  await expect(hue).toHaveValue('216')
  const rail = hue.locator('xpath=ancestor::*[@data-slider-rail]')
  await expect(rail.locator('span').first()).toHaveCSS(
    'background-image',
    /to left/,
  )
  const blue = rtl.getByRole('button', { name: 'Ant Design 蓝', exact: true })
  await activate(blue, info.project.name.startsWith('mobile-'))
  await expect(blue).toHaveAttribute('aria-pressed', 'true')
  const box = (await rtl.boundingBox())!
  for (const control of await rtl
    .locator('button,input:not([aria-hidden="true"]),select')
    .all()) {
    const controlBox = (await control.boundingBox())!
    const name = await control.getAttribute('aria-label')
    expect(controlBox.width, `${name} touch width`).toBeGreaterThanOrEqual(44)
    expect(controlBox.height, `${name} touch height`).toBeGreaterThanOrEqual(44)
    expect(controlBox.x).toBeGreaterThanOrEqual(box.x)
    expect(controlBox.x + controlBox.width).toBeLessThanOrEqual(
      box.x + box.width,
    )
  }
  await expect(rtl.locator('[data-color-panel]')).toHaveCSS(
    'color',
    'rgb(248, 250, 252)',
  )
  const channelBoxes = await Promise.all(
    (await rtl.getByRole('spinbutton').all()).map((input) =>
      input.locator('..').boundingBox(),
    ),
  )
  const sorted = channelBoxes.map((bounds) => bounds!).sort((a, b) => a.x - b.x)
  for (let index = 1; index < sorted.length; index++)
    expect(
      sorted[index].x - (sorted[index - 1].x + sorted[index - 1].width),
    ).toBeGreaterThanOrEqual(7.9)
  await rtl.scrollIntoViewIfNeeded()
  await rtl.screenshot({
    path: `output/playwright/color-rtl-${info.project.name}.png`,
  })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
