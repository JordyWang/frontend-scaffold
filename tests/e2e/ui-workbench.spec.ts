import { expect, test } from '@playwright/test'

test('system dark mode keeps local light surfaces and state colors distinct', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/__ui')
  await expect(page.locator('main').locator('..')).toHaveCSS(
    'background-color',
    'rgb(15, 23, 42)',
  )
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  await expect(preview.locator('[data-ui-theme="light"]')).toHaveCSS(
    'background-color',
    'rgb(248, 250, 252)',
  )
  await expect(page.locator('.ui-ai-status--completed').first()).toHaveCSS(
    'background-color',
    'rgb(20, 83, 45)',
  )
  await page.getByRole('button', { name: '普通提示' }).click()
  const darkToast = page
    .locator('[data-sonner-toast]')
    .filter({ hasText: '信息提示' })
  await expect(darkToast).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await expect(darkToast).toHaveCSS('color', 'rgb(248, 250, 252)')
})

test('default status labels meet AA contrast in light and dark themes', async ({
  page,
}) => {
  await page.goto('/__ui')
  const scope = page
    .getByRole('region', { name: '设计系统补充组件' })
    .locator('.ui-theme-scope')
    .first()
  const contrast = (tone: 'success' | 'warning' | 'error') =>
    scope.locator(`[data-ui-tone="${tone}"]`).evaluate((element) => {
      const style = getComputedStyle(element)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      const rgb = (value: string) => {
        context.fillStyle = value
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
      }
      const luminance = (value: number[]) => {
        const channels = value.map((channel) => {
          const normalized = channel / 255
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
        })
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        )
      }
      const foreground = luminance(rgb(style.color))
      const background = luminance(rgb(style.backgroundColor))
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      )
    })

  for (const tone of ['success', 'warning', 'error'] as const)
    expect(await contrast(tone)).toBeGreaterThanOrEqual(4.5)
  await page.getByRole('button', { name: '切换预览主题' }).click()
  for (const tone of ['success', 'warning', 'error'] as const)
    expect(await contrast(tone)).toBeGreaterThanOrEqual(4.5)
})

test('custom status seeds keep soft backgrounds and readable labels in both themes', async ({
  page,
}) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const scope = preview.locator('.ui-theme-scope[data-ui-theme]').nth(1)
  const colors = async (
    tone: 'success' | 'warning' | 'error',
    tag = scope.locator(`[data-ui-tone="${tone}"]`).first(),
  ) =>
    tag.evaluate((element) => {
      const style = getComputedStyle(element)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      const rgb = (value: string) => {
        context.fillStyle = value
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
      }
      const luminance = (value: number[]) => {
        const channels = value.map((channel) => {
          const normalized = channel / 255
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
        })
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        )
      }
      const foreground = luminance(rgb(style.color))
      const background = luminance(rgb(style.backgroundColor))
      return {
        background: style.backgroundColor,
        contrast:
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05),
      }
    })

  for (const theme of ['dark', 'light']) {
    await expect(scope).toHaveAttribute('data-ui-theme', theme)
    for (const tone of ['success', 'warning', 'error'] as const) {
      expect((await colors(tone)).contrast).toBeGreaterThanOrEqual(4.5)
    }
    expect(
      (
        await colors(
          'error',
          scope.getByRole('button', { name: '局部危险操作' }),
        )
      ).contrast,
    ).toBeGreaterThanOrEqual(4.5)
    for (const tone of ['success', 'warning', 'error'] as const) {
      const badgeColor = await colors(
        tone,
        scope.locator(`[data-ui-badge-tone="${tone}"]`).first(),
      )
      expect(badgeColor.contrast).toBeGreaterThanOrEqual(4.5)
    }
    const original = (await colors('success')).background
    await scope.evaluate((element) =>
      element.style.setProperty('--ui-seed-success', '#ffffff'),
    )
    expect((await colors('success')).background).not.toBe(original)
    expect((await colors('success')).contrast).toBeGreaterThanOrEqual(4.5)
    await scope.evaluate((element) =>
      element.style.setProperty('--ui-seed-success', '#000000'),
    )
    expect((await colors('success')).contrast).toBeGreaterThanOrEqual(4.5)
    await scope.evaluate((element) =>
      element.style.setProperty('--ui-seed-success', '#34d399'),
    )
    await preview.getByRole('button', { name: '切换预览主题' }).click()
  }

  await scope.evaluate((element) => {
    const nested = document.createElement('div')
    nested.className = 'ui-theme-scope'
    nested.dataset.uiTheme = 'light'
    nested.innerHTML =
      '<span data-ui-tone="success" class="inline-flex items-center rounded-[0.35rem] border border-[var(--ui-color-success)] bg-[var(--ui-map-success-bg)] px-2 py-0.5 text-sm font-semibold text-[var(--ui-color-success)]">嵌套状态</span>'
    element.append(nested)
  })
  const nested = scope.locator(
    '[data-ui-theme="light"] [data-ui-tone="success"]',
  )
  expect((await colors('success', nested)).contrast).toBeGreaterThanOrEqual(4.5)
  expect((await colors('success', nested)).background).not.toBe(
    (await colors('success')).background,
  )
})

