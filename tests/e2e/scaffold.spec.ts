import { expect, test } from '@playwright/test'

test('mock mode loads local JSON on desktop and mobile', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '用现有组件，构建一致的界面' }),
  ).toBeVisible()

  await page.getByRole('link', { name: '打开开发预览' }).click()
  await expect(page.getByText('默认数据已从 JSON 文件加载')).toBeVisible()

  const unknownApiStatus = await page.evaluate(async () => {
    const response = await fetch('/api/not-configured')
    return response.status
  })
  expect(unknownApiStatus).toBe(501)

  const sampleVideo = await page.request.get('/mock/media/sample.mp4')
  expect(sampleVideo.ok()).toBe(true)

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})
