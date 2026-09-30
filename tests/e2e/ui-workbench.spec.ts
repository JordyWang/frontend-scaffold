import { expect, test } from '@playwright/test'

test('page shell keeps safe padding and the skip link is keyboard reachable', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.goto('/__ui')
  const skip = page.getByRole('link', { name: '跳到主要内容' })
  await expect(skip).toBeAttached()
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    const padding = await page.locator('main').evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        left: Number.parseFloat(style.paddingLeft),
        right: Number.parseFloat(style.paddingRight),
      }
    })
    expect(padding.left).toBeGreaterThanOrEqual(16)
    expect(padding.right).toBeGreaterThanOrEqual(16)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
})

test('pagination changes page size and jumps to a valid page on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const section = page.getByRole('region', { name: '导航与数据' })
  const pagination = section.getByRole('navigation', { name: '分页' })
  const size = pagination.getByRole('combobox', { name: '每页条数' })
  const input = pagination.getByRole('textbox', { name: '目标页码' })
  const jump = pagination.getByRole('button', { name: '前往', exact: true })
  await expect(pagination.getByText('第 1–10 条，共 135 条')).toBeVisible()
  for (const control of [size, input, jump]) {
    const box = await control.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  await input.fill('99')
  if (testInfo.project.name.startsWith('mobile-')) await jump.tap()
  else await jump.click()
  await expect(pagination.getByRole('alert')).toContainText('请输入 1–14 页')
  await input.fill('3')
  await input.press('Enter')
  await expect(
    pagination.getByRole('button', { name: '前往第 3 页' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(pagination.getByText('第 21–30 条，共 135 条')).toBeVisible()

  const twenty = page.getByRole('option', { name: '20 条/页' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await size.tap()
    await twenty.tap()
  } else {
    await size.focus()
    await size.press('ArrowDown')
    await expect(twenty).toBeVisible()
    await twenty.focus()
    await twenty.press('Enter')
  }
  await expect(size).toContainText('20 条/页')
  await expect(
    pagination.getByRole('button', { name: '前往第 2 页' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(pagination.getByText('第 21–40 条，共 135 条')).toBeVisible()
  await expect(section.getByRole('button', { name: '加载更多' })).toBeEnabled()
  await page.setViewportSize({ width: 360, height: 780 })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('table sorting stays available in desktop headers and mobile cards', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const section = page.getByRole('region', { name: '导航与数据' })
  const table = section.getByRole('region', { name: '示例任务表' })
  const mobile = testInfo.project.name.startsWith('mobile-')
  const sort = table.getByRole('button', { name: /按任务排序/ })
  const names = () =>
    mobile
      ? table
          .getByRole('list', { name: '示例任务表' })
          .getByRole('listitem')
          .locator('strong')
          .allTextContents()
      : table
          .getByRole('table')
          .locator('tbody tr td:nth-child(2)')
          .allTextContents()
  await expect.poll(names).toHaveLength(3)
  const original = await names()
  const sortBox = await sort.boundingBox()
  expect(sortBox!.width).toBeGreaterThanOrEqual(44)
  expect(sortBox!.height).toBeGreaterThanOrEqual(44)
  if (mobile) await sort.tap()
  else {
    await sort.focus()
    await sort.press('Enter')
  }
  const ascending = await names()
  expect(ascending).toEqual(
    [...original].sort((left, right) => left.localeCompare(right, 'zh-CN')),
  )
  if (mobile) await expect(sort).toHaveAttribute('aria-pressed', 'true')
  else
    await expect(table.locator('th[aria-sort]').first()).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  if (mobile) await sort.tap()
  else await sort.press('Enter')
  await expect.poll(names).toEqual([...ascending].reverse())
  if (mobile) await sort.tap()
  else await sort.press('Enter')
  await expect.poll(names).toEqual(original)
})

test('table selection supports partial, all and disabled rows on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const table = page
    .getByRole('region', { name: '导航与数据' })
    .getByRole('region', { name: '示例任务表' })
  const all = table.getByRole('checkbox', {
    name: '全选示例任务表当前可选行',
  })
  const first = table.getByRole('checkbox', { name: '选择设计变量' })
  const second = table.getByRole('checkbox', { name: '选择组件预览' })
  const disabled = table.getByRole('checkbox', { name: '选择触控检查' })
  await expect(all).toBeVisible()
  await expect(all).toHaveJSProperty('indeterminate', true)
  const mark = all.locator('..').locator('span').first()
  const check = mark.locator('span').first()
  const dash = mark.locator('span').last()
  await expect(dash).toHaveCSS('opacity', '1')
  await expect(second).toBeChecked()
  await expect(disabled).toBeDisabled()
  const touchTarget = await all.locator('..').boundingBox()
  expect(touchTarget!.width).toBeGreaterThanOrEqual(44)
  expect(touchTarget!.height).toBeGreaterThanOrEqual(44)
  const mobile = testInfo.project.name.startsWith('mobile-')
  if (mobile) await all.locator('..').tap()
  else {
    await all.focus()
    await all.press('Space')
  }
  await expect(all).toHaveJSProperty('indeterminate', false)
  await expect(dash).toHaveCSS('opacity', '0')
  await expect(check).toHaveCSS('opacity', '1')
  await expect(first).toBeChecked()
  await expect(second).toBeChecked()
  await expect(table.getByText('已选 2 项')).toBeVisible()
  if (mobile) await second.locator('..').tap()
  else await second.press('Space')
  await expect(all).toHaveJSProperty('indeterminate', true)
  await expect(table.getByText('已选 1 项')).toBeVisible()
  if (mobile) await all.locator('..').tap()
  else await all.press('Space')
  await expect(table.getByText('已选 2 项')).toBeVisible()
  if (mobile) await all.locator('..').tap()
  else await all.press('Space')
  await expect(table.getByText('已选 0 项')).toBeVisible()
  await expect(disabled).not.toBeChecked()
  if (mobile) {
    await page.setViewportSize({ width: 360, height: 780 })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
})

test('checkbox and radio marks remain visible after selection', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const checkbox = preview.getByRole('checkbox', { name: '同意更新通知' })
  const choice = preview.getByRole('group', { name: '展示方式' })
  const list = choice.getByRole('radio', { name: '列表' })
  const grid = choice.getByRole('radio', { name: '网格' })
  const mark = (input: typeof checkbox) =>
    input.locator('..').locator('span').first().locator('span').first()
  await expect(list).toBeChecked()
  await expect(mark(list)).toHaveCSS('opacity', '1')
  await expect(mark(grid)).toHaveCSS('opacity', '0')
  const mobile = testInfo.project.name.startsWith('mobile-')
  if (mobile) await grid.locator('..').tap()
  else await grid.locator('..').click()
  await expect(grid).toBeChecked()
  await expect(mark(grid)).toHaveCSS('opacity', '1')
  await expect(mark(list)).toHaveCSS('opacity', '0')
  if (mobile) await checkbox.locator('..').tap()
  else await checkbox.locator('..').click()
  await expect(checkbox).toBeChecked()
  await expect(mark(checkbox)).toHaveCSS('opacity', '1')
})

test('table filters rows with keyboard, touch and focus restoration', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const table = page
    .getByRole('region', { name: '导航与数据' })
    .getByRole('region', { name: '示例任务表' })
  const triggers = table.getByRole('button', { name: /^筛选状态/ })
  const trigger = triggers.first()
  const mobile = testInfo.project.name.startsWith('mobile-')
  const visibleRows = mobile
    ? table.getByRole('list', { name: '示例任务表' })
    : table.getByRole('table')
  if (mobile) await trigger.tap()
  else {
    await trigger.focus()
    await trigger.press('Enter')
  }
  const panel = page.getByRole('dialog', { name: '筛选状态' })
  const active = panel.getByRole('checkbox', { name: '进行中' })
  if (mobile) await active.tap()
  else {
    await active.focus()
    await active.press('Space')
  }
  const apply = panel.getByRole('button', { name: '应用' })
  if (mobile) await apply.tap()
  else await apply.press('Enter')
  await expect(visibleRows.getByText('进行中')).toBeVisible()
  await expect(visibleRows.getByText('已完成')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  const filteredBox = await trigger.boundingBox()
  expect(filteredBox!.height).toBeGreaterThanOrEqual(44)
  if (mobile) await trigger.tap()
  else await trigger.press('Enter')
  const reset = page
    .getByRole('dialog', { name: '筛选状态' })
    .getByRole('button', {
      name: '重置',
    })
  if (mobile) await reset.tap()
  else await reset.press('Enter')
  await expect(visibleRows.getByText('已完成')).toBeVisible()
})

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
  await expect(
    page.getByRole('status', { name: '任务状态：已完成' }).first(),
  ).toHaveCSS('background-color', 'rgb(20, 83, 45)')
  await page.getByRole('button', { name: '普通提示' }).click()
  const darkToast = page
    .locator('[data-sonner-toast]')
    .filter({ hasText: '信息提示' })
  await expect(darkToast).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await expect(darkToast).toHaveCSS('color', 'rgb(248, 250, 252)')
  await expect(darkToast).toHaveCSS('border-color', 'rgb(71, 85, 105)')
  const closeToast = darkToast.getByRole('button', { name: '关闭提示' })
  await expect(closeToast).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  const closeBox = await closeToast.boundingBox()
  expect(closeBox).not.toBeNull()
  expect(closeBox!.width).toBeGreaterThanOrEqual(44)
  expect(closeBox!.height).toBeGreaterThanOrEqual(44)
})

test('default status labels meet AA contrast in light and dark themes', async ({
  page,
}) => {
  await page.goto('/__ui')
  const scope = page
    .getByRole('region', { name: '设计系统补充组件' })
    .locator('[data-ui-scope]')
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
  const scope = preview.locator('[data-ui-scope][data-ui-theme]').nth(1)
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
    nested.dataset.uiScope = ''
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
  const choiceGroup = preview.getByRole('group', { name: '展示方式' })
  const radio = choiceGroup.getByRole('radio', { name: '网格' })
  const segmented = preview.getByRole('group', { name: '数据视图' })
  const compactView = segmented.getByRole('radio', { name: '紧凑列表' })
  const wideView = segmented.locator('label').filter({ hasText: '宽卡片' })
  if (testInfo.project.name.startsWith('mobile-'))
    await radio.locator('..').tap()
  else {
    await choiceGroup.getByRole('radio', { name: '列表' }).focus()
    await page.keyboard.press('ArrowRight')
  }
  await expect(radio).toBeChecked()
  if (testInfo.project.name.startsWith('mobile-')) await wideView.tap()
  else await wideView.click()
  await expect(segmented.getByRole('radio', { name: '宽卡片' })).toBeChecked()
  await expect(compactView).not.toBeChecked()
  await expect(wideView).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await segmented.getByRole('radio', { name: '宽卡片' }).focus()
  await expect(wideView).toHaveCSS('outline-width', '3px')
  await expect(
    preview
      .getByRole('group', { name: '不可用数据视图' })
      .getByRole('radio', { name: '列表' }),
  ).toBeDisabled()

  const rating = preview.getByRole('radiogroup', { name: '满意度' })
  const satisfied = rating.getByRole('radio', { name: '满意', exact: true })
  const satisfiedOption = rating.locator('label').nth(3)
  if (testInfo.project.name.startsWith('mobile-')) await satisfiedOption.tap()
  else await satisfiedOption.click()
  await expect(satisfied).toBeChecked()
  await expect(satisfiedOption).toHaveCSS('color', 'rgb(105, 177, 255)')
  await satisfied.focus()
  await expect(satisfiedOption).toHaveCSS('outline-width', '3px')
  await expect(
    preview
      .getByRole('radiogroup', { name: '不可用评分' })
      .getByRole('radio', { name: '1 星' }),
  ).toBeDisabled()

  const colorPicker = preview.getByLabel('主题色')
  await expect(colorPicker).toHaveValue('#1677ff')
  const colorPickerBox = await colorPicker.boundingBox()
  expect(colorPickerBox?.width).toBeGreaterThanOrEqual(44)
  expect(colorPickerBox?.height).toBeGreaterThanOrEqual(44)
  await expect(preview.getByLabel('不可用颜色')).toBeDisabled()
  await expect(preview.getByLabel('错误颜色')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(preview.getByLabel('错误颜色')).toHaveCSS(
    'border-color',
    'rgb(252, 165, 165)',
  )
  if (testInfo.project.name.startsWith('mobile-')) {
    expect(
      await preview
        .getByRole('radiogroup', { name: '十星评分' })
        .evaluate((element) => element.scrollWidth > element.clientWidth),
    ).toBe(true)
  }

  const scopedSelect = preview.getByRole('combobox', { name: '局部选择' })
  if (testInfo.project.name.startsWith('mobile-')) await scopedSelect.tap()
  else await scopedSelect.click()
  const selectContent = page.locator('[data-select-content]')
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
  const viewport = page.viewportSize()!
  const dialogBox = await scopedDialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0)
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0)
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width)
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport.height)
  await scopedDialog.getByRole('button', { name: '关闭对话框' }).click()

  const sheetTrigger = preview.getByRole('button', { name: '打开局部面板' })
  if (testInfo.project.name.startsWith('mobile-')) await sheetTrigger.tap()
  else await sheetTrigger.click()
  const scopedSheet = page.getByRole('dialog', { name: '局部面板' })
  await expect(scopedSheet).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  const sheetBox = await scopedSheet.boundingBox()
  expect(sheetBox).not.toBeNull()
  expect(sheetBox!.x + sheetBox!.width).toBeCloseTo(viewport.width, 0)
  expect(sheetBox!.y + sheetBox!.height).toBeCloseTo(viewport.height, 0)
  if (testInfo.project.name.startsWith('mobile-')) {
    expect(sheetBox!.width).toBeCloseTo(viewport.width, 0)
    expect(sheetBox!.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1)
  } else {
    expect(sheetBox!.y).toBe(0)
    expect(sheetBox!.height).toBeCloseTo(viewport.height, 0)
  }
  await scopedSheet.getByRole('button', { name: '关闭面板' }).click()

  for (const side of ['左侧', '底部'] as const) {
    const trigger = preview.getByRole('button', { name: `打开${side}面板` })
    if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
    else await trigger.click()
    const sheet = page.getByRole('dialog', { name: `${side}面板` })
    const box = await sheet.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeCloseTo(viewport.height, 0)
    if (side === '底部' || testInfo.project.name.startsWith('mobile-')) {
      expect(box!.x).toBe(0)
      expect(box!.width).toBeCloseTo(viewport.width, 0)
      expect(box!.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1)
    } else {
      expect(box!.x).toBe(0)
      expect(box!.y).toBe(0)
      expect(box!.height).toBeCloseTo(viewport.height, 0)
    }
    await sheet.getByRole('button', { name: '关闭面板' }).click()
  }

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

  const teams = form.getByRole('combobox', { name: '表单团队' })
  await expect(form.getByRole('button', { name: '清除表单团队' })).toHaveCount(
    0,
  )
  if (testInfo.project.name.startsWith('mobile-')) await teams.tap()
  else await teams.click()
  const product = page
    .getByRole('tree', { name: '表单团队' })
    .getByRole('treeitem', { name: '产品团队' })
  const expand = product.locator('[data-tree-select-toggle]')
  const expandBox = await expand.boundingBox()
  expect(expandBox!.y).toBeGreaterThanOrEqual(0)
  expect(expandBox!.y + expandBox!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  )
  if (testInfo.project.name.startsWith('mobile-')) await expand.tap()
  else await expand.click()
  const option = page.getByRole('treeitem', { name: '设计组' })
  if (testInfo.project.name.startsWith('mobile-')) await option.tap()
  else await option.click()
  await expect(teams).toContainText('设计组')
  const reset = form.getByRole('button', { name: '重置表单' })
  if (testInfo.project.name.startsWith('mobile-')) await reset.tap()
  else await reset.click()
  await expect(teams).toContainText('请选择')
  await expect(form.getByRole('button', { name: '清除表单团队' })).toHaveCount(
    0,
  )
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
  const region = preview
    .getByRole('combobox', {
      name: '地区',
      exact: true,
    })
    .first()
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

  if (testInfo.project.name.startsWith('mobile-')) await region.tap()
  else await region.click()
  const regionPopup = page.getByRole('dialog', { name: '地区选项' })
  await regionPopup
    .getByRole('combobox', { name: '地区', exact: true })
    .selectOption('cn')
  await expect(
    regionPopup.getByRole('combobox', { name: '地区第2级', exact: true }),
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

test('date range keeps an ordered pair on keyboard and H5 input', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const group = preview.getByRole('group', { name: '日期范围', exact: true })
  const start = group.locator('input[type="date"]').first()
  const end = group.locator('input[type="date"]').last()
  await expect(start).toHaveAttribute('min', '2026-01-01')
  await expect(end).toHaveAttribute('max', '2027-12-31')
  await start.fill('2026-10-05')
  await end.fill('2026-10-10')
  await expect(
    preview.getByText('已选范围：2026-10-05 → 2026-10-10'),
  ).toBeVisible()
  await start.fill('2026-10-15')
  await expect(end).toHaveValue('')
  await expect(
    preview.getByText('已选范围：2026-10-15 → 未选结束'),
  ).toBeVisible()

  await page.setViewportSize({ width: 360, height: 780 })
  const startBox = await start.boundingBox()
  const endBox = await end.boundingBox()
  expect(startBox!.height).toBeGreaterThanOrEqual(44)
  expect(endBox!.height).toBeGreaterThanOrEqual(44)
  expect(endBox!.y).toBeGreaterThan(startBox!.y)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)

  const disabled = preview.getByRole('group', { name: '不可用日期范围' })
  await expect(disabled.locator('input[type="date"]').first()).toBeDisabled()
  await expect(
    preview.getByRole('group', { name: '错误日期范围' }),
  ).toHaveAttribute('aria-invalid', 'true')
  if (testInfo.project.name.startsWith('mobile-')) await end.tap()
  else await end.focus()
  await expect(end).toBeFocused()
})

test('single select clears with keyboard or touch and restores its placeholder', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const trigger = preview.getByRole('combobox', { name: '可清空单选' })
  const clear = preview.getByRole('button', { name: '清空可清空单选' })
  await expect(trigger).toContainText('选项一')
  const clearBox = await clear.boundingBox()
  expect(clearBox!.width).toBeGreaterThanOrEqual(44)
  expect(clearBox!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await clear.tap()
  else {
    await trigger.focus()
    await trigger.press('Tab')
    await expect(clear).toBeFocused()
    await clear.press('Enter')
  }
  await expect(clear).toHaveCount(0)
  await expect(trigger).toContainText('请选择')
  await expect(trigger).toBeFocused()
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.press('ArrowDown')
  const second = page.getByRole('option', { name: '选项二' })
  if (testInfo.project.name.startsWith('mobile-')) await second.tap()
  else await second.click()
  await expect(trigger).toContainText('选项二')
  await expect(clear).toBeVisible()
})

test('multi-select searches, keeps selections open and clears with keyboard or touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const trigger = preview.getByRole('combobox', { name: '多选分类' })
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  const list = page.getByRole('listbox', { name: '多选分类选项' })
  const search = page.getByRole('searchbox', { name: '搜索多选分类' })
  await expect(search).toBeFocused()
  await search.fill('设计')
  const design = list.getByRole('option', { name: '设计' })
  if (testInfo.project.name.startsWith('mobile-')) await design.tap()
  else await design.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(design).toHaveAttribute('aria-selected', 'true')
  if (testInfo.project.name.startsWith('mobile-')) await design.tap()
  else await design.click()
  await expect(design).toHaveAttribute('aria-selected', 'false')
  if (testInfo.project.name.startsWith('mobile-')) await design.tap()
  else await design.click()
  await expect(design).toHaveAttribute('aria-selected', 'true')
  await search.fill('视频')
  await search.press('Enter')
  await expect(preview.getByText('已选分类：design、video')).toBeVisible()
  await search.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(list).toHaveCount(0)

  const clear = preview.getByRole('button', { name: '清空多选分类' })
  await trigger.press('ArrowDown')
  await expect(search).toBeFocused()
  await search.press('Tab')
  await expect(list).toHaveCount(0)
  await expect(clear).toBeFocused()
  const clearBox = await clear.boundingBox()
  expect(clearBox!.width).toBeGreaterThanOrEqual(44)
  expect(clearBox!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await clear.tap()
  else {
    await clear.focus()
    await clear.press('Enter')
  }
  await expect(clear).toHaveCount(0)
  await expect(preview.getByText('已选分类：无')).toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(
    preview.getByRole('combobox', { name: '不可用多选' }),
  ).toBeDisabled()
  await expect(
    preview.getByRole('combobox', { name: '错误多选' }),
  ).toHaveAttribute('aria-invalid', 'true')
  const keyboard = preview.getByRole('combobox', { name: '错误多选' })
  await keyboard.focus()
  await keyboard.press('ArrowDown')
  const keyboardOption = page
    .getByRole('listbox', { name: '错误多选选项' })
    .getByRole('option', { name: '选项一' })
  await keyboard.press('Space')
  await expect(keyboardOption).toHaveAttribute('aria-selected', 'true')
  await keyboard.press('Space')
  await expect(keyboardOption).toHaveAttribute('aria-selected', 'false')
  await keyboard.press('Escape')
  await expect(keyboard).toBeFocused()
  await page.setViewportSize({ width: 360, height: 780 })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('time range keeps a same-day interval on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const group = preview.getByRole('group', { name: '时间范围', exact: true })
  const start = group.locator('input[type="time"]').first()
  const end = group.locator('input[type="time"]').last()
  await expect(start).toHaveAttribute('min', '08:00')
  await expect(end).toHaveAttribute('max', '22:00')
  await expect(start).toHaveAttribute('step', '300')
  await start.fill('09:00')
  await end.fill('17:00')
  await expect(preview.getByText('已选时间：09:00 → 17:00')).toBeVisible()
  await start.fill('18:00')
  await expect(end).toHaveValue('')
  await expect(preview.getByText('已选时间：18:00 → 未选结束')).toBeVisible()

  await page.setViewportSize({ width: 360, height: 780 })
  const startBox = await start.boundingBox()
  const endBox = await end.boundingBox()
  expect(startBox!.height).toBeGreaterThanOrEqual(44)
  expect(endBox!.height).toBeGreaterThanOrEqual(44)
  expect(endBox!.y).toBeGreaterThan(startBox!.y)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  await expect(
    preview
      .getByRole('group', { name: '不可用时间范围' })
      .locator('input')
      .first(),
  ).toBeDisabled()
  await expect(
    preview.getByRole('group', { name: '错误时间范围' }),
  ).toHaveAttribute('aria-invalid', 'true')
  if (testInfo.project.name.startsWith('mobile-')) await end.tap()
  else await end.focus()
  await expect(end).toBeFocused()
})

test('cascader popup completes a path and inline options stay current', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const trigger = preview
    .getByRole('combobox', {
      name: '地区',
      exact: true,
    })
    .first()
  await expect(trigger).toHaveAttribute('aria-required', 'true')
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  const popup = page.getByRole('dialog', { name: '地区选项' })
  const country = popup.getByRole('combobox', {
    name: '地区',
    exact: true,
  })
  await country.selectOption('cn')
  const city = popup.getByRole('combobox', {
    name: '地区第2级',
    exact: true,
  })
  await city.selectOption('sh')
  await expect(popup).toHaveCount(0)
  await expect(trigger).toContainText('中国 / 上海')

  const clear = preview.getByRole('button', { name: '清空地区' })
  const clearBox = await clear.boundingBox()
  expect(clearBox?.width).toBeGreaterThanOrEqual(44)
  expect(clearBox?.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await clear.tap()
  else await clear.click()
  await expect(trigger).toContainText('请选择')
  await expect(clear).toHaveCount(0)

  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  await country.selectOption('cn')
  await city.selectOption('sh')
  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  await country.selectOption('')
  await expect(trigger).toContainText('请选择')

  const dynamic = preview.getByRole('combobox', {
    name: '动态地区第2级',
    exact: true,
  })
  await expect(dynamic).toHaveValue('sh')
  const remove = preview.getByRole('button', { name: '移除上海选项' })
  if (testInfo.project.name.startsWith('mobile-')) await remove.tap()
  else await remove.click()
  await expect(dynamic).toHaveValue('')
  const restore = preview.getByRole('button', { name: '恢复上海选项' })
  if (testInfo.project.name.startsWith('mobile-')) await restore.tap()
  else await restore.click()
  await expect(dynamic).toHaveValue('sh')
})

test('cascader popup restores focus and preserves keyboard tab order', async ({
  page,
}) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const trigger = preview
    .getByRole('combobox', { name: '地区', exact: true })
    .first()
  const popup = page.getByRole('dialog', { name: '地区选项' })
  const country = popup.getByRole('combobox', { name: '地区', exact: true })

  await trigger.focus()
  await trigger.press('ArrowDown')
  await expect(country).toBeFocused()
  await country.press('Escape')
  await expect(popup).toHaveCount(0)
  await expect(trigger).toBeFocused()

  await trigger.press('ArrowDown')
  await expect(country).toBeFocused()
  await country.press('Shift+Tab')
  await expect(popup).toHaveCount(0)
  await expect(trigger).toBeFocused()

  await trigger.press('ArrowDown')
  await country.selectOption('cn')
  const city = popup.getByRole('combobox', {
    name: '地区第2级',
    exact: true,
  })
  await expect(city).toBeFocused()
  await city.press('Tab')
  await expect(popup).toHaveCount(0)
  await expect(trigger).not.toBeFocused()

  const clear = preview.getByRole('button', { name: '清空地区' })
  await clear.focus()
  await clear.press('Enter')
  await expect(clear).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('controlled number input accepts drafts, clamps on blur and can be cleared', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const number = preview.getByRole('spinbutton', { name: '数量' })
  await number.fill('120')
  await expect(number).toHaveValue('120')
  await number.press('Tab')
  await expect(number).toHaveValue('99')

  const clear = preview.getByRole('button', { name: '清空数量' })
  if (testInfo.project.name.startsWith('mobile-')) await clear.tap()
  else await clear.click()
  await expect(number).toHaveValue('')
  await number.fill('12')
  await expect(number).toHaveValue('12')
})

test('autocomplete filters suggestions and supports keyboard and touch selection', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const city = preview.getByRole('combobox', { name: '城市' })
  await city.fill('北')
  const suggestions = page.getByRole('listbox', { name: '城市建议' })
  await expect(suggestions.getByRole('option', { name: '北京' })).toBeVisible()
  await expect(suggestions.getByRole('option', { name: '上海' })).toHaveCount(0)
  await city.press('ArrowDown')
  const activeId = await suggestions
    .getByRole('option', { name: '北京' })
    .getAttribute('id')
  expect(activeId).not.toBeNull()
  await expect(city).toHaveAttribute('aria-activedescendant', activeId!)
  await city.press('Enter')
  await expect(city).toHaveValue('北京')
  await expect(preview.getByText('已选择：北京')).toBeVisible()
  await expect(suggestions).toHaveCount(0)

  await city.fill('')
  await page.setViewportSize({ width: 360, height: 780 })
  await city.evaluate((element) =>
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' }),
  )
  await expect(suggestions).toBeVisible()
  const panel = await suggestions.boundingBox()
  expect(panel).not.toBeNull()
  const visualBounds = await page.evaluate(() => ({
    left: window.visualViewport?.offsetLeft ?? 0,
    right:
      (window.visualViewport?.offsetLeft ?? 0) +
      (window.visualViewport?.width ?? window.innerWidth),
  }))
  expect(panel!.x).toBeGreaterThanOrEqual(visualBounds.left + 7)
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(visualBounds.right - 7)
  const shanghai = suggestions.getByRole('option', { name: '上海' })
  const box = await shanghai.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  if (testInfo.project.name.startsWith('mobile-')) await shanghai.tap()
  else await shanghai.click()
  await expect(city).toHaveValue('上海')
  await expect(preview.getByText('已选择：上海')).toBeVisible()

  await city.fill('')
  const disabled = suggestions.getByRole('option', { name: '杭州' })
  await expect(disabled).toHaveAttribute('aria-disabled', 'true')
  await city.press('Escape')
  await expect(suggestions).toHaveCount(0)
  await expect(city).toBeFocused()
})

test('accordion preview keeps one panel open with keyboard and touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const group = page.getByRole('group', { name: '单开折叠预览' })
  const overview = group.getByRole('button', { name: '折叠概览' })
  const details = group.getByRole('button', { name: '折叠详情' })
  await expect(overview).toHaveAttribute('aria-expanded', 'true')
  await expect(details).toHaveAttribute('aria-expanded', 'false')
  const bounds = await details.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.height).toBeGreaterThanOrEqual(44)

  if (testInfo.project.name.startsWith('mobile-')) await details.tap()
  else {
    await details.focus()
    await details.press('Enter')
  }
  await expect(overview).toHaveAttribute('aria-expanded', 'false')
  await expect(details).toHaveAttribute('aria-expanded', 'true')
  await expect(group.getByText('可以用键盘或触控切换。')).toBeVisible()
  await expect(group.getByRole('button', { name: '不可用折叠' })).toBeDisabled()
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
  const target = preview.locator('#tour-upload')
  await expect(target).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) await target.tap()
  else await target.click()
  await expect(preview.getByText(/上传按钮已点击 1 次/)).toBeVisible()
  await expect(tour).toBeVisible()

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

test('tour repositions when its card content grows', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.setViewportSize({ width: 390, height: 500 })
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  await preview.getByRole('button', { name: '开始引导' }).click()
  const target = preview.locator('#tour-upload')
  await target.evaluate((element) => element.scrollIntoView({ block: 'end' }))
  const card = page.getByRole('dialog', { name: '上传素材' })
  const before = await card.boundingBox()
  expect(before).not.toBeNull()

  await card.getByRole('button', { name: '展开说明' }).click()
  await expect(card.getByText(/引导卡片会在说明展开后重新定位/)).toBeVisible()
  await expect
    .poll(async () => (await card.boundingBox())?.y ?? 0)
    .toBeLessThan(before!.y)
  const after = await card.boundingBox()
  expect(after!.y + after!.height).toBeLessThanOrEqual(488)
})

test('masked tour keeps Tab on the card and highlighted target', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const begin = preview.getByRole('button', { name: '开始引导' })
  await begin.click()
  const card = page.getByRole('dialog', { name: '上传素材' })
  const close = card.getByRole('button', { name: '关闭引导' })
  const expand = card.getByRole('button', { name: '展开说明' })
  const next = card.getByRole('button', { name: '下一步' })
  const target = preview.locator('#tour-upload')

  await expect(close).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(expand).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(next).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(target).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(target).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(begin).toBeFocused()
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

test('listy keeps a bounded window and stable states on desktop and H5', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const list = page.getByRole('list', { name: '虚拟任务列表' })
  const controls = page.getByRole('group', { name: '虚拟列表状态' })
  const activate = async (name: string) => {
    const button = controls.getByRole('button', { name })
    if (testInfo.project.name.startsWith('mobile-')) await button.tap()
    else await button.click()
  }
  await expect(list).toBeVisible()
  const initialBox = await list.boundingBox()
  expect(initialBox).not.toBeNull()
  const initialCount = await list.getByRole('listitem').count()
  expect(initialCount).toBeLessThan(20)
  await list.evaluate((element) => {
    element.scrollTop = 52 * 50
    element.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  await expect(list.getByText('虚拟列表项目 51')).toBeVisible()
  expect(await list.getByRole('listitem').count()).toBeLessThan(20)

  const shrink = page.getByRole('button', { name: '缩减到 5 条数据' })
  if (testInfo.project.name.startsWith('mobile-')) await shrink.tap()
  else await shrink.click()
  await expect(list.getByText('虚拟列表项目 5')).toBeVisible()
  await expect(list.getByRole('listitem')).toHaveCount(5)
  await expect(list).toHaveJSProperty('scrollTop', 0)
  const restore = page.getByRole('button', { name: '恢复 100 条数据' })
  if (testInfo.project.name.startsWith('mobile-')) await restore.tap()
  else await restore.click()

  await activate('加载中')
  await expect(list).toHaveAttribute('aria-busy', 'true')
  await expect(list.getByRole('status')).toContainText('正在加载')
  expect((await list.boundingBox())?.height).toBeCloseTo(initialBox!.height, 0)
  await activate('有数据')
  await expect(list.getByText('虚拟列表项目 1')).toBeVisible()
  await expect(list.getByText('虚拟列表项目 51')).toHaveCount(0)

  await activate('空数据')
  await expect(list.getByRole('status')).toContainText('暂无内容')
  await activate('错误')
  await expect(list.getByRole('alert')).toContainText('虚拟列表加载失败')
  const retry = list.getByRole('button', { name: '重试' })
  if (testInfo.project.name.startsWith('mobile-')) await retry.tap()
  else await retry.click()
  await expect(list.getByText('虚拟列表项目 1')).toBeVisible()
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

  const multiple = preview.getByRole('combobox', { name: '多选团队' })
  const clear = preview.getByRole('button', { name: '清除多选团队' })
  await clear.focus()
  await clear.press('Enter')
  await expect(clear).toHaveCount(0)
  await expect(multiple).toBeFocused()
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

test('RTL transfer points toward its target in desktop and stacked layouts', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const transfer = preview.getByRole('group', { name: 'RTL 模块分配' })
  const source = transfer.getByRole('region', { name: '待分配' })
  const target = transfer.getByRole('region', { name: '已分配' })
  const move = transfer.getByRole('button', { name: '移至已分配' })
  const arrows = move.locator('span[aria-hidden="true"]')

  await page.setViewportSize({ width: 800, height: 900 })
  await expect(transfer).toHaveCSS('direction', 'rtl')
  expect((await source.boundingBox())!.x).toBeGreaterThan(
    (await target.boundingBox())!.x,
  )
  await expect(arrows.first()).toHaveText('←')
  await expect(arrows.first()).toBeVisible()
  await expect(arrows.last()).toBeHidden()

  await page.setViewportSize({ width: 390, height: 844 })
  expect((await source.boundingBox())!.y).toBeLessThan(
    (await target.boundingBox())!.y,
  )
  await expect(arrows.first()).toBeHidden()
  await expect(arrows.last()).toHaveText('↓')
  await expect(arrows.last()).toBeVisible()
  const task = source.getByRole('checkbox', { name: '任务 A' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await task.locator('..').tap()
    await move.tap()
  } else {
    await task.check()
    await move.click()
  }
  await expect(target.getByRole('checkbox', { name: '任务 A' })).toBeVisible()
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

  const previewTabs = page.getByRole('tablist', {
    name: '预览分组',
    exact: true,
  })
  await previewTabs.getByRole('tab', { name: '总览', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    previewTabs.getByRole('tab', { name: '详细内容' }),
  ).toHaveAttribute('aria-selected', 'true')

  await page
    .getByRole('region', { name: '导航与数据' })
    .getByRole('button', { name: '错误', exact: true })
    .click()
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

test('list keeps its labelled container through loading, empty and retry states', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '导航与数据' })
  const list = preview.getByRole('region', {
    name: '示例任务',
    exact: true,
  })
  const activate = async (name: string) => {
    const button = preview.getByRole('button', { name, exact: true })
    if (testInfo.project.name.startsWith('mobile-')) await button.tap()
    else await button.click()
  }

  await expect(
    list.getByRole('list', { name: '示例任务', exact: true }),
  ).toBeVisible()
  await activate('加载中')
  await expect(list).toHaveAttribute('aria-busy', 'true')
  await expect(list.getByRole('status')).toContainText('正在加载')
  await activate('空数据')
  await expect(list).not.toHaveAttribute('aria-busy')
  await expect(list.getByRole('status')).toContainText('暂无内容')
  await activate('错误')
  await expect(list.getByRole('alert')).toContainText('示例列表加载失败')
  if (testInfo.project.name.startsWith('mobile-'))
    await list.getByRole('button', { name: '重试' }).tap()
  else await list.getByRole('button', { name: '重试' }).click()
  await expect(
    list.getByRole('list', { name: '示例任务', exact: true }),
  ).toBeVisible()
})

test('table exposes one responsive data view and follows RTL text direction', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const workbench = page.getByRole('region', { name: '导航与数据' })
  const tableRegion = workbench.getByRole('region', {
    name: '示例任务表',
    exact: true,
  })
  if (testInfo.project.name.startsWith('mobile-')) {
    await expect(
      tableRegion.getByRole('list', { name: '示例任务表' }),
    ).toBeVisible()
    await expect(
      tableRegion.getByRole('table', { name: '示例任务表' }),
    ).toHaveCount(0)
  } else {
    await expect(
      tableRegion.getByRole('table', { name: '示例任务表' }),
    ).toBeVisible()
    await expect(
      tableRegion.getByRole('list', { name: '示例任务表' }),
    ).toHaveCount(0)
  }

  const rtlTable = page.getByRole('table', { name: 'RTL 数据表' })
  await expect(rtlTable).toHaveCSS('direction', 'rtl')
  await expect(rtlTable.getByRole('columnheader', { name: '任务' })).toHaveCSS(
    'text-align',
    'start',
  )
  await expect(rtlTable.getByRole('rowheader', { name: '任务' })).toHaveCSS(
    'text-align',
    'start',
  )
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
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

test('AI conversation layout stacks on H5 and uses columns on desktop', async ({
  page,
}) => {
  await page.goto('/__ui')
  const workbench = page.getByRole('region', { name: 'AI 对话工作台' })
  const conversations = workbench.getByRole('navigation', {
    name: '会话列表',
  })
  const conversation = workbench.getByRole('region', {
    name: /当前会话：/,
  })
  await expect(
    conversations.getByRole('button', { name: '新建' }),
  ).toBeVisible()
  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    const sidebarBox = await conversations.boundingBox()
    const chatBox = await conversation.boundingBox()
    expect(sidebarBox).not.toBeNull()
    expect(chatBox).not.toBeNull()
    if (width < 768)
      expect(sidebarBox!.y + sidebarBox!.height).toBeLessThanOrEqual(
        chatBox!.y + 1,
      )
    else
      expect(sidebarBox!.x + sidebarBox!.width).toBeLessThanOrEqual(
        chatBox!.x + 1,
      )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
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

test('media controls fit within narrow player cards', async ({ page }) => {
  await page.goto('/__ui')
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const name of ['视频能力示例', '音频能力示例']) {
      const player = page.getByRole('region', { name })
      const playerBox = await player.boundingBox()
      expect(playerBox).not.toBeNull()
      for (const button of await player.getByRole('button').all()) {
        const buttonBox = await button.boundingBox()
        expect(buttonBox).not.toBeNull()
        expect(buttonBox!.x).toBeGreaterThanOrEqual(playerBox!.x - 1)
        expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(
          playerBox!.x + playerBox!.width + 1,
        )
      }
    }
  }
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
  const toastClose = page
    .locator('[data-sonner-toast]')
    .getByRole('button', { name: '关闭提示' })
  await expect(toastClose).toHaveCSS('width', '44px')
  await expect(toastClose).toHaveCSS('height', '44px')
  await toastClose.tap()
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
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
        'button,[role=combobox],[role=tab],label:has(input[type="checkbox"]),label:has(input[type="radio"]),input[type="color"]',
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
  const owner = preview.getByRole('term').filter({ hasText: '负责人' })
  const status = preview.getByRole('term').filter({ hasText: '状态' })
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

test('uncontrolled tabs keep content when the active item is removed', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '导航与数据' })
  const tabs = preview.getByRole('tablist', { name: '动态预览分组' })
  await expect(tabs.getByRole('tab', { name: '动态详情' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const hide = preview.getByRole('button', { name: '隐藏详细分组' })
  if (testInfo.project.name.startsWith('mobile-')) await hide.tap()
  else await hide.click()
  await expect(tabs.getByRole('tab', { name: '动态详情' })).toHaveCount(0)
  await expect(tabs.getByRole('tab', { name: '动态总览' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(
    preview.getByRole('tabpanel', { name: '动态总览' }),
  ).toContainText('动态分组的基础内容。')

  const show = preview.getByRole('button', { name: '显示详细分组' })
  if (testInfo.project.name.startsWith('mobile-')) await show.tap()
  else await show.click()
  await expect(tabs.getByRole('tab', { name: '动态详情' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await tabs.getByRole('tab', { name: '动态详情' }).focus()
  await preview
    .getByRole('button', { name: '隐藏详细分组' })
    .evaluate((element) => (element as HTMLButtonElement).click())
  await expect(tabs.getByRole('tab', { name: '动态总览' })).toBeFocused()
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
  await expect(carousel.locator('[data-carousel-status]')).toHaveAttribute(
    'aria-live',
    'off',
  )
  if (testInfo.project.name.startsWith('mobile-')) await pause.tap()
  else await pause.focus()
  await expect(
    carousel.getByRole('button', { name: '开始自动播放' }),
  ).toBeVisible()
  await expect(carousel.locator('[data-carousel-status]')).toHaveAttribute(
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

test('horizontal menu keeps its submenu visible and touch targets usable', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const menu = page.getByRole('navigation', { name: '横向导航' })
  const catalog = menu.getByRole('menuitem', { name: '目录' })
  await expect(menu.getByRole('menu')).toHaveAttribute(
    'aria-orientation',
    'horizontal',
  )
  if (testInfo.project.name.startsWith('mobile-')) await catalog.tap()
  else await catalog.click()
  const child = page.getByRole('menuitem', { name: '全部组件' })
  await expect(child).toBeVisible()
  const box = await child.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  )
  if (!testInfo.project.name.startsWith('mobile-')) {
    await child.focus()
    await page.keyboard.press('Escape')
    await expect(child).toHaveCount(0)
    await expect(catalog).toBeFocused()
  }
  await expect(menu.getByRole('menuitem', { name: '暂不可用' })).toBeDisabled()
})

test('horizontal submenu remains usable beside a clipped card edge', async ({
  page,
}) => {
  await page.goto('/__ui')
  const menu = page.getByRole('navigation', { name: '横向导航' })
  const card = menu.locator('xpath=ancestor::*[@data-ui-card][1]')
  const catalog = menu.getByRole('menuitem', { name: '目录' })
  const cardBox = await card.boundingBox()
  const catalogBox = await catalog.boundingBox()
  expect(cardBox).not.toBeNull()
  expect(catalogBox).not.toBeNull()
  await card.evaluate(
    (element, height) => {
      element.style.height = `${height}px`
    },
    catalogBox!.y + catalogBox!.height - cardBox!.y + 2,
  )
  await catalog.click()
  const child = page.getByRole('menuitem', { name: '全部组件' })
  const childBox = await child.boundingBox()
  const clippedCardBox = await card.boundingBox()
  expect(clippedCardBox).not.toBeNull()
  expect(childBox).not.toBeNull()
  expect(childBox!.y).toBeGreaterThan(
    clippedCardBox!.y + clippedCardBox!.height,
  )
  await expect(child).toBeInViewport()
  await child.click()
  await expect(child).toHaveAttribute('aria-selected', 'true')
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
        .locator('[data-tree-label]')
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
    await expect(firstMenuItem).toBeFocused()
    await page.keyboard.press('End')
    await expect(
      preview.getByRole('menuitem', { name: '删除内容' }),
    ).toBeFocused()
    await page.keyboard.press('Home')
    await expect(firstMenuItem).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(openMenu).toBeFocused()
    await openMenu.click()
    await firstMenuItem.click()
  }

  const popoverTrigger = preview.getByRole('button', { name: '查看说明' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await popoverTrigger.tap()
  } else {
    await popoverTrigger.click()
  }
  const popover = page
    .getByRole('dialog')
    .filter({ hasText: '必要信息会直接展示' })
  await expect(popover).toBeVisible()
  const popoverAction = popover.getByRole('button', { name: '气泡内操作' })
  if (testInfo.project.name.startsWith('mobile-')) {
    await popoverAction.tap()
  } else {
    await popoverAction.click()
  }
  await expect(page.getByText('气泡内操作完成')).toBeVisible()
  await expect(popover).toBeVisible()
  if (testInfo.project.name.startsWith('mobile-')) {
    await popoverTrigger.tap()
  } else {
    await popoverTrigger.click()
  }

  const tooltipTrigger = preview.getByRole('button', { name: '悬停或聚焦提示' })
  await tooltipTrigger.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toHaveCount(0)
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
  const floatButton = preview.getByRole('button', { name: '回到顶部' })
  await expect(floatButton).toBeVisible()
  const floatBox = await floatButton.boundingBox()
  expect(floatBox).not.toBeNull()
  expect(floatBox!.width).toBeCloseTo(floatBox!.height, 0)
  expect(
    await floatButton.evaluate((element) =>
      parseFloat(getComputedStyle(element).borderTopLeftRadius),
    ),
  ).toBeGreaterThanOrEqual(floatBox!.width / 2)
})

test('overlay triggers preserve keyboard activation and tab order', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.goto('/__ui')

  const dropdownTrigger = page.getByRole('button', { name: '打开菜单' })
  await dropdownTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: '复制内容' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dropdownTrigger).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('menuitem', { name: '复制内容' })).toBeFocused()
  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: '复制内容' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('menu', { name: '菜单' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '打开底部面板' })).toBeFocused()
  await dropdownTrigger.focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('menuitem', { name: '删除内容' })).toBeFocused()
  const popoverTrigger = page.getByRole('button', { name: '查看说明' })
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menu', { name: '菜单' })).toHaveCount(0)
  await expect(popoverTrigger).toBeFocused()
  await page.keyboard.press('Enter')
  const popover = page.getByRole('dialog', { name: '补充说明' })
  await expect(popover).toBeVisible()
  await page.keyboard.press('Tab')
  const action = popover.getByRole('button', { name: '气泡内操作' })
  await expect(action).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('气泡内操作完成')).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(popoverTrigger).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(action).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: '悬停或聚焦提示' }),
  ).toBeFocused()
  await expect(popover).toHaveCount(0)
})

test('floating overlays stay usable inside clipped containers', async ({
  page,
}) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('button', { name: '打开菜单' })
  const container = trigger.locator('..')
  await container.evaluate((element) => {
    element.style.overflow = 'hidden'
  })
  await trigger.click()
  const item = page.getByRole('menuitem', { name: '复制内容' })
  const containerBox = await container.boundingBox()
  const itemBox = await item.boundingBox()
  expect(containerBox).not.toBeNull()
  expect(itemBox).not.toBeNull()
  expect(itemBox!.y).toBeGreaterThan(containerBox!.y + containerBox!.height)
  await expect(item).toBeInViewport()
  await item.click()
  await expect(page.getByText('已复制')).toBeVisible()

  const popoverTrigger = page.getByRole('button', { name: '查看说明' })
  const popoverContainer = popoverTrigger.locator('..')
  await popoverContainer.evaluate((element) => {
    element.style.overflow = 'hidden'
  })
  await popoverTrigger.click()
  const popover = page.getByRole('dialog', { name: '补充说明' })
  await expect(popover).toBeVisible()
  await expect(popoverContainer.getByRole('dialog')).toHaveCount(0)
  await popover.getByText('必要信息会直接展示').click()
  await expect(popover).toBeVisible()
  await popoverTrigger.click()

  const tooltipTrigger = page.getByRole('button', {
    name: '悬停或聚焦提示',
  })
  const tooltipContainer = tooltipTrigger.locator('..')
  await tooltipContainer.evaluate((element) => {
    element.style.overflow = 'hidden'
  })
  await tooltipTrigger.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await expect(tooltipContainer.getByRole('tooltip')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toHaveCount(0)
})

test('RTL OTP arrows follow the visible slot order', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const group = preview.getByRole('group', { name: 'RTL 验证码' })
  const slots = group.getByRole('textbox', { name: /RTL 验证码第/ })
  await expect(group).toHaveAttribute('dir', 'rtl')
  await expect(slots).toHaveCount(4)
  const firstBox = await slots.first().boundingBox()
  const secondBox = await slots.nth(1).boundingBox()
  expect(firstBox!.x).toBeGreaterThan(secondBox!.x)
  expect(firstBox!.width).toBeGreaterThanOrEqual(44)
  await slots.first().focus()
  await slots.first().press('ArrowLeft')
  await expect(slots.nth(1)).toBeFocused()
  await slots.nth(1).press('ArrowRight')
  await expect(slots.first()).toBeFocused()
  if (testInfo.project.name.startsWith('mobile-')) await slots.nth(2).tap()
  else await slots.nth(2).click()
  await expect(slots.nth(2)).toBeFocused()
})

test('RTL tree select follows visual expansion keys in its portal', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const demo = preview.getByRole('group', { name: 'RTL 控件预览' })
  const popupRoot = preview.locator('[data-ui-rtl-popup-root]')
  const trigger = demo.getByRole('combobox', { name: 'RTL 树选择' })
  await trigger.focus()
  await trigger.press('ArrowDown')
  const tree = popupRoot.getByRole('tree', { name: 'RTL 树选择' })
  await expect(tree.locator('..')).toHaveAttribute('dir', 'rtl')
  const team = tree.getByRole('treeitem', { name: '团队' })
  await expect(team).toBeFocused()
  await team.press('ArrowLeft')
  await expect(team).toHaveAttribute('aria-expanded', 'true')
  await team.press('ArrowLeft')
  const design = tree.getByRole('treeitem', { name: '设计组' })
  await expect(design).toBeFocused()
  await design.press('ArrowRight')
  await expect(team).toBeFocused()
  await team.press('Escape')
  await expect(trigger).toBeFocused()

  if (testInfo.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  if (testInfo.project.name.startsWith('mobile-')) await design.tap()
  else await design.click()
  await expect(trigger).toContainText('设计组')
})

test('RTL portal controls keep direction and logical option placement', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const demo = preview.getByRole('group', { name: 'RTL 控件预览' })
  const popupRoot = preview.locator('[data-ui-rtl-popup-root]')
  const select = demo.getByRole('combobox', { name: 'RTL 选择' })
  await expect(select).toHaveAttribute('dir', 'rtl')
  if (testInfo.project.name.startsWith('mobile-')) await select.tap()
  else await select.click()
  const content = popupRoot.locator('[data-select-content]')
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

  const multi = demo.getByRole('combobox', { name: 'RTL 多选' })
  await expect(multi).toHaveCSS('direction', 'rtl')
  if (testInfo.project.name.startsWith('mobile-')) await multi.tap()
  else await multi.click()
  const multiList = popupRoot.getByRole('listbox', { name: 'RTL 多选选项' })
  await expect(multiList.locator('..')).toHaveAttribute('dir', 'rtl')
  const multiSearch = popupRoot.getByRole('searchbox', { name: '搜索RTL 多选' })
  await multiSearch.fill('RTL 乙')
  const beta = multiList.getByRole('option', { name: 'RTL 乙' })
  if (testInfo.project.name.startsWith('mobile-')) await beta.tap()
  else await beta.click()
  await expect(multi).toContainText('RTL 乙')
  await multiSearch.press('Escape')

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

  const menuTrigger = demo.getByRole('button', { name: '打开 RTL 菜单' })
  if (testInfo.project.name.startsWith('mobile-')) await menuTrigger.tap()
  else await menuTrigger.click()
  const menu = popupRoot.getByRole('menu', { name: 'RTL 菜单' })
  const menuTriggerBox = await menuTrigger.boundingBox()
  const menuBox = await menu.boundingBox()
  expect(menuTriggerBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  expect(menuBox!.x + menuBox!.width).toBeCloseTo(
    menuTriggerBox!.x + menuTriggerBox!.width,
    0,
  )
  await menu.getByRole('menuitem', { name: 'RTL 复制' }).click()

  const popoverTrigger = demo.getByRole('button', { name: '打开 RTL 气泡' })
  if (testInfo.project.name.startsWith('mobile-')) await popoverTrigger.tap()
  else await popoverTrigger.click()
  const popover = popupRoot.getByRole('dialog', { name: 'RTL 说明' })
  const popoverTriggerBox = await popoverTrigger.boundingBox()
  const popoverBox = await popover.boundingBox()
  expect(popoverTriggerBox).not.toBeNull()
  expect(popoverBox).not.toBeNull()
  expect(popoverBox!.x).toBeCloseTo(
    Math.max(
      8,
      Math.min(
        popoverTriggerBox!.x,
        page.viewportSize()!.width - popoverBox!.width - 8,
      ),
    ),
    0,
  )
  if (testInfo.project.name.startsWith('mobile-')) await popoverTrigger.tap()
  else await popoverTrigger.click()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
