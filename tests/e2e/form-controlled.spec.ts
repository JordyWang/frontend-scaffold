import { expect, test } from '@playwright/test'

test('controlled Form submits accepted values across keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const preview = page.getByRole('group', { name: '受控表单状态' })
  const form = preview.getByRole('form', { name: '受控表单示例' })
  const input = form.getByRole('textbox', { name: '受控名称' })
  const submit = form.getByRole('button', { name: '提交受控表单' })
  const accept = form.getByRole('button', { name: '接纳请求' })
  const reject = form.getByRole('button', { name: '拒绝请求' })
  const activate = async (button: typeof submit) => {
    if (testInfo.project.name.startsWith('mobile-')) await button.tap()
    else await button.press('Enter')
  }

  await input.fill('待接纳')
  await expect(input).toHaveValue('初始名称')
  await expect(preview).toContainText('待接纳：待接纳')
  await activate(submit)
  await expect(preview).toContainText('已提交：初始名称')

  await activate(accept)
  await expect(input).toHaveValue('待接纳')
  await expect(preview).toContainText('待接纳：无')
  await activate(submit)
  await expect(preview).toContainText('已提交：待接纳')

  await input.fill('不采用')
  await expect(input).toHaveValue('待接纳')
  await activate(reject)
  await expect(preview).toContainText('变更已拒绝')
  await expect(input).toHaveValue('待接纳')

  await input.fill('')
  await activate(accept)
  await expect(form.getByRole('alert')).toContainText('请输入名称')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
