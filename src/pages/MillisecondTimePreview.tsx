import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  FormField,
  Input,
  TimePicker,
  TimeRangePicker,
  Typography,
  type DateTimeRange,
  type TimeRange,
} from '@/shared/ui'

export function MillisecondTimePreview() {
  const [time, setTime] = useState('09:30:15.125'),
    [changes, setChanges] = useState(0)
  const [range, setRange] = useState<TimeRange>([
    '09:30:00.100',
    '09:30:00.400',
  ])
  const [date, setDate] = useState('2024-02-29T23:59:59.900')
  const [dateRange, setDateRange] = useState<DateTimeRange>([
    '2024-02-29T23:59:59.950',
    '2024-03-01T00:00:00.550',
  ])
  const [rtl, setRtl] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [submitted, setSubmitted] = useState('未提交')
  const [nativeValues, setNativeValues] = useState<
    Record<string, string | string[]>
  >({})
  const recordNative = (label: string, value: string | string[]) =>
    setNativeValues((previous) => ({ ...previous, [label]: value }))
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>毫秒时间精度</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="毫秒时间精度" className="min-w-0 space-y-4">
          <Typography tone="muted">
            时间精确到三位毫秒，日期时间保留本地字段。悬停仅预览，确认后更新提交值；在窄容器中横向浏览时间列，每个选项仍可通过键盘和触控选择。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 毫秒时间' : '使用 RTL 毫秒时间'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复毫秒选项' : '禁用 500 毫秒'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <form
                aria-label="毫秒时间表单"
                className="min-w-0 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(
                    String(
                      new FormData(event.currentTarget).get('millisecondTime'),
                    ),
                  )
                }}
              >
                <FormField
                  label="完整毫秒时间"
                  description="000 到 999 共 1000 个选项；126 毫秒禁用，默认悬停预览。"
                  control={
                    <TimePicker
                      label="完整毫秒时间"
                      value={time}
                      name="millisecondTime"
                      required
                      onChange={(next) => {
                        setTime(next)
                        setChanges((count) => count + 1)
                      }}
                      disabledMilliseconds={() => [126]}
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="毫秒时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {time}
                </output>
                <output
                  role="status"
                  aria-label="毫秒时间回调次数"
                  className="block text-sm text-muted-foreground"
                >
                  {changes}
                </output>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="outline">
                    提交毫秒时间
                  </Button>
                  <Button
                    type="reset"
                    variant="outline"
                    onClick={() => {
                      setTime('09:30:15.125')
                      setChanges(0)
                      setSubmitted('未提交')
                    }}
                  >
                    重置毫秒时间
                  </Button>
                </div>
                <output
                  role="status"
                  aria-label="毫秒表单结果"
                  className="block text-sm text-muted-foreground"
                >
                  {submitted}
                </output>
              </form>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="毫秒时间范围"
                  description="100 毫秒步长，结束端 200 毫秒禁用，提交时自动排序。"
                  control={
                    <TimeRangePicker
                      label="毫秒时间范围"
                      startLabel="毫秒开始时间"
                      endLabel="毫秒结束时间"
                      value={range}
                      name="millisecondRange"
                      onChange={setRange}
                      millisecondStep={100}
                      use12Hours
                      order="sort"
                      inputReadOnly
                      disabledMilliseconds={(_hour, _minute, _second, info) =>
                        info.endpoint === 'end' ? [200] : []
                      }
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="毫秒范围提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(range)}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="毫秒日期时间"
                  description="跨闰日边界；03-01 的 100 毫秒不可选。"
                  control={
                    <DatePicker
                      label="毫秒日期时间"
                      showTime={{
                        millisecondStep: 100,
                        disabledMilliseconds: (_h, _m, _s, day) =>
                          day === '2024-03-01' ? [100] : [],
                      }}
                      value={date}
                      onChange={setDate}
                      min="2024-02-29T23:00:00.000"
                      max="2024-03-01T01:00:00.900"
                      step={0.1}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="毫秒日期时间提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {date}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="跨日毫秒范围"
                  description="起点锁定，300 毫秒总步长从原始 950 毫秒跨日计算，结束端可选 250、550、850。"
                  control={
                    <DateRangePicker
                      label="跨日毫秒范围"
                      startLabel="跨日毫秒开始"
                      endLabel="跨日毫秒结束"
                      showTime={{ millisecondStep: 50 }}
                      value={dateRange}
                      name="millisecondDateRange"
                      onChange={setDateRange}
                      disabled={[true, false]}
                      min="2024-02-29T23:59:59.950"
                      max="2024-03-01T00:00:00.900"
                      step={0.3}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="跨日毫秒范围提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(dateRange)}
                </output>
              </div>
              <FormField
                label="原生毫秒时间"
                control={
                  <TimePicker
                    label="原生毫秒时间"
                    onChange={(value) => recordNative('原生毫秒时间', value)}
                    mode="native"
                    precision="millisecond"
                    defaultValue="09:30:00.125"
                  />
                }
              />
              <FormField
                label="原生毫秒时间范围"
                control={
                  <TimeRangePicker
                    label="原生毫秒时间范围"
                    onChange={(value) =>
                      recordNative('原生毫秒开始时间', value)
                    }
                    startLabel="原生毫秒开始时间"
                    endLabel="原生毫秒结束时间"
                    mode="native"
                    precision="millisecond"
                    defaultValue={['09:30:00.125', '10:30:00.500']}
                  />
                }
              />
              <FormField
                label="原生毫秒日期时间"
                control={
                  <DateTimePicker
                    label="原生毫秒日期时间"
                    onChange={(value) =>
                      recordNative('原生毫秒日期时间', value)
                    }
                    mode="native"
                    precision="millisecond"
                    defaultValue="2024-02-29T09:30:00.125"
                  />
                }
              />
              <FormField
                label="原生毫秒日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="原生毫秒日期时间范围"
                    onChange={(value) =>
                      recordNative('原生毫秒开始日期时间', value)
                    }
                    startLabel="原生毫秒开始日期时间"
                    endLabel="原生毫秒结束日期时间"
                    mode="native"
                    precision="millisecond"
                    defaultValue={[
                      '2024-02-29T09:30:00.125',
                      '2024-03-01T10:30:00.500',
                    ]}
                  />
                }
              />
              <output
                role="status"
                aria-label="原生毫秒提交值"
                className="col-span-full block break-all text-sm text-muted-foreground"
              >
                {JSON.stringify(nativeValues)}
              </output>
              <div
                data-millisecond-narrow
                className="w-60 max-w-full min-w-0 space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2"
              >
                <Typography as="h3">240px 毫秒时间</Typography>
                <TimePicker
                  label="窄容器毫秒时间"
                  name="narrowMillisecondTime"
                  mode="panel"
                  defaultValue="13:30:15.100"
                  use12Hours
                  millisecondStep={100}
                  changeOnScroll
                  hideDisabledOptions
                  disabledMilliseconds={() => (blocked ? [200, 500] : [200])}
                  inputReadOnly
                  showNow={false}
                  renderCell={(value, unit) =>
                    unit === 'millisecond' && value === 300 ? (
                      <span className="text-xs">推荐</span>
                    ) : null
                  }
                  getCellDescription={(value, unit) =>
                    unit === 'millisecond' && value === 300
                      ? '推荐精度'
                      : undefined
                  }
                />
              </div>
              <FormField label="毫秒之后的字段" control={<Input />} />
            </div>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
