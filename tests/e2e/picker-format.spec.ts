import { expect, test, type Locator } from '@playwright/test'
const activate = async (target: Locator, mobile: boolean) =>
  mobile ? target.tap() : target.press('Enter')
const demo = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: '日期与时间格式', exact: true })
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/__ui')
})

test('multiple input formats display the first pattern and submit canonical FormData once', async ({
  page,
}) => {
  const section = demo(page),
    field = section.getByRole('combobox', { name: '多格式日期', exact: true })
  await expect(field).toHaveValue('29/02/2024')
  await field.fill('2024-3-1')
  await field.press('Enter')
  await expect(field).toHaveValue('01/03/2024')
  await expect(
    section.getByRole('status', { name: '格式日期规范值', exact: true }),
  ).toHaveText('2024-03-01；提交 1 次')
  await section
    .getByRole('button', { name: '提交格式日期表单', exact: true })
    .click()
  await expect(
    section.getByRole('status', { name: '格式日期表单结果', exact: true }),
  ).toHaveText('2024-03-01')
  await field.fill('02/03/2024')
  await field.press('Enter')
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(section.getByRole('alert')).toHaveText(
    '请输入可选日期（DD/MM/YYYY）',
  )
  await expect(section.locator('input[name="formattedDate"]')).toHaveValue(
    '2024-03-01',
  )
  await field.press('Escape')
  await expect(field).toHaveValue('01/03/2024')
})

