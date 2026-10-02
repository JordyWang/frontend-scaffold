import { expect, test } from '@playwright/test'

test('Form reveals and focuses the first invalid field in a long scroll area', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('group', { name: '长表单错误定位' })
  const form = preview.getByRole('form', { name: '长表单示例' })
  const input = form.getByRole('textbox', { name: '顶部必填项目' })
  const submit = form.getByRole('button', { name: '检查长表单' })
  await preview.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const before = await preview.evaluate((element) => element.scrollTop)
  expect(before).toBeGreaterThan(100)
  if (testInfo.project.name.startsWith('mobile-')) await submit.tap()
  else {
    await submit.focus()
    await submit.press('Enter')
  }
  await expect(form.getByRole('alert')).toHaveText('请输入项目名称')
  await expect(input).toBeFocused()
  const metrics = await preview.evaluate((element) => {
    const field = element.querySelector<HTMLInputElement>(
      '[aria-invalid="true"]',
    )!
    const container = element.getBoundingClientRect()
    const target = field.getBoundingClientRect()
    return {
      scrollTop: element.scrollTop,
      visible: target.top >= container.top && target.bottom <= container.bottom,
    }
  })
  expect(metrics.scrollTop).toBeLessThan(before)
  expect(metrics.visible).toBe(true)
  await input.fill('已命名项目')
  if (testInfo.project.name.startsWith('mobile-')) await submit.tap()
  else await submit.click()
  await expect(form.getByRole('alert')).toHaveCount(0)
})
