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
  TimePicker,
  Typography,
  type DatePickerPlacement,
} from '@/shared/ui'

export function TimePickerPreview() {
  const [time, setTime] = useState('09:30'),
    [seconds, setSeconds] = useState('09:30:15'),
    [twelve, setTwelve] = useState('00:30')
  const [rtl, setRtl] = useState(false),
    [disabled, setDisabled] = useState(false),
    [blocked, setBlocked] = useState(false),
    [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>统一时间选择面板</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="时间选择面板预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            上下方向键和 Home/End 浏览时、分、秒，左右方向键切换列；Enter
            选择，确定后提交，Escape 取消。12 小时制显示 AM/PM，提交值仍使用 24
            小时本地时间。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用时间面板' : '禁用时间面板'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 时间面板' : '使用 RTL 时间面板'}
            </Button>
            <Button variant="outline" onClick={() => setBlocked(!blocked)}>
              {blocked ? '恢复可选时间' : '停用所有时间'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              外部打开时间
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              外部关闭时间
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="time-picker-placement" className="text-sm">
              时间弹出位置
            </label>
            <select
              id="time-picker-placement"
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
                  label="预约时分"
                  description="09:00–17:00，分钟步长 15，11 点不可选；10 点禁止选择 30 分。"
                  control={
                    <TimePicker
                      label="预约时分"
                      value={time}
                      onChange={setTime}
                      min="09:00"
                      max="17:00"
                      minuteStep={15}
                      disabledHours={() => [11]}
                      disabledMinutes={(hour) => (hour === 10 ? [30] : [])}
                      inputReadOnly
                      disabled={disabled}
                      placement={placement}
                      presets={[
                        { key: 'afternoon', label: '下午预约', value: '14:30' },
                      ]}
                    />
                  }
                />
                <output
                  role="status"
                  aria-label="预约时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {time}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="媒体时间点"
                  description="秒步长 15，09:30:30 不可选。"
                  control={
                    <TimePicker
                      label="媒体时间点"
                      precision="second"
                      value={seconds}
                      onChange={setSeconds}
                      secondStep={15}
                      disabledSeconds={(hour, minute) =>
                        hour === 9 && minute === 30 ? [30] : []
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
                  aria-label="媒体时间提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {seconds}
                </output>
              </div>
              <div className="min-w-0 space-y-2">
                <FormField
                  label="十二小时预约"
                  control={
                    <TimePicker
                      label="十二小时预约"
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
                  aria-label="十二小时提交值"
                  className="block text-sm text-muted-foreground"
                >
                  {twelve}
                </output>
              </div>
              <FormField
                label="输入预约时间"
                description="09:00–17:00，分钟步长 15；Enter 提交合法时间，移出控件会取消未确认输入。"
                control={
                  <TimePicker
                    label="输入预约时间"
                    defaultValue="09:30"
                    min="09:00"
                    max="17:00"
                    minuteStep={15}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField label="时间之后的字段" control={<Input />} />
              <FormField
                label="即时选择时间"
                description="选择后立即提交，可以继续调整其他列。"
                control={
                  <TimePicker
                    label="即时选择时间"
                    defaultValue="09:30"
                    minuteStep={15}
                    needConfirm={false}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="外部开合时间"
                control={
                  <TimePicker
                    label="外部开合时间"
                    defaultValue="09:30"
                    open={open}
                    onOpenChange={setOpen}
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <FormField
                label="午夜时段"
                description="23:30 至次日 01:00，时间字符串不附带日期。"
                control={
                  <TimePicker
                    label="午夜时段"
                    defaultValue="00:15"
                    min="23:30"
                    max="01:00"
                    step={900}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="w-60 max-w-full space-y-2">
                <Typography as="h3">240px 常驻时间</Typography>
                <TimePicker
                  label="内嵌时间"
                  mode="panel"
                  precision="second"
                  use12Hours
                  defaultValue="14:30:15"
                  minuteStep={15}
                  secondStep={15}
                  inputReadOnly
                  disabled={disabled}
                  showNow={false}
                />
              </div>
              <div className="min-w-0 space-y-4">
                <FormField
                  label="只读时间"
                  control={
                    <TimePicker
                      label="只读时间"
                      defaultValue="09:30"
                      readOnly
                    />
                  }
                />
                <FormField
                  label="警告时间"
                  control={
                    <TimePicker
                      label="警告时间"
                      defaultValue="14:30"
                      variant="underlined"
                      status="warning"
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <FormField
                  label="错误时间"
                  error="请选择有效时间"
                  control={
                    <TimePicker
                      label="错误时间"
                      defaultValue="25:00"
                      disabled={disabled}
                      placement={placement}
                    />
                  }
                />
                <FormField
                  label="原生时间适配"
                  control={
                    <TimePicker
                      label="原生时间适配"
                      mode="native"
                      defaultValue="09:30"
                      disabled={disabled}
                    />
                  }
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Typography as="h3">动态可用时间</Typography>
                <TimePicker
                  label="动态时间"
                  mode="panel"
                  defaultValue="09:30"
                  minuteStep={15}
                  disabledTime={() => blocked}
                  hideDisabledOptions
                  showNow={false}
                  disabled={disabled}
                />
              </div>
            </div>
            <Form
              initialValues={{ time: '09:30' }}
              validateOn="blur"
              onFinish={(values) => setResult('预约时间：' + values.time)}
              className="mt-4"
            >
              <FormItem
                name="time"
                label="时间预约表单"
                emptyValue=""
                rules={[{ required: true, message: '请选择预约时刻' }]}
                control={
                  <TimePicker
                    label="时间预约表单"
                    min="09:00"
                    max="17:00"
                    minuteStep={15}
                    inputReadOnly
                    disabled={disabled}
                    placement={placement}
                  />
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交时间预约表单</Button>
                <Button type="reset" variant="outline">
                  重置时间预约表单
                </Button>
              </div>
            </Form>
            <output
              role="status"
              aria-label="时间表单结果"
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
