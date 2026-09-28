import { expect, test } from '@playwright/test'

test('design system controls support keyboard, touch and local themes', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('region', { name: '设计系统补充组件' })
  const checkbox = preview.getByRole('checkbox', { name: '同意更新通知' })
  const switchControl = preview.getByRole('switch', { name: '启用提醒' })
  const theme = preview.getByRole('button', { name: '切换预览主题' })

  if (testInfo.project.name === 'mobile-chromium') {
    await preview.getByText('同意更新通知').tap()
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
  const accentBefore = await brandedScope
    .getByText('派生高亮')
    .evaluate((element) => getComputedStyle(element).backgroundColor)

  await preview.getByRole('button', { name: '切换预览密度' }).click()
  await expect(preview.getByText('当前：深色 · 紧凑')).toBeVisible()
  const radio = preview.getByRole('radio', { name: '网格' })
  if (testInfo.project.name === 'mobile-chromium')
    await preview.getByText('网格', { exact: true }).tap()
  else {
    await preview.getByRole('radio', { name: '列表' }).focus()
    await page.keyboard.press('ArrowRight')
  }
  await expect(radio).toBeChecked()

  const scopedSelect = preview.getByRole('combobox', { name: '局部选择' })
  if (testInfo.project.name === 'mobile-chromium') await scopedSelect.tap()
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
  if (testInfo.project.name === 'mobile-chromium') await dialogTrigger.tap()
  else await dialogTrigger.click()
  const scopedDialog = page.getByRole('dialog', { name: '局部对话框' })
  await expect(scopedDialog).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await scopedDialog.getByRole('button', { name: '关闭对话框' }).click()

  const sheetTrigger = preview.getByRole('button', { name: '打开局部面板' })
  if (testInfo.project.name === 'mobile-chromium') await sheetTrigger.tap()
  else await sheetTrigger.click()
  const scopedSheet = page.getByRole('dialog', { name: '局部面板' })
  await expect(scopedSheet).toHaveCSS('background-color', 'rgb(30, 41, 59)')
  await scopedSheet.getByRole('button', { name: '关闭面板' }).click()

  await theme.click()
  const accentAfter = await preview
    .getByText('派生高亮')
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(accentAfter).not.toBe(accentBefore)

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
    if (testInfo.project.name === 'mobile-chromium') await locator.tap()
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
    if (testInfo.project.name === 'mobile-chromium') await locator.tap()
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
  if (testInfo.project.name === 'mobile-chromium') await play.tap()
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
  test.skip(testInfo.project.name !== 'mobile-chromium')
  await page.goto('/__ui')
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
      ...document.querySelectorAll('button,[role=combobox],[role=tab]'),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !element.hasAttribute('disabled') &&
          (rect.width < 44 || rect.height < 44)
        )
      })
      .map((element) => element.textContent?.trim()),
  }))
  expect(geometry).toEqual({ overflow: false, smallTargets: [] })
})
