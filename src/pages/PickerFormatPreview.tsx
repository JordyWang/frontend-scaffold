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
  MultiDatePicker,
  TimePicker,
  TimeRangePicker,
  Typography,
  type DateRange,
  type DateTimeRange,
  type TimeRange,
  type PickerParseInput,
} from '@/shared/ui'

const dateLabel = (value: string) => '日期 ' + value.split('-').join('/')
const parseDateLabel: PickerParseInput = (text) =>
  /^日期 \d{4}\/\d{2}\/\d{2}$/.test(text)
    ? text.slice(3).replaceAll('/', '-')
    : undefined

export function PickerFormatPreview() {
  const [date, setDate] = useState('2024-02-29'),
    [dateChanges, setDateChanges] = useState(0)
  const [alternate, setAlternate] = useState(false),
    [locale, setLocale] = useState('fr-FR')
  const [range, setRange] = useState<DateRange>(['2024-02-29', '2024-03-02'])
  const [time, setTime] = useState('13:30:15.007')
  const [maskDate, setMaskDate] = useState('2024-02-29')
  const [maskTime, setMaskTime] = useState('13:30:15')
  const [timeRange, setTimeRange] = useState<TimeRange>(['09:30', '13:30'])
  const [dateTime, setDateTime] = useState('2024-02-29T13:30:15.007')
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>([
    '2024-02-29T23:30',
    '2024-03-01T01:30',
  ])
  const [multiple, setMultiple] = useState<string[]>(['2024-02-29'])
  const [functionDate, setFunctionDate] = useState('2024-02-29')
  const [submitted, setSubmitted] = useState('未提交')
  const [native, setNative] = useState('2024-02-29')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期与时间格式</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期与时间格式" className="min-w-0 space-y-4">
          <Typography tone="muted">
            可输入多种格式，确认后用首个格式显示。提交值保持规范字符串；月份名称、12
            小时时段和毫秒也使用相同规则。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAlternate(!alternate)}>
              {alternate ? '显示斜线日期' : '显示中文日期'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocale(locale === 'fr-FR' ? 'zh-CN' : 'fr-FR')}
            >
              {locale === 'fr-FR' ? '使用中文月份' : '使用法语月份'}
            </Button>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <form
              aria-label="格式日期表单"
              className="min-w-0 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmitted(
                  String(
                    new FormData(event.currentTarget).get('formattedDate'),
                  ),
                )
              }}
            >
              <FormField
                label="多格式日期"
                description="支持 YYYY-M-D、DD/MM/YYYY 和中文日期；3 月 2 日禁选。"
                control={
                  <DatePicker
                    label="多格式日期"
                    value={date}
                    format={
                      alternate
                        ? ['YYYY年MM月DD日', 'DD/MM/YYYY', 'YYYY-M-D']
                        : ['DD/MM/YYYY', 'YYYY-M-D', 'YYYY年MM月DD日']
                    }
                    name="formattedDate"
                    required
                    needConfirm
                    disabledDate={(value) => value === '2024-03-02'}
                    onChange={(value) => {
                      setDate(value)
                      setDateChanges((count) => count + 1)
                    }}
                  />
                }
              />
              <p
                role="status"
                aria-label="格式日期规范值"
                className="break-all text-sm"
              >
                {date || '空'}；提交 {dateChanges} 次
              </p>
              <Button type="submit" variant="outline">
                提交格式日期表单
              </Button>
              <p
                role="status"
                aria-label="格式日期表单结果"
                className="break-all text-sm"
              >
                {submitted}
              </p>
            </form>
            <FormField
              label="格式日期范围"
              description="展示为日/月/年，先后关系仍按真实日期判断。"
              control={
                <DateRangePicker
                  label="格式日期范围"
                  value={range}
                  startLabel="格式开始日期"
                  endLabel="格式结束日期"
                  format={['DD/MM/YYYY', 'YYYY-M-D']}
                  needConfirm
                  name="formattedRange"
                  onChange={setRange}
                />
              }
            />
            <FormField
              label="格式多选日期"
              description="Enter 添加，完成后提交；标签同样使用展示格式。"
              control={
                <MultiDatePicker
                  label="格式多选日期"
                  value={multiple}
                  format={['DD/MM/YYYY', 'YYYY-M-D']}
                  name="formattedMultiple"
                  onChange={setMultiple}
                />
              }
            />
            <FormField
              label="函数格式日期"
              description="输入“日期 2024/02/29”，或使用面板；解析结果仍是规范日期。"
              control={
                <DatePicker
                  label="函数格式日期"
                  value={functionDate}
                  format={dateLabel}
                  parseInput={parseDateLabel}
                  onChange={setFunctionDate}
                />
              }
            />
            <FormField
              label="分段掩码日期"
              description="输入数字自动补齐分隔符；左右方向键跨过分隔符，提交值仍为 YYYY-MM-DD。"
              control={
                <DatePicker
                  label="分段掩码日期"
                  value={maskDate}
                  format={{ format: 'YYYY-MM-DD', type: 'mask' }}
                  name="maskDate"
                  onChange={setMaskDate}
                />
              }
            />
            <FormField
              label="分段掩码时间"
              description="按时、分、秒分段输入，保留键盘和触控编辑。"
              control={
                <TimePicker
                  label="分段掩码时间"
                  value={maskTime}
                  precision="second"
                  format={{ format: 'HH:mm:ss', type: 'mask' }}
                  name="maskTime"
                  onChange={setMaskTime}
                />
              }
            />
            <FormField
              label="本地化月份日期"
              description="LL 使用当前语言的月份名称；切换语言保留提交值。"
              control={
                <ConfigProvider locale={locale}>
                  <DatePicker
                    label="本地化月份日期"
                    defaultValue="2024-02-29"
                    format="LL"
                    name="localizedDate"
                  />
                </ConfigProvider>
              }
            />
            <FormField
              label="早年格式日期"
              description="0001–0099 年仍按真实年份处理。"
              control={
                <DatePicker
                  label="早年格式日期"
                  defaultValue="0099-12-31"
                  format="DD/MM/YYYY"
                  name="earlyDate"
                />
              }
            />
            <FormField
              label="ISO 周格式"
              description="2020 年第 1 周从 2019 年 12 月开始；周历固定为 ISO。"
              control={
                <DatePicker
                  label="ISO 周格式"
                  picker="week"
                  defaultValue="2020-W01"
                  format="GGGG年[第]WW[周]"
                  name="isoFormatWeek"
                />
              }
            />
            <FormField
              label="季度格式"
              control={
                <DatePicker
                  label="季度格式"
                  picker="quarter"
                  defaultValue="2024-Q2"
                  format="YYYY年[第]Q[季度]"
                  name="formatQuarter"
                />
              }
            />
            <FormField
              label="月份格式"
              control={
                <DatePicker
                  label="月份格式"
                  picker="month"
                  defaultValue="2024-02"
                  format="MMM YYYY"
                  locale="en"
                />
              }
            />
            <FormField
              label="年份格式"
              control={
                <DatePicker
                  label="年份格式"
                  picker="year"
                  defaultValue="0099"
                  format="YYYY[年]"
                />
              }
            />
            <FormField
              label="多格式毫秒时间"
              description="可输入 24 小时格式，显示 12 小时及三位毫秒。"
              control={
                <TimePicker
                  label="多格式毫秒时间"
                  value={time}
                  format={['hh:mm:ss.SSS a', 'HH:mm:ss.SSS']}
                  locale="en"
                  name="formatTime"
                  onChange={setTime}
                />
              }
            />
            <FormField
              label="格式时间范围"
              control={
                <TimeRangePicker
                  label="格式时间范围"
                  value={timeRange}
                  startLabel="格式开始时间"
                  endLabel="格式结束时间"
                  format="hh:mm a"
                  locale="en"
                  name="formatTimeRange"
                  onChange={setTimeRange}
                />
              }
            />
            <FormField
              label="格式日期时间"
              control={
                <DateTimePicker
                  label="格式日期时间"
                  value={dateTime}
                  format={[
                    'DD/MM/YYYY hh:mm:ss.SSS A',
                    'YYYY-MM-DD HH:mm:ss.SSS',
                  ]}
                  locale="en"
                  name="formatDateTime"
                  onChange={setDateTime}
                />
              }
            />
            <FormField
              label="格式日期时间范围"
              control={
                <DateTimeRangePicker
                  label="格式日期时间范围"
                  value={dateTimeRange}
                  startLabel="格式开始日期时间"
                  endLabel="格式结束日期时间"
                  format="DD/MM/YYYY HH:mm"
                  name="formatDateTimeRange"
                  onChange={setDateTimeRange}
                />
              }
            />
            <FormField
              label="showTime 格式"
              control={
                <DatePicker
                  label="showTime 格式"
                  showTime={{ precision: 'second' }}
                  defaultValue="2024-02-29T13:30:15"
                  format="YYYY年MM月DD日 HH:mm:ss"
                />
              }
            />
            <FormField
              label="showTime 范围格式"
              control={
                <DateRangePicker
                  label="showTime 范围格式"
                  showTime
                  defaultValue={['2024-02-29T13:30', '2024-03-01T14:30']}
                  format="DD/MM/YYYY HH:mm"
                />
              }
            />
          </div>
          <p
            role="status"
            aria-label="格式选择规范值"
            className="break-all text-sm text-muted-foreground"
          >
            日期范围 {JSON.stringify(range)}；多选 {JSON.stringify(multiple)}
            ；时间 {time}；时间范围 {JSON.stringify(timeRange)}；日期时间{' '}
            {dateTime}；日期时间范围 {JSON.stringify(dateTimeRange)}
          </p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <form aria-label="格式原生适配" className="min-w-0 space-y-2">
              <Typography tone="muted">
                原生输入由浏览器决定展示，不应用自定义 format。
              </Typography>
              <DatePicker
                label="格式原生日期"
                mode="native"
                value={native}
                onChange={setNative}
                format="DD/MM/YYYY"
                name="formatNativeDate"
              />
              <TimePicker
                label="格式原生时间"
                mode="native"
                defaultValue="13:30"
                format="hh:mm:ss.SSS a"
                name="formatNativeTime"
              />
              <DateTimePicker
                label="格式原生日期时间"
                mode="native"
                defaultValue="2024-02-29T13:30"
                format="LLL"
                name="formatNativeDateTime"
              />
              <DateTimeRangePicker
                label="格式原生日期时间范围"
                startLabel="格式原生开始"
                endLabel="格式原生结束"
                mode="native"
                defaultValue={['2024-02-29T13:30', '2024-03-01T14:30']}
                format="LLL"
                name="formatNativeRange"
              />
              <Button type="reset" variant="outline">
                重置原生格式
              </Button>
            </form>
            <ConfigProvider
              direction="rtl"
              locale="en"
              theme={{ mode: 'dark' }}
            >
              <div
                className="w-60 max-w-full min-w-0 space-y-2"
                aria-label="窄容器格式"
              >
                <Typography>240px RTL 深色格式</Typography>
                <TimePicker
                  label="窄容器格式时间"
                  mode="panel"
                  defaultValue="12:30:15.100"
                  precision="millisecond"
                  format="hh:mm:ss.SSS A"
                  hourStep={3}
                  minuteStep={15}
                  secondStep={15}
                  millisecondStep={100}
                />
                <DateRangePicker
                  label="窄容器格式日期"
                  mode="panel"
                  defaultValue={['2024-02-29', '2024-03-02']}
                  format="DD/MM/YYYY"
                  needConfirm
                />
              </div>
            </ConfigProvider>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
