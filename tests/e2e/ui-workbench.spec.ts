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
    scope.locator(`.ui-tag--${tone}`).evaluate((element) => {
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
  const scope = preview.locator('.ui-theme-scope').nth(1)
  const colors = async (
    tone: 'success' | 'warning' | 'error',
    tag = scope.locator(`.ui-tag--${tone}`).first(),
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
        scope.locator(`.ui-badge__count--${tone}`).first(),
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
    nested.innerHTML = '<span class="ui-tag ui-tag--success">嵌套状态</span>'
    element.append(nested)
  })
  const nested = scope.locator('[data-ui-theme="light"] .ui-tag--success')
  expect((await colors('success', nested)).contrast).toBeGreaterThanOrEqual(4.5)
  expect((await colors('success', nested)).background).not.toBe(
    (await colors('success')).background,
  )
})

test('design system controls support keyboard, touch and local themes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const checkbox = preview.getByRole('checkbox', { name: '同意更新通知' })
  const switchControl = preview.getByRole('switch', { name: '启用提醒' })
  const theme = preview.getByRole('button', { name: '切换预览主题' })

  if (testInfo.project.name.startsWith('mobile-')) {
    await preview
      .locator('label.ui-choice')
      .filter({ hasText: '同意更新通知' })
      .tap()
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
  ).toHaveCSS('background-color', 'rgb(15, 118, 110)')
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
    nestedScope.locator('.ui-card').filter({ hasText: '继承卡片' }),
  ).toHaveCSS('border-top-left-radius', '16px')
  const accentBefore = await brandedScope
    .getByText('派生高亮')
    .evaluate((element) => getComputedStyle(element).backgroundColor)

  await preview.getByRole('button', { name: '切换预览密度' }).click()
  await expect(preview.getByText('当前：深色 · 紧凑')).toBeVisible()
  const radio = preview.getByRole('radio', { name: '网格' })
  if (testInfo.project.name.startsWith('mobile-'))
    await preview.getByText('网格', { exact: true }).tap()
  else {
    await preview.getByRole('radio', { name: '列表' }).focus()
    await page.keyboard.press('ArrowRight')
  }
  await expect(radio).toBeChecked()

  const scopedSelect = preview.getByRole('combobox', { name: '局部选择' })
  if (testInfo.project.name.startsWith('mobile-')) await scopedSelect.tap()
  else await scopedSelect.click()
  const selectContent = page.locator('.ui-select__content')
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
  const input = page.locator('input[type=file]').first()

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
        'button,[role=combobox],[role=tab],.ui-choice,.ui-switch',
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
