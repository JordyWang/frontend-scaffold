import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DateRangePicker,
  Form,
  FormField,
  FormItem,
  Input,
  Typography,
  type DatePeriodUnit,
  type DateRange,
  type DatePickerPlacement,
} from '@/shared/ui'

const examples: {
  picker: DatePeriodUnit
  label: string
  min: string
  max: string
}[] = [
  { picker: 'week', label: '跨年周范围', min: '2020-W49', max: '2021-W10' },
  { picker: 'month', label: '结算月份范围', min: '2023-01', max: '2027-12' },
  { picker: 'quarter', label: '发布季度范围', min: '2024-Q1', max: '2025-Q4' },
  { picker: 'year', label: '报告年份范围', min: '2000', max: '2040' },
]

export function DateUnitRangePreview() {
  const [ranges, setRanges] = useState<Record<DatePeriodUnit, DateRange>>({
    week: ['2020-W53', '2021-W02'],
    month: ['2024-02', '2024-05'],
    quarter: ['2024-Q1', '2024-Q3'],
    year: ['2024', '2026'],
  })
  const [rtl, setRtl] = useState(false),
    [disabled, setDisabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交')
  const [limited, setLimited] = useState('尚未选择')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>周、月、季度和年范围</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期单位范围预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            选择开始和结束单位，浏览与键盘预览不会提交。桌面并排显示两个面板，窄容器显示一个；周沿用
            ISO 周历。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期单位范围' : '禁用日期单位范围'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期单位范围' : '使用 RTL 日期单位范围'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开季度范围
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭季度范围
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="unit-range-placement" className="text-sm">
              日期单位范围弹出位置
            </label>
            <select
              id="unit-range-placement"
              className="min-h-11 w-full rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-base"
              value={placement}
              onChange={(event) =>
                setPlacement(event.target.value as DatePickerPlacement)
              }
            >
              {(
                ['bottomStart', 'bottomEnd', 'topStart', 'topEnd'] as const
              ).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {examples.map(({ picker, label, min, max }) => (
                <div key={picker} className="min-w-0 space-y-2">
                  <FormField
                    label={label}
                    description={
                      picker === 'quarter'
                        ? '确认后提交；可通过预设选择发布窗口。'
                        : '选择结束单位后提交，Escape 丢弃临时范围。'
                    }
                    control={
                      <DateRangePicker
                        picker={picker}
                        label={label}
                        startLabel={label + '开始'}
                        endLabel={label + '结束'}
                        value={ranges[picker]}
                        onChange={(value) =>
                          setRanges((current) => ({
                            ...current,
                            [picker]: value,
                          }))
                        }
                        min={min}
                        max={max}
                        inputReadOnly
                        needConfirm={picker === 'quarter'}
                        disabled={disabled}
                        placement={placement}
                        disabledDate={(value) =>
                          picker === 'month' && value === '2024-03'
                        }
                        renderCell={(value) =>
                          picker === 'quarter' && value === '2024-Q2' ? (
                            <span className="text-xs">发布</span>
                          ) : null
                        }
                        getCellDescription={(value) =>
                          picker === 'quarter' && value === '2024-Q2'
                            ? '发布窗口'
                            : undefined
                        }
                        presets={
                          picker === 'quarter'
                            ? [
                                {
                                  key: 'launch',
                                  label: '下个发布区间',
                                  value: ['2024-Q2', '2024-Q4'],
                                },
                              ]
                            : []
                        }
                      />
                    }
                  />
                  <output
                    role="status"
                    aria-label={label + '提交值'}
                    className="block text-sm text-muted-foreground"
                  >
                    {ranges[picker].join(' → ')}
                  </output>
                </div>
              ))}
              <FormField
                label="输入月份范围"
                description="仅允许奇数月份，步长为两个月。"
                control={
                  <DateRangePicker
                    picker="month"
                    label="输入月份范围"
                    startLabel="输入开始月份"
                    endLabel="输入结束月份"
                    defaultValue={['2024-01', '2024-05']}
                    min="2024-01"
                    max="2024-11"
                    step={2}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="范围之后的字段" control={<Input />} />
              <FormField
                label="锁定开始月份"
                description="起点保持 2024-03，只能修改结束月份。"
                control={
                  <DateRangePicker
                    picker="month"
                    label="锁定月份范围"
                    startLabel="锁定开始月份"
                    endLabel="可编辑结束月份"
                    defaultValue={['2024-03', '2024-06']}
                    min="2024-01"
                    max="2024-12"
                    disabled={disabled ? true : [true, false]}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <FormField
                label="开放年份范围"
                description="结束年份可以留空，点击应用范围提交。"
                control={
                  <DateRangePicker
                    picker="year"
                    label="开放年份范围"
                    startLabel="开放开始年份"
                    endLabel="开放结束年份"
                    defaultValue={['2024', '']}
                    min="2020"
                    max="2040"
                    allowEmpty={[false, true]}
                    disabled={disabled}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <div className="min-w-0 space-y-2">
                <FormField
                  label="受限月份范围"
                  description="结束月份必须落在开始月份之后的四个月窗口内。"
                  control={
                    <DateRangePicker
                      picker="month"
                      label="受限月份范围"
                      startLabel="受限开始月份"
                      endLabel="受限结束月份"
                      defaultValue={['2024-02', '2024-05']}
                      min="2024-01"
                      max="2025-12"
                      disabled={disabled}
                      inputReadOnly
                      placement={placement}
                      disabledDate={(value, { endpoint, from }) => {
                        if (endpoint !== 'end' || !from) return false
                        const ordinal = (month: string) =>
                          Number(month.slice(0, 4)) * 12 +
                          Number(month.slice(5))
                        const distance = ordinal(value) - ordinal(from)
                        return distance < 0 || distance > 3
                      }}
                      onCalendarChange={(value, { endpoint }) =>
                        setLimited(endpoint + '：' + value.join(' → '))
                      }
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="受限月份临时值"
                  className="block text-sm text-muted-foreground"
                >
                  {limited}
                </output>
              </div>
              <FormField
                label="外部开合季度范围"
                control={
                  <DateRangePicker
                    picker="quarter"
                    label="外部开合季度范围"
                    startLabel="外部开始季度"
                    endLabel="外部结束季度"
                    defaultValue={['2024-Q1', '2024-Q3']}
                    needConfirm
                    open={open}
                    onOpenChange={setOpen}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="w-60 max-w-full space-y-2">
                <Typography as="h3">240px 常驻面板</Typography>
                <DateRangePicker
                  picker="month"
                  mode="panel"
                  label="内嵌月份范围"
                  startLabel="内嵌开始月份"
                  endLabel="内嵌结束月份"
                  defaultValue={['2024-02', '2024-05']}
                  min="2024-01"
                  max="2024-12"
                  needConfirm
                  inputReadOnly
                  disabled={disabled}
                />
              </div>
              <div className="min-w-0 space-y-4">
                <FormField
                  label="只读年份范围"
                  control={
                    <DateRangePicker
                      picker="year"
                      label="只读年份范围"
                      startLabel="只读开始年份"
                      endLabel="只读结束年份"
                      defaultValue={['2023', '2025']}
                      readOnly
                    />
                  }
                />
                <FormField
                  label="警告季度范围"
                  control={
                    <DateRangePicker
                      picker="quarter"
                      label="警告季度范围"
                      startLabel="警告开始季度"
                      endLabel="警告结束季度"
                      defaultValue={['2024-Q2', '2024-Q4']}
                      status="warning"
                      variant="underlined"
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <FormField
                  label="错误周范围"
                  error="请选择可用的周范围"
                  control={
                    <DateRangePicker
                      picker="week"
                      label="错误周范围"
                      startLabel="错误开始周"
                      endLabel="错误结束周"
                      defaultValue={['2021-W53', '2022-W02']}
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
              </div>
            </div>
            <Form
              initialValues={{ period: ['2024-02', '2024-05'] }}
              validateOn="blur"
              onFinish={(values) =>
                setResult(
                  '月份范围：' + (values.period as string[]).join(' → '),
                )
              }
              className="mt-4"
            >
              <FormItem
                name="period"
                label="月份范围表单"
                emptyValue={[]}
                rules={[
                  { required: true, message: '请选择完整月份范围' },
                  {
                    validator: (value) =>
                      Array.isArray(value) &&
                      value.length === 2 &&
                      value.every(Boolean)
                        ? undefined
                        : '请选择完整月份范围',
                  },
                ]}
                control={
                  <DateRangePicker
                    picker="month"
                    label="月份范围表单"
                    startLabel="表单开始月份"
                    endLabel="表单结束月份"
                    min="2024-01"
                    max="2025-12"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交月份范围表单</Button>
                <Button type="reset" variant="outline">
                  重置月份范围表单
                </Button>
              </div>
            </Form>
            <output
              role="status"
              aria-label="月份范围表单结果"
              className="mt-2 block text-sm text-muted-foreground"
            >
              {result}
            </output>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
