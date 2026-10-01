import { expect, test } from '@playwright/test'

test('single select accepts sequential typing without typeahead stealing focus', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /createRoot|createPortal/.test(message.text())
    )
      errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/__ui')
  const trigger = page.getByRole('combobox', {
    name: '可搜索选择',
    exact: true,
  })
  if (info.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  const search = page.getByRole('searchbox', { name: '搜索可搜索选择' })
  await expect(search).toBeFocused()
  await page.keyboard.type('shan', { delay: 60 })
  await expect(search).toHaveValue('shan')
  await expect(search).toBeFocused()
  await expect(
    page.getByRole('option', { name: '上海', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('option', { name: '深圳', exact: true }),
  ).toHaveCount(0)
  await search.press('Home')
  await expect(search).toBeFocused()
  await search.press('End')
  await expect(search).toBeFocused()
  // Home/End are platform-specific; ArrowLeft edits consistently on PC and H5.
  for (let index = 0; index < 4; index++) await search.press('ArrowLeft')
  await page.keyboard.type('b')
  await expect(search).toHaveValue('bshan')
  await expect(search).toBeFocused()
  await search.press('Backspace')
  await expect(search).toHaveValue('shan')
  await search.press('ArrowDown')
  const result = page.getByRole('option', { name: '上海', exact: true })
  await expect(result).toBeFocused()
  await result.press('Enter')
  await expect(trigger).toContainText('上海')
  await expect(trigger).toBeFocused()
  expect(errors).toEqual([])
})

test('single select leaves IME confirmation keys to the search input', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('combobox', {
    name: '可搜索选择',
    exact: true,
  })
  const triggerId = await trigger.getAttribute('id')
  const triggerButton = page.locator(`button[id="${triggerId}"]`)
  if (info.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  const search = page.getByRole('searchbox', { name: '搜索可搜索选择' })
  await expect(search).toBeFocused()
  await search.dispatchEvent('compositionstart')
  await search.fill('上')
  await search.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await expect(search).toBeVisible()
  await expect(triggerButton).toContainText('请选择')
  await search.dispatchEvent('keydown', { key: 'Escape', isComposing: true })
  await expect(search).toBeVisible()
  await search.dispatchEvent('compositionend', { data: '上' })
  await search.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 })
  await expect(search).toBeVisible()
  await search.press('Enter')
  await expect(trigger).toContainText('上海')
})

test('single select continues the form tab order from its searchable portal', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('combobox', {
    name: '可搜索选择',
    exact: true,
  })
  const activate = async () => {
    if (info.project.name.startsWith('mobile-')) await trigger.tap()
    else await trigger.click()
  }
  await activate()
  const search = page.getByRole('searchbox', { name: '搜索可搜索选择' })
  const first = page.getByRole('option', { name: '北京', exact: true })
  await expect(search).toBeFocused()
  await search.press('ArrowDown')
  await expect(first).toBeFocused()
  await first.press('ArrowUp')
  await expect(search).toBeFocused()
  await search.press('Tab')
  await expect(first).toBeFocused()
  await first.press('Shift+Tab')
  await expect(search).toBeFocused()
  await search.press('Shift+Tab')
  await expect(search).toHaveCount(0)
  await expect(trigger).toBeFocused()

  await activate()
  await expect(search).toHaveValue('')
  await search.press('ArrowUp')
  const last = page.getByRole('option', { name: '深圳', exact: true })
  await expect(last).toBeFocused()
  await last.press('Tab')
  await expect(search).toHaveCount(0)
  await expect(
    page.getByRole('combobox', { name: '填充选择', exact: true }),
  ).toBeFocused()

  await activate()
  await search.fill('unknown-city')
  await expect(
    page.getByRole('status').filter({ hasText: '无匹配选项' }),
  ).toBeVisible()
  await search.press('Tab')
  await expect(search).toHaveCount(0)
  await expect(
    page.getByRole('combobox', { name: '填充选择', exact: true }),
  ).toBeFocused()
})

test('RTL searchable select preserves its selected label and 44px results', async ({
  page,
}, info) => {
  await page.goto('/__ui')
  const trigger = page.getByRole('combobox', {
    name: 'RTL 搜索选择',
    exact: true,
  })
  const triggerId = await trigger.getAttribute('id')
  const triggerButton = page.locator(`button[id="${triggerId}"]`)
  if (info.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  const search = page.getByRole('searchbox', { name: '搜索RTL 搜索选择' })
  await expect(search).toBeFocused()
  const popup = page.locator('[data-select-content]')
  await expect(popup).toHaveAttribute('dir', 'rtl')
  const popupId = (await popup.getAttribute('id'))!
  expect(popupId).toBeTruthy()
  await expect(search).toHaveAttribute('aria-controls', popupId)
  await expect(triggerButton).toHaveAttribute('aria-controls', popupId)
  await search.fill('second')
  await expect(triggerButton).toContainText('RTL 搜索第一项')
  const result = page.getByRole('option', {
    name: 'RTL 搜索第二项',
    exact: true,
  })
  await expect(result).toBeVisible()
  expect((await result.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await popup.screenshot({
    path: `output/playwright/select-search-rtl-${info.project.name}.png`,
  })
  if (info.project.name.startsWith('mobile-')) await result.tap()
  else {
    await search.press('ArrowDown')
    await result.press('Enter')
  }
  await expect(trigger).toContainText('RTL 搜索第二项')
  await expect(trigger).toBeFocused()
  if (info.project.name.startsWith('mobile-')) await trigger.tap()
  else await trigger.click()
  await expect(search).toBeFocused()
  await search.fill('long')
  const longResult = page.getByRole('option', { name: /^RTL 很长的选项/ })
  await expect(longResult).toBeVisible()
  const popupBox = (await popup.boundingBox())!
  const viewportWidth = page.viewportSize()!.width
  expect(popupBox.x).toBeGreaterThanOrEqual(8)
  expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(viewportWidth - 8)
  await popup.screenshot({
    path: `output/playwright/select-search-long-${info.project.name}.png`,
  })
  if (info.project.name.startsWith('mobile-')) await longResult.tap()
  else await longResult.click()
  await expect(trigger).toContainText('RTL 很长的选项')
  const labelBox = (await trigger.getByText(/^RTL 很长的选项/).boundingBox())!
  const triggerBox = (await trigger.boundingBox())!
  expect(labelBox.width).toBeLessThan(triggerBox.width)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
