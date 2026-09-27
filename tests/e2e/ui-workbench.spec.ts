import { expect, test } from '@playwright/test'

test('keyboard controls retain focus and expose data states', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium')
  await page.goto('/__ui')

  const select = page.getByRole('combobox', { name: '分类' })
  await select.click()
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toContainText('设计')

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
  await expect(page.getByRole('alert')).toHaveCount(2)
  await page.getByRole('button', { name: '重试' }).first().click()
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
  await expect(page.getByRole('alert')).toContainText('文件类型不受支持')

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
  const prompt = page.getByRole('textbox', { name: '任务描述' })
  const submit = page.getByRole('button', { name: '提交任务' })

  await prompt.fill('生成一份摘要')
  await submit.click()
  await expect(
    page.getByRole('status', { name: '任务状态：已完成' }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText('任务已完成')).toBeVisible()

  await prompt.fill('失败任务')
  await submit.click()
  await expect(
    page.getByRole('status', { name: '任务状态：失败' }),
  ).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText('Mock 任务失败，请重试')).toBeVisible()
  await page.getByRole('button', { name: '重试任务' }).click()
  await expect(
    page.getByRole('status', { name: '任务状态：已完成' }),
  ).toBeVisible({ timeout: 5_000 })

  await prompt.fill('取消任务')
  await submit.click()
  await page.getByRole('button', { name: '取消任务' }).click()
  await expect(
    page.getByRole('status', { name: '任务状态：已取消' }),
  ).toBeVisible({ timeout: 5_000 })
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