test('design system controls support keyboard, touch and local themes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  await expect(
    page
      .getByRole('region', { name: '基础展示与输入' })
      .getByRole('button', { name: '主要操作' }),
  ).toHaveCSS('background-color', 'rgb(22, 119, 255)')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const checkbox = preview.getByRole('checkbox', { name: '同意更新通知' })
  const switchControl = preview.getByRole('switch', { name: '启用提醒' })
  const cascader = preview.getByRole('combobox', { name: '地区' })
  const theme = preview.getByRole('button', { name: '切换预览主题' })
  await expect(cascader).toHaveAttribute('id')

  if (testInfo.project.name.startsWith('mobile-')) {
    await preview.locator('label').filter({ hasText: '同意更新通知' }).tap()
    await preview.getByText('启用提醒').tap()
    await theme.tap()
  } else {
    await checkbox.focus()
    await page.keyboard.press('Space')
    await switchControl.focus()
    await page.keyboard.press('Space')
    await theme.click()
  }
  await expect(checkbox).toBeChecked()
  await expect(switchControl).not.toBeChecked()
  await expect(preview.getByText('当前：深色 · 常规')).toBeVisible()
  await expect(preview.locator('[data-ui-theme="dark"]')).toHaveCount(1)
  const brandedScope = preview.locator('[data-ui-theme="light"]')
  await expect(
    brandedScope.getByRole('button', { name: '主要操作' }),
  ).toHaveCSS('background-color', 'rgb(22, 119, 255)')
  await expect(
    brandedScope.getByRole('button', { name: '主要操作' }),
  ).toHaveCSS('color', 'rgb(255, 255, 255)')
  await expect(
    brandedScope.getByRole('button', { name: '主要操作' }),
  ).toHaveCSS('border-radius', '999px')
  const nestedScope = brandedScope.locator('[data-ui-density="default"]')
  await expect(nestedScope.getByRole('button', { name: '继承按钮' })).toHaveCSS(
    'border-radius',
    '999px',
  )
  await expect(nestedScope.getByRole('button', { name: '继承按钮' })).toHaveCSS(
    'height',
    '48px',
  )
  await expect(
    nestedScope.getByRole('textbox', { name: '继承输入' }),
  ).toHaveCSS('height', '48px')
  await expect(
    nestedScope.locator('[data-ui-card]').filter({ hasText: '继承卡片' }),
  ).toHaveCSS('border-top-left-radius', '16px')
  const tokenDialogTrigger = nestedScope.getByRole('button', {
    name: '打开组件 Token 对话框',
  })
  if (testInfo.project.name.startsWith('mobile-'))
    await tokenDialogTrigger.tap()
  else await tokenDialogTrigger.click()
  await expect(
    page.getByRole('dialog', { name: '组件 Token 对话框' }),
  ).toHaveCSS('border-top-left-radius', '20px')
  await page
    .getByRole('dialog', { name: '组件 Token 对话框' })
    .getByRole('button', { name: '关闭对话框' })
    .click()
  const tokenMenuTrigger = nestedScope.getByRole('button', {
    name: '打开组件 Token 菜单',
  })
  if (testInfo.project.name.startsWith('mobile-')) await tokenMenuTrigger.tap()
  else await tokenMenuTrigger.click()
  await expect(page.getByRole('menu', { name: '菜单' })).toHaveCSS(
    'border-top-left-radius',
    '12px',
  )
  await page.keyboard.press('Escape')
  const accentBefore = await brandedScope
    .getByText('派生高亮')
    .evaluate((element) => getComputedStyle(element).backgroundColor)

  await preview.getByRole('button', { name: '切换预览密度' }).click()
  await expect(preview.getByText('当前：深色 · 紧凑')).toBeVisible()
  const radio = preview.getByRole('radio', { name: '网格' })
  const segmented = preview.getByRole('group', { name: '数据视图' })
  const compactView = segmented.getByRole('radio', { name: '紧凑列表' })
  const wideView = segmented.locator('label').filter({ hasText: '宽卡片' })
  if (testInfo.project.name.startsWith('mobile-'))
    await radio.locator('..').tap()
  else {
    await preview.getByRole('radio', { name: '列表', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
  }
  await expect(radio).toBeChecked()
  if (testInfo.project.name.startsWith('mobile-')) await wideView.tap()
  else await wideView.click()
  await expect(segmented.getByRole('radio', { name: '宽卡片' })).toBeChecked()
  await expect(compactView).not.toBeChecked()

  const rating = preview.getByRole('radiogroup', { name: '满意度' })
  const satisfied = rating.getByRole('radio', { name: '满意', exact: true })
  const satisfiedOption = rating.locator('label').nth(3)
  if (testInfo.project.name.startsWith('mobile-')) await satisfiedOption.tap()
  else await satisfiedOption.click()
  await expect(satisfied).toBeChecked()

  const colorPicker = preview.getByLabel('主题色')
  await expect(colorPicker).toHaveValue('#1677ff')
  const colorPickerBox = await colorPicker.boundingBox()
  expect(colorPickerBox?.width).toBeGreaterThanOrEqual(44)
  expect(colorPickerBox?.height).toBeGreaterThanOrEqual(44)

  const scopedSelect = preview.getByRole('combobox', { name: '局部选择' })
  if (testInfo.project.name.startsWith('mobile-')) await scopedSelect.tap()
  else await scopedSelect.click()
  const selectContent = page.locator('[data-ui-select-content]')
  await expect(selectContent).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await expect
    .poll(() =>
      selectContent.evaluate((element) =>
        element.closest('[data-ui-theme]')?.getAttribute('data-ui-theme'),
      ),
    )
    .toBe('dark')
  await page.getByRole('option', { name: '选项一' }).click()

  const dialogTrigger = preview.getByRole('button', { name: '打开局部对话框' })
  if (testInfo.project.name.startsWith('mobile-')) await dialogTrigger.tap()
  else await dialogTrigger.click()
  const scopedDialog = page.getByRole('dialog', { name: '局部对话框' })
  await expect(scopedDialog).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await scopedDialog.getByRole('button', { name: '关闭对话框' }).click()

  const sheetTrigger = preview.getByRole('button', { name: '打开局部面板' })
  if (testInfo.project.name.startsWith('mobile-')) await sheetTrigger.tap()
  else await sheetTrigger.click()
  const scopedSheet = page.getByRole('dialog', { name: '局部面板' })
  await expect(scopedSheet).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await scopedSheet.getByRole('button', { name: '关闭面板' }).click()

  await theme.click()
  const accentAfter = await preview
    .getByText('派生高亮')
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(accentAfter).not.toBe(accentBefore)
  await expect(preview.getByRole('button', { name: '主要操作' })).toHaveCSS(
    'color',
    'rgb(17, 24, 39)',
  )

  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
})

test('form preview validates and submits through the project contract', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const form = preview.locator('form').filter({ hasText: '联系邮箱' })
  const email = form.getByRole('textbox', { name: '联系邮箱' })
  const submit = form.getByRole('button', { name: '提交表单' })
  const labelBox = await form
    .locator('label')
    .filter({ hasText: '联系邮箱' })
    .boundingBox()
  const emailBox = await email.boundingBox()
  expect(labelBox).not.toBeNull()
  expect(emailBox).not.toBeNull()
  if (testInfo.project.name.startsWith('mobile-'))
    expect(emailBox!.y).toBeGreaterThan(labelBox!.y)
  else expect(emailBox!.x).toBeGreaterThan(labelBox!.x)

  if (testInfo.project.name.startsWith('mobile-')) await submit.tap()
  else await submit.click()
  await expect(form.getByRole('alert')).toHaveText('请输入联系邮箱')

  await email.fill('person@example.com')
  if (testInfo.project.name.startsWith('mobile-')) await submit.tap()
  else await submit.click()
  await expect(form.getByText('已提交：person@example.com')).toBeVisible()
})

test('native data controls keep their touch targets and keyboard behavior', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const number = preview.getByRole('spinbutton', { name: '数量' })
  const slider = preview.getByRole('slider', { name: '音量' })
  const date = preview.getByLabel('开始日期')
  const time = preview.getByLabel('开始时间')
  const autocomplete = preview.getByRole('combobox', { name: '城市' })
  const region = preview.getByRole('combobox', { name: '地区' })
  const upload = preview.getByRole('button', { name: '上传图片' })

  for (const [name, control] of [
    ['number', number.locator('..')],
    ['slider', slider],
    ['date', date],
    ['time', time],
    ['autocomplete', autocomplete],
    ['cascader', region],
    ['upload', upload],
  ] as const) {
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height, `${name} touch height`).toBeGreaterThanOrEqual(44)
  }
  await expect(number.locator('..')).toHaveCSS('border-style', 'solid')

  if (testInfo.project.name.startsWith('mobile-')) await number.tap()
  else await number.focus()
  await number.press('ArrowUp')
  await expect(number).toHaveValue('4')
  await slider.focus()
  await slider.press('ArrowRight')
  await expect(slider).toHaveValue('43')

  await region.selectOption('cn')
  await expect(
    preview.getByRole('combobox', { name: '地区第2级' }),
  ).toBeVisible()
  await page.setViewportSize({ width: 360, height: 780 })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('one-time-code input supports entry, correction and touch-sized slots', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const group = preview.getByRole('group', { name: '一次性验证码' })
  const slots = group.getByRole('textbox', { name: /一次性验证码第/ })
  await expect(slots).toHaveCount(6)
  await expect(slots.first()).toHaveAttribute('inputmode', 'numeric')
  if (testInfo.project.name.startsWith('mobile')) await slots.first().tap()
  else await slots.first().click()
  await slots.first().fill('123456')
  await expect(preview.getByText('验证码已填写完整')).toBeVisible()
  await slots.last().press('Backspace')
  await expect(preview.getByText('已填写 5 / 6 位')).toBeVisible()
  const bounds = await slots.first().boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  await expect(
    preview
      .getByRole('group', { name: '不可用验证码' })
      .locator('input')
      .first(),
  ).toBeDisabled()
  await expect(
    preview.getByRole('group', { name: '错误验证码' }),
  ).toHaveAttribute('aria-invalid', 'true')
})