test('formatted calendar keeps keyboard browsing pending, touch confirmation and focus recovery', async ({
  page,
}, info) => {
  const section = demo(page),
    field = section.getByRole('combobox', { name: '多格式日期', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const panel = page.getByRole('dialog', {
    name: '多格式日期选择面板',
    exact: true,
  })
  const leap = panel.locator('[data-calendar-date="2024-02-29"]')
  await expect(leap).toBeFocused()
  await leap.press('ArrowRight')
  const next = panel.locator('[data-calendar-date="2024-03-01"]')
  await expect(next).toBeFocused()
  const box = await next.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  await activate(next, info.project.name.startsWith('mobile-'))
  await expect(field).toHaveValue('01/03/2024')
  await expect(section.locator('input[name="formattedDate"]')).toHaveValue(
    '2024-02-29',
  )
  await activate(
    panel.getByRole('button', { name: '确定', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(field).toBeFocused()
  await expect(section.locator('input[name="formattedDate"]')).toHaveValue(
    '2024-03-01',
  )
})

test('hover previews use the date format without changing selected or submitted values', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'desktop-chromium',
    'Mouse hover is a desktop interaction',
  )
  const section = demo(page),
    field = section.getByRole('combobox', { name: '多格式日期', exact: true })
  await field.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await field.press('ArrowDown')
  const panel = page.getByRole('dialog', {
    name: '多格式日期选择面板',
    exact: true,
  })
  await panel.locator('[data-calendar-date="2024-03-01"]').hover()
  await expect(field).toHaveValue('01/03/2024')
  await expect(field).toHaveAttribute('data-picker-preview', 'hover')
  await expect(section.locator('input[name="formattedDate"]')).toHaveValue(
    '2024-02-29',
  )
  await expect(
    panel.locator('[data-calendar-date="2024-02-29"]').locator('xpath=..'),
  ).toHaveAttribute('aria-selected', 'true')
  await field.press('Escape')
  await expect(field).toHaveValue('29/02/2024')
})

test('date ranges order canonical endpoints and format multiple-date tags', async ({
  page,
}) => {
  const section = demo(page),
    start = section.getByRole('combobox', {
      name: '格式开始日期',
      exact: true,
    }),
    end = section.getByRole('combobox', { name: '格式结束日期', exact: true })
  await start.fill('2024-3-1')
  await end.fill('04/03/2024')
  await end.press('Enter')
  await expect(start).toHaveValue('01/03/2024')
  await expect(section.locator('input[name="formattedRange"]')).toHaveValue(
    '["2024-03-01","2024-03-04"]',
  )
  const multiple = section.getByRole('combobox', {
    name: '格式多选日期',
    exact: true,
  })
  await multiple.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await multiple.fill('2024-3-1')
  await multiple.press('Enter')
  await multiple.evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  )
  await expect(
    section.getByRole('button', { name: '移除日期 01/03/2024', exact: true }),
  ).toBeVisible()
  await expect(section.locator('input[name="formattedMultiple"]')).toHaveValue(
    '["2024-02-29"]',
  )
  await page
    .getByRole('dialog', { name: '格式多选日期选择面板', exact: true })
    .getByRole('button', { name: '完成', exact: true })
    .click()
  await expect(section.locator('input[name="formattedMultiple"]')).toHaveValue(
    '["2024-02-29","2024-03-01"]',
  )
})

test('function formats, ISO week-year and quarters accept input without changing canonical APIs', async ({
  page,
}) => {
  const section = demo(page),
    functionField = section.getByRole('combobox', {
      name: '函数格式日期',
      exact: true,
    })
  await functionField.fill('日期 2024/03/01')
  await functionField.press('Enter')
  await expect(functionField).toHaveValue('日期 2024/03/01')
  const week = section.getByRole('combobox', {
    name: 'ISO 周格式',
    exact: true,
  })
  await expect(week).toHaveValue('2020年第01周')
  await week.fill('2020年第53周')
  await week.press('Enter')
  await expect(section.locator('input[name="isoFormatWeek"]')).toHaveValue(
    '2020-W53',
  )
  const quarter = section.getByRole('combobox', {
    name: '季度格式',
    exact: true,
  })
  await quarter.fill('2024年第3季度')
  await quarter.press('Enter')
  await expect(section.locator('input[name="formatQuarter"]')).toHaveValue(
    '2024-Q3',
  )
  const early = section.getByRole('combobox', {
    name: '早年格式日期',
    exact: true,
  })
  await expect(early).toHaveValue('31/12/0099')
  await early.fill('01/01/0001')
  await early.press('Enter')
  await expect(section.locator('input[name="earlyDate"]')).toHaveValue(
    '0001-01-01',
  )
})

test('time and dateTime fields accept alternate patterns, 12-hour display and exact milliseconds', async ({
  page,
}) => {
  const section = demo(page),
    time = section.getByRole('combobox', {
      name: '多格式毫秒时间',
      exact: true,
    })
  await time.fill('14:35:16.009')
  await time.press('Enter')
  await expect(time).toHaveValue('02:35:16.009 pm')
  await expect(section.locator('input[name="formatTime"]')).toHaveValue(
    '14:35:16.009',
  )
  const datetime = section.getByRole('combobox', {
    name: '格式日期时间',
    exact: true,
  })
  await datetime.fill('2024-03-01 14:35:16.009')
  await datetime.press('Enter')
  await expect(datetime).toHaveValue('01/03/2024 02:35:16.009 PM')
  await expect(section.locator('input[name="formatDateTime"]')).toHaveValue(
    '2024-03-01T14:35:16.009',
  )
  const end = section.getByRole('combobox', {
    name: '格式结束时间',
    exact: true,
  })
  await end.fill('02:30 pm')
  await end.press('Enter')
  await expect(section.locator('input[name="formatTimeRange"]')).toHaveValue(
    '["09:30","14:30"]',
  )
  const dateEnd = section.getByRole('combobox', {
    name: '格式结束日期时间',
    exact: true,
  })
  await dateEnd.fill('02/03/2024 03:30')
  await dateEnd.press('Enter')
  await expect(
    section.locator('input[name="formatDateTimeRange"]'),
  ).toHaveValue('["2024-02-29T23:30","2024-03-02T03:30"]')
})

test('dynamic patterns and locale discard unfinished text while preserving committed values', async ({
  page,
}, info) => {
  const section = demo(page),
    date = section.getByRole('combobox', { name: '多格式日期', exact: true })
  await date.fill('partial')
  await activate(
    section.getByRole('button', { name: '显示中文日期', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(date).toHaveValue('2024年02月29日')
  await expect(
    section.getByRole('status', { name: '格式日期规范值', exact: true }),
  ).toHaveText('2024-02-29；提交 0 次')
  const localized = section.getByRole('combobox', {
    name: '本地化月份日期',
    exact: true,
  })
  await expect(localized).toHaveValue('29 février 2024')
  await activate(
    section.getByRole('button', { name: '使用中文月份', exact: true }),
    info.project.name.startsWith('mobile-'),
  )
  await expect(localized).toHaveValue('2024年2月29日')
  await expect(section.locator('input[name="localizedDate"]')).toHaveValue(
    '2024-02-29',
  )
})

test('native adapters ignore custom formats and expose browser-native canonical values', async ({
  page,
}) => {
  const section = demo(page),
    form = section.getByRole('form', { name: '格式原生适配', exact: true })
  expect(
    await form.evaluate((element) =>
      Object.fromEntries(new FormData(element as HTMLFormElement)),
    ),
  ).toEqual({
    formatNativeDate: '2024-02-29',
    formatNativeTime: '13:30',
    formatNativeDateTime: '2024-02-29T13:30',
    formatNativeRange: '["2024-02-29T13:30","2024-03-01T14:30"]',
  })
  await section.getByLabel('格式原生日期', { exact: true }).fill('2024-03-01')
  await expect(section.getByLabel('格式原生日期', { exact: true })).toHaveValue(
    '2024-03-01',
  )
})

test('240px RTL dark formatted controls retain local scrolling, keyboard and 44px touch targets', async ({
  page,
}, info) => {
  const section = demo(page),
    narrow = section.getByLabel('窄容器格式', { exact: true })
  await narrow.scrollIntoViewIfNeeded()
  const time = narrow.getByRole('textbox', {
    name: '窄容器格式时间',
    exact: true,
  })
  await expect(time).toHaveValue('12:30:15.100 PM')
  const options = narrow.locator('[data-time-unit="millisecond"]')
  const target = options.filter({ hasText: '200' })
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThanOrEqual(44)
  await activate(target, info.project.name.startsWith('mobile-'))
  await expect(time).toHaveValue('12:30:15.200 PM')
  await time.press('Escape')
  await narrow
    .getByRole('button', { name: '取消', exact: true })
    .first()
    .click()
  await expect(time).toHaveValue('12:30:15.100 PM')
  const dates = narrow.locator('[data-calendar-date="2024-02-29"]')
  await dates.press('ArrowLeft')
  await expect(
    narrow.locator('[data-calendar-date="2024-03-01"]'),
  ).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await narrow.screenshot({
    path: 'output/playwright/formatted-rtl-' + info.project.name + '.png',
  })
})
