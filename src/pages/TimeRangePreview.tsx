import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  Form,
  FormField,
  FormItem,
  Input,
  TimeRangePicker,
  Typography,
  type DatePickerPlacement,
  type TimeRange,
} from '@/shared/ui'

const rangeText = (range: TimeRange) =>
  (range[0] || '未选开始') + ' → ' + (range[1] || '未选结束')
export function TimeRangePreview() {
  const [range, setRange] = useState<TimeRange>(['09:30', '17:00'])
  const [seconds, setSeconds] = useState<TimeRange>(['09:30:15', '10:30:15'])
  const [twelve, setTwelve] = useState<TimeRange>(['00:30', '13:30'])
  const [rtl, setRtl] = useState(false),
    [disabled, setDisabled] = useState(false),
    [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>统一时间范围面板</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="时间范围面板预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            分别调整开始和结束时间；方向键只浏览，Enter
            或触控选择，默认确定后提交。交叉时清空可编辑的另一端；自动排序示例在提交时排序。同日区间不附带日期。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用时间范围' : '禁用时间范围'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 时间范围' : '使用 RTL 时间范围'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开时间范围
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭时间范围
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="time-range-placement" className="text-sm">
              时间范围弹出位置
            </label>
            <select
              id="time-range-placement"
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
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <FormField
                  label="营业时段"
                  description="09:00–20:00，分钟步长 15；结束时间不能早于开始，结束的 11 点不可选。"
                  control={
                    <TimeRangePicker
                      label="营业时段"
                      startLabel="营业开始时间"
                      endLabel="营业结束时间"
                      value={range}
                      onChange={setRange}
                      min="09:00"
                      max="20:00"
                      minuteStep={15}
                      disabledHours={({ endpoint }) =>
                        endpoint === 'end' ? [11] : []
                      }
                      disabledTime={(time, { endpoint, from }) =>
                        endpoint === 'end' && Boolean(from && time < from)
                      }
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                      presets={[
                        {
                          key: 'afternoon',
                          label: '下午营业',
                          value: ['14:30', '18:00'],
                        },
                      ]}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="营业时段提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {rangeText(range)}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="媒体片段"
                  description="秒步长 15，结束的 10:30:30 不可选。"
                  control={
                    <TimeRangePicker
                      label="媒体片段"
                      startLabel="片段开始时间"
                      endLabel="片段结束时间"
                      value={seconds}
                      onChange={setSeconds}
                      secondStep={15}
                      disabledSeconds={(hour, minute, { endpoint }) =>
                        endpoint === 'end' && hour === 10 && minute === 30
                          ? [30]
                          : []
                      }
                      renderCell={(number, unit, { endpoint }) =>
                        endpoint === 'end' &&
                        unit === 'second' &&
                        number === 45 ? (
                          <span className="text-xs">标记</span>
                        ) : null
                      }
                      getCellDescription={(number, unit, { endpoint }) =>
                        endpoint === 'end' && unit === 'second' && number === 45
                          ? '片段结束标记'
                          : undefined
                      }
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="媒体片段提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {rangeText(seconds)}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="十二小时范围"
                  control={
                    <TimeRangePicker
                      label="十二小时范围"
                      startLabel="十二小时开始"
                      endLabel="十二小时结束"
                      value={twelve}
                      onChange={setTwelve}
                      use12Hours
                      minuteStep={15}
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="十二小时范围提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {rangeText(twelve)}
                </output>
              </div>
              <FormField
                label="自动排序时段"
                description="先保留端点身份，提交时将较早时刻放在开始端。"
                control={
                  <TimeRangePicker
                    label="自动排序时段"
                    startLabel="排序开始时间"
                    endLabel="排序结束时间"
                    defaultValue={['09:30', '17:00']}
                    order="sort"
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="输入时间范围"
                description="09:00–20:00，分钟步长 15，Enter 确认完整范围。"
                control={
                  <TimeRangePicker
                    label="输入时间范围"
                    startLabel="输入开始时间"
                    endLabel="输入结束时间"
                    defaultValue={['09:30', '17:00']}
                    min="09:00"
                    max="20:00"
                    minuteStep={15}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="时间范围之后的字段" control={<Input />} />
              <FormField
                label="锁定开始时刻"
                control={
                  <TimeRangePicker
                    label="锁定开始时刻"
                    startLabel="锁定开始时间"
                    endLabel="可编辑结束时间"
                    defaultValue={['10:00', '12:00']}
                    disabled={disabled ? true : [true, false]}
                    minuteStep={15}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <FormField
                label="开放结束时刻"
                control={
                  <TimeRangePicker
                    label="开放结束时刻"
                    startLabel="开放开始时间"
                    endLabel="开放结束时间"
                    defaultValue={['09:30', '']}
                    allowEmpty={[false, true]}
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="即时提交时段"
                control={
                  <TimeRangePicker
                    label="即时提交时段"
                    startLabel="即时开始时间"
                    endLabel="即时结束时间"
                    defaultValue={['09:30', '17:00']}
                    needConfirm={false}
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="外部开合时段"
                control={
                  <TimeRangePicker
                    label="外部开合时段"
                    startLabel="外部开始时间"
                    endLabel="外部结束时间"
                    defaultValue={['09:30', '17:00']}
                    open={open}
                    onOpenChange={setOpen}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="w-60 max-w-full space-y-2">
                <Typography as="h3">240px 常驻时间范围</Typography>
                <TimeRangePicker
                  label="内嵌时间范围"
                  startLabel="内嵌开始时间"
                  endLabel="内嵌结束时间"
                  mode="panel"
                  precision="second"
                  use12Hours
                  defaultValue={['09:30:15', '17:30:15']}
                  minuteStep={15}
                  secondStep={15}
                  inputReadOnly
                  disabled={disabled}
                />
              </div>
              <div className="min-w-0 space-y-4">
                <FormField
                  label="只读时段"
                  control={
                    <TimeRangePicker
                      label="只读时段"
                      startLabel="只读开始时间"
                      endLabel="只读结束时间"
                      defaultValue={['09:30', '17:00']}
                      readOnly
                    />
                  }
                />
                <FormField
                  label="错误时段"
                  error="请选择有效时间范围"
                  control={
                    <TimeRangePicker
                      label="错误时段"
                      startLabel="错误开始时间"
                      endLabel="错误结束时间"
                      defaultValue={['25:00', '17:00']}
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <FormField
                  label="原生时段"
                  control={
                    <TimeRangePicker
                      label="原生时段"
                      startLabel="原生开始时间"
                      endLabel="原生结束时间"
                      mode="native"
                      defaultValue={['09:30', '17:00']}
                      disabled={disabled}
                    />
                  }
                />
              </div>
            </div>
            <Form
              className="mt-4"
              initialValues={{ hours: ['09:30', '17:00'] }}
              validateOn="blur"
              onFinish={(values) =>
                setResult('预约时段：' + rangeText(values.hours as TimeRange))
              }
            >
              <FormItem
                name="hours"
                label="时间范围表单"
                emptyValue={[]}
                rules={[
                  {
                    validator: (value) =>
                      Array.isArray(value) &&
                      value.length === 2 &&
                      value.every(Boolean)
                        ? undefined
                        : '请选择完整预约时段',
                  },
                ]}
                control={
                  <TimeRangePicker
                    label="时间范围表单"
                    startLabel="表单开始时间"
                    endLabel="表单结束时间"
                    min="09:00"
                    max="20:00"
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交时间范围表单</Button>
                <Button type="reset" variant="outline">
                  重置时间范围表单
                </Button>
              </div>
            </Form>
            <output
              role="status"
              aria-label="时间范围表单结果"
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
