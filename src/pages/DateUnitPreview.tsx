import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DatePicker,
  Form,
  FormField,
  FormItem,
  Input,
  MultiDatePicker,
  Typography,
  type DatePickerPlacement,
} from '@/shared/ui'

export function DateUnitPreview() {
  const [week, setWeek] = useState('2020-W53')
  const [month, setMonth] = useState('2024-02')
  const [quarter, setQuarter] = useState('2024-Q1')
  const [year, setYear] = useState('2024')
  const [months, setMonths] = useState(['2024-02', '2024-05'])
  const [disabled, setDisabled] = useState(false),
    [rtl, setRtl] = useState(false)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>周、月、季度和年</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期单位预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            周使用 ISO
            周历（周一开始），跨年周保留所属的周年。月份、季度和年份可逐层浏览；
            浏览不会提交。方向键移动，PageUp / PageDown 翻页，Enter 选择，Escape
            取消。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期单位' : '禁用日期单位'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期单位' : '使用 RTL 日期单位'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开季度
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭季度
            </Button>
            <Button
              variant="outline"
              onClick={() => setMonths(['2024-02', '2024-05'])}
            >
              重置月份多选
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                label="跨年周"
                description="2020 年第 53 周跨越至 2021 年 1 月 3 日。"
                control={
                  <DatePicker
                    picker="week"
                    label="跨年周"
                    value={week}
                    onChange={setWeek}
                    min="2020-W49"
                    max="2021-W10"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="结算月份"
                control={
                  <DatePicker
                    picker="month"
                    label="结算月份"
                    value={month}
                    onChange={setMonth}
                    min="2023-01"
                    max="2027-12"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                    disabledDate={(value) => value === '2024-03'}
                    getCellDescription={(value) =>
                      value === '2024-06' ? '年中结算' : undefined
                    }
                  />
                }
              />
              <FormField
                label="确认季度"
                control={
                  <DatePicker
                    picker="quarter"
                    label="确认季度"
                    value={quarter}
                    onChange={setQuarter}
                    needConfirm
                    inputReadOnly
                    disabled={disabled}
                    min="2024-Q1"
                    max="2025-Q4"
                    placement={placement}
                    renderCell={(value) =>
                      value === '2024-Q2' ? (
                        <span className="text-xs">发布</span>
                      ) : null
                    }
                    getCellDescription={(value) =>
                      value === '2024-Q2' ? '发布季度' : undefined
                    }
                    presets={[
                      { key: 'q', label: '下个发布季度', value: '2024-Q2' },
                    ]}
                  />
                }
              />
              <FormField
                label="报告年份"
                control={
                  <DatePicker
                    picker="year"
                    label="报告年份"
                    value={year}
                    onChange={setYear}
                    min="2000"
                    max="2040"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="多个结算月"
                description="最多三个；确认后提交，标签可逐项删除。"
                control={
                  <MultiDatePicker
                    picker="month"
                    label="多个结算月"
                    value={months}
                    onChange={setMonths}
                    needConfirm
                    inputReadOnly
                    maxCount={3}
                    maxTagCount={1}
                    disabled={disabled}
                    min="2024-01"
                    max="2025-12"
                    placement={placement}
                    presets={[
                      {
                        key: 'summer',
                        label: '夏季月份',
                        value: ['2024-08', '2024-06', '2024-07'],
                      },
                    ]}
                  />
                }
              />
              <FormField
                label="多个报告年份"
                control={
                  <DatePicker
                    multiple
                    picker="year"
                    label="多个报告年份"
                    defaultValue={['2024', '2025']}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="多个发布季度"
                control={
                  <DatePicker
                    multiple
                    picker="quarter"
                    label="多个发布季度"
                    defaultValue={['2024-Q1']}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="多个跨年周"
                control={
                  <DatePicker
                    multiple
                    picker="week"
                    label="多个跨年周"
                    defaultValue={['2020-W53']}
                    min="2020-W49"
                    max="2021-W10"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="输入月份"
                description="仅可选奇数月份，步长为两个月。"
                control={
                  <DatePicker
                    picker="month"
                    label="输入月份"
                    defaultValue="2024-01"
                    min="2024-01"
                    max="2024-12"
                    step={2}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="输入之后的字段" control={<Input />} />
              <FormField
                label="外部开合季度"
                control={
                  <DatePicker
                    picker="quarter"
                    label="外部开合季度"
                    defaultValue="2024-Q1"
                    needConfirm
                    inputReadOnly
                    disabled={disabled}
                    open={open}
                    onOpenChange={setOpen}
                    placement={placement}
                  />
                }
              />
              <div className="space-y-2">
                <label htmlFor="unit-picker-placement" className="text-sm">
                  日期单位弹出位置
                </label>
                <select
                  id="unit-picker-placement"
                  className="min-h-11 w-full rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-base"
                  value={placement}
                  onChange={(event) =>
                    setPlacement(event.target.value as DatePickerPlacement)
                  }
                >
                  <option value="bottomStart">下方起点</option>
                  <option value="bottomEnd">下方终点</option>
                  <option value="topStart">上方起点</option>
                  <option value="topEnd">上方终点</option>
                </select>
              </div>
              <div className="min-w-0 md:col-span-2">
                <h4 className="mb-2 text-lg font-semibold">
                  窄容器中的常驻月份
                </h4>
                <div className="max-w-[240px]">
                  <DatePicker
                    picker="month"
                    mode="panel"
                    label="内嵌月份"
                    defaultValue="2024-02"
                    needConfirm
                    inputReadOnly
                    disabled={disabled}
                  />
                </div>
              </div>
              <FormField
                label="警告季度"
                control={
                  <DatePicker
                    picker="quarter"
                    label="警告季度"
                    defaultValue="2024-Q1"
                    inputReadOnly
                    variant="underlined"
                    status="warning"
                    size="small"
                  />
                }
              />
              <FormField
                label="错误年份"
                error="请选择可用报告年份"
                control={
                  <DatePicker picker="year" label="错误年份" inputReadOnly />
                }
              />
              <FormField
                label="只读周"
                control={
                  <DatePicker
                    picker="week"
                    label="只读周"
                    value="2020-W53"
                    readOnly
                  />
                }
              />
              <FormField
                label="禁用月份"
                control={
                  <DatePicker
                    picker="month"
                    label="禁用月份"
                    value="2024-02"
                    disabled
                  />
                }
              />
            </div>
          </ConfigProvider>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p role="status" aria-label="跨年周提交值">
              {week || '空选择'}
            </p>
            <p role="status" aria-label="月份提交值">
              {month || '空选择'}
            </p>
            <p role="status" aria-label="季度提交值">
              {quarter || '空选择'}
            </p>
            <p role="status" aria-label="年份提交值">
              {year || '空选择'}
            </p>
            <p role="status" aria-label="多个结算月提交值">
              {months.join('、') || '空选择'}
            </p>
          </div>
          <Form
            initialValues={{ month: '2024-02' }}
            validateOn="blur"
            onFinish={(values) => setResult('结算月：' + String(values.month))}
          >
            <FormItem
              name="month"
              label="月份表单"
              rules={[{ required: true, message: '请选择结算月份' }]}
              control={
                <DatePicker
                  picker="month"
                  label="月份表单"
                  inputReadOnly
                  defaultPanelMonth="2024-01"
                />
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">提交月份表单</Button>
              <Button type="reset" variant="outline">
                重置月份表单
              </Button>
            </div>
          </Form>
          <p
            role="status"
            aria-label="月份表单结果"
            className="text-sm text-muted-foreground"
          >
            {result}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
