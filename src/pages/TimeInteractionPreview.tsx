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
  TimePicker,
  TimeRangePicker,
  FormField,
  Input,
  Typography,
  type TimeRange,
  type DateTimeRange,
} from '@/shared/ui'

export function TimeInteractionPreview() {
  const [time, setTime] = useState('09:30'),
    [immediate, setImmediate] = useState('09:30')
  const [range, setRange] = useState<TimeRange>(['09:30', '17:00'])
  const [date, setDate] = useState('2024-02-29T09:30')
  const [dateRange, setDateRange] = useState<DateTimeRange>([
    '2024-02-29T23:30:15',
    '2024-03-01T00:30:15',
  ])
  const [rtl, setRtl] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [changes, setChanges] = useState(0),
    [rangeChanges, setRangeChanges] = useState(0)
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>时间滚动与悬停预览</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="时间滚动与悬停预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            滚动选择为可选能力，停止滚动后才改变待选值；确认模式仍需点击确定。鼠标悬停只在输入中预览，不改变待选值、选中语义或表单值；触控和键盘选择沿用原有交互。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 滚动时间' : '使用 RTL 滚动时间'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复滚动选项' : '停用滚动选项'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <FormField
                  label="确认滚动时间"
                  description="小时 10 不可选，分钟步长 15。悬停预览默认开启。"
                  control={
                    <TimePicker
                      label="确认滚动时间"
                      value={time}
                      name="scrollTime"
                      changeOnScroll
                      onChange={(value) => {
                        setTime(value)
                        setChanges((count) => count + 1)
                      }}
                      minuteStep={15}
                      disabledHours={() =>
                        blocked
                          ? Array.from({ length: 24 }, (_, index) => index)
                          : [10]
                      }
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="滚动时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {time}
                </output>
                <output
                  role="status"
                  aria-label="滚动时间值回调次数"
                  className="block text-sm text-muted-foreground"
                >
                  {changes}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="立即滚动时间"
                  description="停止滚动后立即提交，可选择到 23 点和 59 分。"
                  control={
                    <TimePicker
                      label="立即滚动时间"
                      value={immediate}
                      changeOnScroll
                      needConfirm={false}
                      previewValue={false}
                      onChange={setImmediate}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="立即滚动提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {immediate}
                </output>
              </div>
              <FormField
                label="关闭悬停预览"
                description="鼠标悬停不改变输入，滚动仅浏览。"
                control={
                  <TimePicker
                    label="关闭悬停预览"
                    defaultValue="09:30"
                    previewValue={false}
                    inputReadOnly
                    showNow={false}
                  />
                }
              />
              <div className="min-w-0 space-y-2">
                <FormField
                  label="滚动时间范围"
                  description="交叉清空可编辑端点，完整范围一次确认。"
                  control={
                    <TimeRangePicker
                      label="滚动时间范围"
                      startLabel="滚动开始时间"
                      endLabel="滚动结束时间"
                      value={range}
                      name="scrollRange"
                      onChange={setRange}
                      onCalendarChange={() =>
                        setRangeChanges((count) => count + 1)
                      }
                      changeOnScroll
                      minuteStep={15}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="滚动时间范围提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {JSON.stringify(range)}
                </output>
                <output
                  role="status"
                  aria-label="滚动时间范围临时回调次数"
                  className="block text-sm text-muted-foreground"
                >
                  {rangeChanges}
                </output>
              </div>
              <FormField
                label="锁定滚动起点"
                control={
                  <TimeRangePicker
                    label="锁定滚动起点"
                    startLabel="锁定滚动开始时间"
                    endLabel="可编辑滚动结束时间"
                    defaultValue={['10:30', '12:00']}
                    disabled={[true, false]}
                    changeOnScroll
                    minuteStep={15}
                    inputReadOnly
                    showNow={false}
                  />
                }
              />
              <div className="min-w-0 space-y-2">
                <FormField
                  label="日期时间滚动"
                  control={
                    <DatePicker
                      label="日期时间滚动"
                      showTime={{ changeOnScroll: true, minuteStep: 15 }}
                      value={date}
                      name="scrollDateTime"
                      onChange={setDate}
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期时间滚动提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {date}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="跨日滚动范围"
                  description="结束端 00:30:30 不可选，滚动限制带日期和另一端信息。"
                  control={
                    <DateRangePicker
                      label="跨日滚动范围"
                      startLabel="跨日滚动开始日期时间"
                      endLabel="跨日滚动结束日期时间"
                      showTime={{ changeOnScroll: true, secondStep: 15 }}
                      value={dateRange}
                      name="scrollDateTimeRange"
                      onChange={setDateRange}
                      min="2024-02-29T23:00:00"
                      max="2024-03-01T02:00:00"
                      disabledSeconds={(hour, minute, date, info) =>
                        info.endpoint === 'end' &&
                        date === '2024-03-01' &&
                        hour === 0 &&
                        minute === 30
                          ? [30]
                          : []
                      }
                      inputReadOnly
                      showNow={false}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="跨日滚动范围提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(dateRange)}
                </output>
              </div>
              <FormField label="滚动之后的字段" control={<Input />} />
              <div className="w-60 max-w-full min-w-0 space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">240px 滚动时间</Typography>
                <TimePicker
                  label="窄容器滚动时间"
                  mode="panel"
                  defaultValue="00:30:15"
                  precision="second"
                  use12Hours
                  changeOnScroll
                  minuteStep={15}
                  secondStep={15}
                  inputReadOnly
                  showNow={false}
                />
              </div>
            </div>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