test('search and password inputs support keyboard, touch and status feedback', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const search = preview.getByRole('searchbox', { name: '搜索组件' })
  await search.fill('Tailwind')
  if (testInfo.project.name.startsWith('mobile')) {
    await search
      .locator('..')
      .getByRole('button', { name: '搜索', exact: true })
      .tap()
  } else {
    await search.press('Enter')
  }
  await expect(preview.getByText('已搜索：Tailwind')).toBeVisible()
  const clear = search.locator('..').getByRole('button', { name: '清空搜索' })
  if (testInfo.project.name.startsWith('mobile')) await clear.tap()
  else await clear.click()
  await expect(search).toHaveValue('')
  await expect(search).toBeFocused()

  const password = preview.getByLabel('登录密码')
  await expect(password).toHaveAttribute('type', 'password')
  const show = password.locator('..').getByRole('button', { name: '显示密码' })
  if (testInfo.project.name.startsWith('mobile')) await show.tap()
  else {
    await show.focus()
    await page.keyboard.press('Space')
  }
  await expect(password).toHaveAttribute('type', 'text')
  await expect(password).toHaveValue('example-123')
  const buttonBounds = await password
    .locator('..')
    .getByRole('button', { name: '隐藏密码' })
    .boundingBox()
  expect(buttonBounds).not.toBeNull()
  expect(buttonBounds!.width).toBeGreaterThanOrEqual(44)
  expect(buttonBounds!.height).toBeGreaterThanOrEqual(44)
  await expect(preview.getByLabel('不可用密码')).toBeDisabled()
  await expect(preview.getByLabel('错误密码')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
})

