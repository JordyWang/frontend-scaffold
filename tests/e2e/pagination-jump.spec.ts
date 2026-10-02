import { expect, test } from '@playwright/test'

test('pagination jumpers cross page gaps with keyboard and H5 touch', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui')
  const section = page.getByRole('region', { name: '导航与数据' })
  const pagination = section.getByRole('navigation', { name: '分页' })
  const mobile = testInfo.project.name.startsWith('mobile-')

  for (const target of [6, 11]) {
    const jump = pagination.getByRole('button', {
      name: `向后跳至第 ${target} 页`,
    })
    const bounds = await jump.boundingBox()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
    if (mobile) await jump.tap()
    else {
      await jump.focus()
      await jump.press('Enter')
    }
    await expect(
      pagination.getByRole('button', { name: `前往第 ${target} 页` }),
    ).toHaveAttribute('aria-current', 'page')
  }

  await expect(
    pagination.getByRole('button', { name: /向后跳至第/ }),
  ).toHaveCount(0)
  for (const target of [6, 1]) {
    const previous = pagination.getByRole('button', {
      name: `向前跳至第 ${target} 页`,
    })
    if (mobile) await previous.tap()
    else {
      await previous.focus()
      await previous.press('Enter')
    }
    await expect(
      pagination.getByRole('button', { name: `前往第 ${target} 页` }),
    ).toHaveAttribute('aria-current', 'page')
  }
  await expect(
    pagination.getByRole('button', { name: /向前跳至第/ }),
  ).toHaveCount(0)
  if (!mobile)
    await expect(
      pagination.getByRole('button', { name: '前往第 1 页' }),
    ).toBeFocused()
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
