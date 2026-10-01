import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DatePicker,
  DateTimePicker,
  Form,
  FormField,
  FormItem,
  Input,
  Typography,
  type DatePickerPlacement,
} from '@/shared/ui'

export function DateTimePreview() {
  const [value, setValue] = useState('2024-02-28T09:30')
  const [seconds, setSeconds] = useState('2024-02-29T23:30:15')
  const [rtl, setRtl] = useState(false),
    [disabled, setDisabled] = useState(false)
  const [open, setOpen] = useState(false),
    [blocked, setBlocked] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交'),
    [nativeResult, setNativeResult] = useState('尚未提交')
  const [blurs, setBlurs] = useState(0)
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期时间组合</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期时间组合预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            日期和时间共用一次确认。日期网格方向键只浏览，Enter
            选择；时间列支持上下方向键和
            Home/End，左右方向键切列。窄容器使用“选择日期”和“调整时间”切换，Escape
            取消，提交值保留本地日期时间。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期时间' : '禁用日期时间'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期时间' : '使用 RTL 日期时间'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复日期时间选项' : '停用日期时间选项'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开日期时间
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭日期时间
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="datetime-placement" className="text-sm">
              日期时间弹出位置
            </label>
            <select
              id="datetime-placement"
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
                  label="跨闰月预约"
                  description="2 月 28 日 09:00 至 3 月 2 日 17:00；2 月 29 日禁用 9 点，10 点禁用 30 分，3 月 2 日不可选。"
                  control={
                    <DatePicker
                      showTime={{ minuteStep: 15 }}
                      label="跨闰月预约"
                      value={value}
                      onChange={setValue}
                      onBlur={() => setBlurs((count) => count + 1)}
                      min="2024-02-28T09:00"
                      max="2024-03-02T17:00"
                      disabledDate={(date) => date === '2024-03-02'}
                      disabledHours={(date) =>
                        date === '2024-02-29' ? [9] : []
                      }
                      disabledMinutes={(hour) => (hour === 10 ? [30] : [])}
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                      presets={[
                        {
                          key: 'next',
                          label: '次日午后',
                          value: () => '2024-03-01T14:30',
                        },
                      ]}
                      getDateDescription={(date) =>
                        date === '2024-02-29' ? '闰日预约' : undefined
                      }
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="日期时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {value}
                </output>
                <output
                  role="status"
                  aria-label="日期时间失焦次数"
                  className="block text-sm text-muted-foreground"
                >
                  {blurs}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="跨日媒体时刻"
                  description="秒步长 15，2 月 29 日 23:30:30 不可选。"
                  control={
                    <DateTimePicker
                      label="跨日媒体时刻"
                      precision="second"
                      value={seconds}
                      onChange={setSeconds}
                      min="2024-02-29T23:00:00"
                      max="2024-03-01T02:00:00"
                      secondStep={15}
                      disabledSeconds={(hour, minute, date) =>
                        date === '2024-02-29' && hour === 23 && minute === 30
                          ? [30]
                          : []
                      }
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
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
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="媒体日期时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {seconds}
                </output>
              </div>
              <FormField
                label="12 小时日期时间"
                control={
                  <DateTimePicker
                    label="12 小时日期时间"
                    defaultValue="2024-02-29T00:30"
                    use12Hours
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="默认打开时间"
                description="先选日期，再补入默认 09:30；打开面板本身不选择。"
                control={
                  <DatePicker
                    label="默认打开时间"
                    showTime={{ defaultOpenTime: '09:30', minuteStep: 15 }}
                    defaultPanelMonth="2024-02"
                    min="2024-02-28T10:00"
                    max="2024-03-02T17:00"
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="输入日期时间"
                description="可输入 YYYY-MM-DD HH:mm 或 YYYY-MM-DDTHH:mm，Enter 确认。"
                control={
                  <DateTimePicker
                    label="输入日期时间"
                    defaultValue="2024-02-29T09:30"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="日期时间之后的字段" control={<Input />} />
              <FormField
                label="立即提交日期时间"
                control={
                  <DateTimePicker
                    label="立即提交日期时间"
                    defaultValue="2024-02-29T09:30"
                    needConfirm={false}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="外部控制日期时间"
                control={
                  <DateTimePicker
                    label="外部控制日期时间"
                    defaultValue="2024-02-29T09:30"
                    open={open}
                    onOpenChange={setOpen}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="w-60 max-w-full space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">240px 常驻组合</Typography>
                <DateTimePicker
                  label="窄容器日期时间"
                  mode="panel"
                  defaultValue="2024-02-29T09:30"
                  minuteStep={15}
                  disabled={disabled}
                  showNow={false}
                  inputReadOnly
                />
              </div>
              <div className="w-60 max-w-full space-y-2 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
                <Typography as="h3">动态可用性</Typography>
                <DateTimePicker
                  label="动态日期时间"
                  mode="panel"
                  defaultValue="2024-02-29T09:30"
                  disabledTime={() => blocked}
                  hideDisabledOptions
                  disabled={disabled}
                  showNow={false}
                  inputReadOnly
                />
              </div>
              <FormField
                label="只读日期时间"
                control={
                  <DateTimePicker
                    label="只读日期时间"
                    defaultValue="2024-02-29T09:30"
                    readOnly
                  />
                }
              />
              <FormField
                label="错误日期时间"
                error="请选择有效日期时间"
                control={
                  <DateTimePicker
                    label="错误日期时间"
                    value="2024-02-29T08:00"
                    min="2024-02-29T09:00"
                    status="error"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="警告日期时间"
                control={
                  <DateTimePicker
                    label="警告日期时间"
                    defaultValue="2024-02-29T09:30"
                    variant="filled"
                    status="warning"
                    size="small"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="大号下划线日期时间"
                control={
                  <DateTimePicker
                    label="大号下划线日期时间"
                    defaultValue="2024-02-29T09:30"
                    variant="underlined"
                    size="large"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
            </div>
            <div className="mt-4 min-w-0 rounded-[var(--ui-card-radius)] border border-border bg-card p-2">
              <Typography as="h3">响应式常驻组合</Typography>
              <DateTimePicker
                label="响应式日期时间"
                mode="panel"
                defaultValue="2024-02-29T09:30"
                minuteStep={15}
                disabled={disabled}
                showNow={false}
                inputReadOnly
              />
            </div>
            <Form
              initialValues={{ appointment: '2024-02-29T09:30' }}
              validateOn="blur"
              onFinish={(values) => setResult('预约：' + values.appointment)}
              className="mt-4"
            >
              <FormItem
                name="appointment"
                label="日期时间预约表单"
                emptyValue=""
                rules={[{ required: true, message: '请选择完整预约时刻' }]}
                control={
                  <DatePicker
                    showTime={{ minuteStep: 15 }}
                    label="日期时间预约表单"
                    name="appointment"
                    min="2024-02-28T09:00"
                    max="2024-03-02T17:00"
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交日期时间表单</Button>
                <Button type="reset" variant="outline">
                  重置日期时间表单
                </Button>
              </div>
            </Form>
            <output
              role="status"
              aria-label="日期时间表单结果"
              className="mt-2 block text-sm text-muted-foreground"
            >
              {result}
            </output>
            <form
              id="datetime-native-preview"
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                setNativeResult(
                  String(
                    new FormData(event.currentTarget).get('nativeDatetime'),
                  ),
                )
              }}
            >
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交原生日期时间</Button>
                <Button type="reset" variant="outline">
                  重置原生日期时间
                </Button>
              </div>
            </form>
            <FormField
              label="原生日期时间"
              description="显式使用浏览器原生日期时间控件；下面的输入关联上面的原生表单。"
              control={
                <DateTimePicker
                  label="原生日期时间"
                  name="nativeDatetime"
                  form="datetime-native-preview"
                  mode="native"
                  precision="second"
                  defaultValue="2024-02-29T09:30:15"
                  disabled={disabled}
                />
              }
            />
            <output
              role="status"
              aria-label="原生日期时间结果"
              className="block text-sm text-muted-foreground"
            >
              {nativeResult}
            </output>
          </ConfigProvider>
        </section>
      </CardContent>
    </Card>
  )
}
