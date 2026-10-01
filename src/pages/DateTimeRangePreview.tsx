import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DateRangePicker,
  DateTimeRangePicker,
  Form,
  FormField,
  FormItem,
  Input,
  Typography,
  type DatePickerPlacement,
  type DateTimeRange,
} from '@/shared/ui'

export function DateTimeRangePreview() {
  const [value, setValue] = useState<DateTimeRange>([
    '2024-02-29T23:30',
    '2024-03-01T00:30',
  ])
  const [rtl, setRtl] = useState(false),
    [disabled, setDisabled] = useState(false)
  const [blocked, setBlocked] = useState(false),
    [locked, setLocked] = useState(false)
  const [open, setOpen] = useState(false),
    [blurs, setBlurs] = useState(0)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交'),
    [nativeResult, setNativeResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期时间范围组合</CardTitle>
      </CardHeader>
      <CardContent>
        <section
          aria-label="日期时间范围组合预览"
          className="min-w-0 space-y-4"
        >
          <Typography tone="muted">
            两端各有日期和时间，共用一次确认。切换端点继续调整，方向键浏览，Enter
            选择，Escape
            取消；跨日范围使用完整本地日期时间。窄容器切换日期与时间，选择项至少
            44px。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期时间范围' : '禁用日期时间范围'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期时间范围' : '使用 RTL 日期时间范围'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复日期时间范围选项' : '停用日期时间范围选项'}
            </Button>
            <Button variant="outline" onClick={() => setLocked(!locked)}>
              {locked ? '恢复范围开始端点' : '停用范围开始端点'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开日期时间范围
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭日期时间范围
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="datetime-range-placement" className="text-sm">
              日期时间范围弹出位置
            </label>
            <select
              id="datetime-range-placement"
              className="min-h-11 w-full rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-base"
              value={placement}
              onChange={(event) =>
                setPlacement(event.target.value as DatePickerPlacement)
              }
            >
              {(
                ['bottomStart', 'bottomEnd', 'topStart', 'topEnd'] as const
              ).map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <FormField
                  label="跨日预约范围"
                  description="2 月 29 日 23:00 至 3 月 2 日 02:00；结束端 3 月 1 日禁用 1 点和 00:15，3 月 2 日不可选。"
                  control={
                    <DateRangePicker
                      showTime={{ minuteStep: 15 }}
                      label="跨日预约范围"
                      startLabel="预约开始日期时间"
                      endLabel="预约结束日期时间"
                      name="datetimeRange"
                      value={value}
                      onChange={setValue}
                      onBlur={() => setBlurs((count) => count + 1)}
                      min="2024-02-29T23:00"
                      max="2024-03-02T02:00"
                      disabledDate={(date, info) =>
                        info.endpoint === 'end' && date === '2024-03-02'
                      }
                      disabledHours={(date, info) =>
                        info.endpoint === 'end' &&
                        date === '2024-03-01' &&
                        info.from === '2024-02-29T23:30'
                          ? [1]
                          : []
                      }
                      disabledMinutes={(hour, date, info) =>
                        info.endpoint === 'end' &&
                        date === '2024-03-01' &&
                        hour === 0
                          ? [15]
                          : []
                      }
                      getDateDescription={(date: string) =>
                        date === '2024-02-29' ? '闰日预约' : undefined
                      }
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                      presets={[
                        {
                          key: 'next',
                          label: '次日清晨范围',
                          value: () => ['2024-03-01T00:00', '2024-03-01T02:00'],
                        },
                      ]}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期时间范围提交值"
                  className="block break-all text-sm text-muted-foreground"
                >
                  {JSON.stringify(value)}
                </output>
                <output
                  role="status"
                  aria-label="日期时间范围失焦次数"
                  className="block text-sm text-muted-foreground"
                >
                  {blurs}
                </output>
              </div>
              <FormField
                label="秒精度跨午夜"
                description="秒步长 15；结束端 3 月 1 日 00:30:30 不可选，45 秒有媒体标记。"
                control={
                  <DateTimeRangePicker
                    label="秒精度跨午夜"
                    startLabel="媒体开始日期时间"
                    endLabel="媒体结束日期时间"
                    precision="second"
                    defaultValue={[
                      '2024-02-29T23:30:15',
                      '2024-03-01T00:30:15',
                    ]}
                    min="2024-02-29T23:00:00"
                    max="2024-03-01T02:00:00"
                    secondStep={15}
                    disabledSeconds={(hour, minute, date, info) =>
                      info.endpoint === 'end' &&
                      date === '2024-03-01' &&
                      hour === 0 &&
                      minute === 30
                        ? [30]
                        : []
                    }
                    renderCell={(number, unit) =>
                      unit === 'second' && number === 45 ? (
                        <span className="text-xs">标记</span>
                      ) : null
                    }
                    getCellDescription={(number, unit) =>
                      unit === 'second' && number === 45
                        ? '媒体标记'
                        : undefined
                    }
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="12 小时日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="12 小时日期时间范围"
                    startLabel="12 小时开始日期时间"
                    endLabel="12 小时结束日期时间"
                    defaultValue={['2024-02-29T23:30', '2024-03-01T00:30']}
                    use12Hours
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="交叉清空日期时间范围"
                description="越过另一端时，清空可编辑的另一端。"
                control={
                  <DateTimeRangePicker
                    label="交叉清空日期时间范围"
                    startLabel="交叉开始日期时间"
                    endLabel="交叉结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="自动排序日期时间范围"
                description="临时值保留端点身份，提交时排序。"
                control={
                  <DateTimeRangePicker
                    label="自动排序日期时间范围"
                    startLabel="排序开始日期时间"
                    endLabel="排序结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    order="sort"
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="锁定日期时间起点"
                control={
                  <DateTimeRangePicker
                    label="锁定日期时间起点"
                    startLabel="锁定开始日期时间"
                    endLabel="可编辑结束日期时间"
                    defaultValue={['2024-02-29T23:30', '2024-03-01T00:30']}
                    disabled={disabled ? true : [true, false]}
                    order="sort"
                    minuteStep={15}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <FormField
                label="开放日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="开放日期时间范围"
                    startLabel="开放开始日期时间"
                    endLabel="开放结束日期时间"
                    defaultPanelMonth="2024-02"
                    defaultOpenTime={['09:30', '17:00']}
                    allowEmpty={[false, true]}
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="输入日期时间范围"
                description="支持 YYYY-MM-DD HH:mm 和本地 ISO 字符串；Enter 确认两端。"
                control={
                  <DateTimeRangePicker
                    label="输入日期时间范围"
                    startLabel="输入开始日期时间"
                    endLabel="输入结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    minuteStep={15}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="日期时间范围之后的字段" control={<Input />} />
              <FormField
                label="立即提交日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="立即提交日期时间范围"
                    startLabel="即时开始日期时间"
                    endLabel="即时结束日期时间"
                    defaultPanelMonth="2024-02"
                    defaultOpenTime={['09:30', '17:00']}
                    needConfirm={false}
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="外部控制日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="外部控制日期时间范围"
                    startLabel="外部开始日期时间"
                    endLabel="外部结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    open={open}
                    onOpenChange={setOpen}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="w-60 max-w-full min-w-0 space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">240px 常驻日期时间范围</Typography>
                <DateTimeRangePicker
                  label="内嵌日期时间范围"
                  startLabel="内嵌开始日期时间"
                  endLabel="内嵌结束日期时间"
                  mode="panel"
                  defaultValue={['2024-02-29T23:30:15', '2024-03-01T00:30:15']}
                  precision="second"
                  use12Hours
                  minuteStep={15}
                  secondStep={15}
                  showNow={false}
                  inputReadOnly
                  disabled={disabled}
                />
              </div>
              <div className="w-60 max-w-full min-w-0 space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">动态日期时间范围</Typography>
                <DateTimeRangePicker
                  label="动态日期时间范围"
                  startLabel="动态开始日期时间"
                  endLabel="动态结束日期时间"
                  mode="panel"
                  defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                  disabledTime={() => blocked}
                  hideDisabledOptions
                  showNow={false}
                  inputReadOnly
                  disabled={disabled ? true : [locked, false]}
                />
              </div>
              <FormField
                label="只读日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="只读日期时间范围"
                    startLabel="只读开始日期时间"
                    endLabel="只读结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    readOnly
                  />
                }
              />
              <FormField
                label="错误日期时间范围"
                error="请选择有效日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="错误日期时间范围"
                    startLabel="错误开始日期时间"
                    endLabel="错误结束日期时间"
                    value={['2024-02-30T09:30', '2024-03-01T17:00']}
                    status="error"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="小号填充日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="小号填充日期时间范围"
                    startLabel="小号开始日期时间"
                    endLabel="小号结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    variant="filled"
                    status="warning"
                    size="small"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="大号下划线日期时间范围"
                control={
                  <DateTimeRangePicker
                    label="大号下划线日期时间范围"
                    startLabel="大号开始日期时间"
                    endLabel="大号结束日期时间"
                    defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                    variant="underlined"
                    size="large"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
            </div>
            <div className="mt-4 min-w-0 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
              <Typography as="h3">响应式常驻日期时间范围</Typography>
              <DateTimeRangePicker
                label="响应式日期时间范围"
                startLabel="响应式开始日期时间"
                endLabel="响应式结束日期时间"
                mode="panel"
                defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
                minuteStep={15}
                showNow={false}
                inputReadOnly
                disabled={disabled}
              />
            </div>
            <Form
              className="mt-4"
              initialValues={{
                range: ['2024-02-29T09:30', '2024-03-01T17:00'],
              }}
              validateOn="blur"
              onFinish={(values) =>
                setResult('预约范围：' + JSON.stringify(values.range))
              }
            >
              <FormItem
                name="range"
                label="日期时间范围表单"
                emptyValue={[]}
                rules={[
                  {
                    validator: (range) =>
                      Array.isArray(range) &&
                      range.length === 2 &&
                      range.every(Boolean)
                        ? undefined
                        : '请选择完整日期时间范围',
                  },
                ]}
                control={
                  <DateRangePicker
                    showTime={{ minuteStep: 15 }}
                    label="日期时间范围表单"
                    startLabel="表单开始日期时间"
                    endLabel="表单结束日期时间"
                    name="range"
                    min="2024-02-28T09:00"
                    max="2024-03-02T17:00"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交日期时间范围表单</Button>
                <Button type="reset" variant="outline">
                  重置日期时间范围表单
                </Button>
              </div>
            </Form>
            <output
              role="status"
              aria-label="日期时间范围表单结果"
              className="mt-2 block break-all text-sm text-muted-foreground"
            >
              {result}
            </output>
            <form
              id="datetime-range-native-preview"
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                setNativeResult(
                  String(
                    new FormData(event.currentTarget).get(
                      'nativeDatetimeRange',
                    ),
                  ),
                )
              }}
            >
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交原生日期时间范围</Button>
                <Button type="reset" variant="outline">
                  重置原生日期时间范围
                </Button>
              </div>
            </form>
            <FormField
              label="原生日期时间范围"
              description="显式使用浏览器原生控件，输入关联上面的原生表单。"
              control={
                <DateTimeRangePicker
                  label="原生日期时间范围"
                  startLabel="原生开始日期时间"
                  endLabel="原生结束日期时间"
                  name="nativeDatetimeRange"
                  form="datetime-range-native-preview"
                  mode="native"
                  precision="second"
                  defaultValue={['2024-02-29T23:30:15', '2024-03-01T00:30:15']}
                  disabled={disabled}
                />
              }
            />
            <output
              role="status"
              aria-label="原生日期时间范围结果"
              className="block break-all text-sm text-muted-foreground"
            >
              {nativeResult}
            </output>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
