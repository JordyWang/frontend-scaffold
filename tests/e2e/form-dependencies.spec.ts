import { expect, test } from '@playwright/test'

test('Form updates dependent errors after an accepted source change', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('group', { name: '表单字段联动' })
  const form = preview.getByRole('form', { name: '字段联动示例' })
  const source = form.getByRole('textbox', { name: '代号', exact: true })
  const confirmation = form.getByRole('textbox', { name: '确认代号' })
  const submit = form.getByRole('button', { name: '提交字段联动' })
  const reset = form.getByRole('button', { name: '重置字段联动' })
  const activate = async (button: typeof submit) => {
    if (testInfo.project.name.startsWith('mobile-')) await button.tap()
    else await button.press('Enter')
  }

  await activate(submit)
  await expect(preview).toContainText('字段一致，已提交')
  await source.fill('green')
  await expect(form.getByRole('alert')).toContainText('两次代号不一致')
  await expect(confirmation).toHaveAttribute('aria-invalid', 'true')

  await source.fill('blue')
  await expect(form.getByRole('alert')).toHaveCount(0)
  await activate(submit)
  await expect(preview).toContainText('字段一致，已提交')

  await source.fill('other')
  await expect(form.getByRole('alert')).toContainText('两次代号不一致')
  await activate(reset)
  await expect(source).toHaveValue('blue')
  await expect(form.getByRole('alert')).toHaveCount(0)
  await expect(preview).toContainText('已重置')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
