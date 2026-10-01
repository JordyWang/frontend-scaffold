import { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfigProvider,
  DatePicker,
  DateRangePicker,
  FormField,
  Input,
  Typography,
  type DateRange,
  type DateTimeRange,
} from '@/shared/ui'

export function DateInputPreview() {
  const [date, setDate] = useState('2024-02-10')
  const [range, setRange] = useState<DateRange>(['2024-02-10', '2024-02-15'])
  const [multiple, setMultiple] = useState(['2024-02-10'])
  const [dateTime, setDateTime] = useState('2024-02-29T09:30')
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>([
    '2024-02-28T23:30',
    '2024-02-29T09:30',
  ])
  const [changes, setChanges] = useState(0),
    [pending, setPending] = useState(0)
  const [submissions, setSubmissions] = useState(0)
  const [rtl, setRtl] = useState(false),
    [blocked, setBlocked] = useState(false)
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期输入悬停预览</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期输入悬停预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            鼠标悬停暂时显示可选日期，离开后恢复实际值。预览不会新增标签、清空另一端、提交表单或触发选择回调；键盘与触控继续使用实际选择。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期预览' : '使用 RTL 日期预览'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复日期预览选项' : '停用日期预览选项'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <FormField
                  label="悬停确认日期"
                  description="12 日可动态停用，选择后需确认。"
                  control={
                    <DatePicker
                      label="悬停确认日期"
                      value={date}
                      name="previewDate"
                      needConfirm
                      inputReadOnly
                      disabledDate={(value) =>
                        blocked && value === '2024-02-12'
                      }
                      onChange={(value) => {
                        setDate(value)
                        setChanges((count) => count + 1)
                      }}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期预览提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {date}
                </output>
                <output
                  role="status"
                  aria-label="日期预览值回调次数"
                  className="block text-sm text-muted-foreground"
                >
                  {changes}
                </output>
              </div>
              <FormField
                label="关闭日期预览"
                control={
                  <DatePicker
                    label="关闭日期预览"
                    defaultValue="2024-02-10"
                    previewValue={false}
                    needConfirm
                    inputReadOnly
                  />
                }
              />
              <div className="min-w-0 space-y-2">
                <FormField
                  label="悬停日期范围"
                  description="悬停跨过另一端也保留原元组。"
                  control={
                    <DateRangePicker
                      label="悬停日期范围"
                      startLabel="预览开始日期"
                      endLabel="预览结束日期"
                      value={range}
                      name="previewDateRange"
                      needConfirm
                      inputReadOnly
                      onChange={setRange}
                      onCalendarChange={() => setPending((count) => count + 1)}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期范围预览提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(range)}
                </output>
                <output
                  role="status"
                  aria-label="日期范围预览临时回调次数"
                  className="block text-sm text-muted-foreground"
                >
                  {pending}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="悬停多选日期"
                  control={
                    <DatePicker
                      multiple
                      label="悬停多选日期"
                      value={multiple}
                      name="previewMultiple"
                      needConfirm
                      inputReadOnly
                      onChange={setMultiple}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="多选日期预览提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(multiple)}
                </output>
              </div>
              {(
                [
                  ['week', '悬停周', '2024-W08'],
                  ['month', '悬停月', '2024-02'],
                  ['quarter', '悬停季度', '2024-Q1'],
                  ['year', '悬停年', '2024'],
                ] as const
              ).map(([picker, label, value]) => (
                <FormField
                  key={picker}
                  label={label}
                  control={
                    <DatePicker
                      picker={picker}
                      label={label}
                      defaultValue={value}
                      needConfirm
                      inputReadOnly
                    />
                  }
                />
              ))}
              <div className="min-w-0 space-y-2">
                <FormField
                  label="悬停日期时间"
                  description="3 月 1 日最多到 08:00，预览按同一约束补全时间。"
                  control={
                    <DatePicker
                      label="悬停日期时间"
                      showTime
                      value={dateTime}
                      name="previewDateTime"
                      max="2024-03-01T08:00"
                      onChange={setDateTime}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期时间预览提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {dateTime}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="悬停跨日范围"
                  control={
                    <DateRangePicker
                      label="悬停跨日范围"
                      startLabel="预览开始日期时间"
                      endLabel="预览结束日期时间"
                      showTime
                      value={dateTimeRange}
                      name="previewDateTimeRange"
                      onChange={setDateTimeRange}
                      inputReadOnly
                      showNow={false}
                      disabledMinutes={(hour, date, info) =>
                        info.endpoint === 'end' &&
                        date === '2024-03-01' &&
                        hour === 9
                          ? [30]
                          : []
                      }
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="跨日范围预览提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(dateTimeRange)}
                </output>
              </div>
              <form
                aria-label="预览必填校验"
                className="min-w-0 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmissions((count) => count + 1)
                }}
              >
                <FormField
                  label="必填日期预览"
                  description="空值悬停显示日期后仍需实际选择并确认。"
                  control={
                    <DatePicker
                      label="必填日期预览"
                      required
                      name="previewRequired"
                      needConfirm
                      defaultPanelMonth="2024-02"
                    />
                  }
                />
                <Button type="submit">提交预览必填表单</Button>
                <output
                  role="status"
                  aria-label="预览必填表单提交次数"
                  className="block text-sm text-muted-foreground"
                >
                  {submissions}
                </output>
              </form>
              <FormField label="预览之后的字段" control={<Input />} />
              <div className="w-60 max-w-full min-w-0 space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">240px 日期预览</Typography>
                <DatePicker
                  label="窄容器日期预览"
                  mode="panel"
                  defaultValue="2024-02-10"
                  needConfirm
                  inputReadOnly
                  disabledDate={(value) => blocked && value === '2024-02-12'}
                />
              </div>
            </div>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