test('calendar selects dates with keyboard and touch without page overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const calendar = preview.getByRole('grid', { name: /活动日历/ })
  const activeDay = calendar.locator('button[tabindex="0"]')
  await expect(activeDay).toHaveCount(1)
  const bounds = await activeDay.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile')) await activeDay.tap()
  else {
    await activeDay.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
  }
  await expect(preview.getByText(/^已选择：\d{4}-\d{2}-\d{2}/)).toBeVisible()
  const previousLabel = await calendar.getAttribute('aria-label')
  const next = preview.getByRole('button', { name: '下个月' }).first()
  if (testInfo.project.name.startsWith('mobile')) await next.tap()
  else await next.click()
  await expect(calendar).not.toHaveAttribute('aria-label', previousLabel!)
  await expect(
    preview
      .getByRole('grid', { name: /不可用日历/ })
      .locator('button')
      .first(),
  ).toBeDisabled()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('mentions suggestions support keyboard, touch and narrow viewports', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const input = preview.getByRole('combobox', { name: '提及成员' })
  await input.scrollIntoViewIfNeeded()
  await input.fill('@de')
  const list = page.getByRole('listbox', { name: '提及建议' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('option', { name: '设计团队' })).toBeVisible()
  const choice = testInfo.project.name.startsWith('mobile-')
    ? '设计团队'
    : '开发团队'
  if (testInfo.project.name.startsWith('mobile-')) {
    await list.getByRole('option', { name: choice }).tap()
  } else {
    await input.press('ArrowDown')
    await input.press('Enter')
  }
  await expect(preview.getByText(`已选择：${choice}`)).toBeVisible()
  await expect(input).toHaveValue(
    choice === '设计团队' ? '@design ' : '@developer ',
  )
  await expect(input).toHaveAttribute('aria-expanded', 'false')

  await input.fill('@ops')
  const disabled = list.getByRole('option', { name: '运营团队' })
  await expect(disabled).toHaveAttribute('aria-disabled', 'true')
  const optionBounds = await disabled.boundingBox()
  expect(optionBounds).not.toBeNull()
  expect(optionBounds!.height).toBeGreaterThanOrEqual(44)
  expect(optionBounds!.x).toBeGreaterThanOrEqual(0)
  expect(optionBounds!.x + optionBounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
  await input.press('Escape')
  await expect(list).toHaveCount(0)
  await expect(
    preview.getByRole('combobox', { name: '不可用提及' }),
  ).toBeDisabled()
  await expect(
    preview.getByRole('combobox', { name: '错误提及' }),
  ).toHaveAttribute('aria-invalid', 'true')
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('splitter supports keyboard, pointer and touch controls without overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const splitter = preview.getByRole('group', { name: '工作区分隔面板' })
  const separator = splitter.getByRole('separator')
  await expect(separator).toHaveAttribute('aria-valuenow', '60')
  const bounds = await separator.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) {
    await splitter.getByRole('button', { name: '折叠导航区' }).tap()
    await expect(separator).toHaveAttribute('aria-valuenow', '0')
    await splitter.getByRole('button', { name: '展开导航区' }).tap()
    await expect(separator).toHaveAttribute('aria-valuenow', '60')
  } else {
    await separator.focus()
    await separator.press('ArrowLeft')
    await expect(separator).toHaveAttribute('aria-valuenow', '55')
    await separator.press('Home')
    await expect(separator).toHaveAttribute('aria-valuenow', '20')
    await separator.dblclick({ position: { x: bounds!.width / 2, y: 16 } })
    await expect(separator).toHaveAttribute('aria-valuenow', '60')
    const refreshed = await separator.boundingBox()
    expect(refreshed).not.toBeNull()
    await page.mouse.move(
      refreshed!.x + refreshed!.width / 2,
      refreshed!.y + 16,
    )
    await page.mouse.down()
    await page.mouse.move(
      refreshed!.x + refreshed!.width / 2 + 28,
      refreshed!.y + 16,
    )
    await page.mouse.up()
    await expect(separator).not.toHaveAttribute('aria-valuenow', '60')
  }
  const disabled = preview
    .getByRole('group', { name: '不可用的垂直分隔面板' })
    .getByRole('separator')
  await expect(disabled).toHaveAttribute('aria-disabled', 'true')
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('layout sider collapses responsively and restores focus after mobile navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const sider = preview.getByRole('complementary', { name: '示例导航' })
  if (testInfo.project.name.startsWith('mobile-')) {
    const trigger = preview.getByRole('button', { name: '展开示例导航' })
    await expect(sider).toHaveAttribute('data-broken', 'true')
    await trigger.tap()
    const sheet = page.getByRole('dialog', { name: '示例导航' })
    await expect(sheet).toBeVisible()
    await expect(
      sheet.getByRole('navigation', { name: '示例导航菜单' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(trigger).toBeFocused()
  } else {
    const collapse = preview.getByRole('button', { name: '收起示例导航' })
    await expect(sider).not.toHaveAttribute('data-broken')
    await collapse.click()
    await expect(sider).toHaveAttribute('data-collapsed', 'true')
    await preview.getByRole('button', { name: '展开示例导航' }).click()
    await expect(sider).not.toHaveAttribute('data-collapsed')
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(sider).toHaveAttribute('data-broken', 'true')
    await page.setViewportSize({ width: 768, height: 800 })
    await expect(sider).not.toHaveAttribute('data-broken')
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('masonry reflows uneven cards across container widths and dynamic updates', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const masonry = preview.getByRole('list', { name: '瀑布流卡片' })
  const cards = masonry.getByRole('listitem')
  await expect(cards).toHaveCount(7)

  const inspect = () =>
    masonry.evaluate((root) => {
      const bounds = root.getBoundingClientRect()
      const items = [...root.querySelectorAll('[role="listitem"]')].map(
        (item) => ({
          column: Number(item.getAttribute('data-column')),
          rect: item.getBoundingClientRect().toJSON(),
        }),
      )
      return {
        width: bounds.width,
        height: bounds.height,
        columns: [...new Set(items.map((item) => item.column))].length,
        inside: items.every(
          ({ rect }) =>
            rect.left >= bounds.left - 1 &&
            rect.right <= bounds.right + 1 &&
            rect.top >= bounds.top - 1 &&
            rect.bottom <= bounds.bottom + 1,
        ),
        overlap: items.some((first, index) =>
          items
            .slice(index + 1)
            .some(
              (second) =>
                first.rect.left < second.rect.right - 1 &&
                first.rect.right > second.rect.left + 1 &&
                first.rect.top < second.rect.bottom - 1 &&
                first.rect.bottom > second.rect.top + 1,
            ),
        ),
      }
    })

  await expect.poll(async () => (await inspect()).height).toBeGreaterThan(200)
  const initial = await inspect()
  expect(initial.inside).toBe(true)
  expect(initial.overlap).toBe(false)
  expect(initial.columns).toBe(
    initial.width >= 1024 ? 4 : initial.width >= 768 ? 3 : 2,
  )

  await cards
    .first()
    .locator('div')
    .evaluate((element) => ((element as HTMLElement).style.height = '320px'))
  await expect
    .poll(async () => (await inspect()).height)
    .toBeGreaterThan(initial.height + 20)
  await cards
    .first()
    .locator('div')
    .evaluate((element) =>
      (element as HTMLElement).style.removeProperty('height'),
    )
  await expect.poll(async () => (await inspect()).height).toBe(initial.height)

  const add = preview.getByRole('button', { name: '添加卡片' })
  if (testInfo.project.name.startsWith('mobile-')) await add.tap()
  else await add.click()
  await expect(cards).toHaveCount(8)
  await expect.poll(async () => (await inspect()).inside).toBe(true)
  expect((await inspect()).overlap).toBe(false)

  await page.setViewportSize({ width: 360, height: 800 })
  await expect.poll(async () => (await inspect()).columns).toBe(2)
  expect((await inspect()).overlap).toBe(false)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('spin overlays regions and full screen without trapping inactive content', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const status = page.getByRole('status', { name: '卡片加载中' })
  await expect(status).toBeVisible()
  const action = preview.getByRole('button', {
    name: '区域内操作',
    includeHidden: true,
  })
  await expect(action.locator('../..')).toHaveAttribute('inert')

  const stop = preview.getByRole('button', { name: '结束区域加载' })
  if (testInfo.project.name.startsWith('mobile-')) await stop.tap()
  else await stop.click()
  await expect(status).toHaveCount(0)
  await expect(action.locator('../..')).not.toHaveAttribute('inert')
  await action.click()

  const fullscreen = preview.getByRole('button', { name: '演示全屏加载' })
  if (testInfo.project.name.startsWith('mobile-')) await fullscreen.tap()
  else await fullscreen.click()
  await expect(page.getByRole('status', { name: '页面加载中' })).toBeVisible()
  await expect(page.getByRole('status', { name: '页面加载中' })).toHaveCount(
    0,
    { timeout: 3000 },
  )
})

test('spinner and spin share sizes and respect reduced motion', async ({
  page,
}) => {
  await page.goto('/__ui')
  const group = page.getByRole('group', { name: '加载指示器尺寸' })
  for (const [label, pixels] of [
    ['小号', 16],
    ['默认', 24],
    ['大号', 36],
  ] as const) {
    const standalone = group
      .getByRole('status', { name: `${label}独立加载` })
      .locator('[aria-hidden="true"]')
    const wrapped = group
      .getByRole('status', { name: `${label}区域加载` })
      .locator('[aria-hidden="true"]')
    for (const indicator of [standalone, wrapped]) {
      await expect(indicator).toHaveCSS('width', `${pixels}px`)
      await expect(indicator).toHaveCSS('height', `${pixels}px`)
    }
    expect(await standalone.evaluate((el) => getComputedStyle(el).color)).toBe(
      await wrapped.evaluate((el) => getComputedStyle(el).color),
    )
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(
    group
      .getByRole('status', { name: '默认独立加载' })
      .locator('[aria-hidden="true"]'),
  ).toHaveCSS('animation-name', 'none')
  await expect(
    group
      .getByRole('status', { name: '默认区域加载' })
      .locator('[aria-hidden="true"]'),
  ).toHaveCSS('animation-name', 'none')
})

test('watermark follows theme and keeps covered controls touchable', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const watermark = preview.getByRole('group', { name: '水印示例' })
  const overlay = watermark.locator('[data-watermark-overlay]')
  await expect(overlay).toBeVisible()
  await expect(overlay).toHaveCSS('pointer-events', 'none')
  const textPattern = await overlay.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  )
  expect(textPattern).toContain('data:image/png')

  const innerAction = watermark.getByRole('button', { name: '水印内操作' })
  if (testInfo.project.name.startsWith('mobile-')) await innerAction.tap()
  else await innerAction.click()
  const imageSwitch = preview.getByRole('button', { name: '显示图片水印' })
  if (testInfo.project.name.startsWith('mobile-')) await imageSwitch.tap()
  else await imageSwitch.click()
  await expect
    .poll(() =>
      overlay.evaluate((element) => getComputedStyle(element).backgroundImage),
    )
    .not.toBe(textPattern)

  await preview.getByRole('button', { name: '显示文字水印' }).click()
  await expect
    .poll(() =>
      overlay.evaluate((element) => getComputedStyle(element).backgroundImage),
    )
    .toBe(textPattern)
  await preview.getByRole('button', { name: '切换预览主题' }).click()
  await expect
    .poll(() =>
      overlay.evaluate((element) => getComputedStyle(element).backgroundImage),
    )
    .not.toBe(textPattern)

  await overlay.evaluate((element) => element.remove())
  await expect(overlay).toBeVisible()
})

test('tour highlights targets and supports keyboard, close and touch navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '开始引导' })
  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()
  const tour = page.getByRole('dialog', { name: '上传素材' })
  await expect(tour).toBeVisible()
  await expect(page.locator('[data-tour-mask]')).toHaveCount(4)
  await expect(page.locator('[data-tour-card]')).toHaveCSS('position', 'fixed')
  await expect(preview.locator('#tour-upload')).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('dialog', { name: '保存草稿' })).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog', { name: '上传素材' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '上传素材' })).toHaveCount(0)
  await expect(begin).toBeFocused()

  if (testInfo.project.name.startsWith('mobile-')) await begin.tap()
  else await begin.click()
  const next = page.getByRole('button', { name: '下一步' })
  for (let index = 0; index < 2; index += 1) {
    if (testInfo.project.name.startsWith('mobile-')) await next.tap()
    else await next.click()
  }
  const finish = page
    .getByRole('dialog', { name: '发布内容' })
    .getByRole('button', { name: '完成' })
  if (testInfo.project.name.startsWith('mobile-')) await finish.tap()
  else await finish.click()
  await expect(page.getByRole('dialog', { name: '发布内容' })).toHaveCount(0)
})

test('qrcode renders in the design system and supports expired refresh on touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const qr = preview.locator('[data-qrcode-type="svg"]')
  await expect(qr).toBeVisible()
  await expect(
    qr.getByRole('img', { name: 'Ant Design 文档二维码' }),
  ).toBeVisible()

  const expire = preview.getByRole('button', { name: '模拟失效' })
  if (testInfo.project.name.startsWith('mobile-')) await expire.tap()
  else await expire.click()
  await expect(preview.getByText('二维码已失效')).toBeVisible()
  const refresh = preview.getByRole('button', { name: '刷新' })
  if (testInfo.project.name.startsWith('mobile-')) await refresh.tap()
  else await refresh.click()
  await expect(preview.getByText('二维码已失效')).toHaveCount(0)
})

test('listy keeps a bounded DOM window while scrolling on narrow layouts', async ({
  page,
}) => {
  await page.goto('/__ui')
  const list = page.getByRole('list', { name: '虚拟任务列表' })
  await expect(list).toBeVisible()
  const initialCount = await list.getByRole('listitem').count()
  expect(initialCount).toBeLessThan(20)
  await list.evaluate((element) => {
    element.scrollTop = 52 * 50
    element.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  await expect(list.getByText('虚拟列表项目 51')).toBeVisible()
  expect(await list.getByRole('listitem').count()).toBeLessThan(20)
})

test('border beam keeps content accessible and stops motion when requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
  const beam = page.locator('[data-border-beam]').first()
  await expect(beam).toBeVisible()
  await expect(beam.getByText('内容区域保持正常键盘和触控交互。')).toBeVisible()
  await expect(beam.locator('[data-border-beam-light]')).toHaveCSS(
    'animation-name',
    'none',
  )
})

test('tree select searches collapsed branches with keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const trigger = preview.getByRole('combobox', {
    name: '团队选择',
    exact: true,
  })
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else {
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
  }
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const search = page.getByRole('searchbox', { name: '搜索团队选择' })
  await search.fill('用户研究')
  const result = page.getByRole('treeitem', { name: '用户研究组' })
  await expect(result).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) await result.tap()
  else {
    await search.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  }
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toContainText('用户研究组')
  await expect(trigger).toHaveCSS('min-height', '44px')
})

test('transfer moves filtered choices with keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const transfer = preview.getByRole('group', { name: '模块分配' })
  const source = transfer.getByRole('region', { name: '可用模块' })
  const target = transfer.getByRole('region', { name: '已启用模块' })
  const design = source.getByRole('checkbox', { name: /设计规范/ })
  const move = transfer.getByRole('button', { name: '移至已启用模块' })
  await expect(
    source.getByRole('checkbox', { name: '归档模块' }),
  ).toBeDisabled()

  if (testInfo.project.name.startsWith('mobile-')) {
    await design.locator('..').tap()
    await move.tap()
  } else {
    await design.focus()
    await page.keyboard.press('Space')
    await move.focus()
    await page.keyboard.press('Enter')
  }
  await expect(target.getByRole('checkbox', { name: /设计规范/ })).toBeVisible()

  await source.getByRole('searchbox', { name: '搜索可用模块' }).fill('音频')
  const selectAll = source.getByRole('checkbox', {
    name: '全选可用模块可见项',
  })
  if (testInfo.project.name.startsWith('mobile-'))
    await selectAll.locator('..').tap()
  else await selectAll.check()
  if (testInfo.project.name.startsWith('mobile-')) await move.tap()
  else await move.click()
  await expect(target.getByRole('checkbox', { name: /音频预览/ })).toBeVisible()

  await preview.getByRole('button', { name: '禁用穿梭框' }).click()
  await expect(
    target.getByRole('checkbox', { name: /音频预览/ }),
  ).toBeDisabled()
  await expect(move).toBeDisabled()
  const row = await target
    .getByRole('checkbox', { name: /音频预览/ })
    .locator('..')
    .boundingBox()
  expect(row?.height).toBeGreaterThanOrEqual(44)
})

test('keyboard controls retain focus and expose data states', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.goto('/__ui')

  const select = page.getByRole('combobox', { name: '分类' })
  await select.click()
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toContainText(/设计|开发/)

  const dialogTrigger = page.getByRole('button', { name: '打开对话框' })
  await dialogTrigger.click()
  await expect(page.getByRole('dialog', { name: '确认操作' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(dialogTrigger).toBeFocused()

  await page.getByRole('button', { name: '普通提示' }).click()
  await expect(page.getByText('信息提示')).toBeVisible()
  await page.getByRole('button', { name: '警告提示' }).click()
  await expect(page.getByText('需要注意')).toBeVisible()

  await page.getByRole('tab', { name: '总览' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: '详细内容' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await page.getByRole('button', { name: '错误', exact: true }).click()
  await expect(
    page.getByRole('region', { name: '导航与数据' }).getByRole('alert'),
  ).toHaveCount(2)
  await page
    .getByRole('region', { name: '导航与数据' })
    .getByRole('button', { name: '重试' })
    .first()
    .click()
  await expect(page.getByRole('list', { name: '示例任务' })).toBeVisible()
})

test('file selection, cancellation and retry work in the preview', async ({
  page,
}) => {
  await page.goto('/__ui')
  const input = page
    .getByRole('region', { name: '文件能力' })
    .locator('input[type=file]')
    .first()

  await input.setInputFiles({
    name: 'note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('unsupported'),
  })
  await expect(
    page.getByRole('region', { name: '文件能力' }).getByRole('alert'),
  ).toContainText('文件类型不受支持')

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
    'base64',
  )
  await input.setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(
    page.getByRole('img', { name: '文件预览：photo.png' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '开始上传' }).click()
  await expect(page.getByText('文件上传：正在上传')).toBeVisible()
  await page.getByRole('button', { name: '取消上传' }).click()
  await expect(page.getByText('文件上传：已取消上传')).toBeVisible()
  await page.getByRole('button', { name: '重试上传' }).click()
  await expect(page.getByText('文件上传：上传完成')).toBeVisible({
    timeout: 5_000,
  })
})

test('AI tasks show progress, cancellation, failure and retry', async ({
  page,
}) => {
  await page.goto('/__ui')
  const ai = page.getByRole('region', { name: 'AI 任务能力' })
  const prompt = ai.getByRole('textbox', { name: '任务描述' })
  const submit = ai.getByRole('button', { name: '提交任务' })

  await prompt.fill('生成一份摘要')
  await submit.click()
  await expect(
    ai.getByRole('status', { name: '任务状态：已完成' }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(ai.getByText('任务已完成')).toBeVisible()

  await prompt.fill('失败任务')
  await submit.click()
  await expect(ai.getByRole('status', { name: '任务状态：失败' })).toBeVisible({
    timeout: 5_000,
  })
  await expect(ai.getByText('Mock 任务失败，请重试')).toBeVisible()
  await ai.getByRole('button', { name: '重试任务' }).click()
  await expect(
    ai.getByRole('status', { name: '任务状态：已完成' }),
  ).toBeVisible({ timeout: 5_000 })

  await prompt.fill('取消任务')
  await submit.click()
  await ai.getByRole('button', { name: '取消任务' }).click()
  await expect(
    ai.getByRole('status', { name: '任务状态：已取消' }),
  ).toBeVisible({ timeout: 5_000 })
})

test('AI conversation workbench streams, cancels and retries messages', async ({
  page,
}, testInfo) => {
  const activate = async (locator: ReturnType<typeof page.getByRole>) => {
    if (testInfo.project.name.startsWith('mobile-')) await locator.tap()
    else await locator.click()
  }
  await page.goto('/__ui')
  const chat = page.getByRole('region', { name: 'AI 对话工作台' })
  await expect(
    chat.getByRole('heading', { name: '你好，我是 AI 助手' }),
  ).toBeVisible()

  const composer = chat.getByRole('textbox', { name: '发送消息' })
  await composer.fill('整理一份摘要')
  await composer.press('Enter')
  await expect(chat.getByText('AI 正在思考')).toBeVisible()
  await expect(chat.getByText(/Mock 流式回复/)).toBeVisible({ timeout: 5_000 })

  await composer.fill('失败')
  await composer.press('Enter')
  await expect(chat.getByRole('alert').first()).toContainText('Mock 对话失败', {
    timeout: 5_000,
  })
  await activate(chat.getByRole('button', { name: '重试' }))
  await expect(chat.getByText(/Mock 流式回复/).last()).toBeVisible({
    timeout: 5_000,
  })

  await composer.fill('取消这次生成')
  await composer.press('Enter')
  await activate(chat.getByRole('button', { name: '停止生成' }))
  await expect(chat.getByText('已取消生成')).toBeVisible({ timeout: 5_000 })
})

test('video player supports playback, touch controls and media errors', async ({
  page,
}, testInfo) => {
  const activate = async (locator: ReturnType<typeof page.getByRole>) => {
    if (testInfo.project.name.startsWith('mobile-')) await locator.tap()
    else await locator.click()
  }
  await page.goto('/__ui')
  const player = page.getByRole('region', { name: '视频能力示例' })
  await expect(player).toBeVisible()
  await expect(player.getByRole('status')).toHaveText(/视频已就绪/, {
    timeout: 5_000,
  })

  await activate(player.getByRole('button', { name: '播放视频' }))
  await expect(player.getByRole('button', { name: '暂停视频' })).toBeVisible()
  if (await player.getByRole('button', { name: '暂停视频' }).isVisible())
    await activate(player.getByRole('button', { name: '暂停视频' }))
  const seek = player.getByRole('slider', { name: /视频进度/ })
  const seekBox = await seek.boundingBox()
  expect(seekBox).not.toBeNull()
  await seek.click({
    position: { x: seekBox!.width / 2, y: seekBox!.height / 2 },
  })
  await expect
    .poll(async () => Number(await seek.inputValue()))
    .toBeGreaterThan(0.5)
  await seek.focus()
  await page.keyboard.press('ArrowLeft')
  await expect.poll(async () => Number(await seek.inputValue())).toBeLessThan(1)
  await activate(player.getByRole('button', { name: '静音视频' }))
  await expect(player.getByRole('button', { name: '取消静音' })).toBeVisible()

  await activate(page.getByRole('button', { name: '演示媒体错误' }))
  const errorPlayer = page.getByRole('region', { name: '错误视频示例' })
  await expect(errorPlayer.getByRole('alert')).toContainText('视频')
  await expect(
    errorPlayer.getByRole('button', { name: '重试播放' }),
  ).toBeVisible()

  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  }
})

test('audio player supports playback, seeking and error retry', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const player = page.getByRole('region', { name: '音频能力示例' })
  await expect(player.getByRole('status')).toHaveText(/音频已就绪/, {
    timeout: 5_000,
  })
  const play = player.getByRole('button', { name: '播放音频' })
  if (testInfo.project.name.startsWith('mobile-')) await play.tap()
  else await play.click()
  await expect(player.getByRole('button', { name: '暂停音频' })).toBeVisible()
  await player.getByRole('button', { name: '暂停音频' }).click()
  const seek = player.getByRole('slider', { name: /音频进度/ })
  await seek.fill('1')
  await expect(seek).toHaveValue('1')
  await expect
    .poll(() =>
      player
        .locator('audio')
        .evaluate((audio: HTMLAudioElement) => audio.currentTime),
    )
    .toBeGreaterThan(0.9)
  await page.getByRole('button', { name: '演示音频错误' }).click()
  const errorPlayer = page.getByRole('region', { name: '错误音频示例' })
  await expect(errorPlayer.getByRole('alert')).toContainText('音频')
  await expect(
    errorPlayer.getByRole('button', { name: '重试播放' }),
  ).toBeVisible()
})

test('mock workflow connects upload, task retry, cancellation and media preview', async ({
  page,
}) => {
  await page.goto('/__ui')
  const flow = page.getByRole('group', { name: '完整 Mock 示例流程' })
  const input = flow.locator('input[type=file]')
  await input.setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await expect(
    flow.getByRole('img', { name: '文件预览：photo.png' }),
  ).toBeVisible()
  await flow.getByRole('button', { name: '开始流程上传' }).click()
  await flow.getByRole('button', { name: '取消上传' }).click()
  await expect(flow.getByText('流程文件上传：已取消上传')).toBeVisible()
  await flow.getByRole('button', { name: '重试上传' }).click()
  await expect(flow.getByText('流程文件上传：上传完成')).toBeVisible({
    timeout: 5_000,
  })

  await flow.getByRole('textbox', { name: '任务描述' }).fill('失败任务')
  await flow.getByRole('button', { name: '提交任务' }).click()
  await expect(
    flow.getByRole('status', { name: '任务状态：失败' }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(flow.getByText('任务未完成，请重试后预览。')).toBeVisible()
  await flow.getByRole('button', { name: '重试任务' }).click()
  await expect(
    flow.getByRole('status', { name: '任务状态：已完成' }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(flow.getByRole('region', { name: '流程视频结果' })).toBeVisible()
  await flow.getByRole('button', { name: '音频结果' }).click()
  await expect(flow.getByRole('region', { name: '流程音频结果' })).toBeVisible()

  await flow.getByRole('textbox', { name: '任务描述' }).fill('取消任务')
  await flow.getByRole('button', { name: '提交任务' }).click()
  await flow.getByRole('button', { name: '取消任务' }).click()
  await expect(
    flow.getByRole('status', { name: '任务状态：已取消' }),
  ).toBeVisible()
  await expect(flow.getByText('任务未完成，请重试后预览。')).toBeVisible()
})

test('mobile controls are touchable without horizontal overflow', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'))
  await page.goto('/__ui')
  await page.getByRole('button', { name: '普通提示' }).tap()
  await expect
    .poll(() =>
      page
        .locator('[data-sonner-toaster]')
        .first()
        .evaluate((element) =>
          element.style.getPropertyValue('--mobile-offset-bottom'),
        ),
    )
    .toContain('safe-area-inset-bottom')
  await page.getByRole('button', { name: '打开面板' }).tap()
  await expect(page.getByRole('dialog', { name: '详情面板' })).toBeVisible()
  await page.getByRole('button', { name: '关闭面板' }).tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '选择文件', exact: true }).tap()
  const chooser = await chooserPromise
  await chooser.setFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await expect(
    page.getByRole('img', { name: '文件预览：photo.png' }),
  ).toBeVisible()

  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  }
  await page.setViewportSize({ width: 360, height: 844 })

  const geometry = await page.evaluate(() => ({
    overflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    smallTargets: [
      ...document.querySelectorAll(
        'button,[role=combobox],[role=tab],label:has(input[type="checkbox"]),label:has(input[type="radio"]),.ui-segmented__option,.ui-rate__option,.ui-color-picker__input',
      ),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !element.hasAttribute('disabled') &&
          !element.querySelector('input:disabled') &&
          (rect.width < 44 || rect.height < 44)
        )
      })
      .map((element) => element.textContent?.trim()),
  }))
  expect(geometry).toEqual({ overflow: false, smallTargets: [] })
})

test('extended navigation and feedback components expose responsive semantics', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const breadcrumb = preview.getByRole('navigation', { name: '面包屑导航' })
  const steps = preview.getByRole('navigation', { name: '步骤进度' })
  await expect(breadcrumb).toBeVisible()
  await expect(steps).toBeVisible()
  await expect(
    preview.getByRole('progressbar', { name: '进度' }),
  ).toHaveAttribute('aria-valuenow', '50')

  const details = preview.getByRole('button', { name: '实现说明' })
  await expect(details).toHaveAttribute('aria-expanded', 'true')
  if (testInfo.project.name.startsWith('mobile-')) {
    await details.tap()
    await preview.getByRole('button', { name: '标记完成' }).tap()
  } else {
    await details.click()
    await preview.getByRole('button', { name: '标记完成' }).click()
  }
  await expect(details).toHaveAttribute('aria-expanded', 'false')
  await expect(
    preview.getByRole('progressbar', { name: '进度' }),
  ).toHaveAttribute('aria-valuenow', '100')
  await expect(
    preview.getByRole('heading', { name: '流程已完成' }),
  ).toBeVisible()

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})

test('descriptions reflow and avatar sizes remain stable across viewports', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const owner = preview.getByText('负责人', { exact: true })
  const status = preview.getByText('状态', { exact: true })
  const avatar = preview.getByRole('img', { name: '团队成员' })
  const smallAvatar = preview.getByRole('img', { name: '方形头像' })

  await expect(avatar).toHaveCSS('width', '40px')
  await expect(smallAvatar).toHaveCSS('width', '32px')
  const ownerBox = await owner.boundingBox()
  const statusBox = await status.boundingBox()
  expect(ownerBox).not.toBeNull()
  expect(statusBox).not.toBeNull()
  if (testInfo.project.name.startsWith('mobile-')) {
    expect(statusBox!.y).toBeGreaterThan(ownerBox!.y)
  } else {
    expect(Math.abs(statusBox!.y - ownerBox!.y)).toBeLessThan(2)
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('vertical tabs place content beside triggers and support keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const navigation = page.getByRole('region', { name: '导航与数据' })
  const tabs = navigation.getByRole('tablist', { name: '垂直预览分组' })
  const first = tabs.getByRole('tab', { name: '概览' })
  const second = tabs.getByRole('tab', { name: '细节' })
  const content = navigation.getByRole('tabpanel', { name: '概览' })

  await expect(tabs).toHaveAttribute('aria-orientation', 'vertical')
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await expect(content).toContainText('使用上下方向键或触控切换垂直分组。')

  const listBox = await tabs.boundingBox()
  const contentBox = await content.boundingBox()
  expect(listBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(listBox!.x + listBox!.width).toBeLessThanOrEqual(contentBox!.x + 1)

  if (testInfo.project.name.startsWith('mobile-')) {
    await second.tap()
  } else {
    await first.focus()
    await page.keyboard.press('ArrowDown')
    await expect(second).toBeFocused()
  }
  await expect(second).toHaveAttribute('aria-selected', 'true')
  await expect(
    navigation.getByRole('tabpanel', { name: '细节' }),
  ).toContainText('窄屏仍保留左侧选项与右侧内容。')
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('anchor follows page sections with keyboard and touch navigation', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const anchor = preview.getByRole('navigation', { name: '页内导航' })
  const timeline = anchor.getByRole('link', { name: '时间线' })
  const result = anchor.getByRole('link', { name: '结果' })
  await expect(timeline).toHaveAttribute('aria-current', 'location')
  if (testInfo.project.name.startsWith('mobile-')) await result.tap()
  else {
    await result.focus()
    await page.keyboard.press('Enter')
  }
  await expect(result).toHaveAttribute('aria-current', 'location')
  await page
    .locator('#preview-timeline')
    .evaluate((element) => element.scrollIntoView({ block: 'start' }))
  await expect(timeline).toHaveAttribute('aria-current', 'location')
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('uncontrolled vertical steps support keyboard and touch changes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const steps = preview.getByRole('navigation', { name: '非受控垂直步骤' })
  const first = steps.getByRole('button', { name: '收集信息' })
  const second = steps.getByRole('button', { name: '确认内容' })
  const disabled = steps.getByRole('button', { name: '暂不可用' })
  await expect(first.locator('..')).toHaveAttribute('aria-current', 'step')
  await expect(disabled).toBeDisabled()
  if (testInfo.project.name.startsWith('mobile-')) await second.tap()
  else {
    await second.focus()
    await page.keyboard.press('Enter')
  }
  await expect(second.locator('..')).toHaveAttribute('aria-current', 'step')
  await expect(preview.getByText('最近切换：第 2 步')).toBeVisible()
})

test('carousel exposes rotation controls and pauses on touch or focus', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const carousel = preview.getByRole('region', { name: '轮播内容' })
  await expect(carousel).toBeVisible()
  const enable = preview.getByRole('button', { name: '启用自动轮播' })
  if (testInfo.project.name.startsWith('mobile-')) await enable.tap()
  else await enable.click()
  const pause = carousel.getByRole('button', { name: '停止自动播放' })
  await expect(pause).toBeVisible()
  await expect(carousel.locator('.ui-carousel__status')).toHaveAttribute(
    'aria-live',
    'off',
  )
  if (testInfo.project.name.startsWith('mobile-')) await pause.tap()
  else await pause.focus()
  await expect(
    carousel.getByRole('button', { name: '开始自动播放' }),
  ).toBeVisible()
  await expect(carousel.locator('.ui-carousel__status')).toHaveAttribute(
    'aria-live',
    'polite',
  )
})

test('menu exposes nested expansion and selected state', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const menu = page.getByRole('navigation', { name: '主导航' })
  const settings = menu.getByRole('menuitem', { name: '设置' })
  await expect(menu.getByRole('menuitem', { name: '概览' })).toHaveAttribute(
    'tabindex',
    '0',
  )
  await expect(settings).toHaveAttribute('tabindex', '-1')
  if (testInfo.project.name.startsWith('mobile-')) {
    await settings.tap()
    await expect(settings).toHaveAttribute('aria-expanded', 'true')
    await expect(settings).toHaveAttribute('aria-selected', 'true')
    await expect(menu.getByRole('menuitem', { name: '主题' })).toBeVisible()
  } else {
    await settings.focus()
    await page.keyboard.press('ArrowRight')
    await expect(settings).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    const theme = menu.getByRole('menuitem', { name: '主题' })
    await expect(theme).toBeFocused()
    await expect(theme).toHaveAttribute('tabindex', '0')
    await expect(settings).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('ArrowLeft')
    await expect(settings).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(settings).toHaveAttribute('aria-selected', 'true')
  }
})

test('tree uses one tab stop and supports keyboard and touch expansion', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const tree = page.getByRole('tree', { name: '树形导航' })
  const root = tree.getByRole('treeitem', { name: '组件' })
  const input = tree.getByRole('treeitem', { name: 'Input' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await input.tap()
    await expect(input).toHaveAttribute('aria-selected', 'true')
    await root.locator('[data-tree-toggle]').tap()
    await expect(root).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveCount(0)
  } else {
    await root.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(input).toBeFocused()
    expect(
      await input
        .locator('.ui-tree__label')
        .evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('solid')
    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(root).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(root).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('ArrowRight')
    await expect(root).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(root).not.toBeFocused()
    await expect(input).not.toBeFocused()
    await root.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await expect(input).toBeFocused()
    await page
      .getByRole('button', { name: '切换树展开' })
      .evaluate((element) => (element as HTMLButtonElement).click())
    await expect(root).toBeFocused()
    await expect(root).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('Tab')
    await expect(root).not.toBeFocused()
  }
})

test('overlay components keep focus, touch and safe-area behavior', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const openMenu = preview.getByRole('button', { name: '打开菜单' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await openMenu.tap()
  } else {
    await openMenu.click()
  }
  await expect(preview.getByRole('menu', { name: '菜单' })).toBeVisible()
  const firstMenuItem = preview.getByRole('menuitem', { name: '复制内容' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await firstMenuItem.tap()
  } else {
    await firstMenuItem.click()
  }

  const popoverTrigger = preview.getByRole('button', { name: '查看说明' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await popoverTrigger.tap()
  } else {
    await popoverTrigger.click()
  }
  await expect(
    page.getByRole('dialog').filter({ hasText: '必要信息会直接展示' }),
  ).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) {
    await popoverTrigger.tap()
  } else {
    await popoverTrigger.click()
  }

  const tooltipTrigger = preview.getByRole('button', { name: '悬停或聚焦提示' })
  await tooltipTrigger.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) {
    await preview.getByRole('button', { name: '通知示例' }).tap()
  } else {
    await preview.getByRole('button', { name: '通知示例' }).click()
  }
  await expect(page.getByText('通知已发送')).toBeVisible()

  const confirmTrigger = preview.getByRole('button', { name: '确认操作' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await confirmTrigger.tap()
  } else {
    await confirmTrigger.click()
  }
  await expect(page.getByRole('dialog', { name: '确认删除？' })).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) {
    await page.getByRole('button', { name: '取消' }).tap()
  } else {
    await page.getByRole('button', { name: '取消' }).click()
  }
  await expect(page.getByRole('dialog', { name: '确认删除？' })).toHaveCount(0)
  await expect(preview.getByRole('button', { name: '回到顶部' })).toBeVisible()
})

test('RTL portal controls keep direction and logical option placement', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const demo = preview.getByRole('group', { name: 'RTL 弹层预览' })
  const popupRoot = preview.locator('[data-ui-rtl-popup-root]')
  const select = demo.getByRole('combobox', { name: 'RTL 选择' })
  await expect(select).toHaveAttribute('dir', 'rtl')
  if (testInfo.project.name.startsWith('mobile-')) await select.tap()
  else await select.click()
  const content = popupRoot.locator('[data-ui-select-content]')
  await expect(content).toHaveAttribute('dir', 'rtl')
  await expect(content).toHaveCSS('direction', 'rtl')
  const first = content.getByRole('option', { name: 'RTL 第一项' })
  const firstBox = await first.boundingBox()
  const indicatorBox = await first.locator('svg').boundingBox()
  expect(firstBox).not.toBeNull()
  expect(indicatorBox).not.toBeNull()
  expect(indicatorBox!.x).toBeLessThan(firstBox!.x + firstBox!.width / 2)
  if (testInfo.project.name.startsWith('mobile-'))
    await content.getByRole('option', { name: 'RTL 第二项' }).tap()
  else {
    await expect(first).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      content.getByRole('option', { name: 'RTL 第二项' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
  }
  await expect(select).toContainText('RTL 第二项')

  const openDialog = demo.getByRole('button', { name: '打开 RTL 对话框' })
  if (testInfo.project.name.startsWith('mobile-')) await openDialog.tap()
  else await openDialog.click()
  const dialog = popupRoot.getByRole('dialog', { name: 'RTL 对话框' })
  await expect(dialog).toHaveAttribute('dir', 'rtl')
  await expect(dialog).toHaveCSS('direction', 'rtl')
  await dialog.getByRole('button', { name: '关闭对话框' }).click()

  const openSheet = demo.getByRole('button', { name: '打开 RTL 面板' })
  if (testInfo.project.name.startsWith('mobile-')) await openSheet.tap()
  else await openSheet.click()
  const sheet = popupRoot.getByRole('dialog', { name: 'RTL 面板' })
  await expect(sheet).toHaveAttribute('dir', 'rtl')
  await expect(sheet).toHaveCSS('direction', 'rtl')
  await sheet.getByRole('button', { name: '关闭面板' }).click()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
