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
  type DateRange,
  type DatePickerPlacement,
} from '@/shared/ui'

export function DateRangePreview() {
  const [value, setValue] = useState<DateRange>(['2024-02-28', '2024-03-02'])
  const [confirmed, setConfirmed] = useState<DateRange>([
    '2024-02-10',
    '2024-02-14',
  ])
  const [pending, setPending] = useState('尚未浏览')
  const [rtl, setRtl] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期范围面板</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期范围面板预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            选择开始后继续选择结束；浏览与临时范围不会提交。桌面显示相邻两个月，窄容器显示单月。允许留空时用“应用范围”确认开放区间。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 范围' : '使用 RTL 范围'}
            </Button>
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用范围面板' : '禁用范围面板'}
            </Button>
            <Button variant="outline" onClick={() => setValue(['', ''])}>
              清空受控范围
            </Button>
            <Button
              variant="outline"
              onClick={() => setValue(['2024-02-28', '2024-03-02'])}
            >
              回填闰月范围
            </Button>
            <Button variant="outline" onClick={() => setOpen(!open)}>
              {open ? '外部关闭范围' : '外部打开范围'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <DateRangePicker
                label="行程范围"
                startLabel="行程开始"
                endLabel="行程结束"
                value={value}
                onChange={setValue}
                onCalendarChange={(range, { endpoint }) =>
                  setPending(endpoint + '：' + range.join(' → '))
                }
                min="2024-02-01"
                max="2024-03-31"
                inputReadOnly
                disabled={disabled}
                placement={placement}
              />
              <FormField
                label="范围之后的输入"
                control={<Input aria-label="范围之后的输入" />}
              />
              <DateRangePicker
                label="确认范围"
                startLabel="确认开始"
                endLabel="确认结束"
                value={confirmed}
                onChange={setConfirmed}
                min="2024-02-01"
                max="2024-03-31"
                inputReadOnly
                needConfirm
                disabled={disabled}
                disabledDate={(date) => date === '2024-02-12'}
                presets={[
                  {
                    key: 'leap',
                    label: '闰月预设范围',
                    value: ['2024-02-28', '2024-03-02'],
                  },
                  {
                    key: 'blocked',
                    label: '不可选范围',
                    value: ['2024-02-12', '2024-02-14'],
                  },
                ]}
              />
              <DateRangePicker
                label="输入范围"
                startLabel="输入开始"
                endLabel="输入结束"
                defaultValue={['2024-02-10', '2024-02-14']}
                min="2024-02-01"
                max="2024-03-31"
                disabledDate={(date) => date === '2024-02-12'}
                disabled={disabled}
              />
              <DateRangePicker
                label="锁定开始范围"
                startLabel="锁定开始"
                endLabel="可选结束"
                defaultValue={['2024-02-28', '2024-03-02']}
                min="2024-02-01"
                max="2024-03-31"
                inputReadOnly
                disabled={disabled ? true : [true, false]}
                disabledDate={(date, { from }) =>
                  Boolean(
                    from &&
                    Math.abs(Date.parse(date) - Date.parse(from)) >
                      7 * 86400000,
                  )
                }
              />
              <DateRangePicker
                label="开放日期范围"
                startLabel="开放开始"
                endLabel="开放结束"
                defaultValue={['2024-02-10', '']}
                inputReadOnly
                allowEmpty={[false, true]}
                disabled={disabled}
                defaultPanelMonth="2024-02"
              />
              <DateRangePicker
                label="外部控制范围"
                startLabel="外部开始"
                endLabel="外部结束"
                defaultValue={['2024-02-28', '2024-03-02']}
                open={open}
                onOpenChange={setOpen}
                inputReadOnly
                disabled={disabled}
                placement={placement}
              />
              <div className="space-y-2">
                <label htmlFor="range-placement" className="text-sm">
                  范围弹出位置
                </label>
                <select
                  id="range-placement"
                  value={placement}
                  onChange={(event) =>
                    setPlacement(event.target.value as DatePickerPlacement)
                  }
                  className="min-h-11 w-full rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-base"
                >
                  <option value="bottomStart">下方起点</option>
                  <option value="bottomEnd">下方终点</option>
                  <option value="topStart">上方起点</option>
                  <option value="topEnd">上方终点</option>
                </select>
              </div>
              <div className="min-w-0 md:col-span-2">
                <h4 className="mb-2 text-lg font-semibold">窄容器常驻范围</h4>
                <div className="max-w-[22rem]">
                  <DateRangePicker
                    mode="panel"
                    label="内嵌范围"
                    startLabel="内嵌开始"
                    endLabel="内嵌结束"
                    defaultValue={['2024-02-28', '2024-03-02']}
                    needConfirm
                    inputReadOnly
                    disabled={disabled}
                  />
                </div>
              </div>
              <FormField
                label="错误范围面板"
                error="请选择日期范围"
                control={
                  <DateRangePicker
                    label="错误范围面板"
                    startLabel="错误开始"
                    endLabel="错误结束"
                    inputReadOnly
                  />
                }
              />
            </div>
          </ConfigProvider>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p role="status" aria-label="行程范围值">
              {value[0] || '未选开始'} → {value[1] || '未选结束'}
            </p>
            <p role="status" aria-label="确认范围值">
              {confirmed.join(' → ')}
            </p>
            <p role="status" aria-label="临时范围事件">
              {pending}
            </p>
          </div>
          <Form
            initialValues={{ period: ['2024-02-28', '2024-03-02'] }}
            validateOn="blur"
            onFinish={(values) =>
              setResult('预约：' + (values.period as DateRange).join(' → '))
            }
          >
            <FormItem
              name="period"
              label="范围预约"
              emptyValue={[]}
              rules={[
                {
                  validator: (value) =>
                    Array.isArray(value) &&
                    value.length === 2 &&
                    value.every(Boolean)
                      ? undefined
                      : '请选择完整预约范围',
                },
              ]}
              control={
                <DateRangePicker
                  label="范围预约"
                  startLabel="预约开始"
                  endLabel="预约结束"
                  inputReadOnly
                  defaultPanelMonth="2024-02"
                />
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">提交范围预约</Button>
              <Button type="reset" variant="outline">
                重置范围预约
              </Button>
            </div>
          </Form>
          <p
            role="status"
            aria-label="范围预约结果"
            className="text-sm text-muted-foreground"
          >
            {result}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
