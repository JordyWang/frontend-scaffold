import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfigProvider,
  DatePicker,
  Form,
  FormField,
  FormItem,
  Input,
  Typography,
  type DatePickerPlacement,
} from '@/shared/ui'

export function DatePickerPreview() {
  const [value, setValue] = useState('2024-02-29')
  const [confirmed, setConfirmed] = useState('2024-02-10')
  const [disabled, setDisabled] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期选择面板</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期选择面板预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            ISO 日期值与浏览月份分开。方向键浏览、Enter 选择，Escape
            取消；确认模式只在“确定”后提交。日期与快捷按钮保持 44px 触控区域。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期面板' : '禁用日期面板'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 日期' : '使用 RTL 日期'}
            </Button>
            <Button variant="outline" onClick={() => setValue('')}>
              清空受控日期
            </Button>
            <Button variant="outline" onClick={() => setValue('2024-02-29')}>
              回填闰日
            </Button>
            <Button variant="outline" onClick={() => setOpen(!open)}>
              {open ? '外部关闭日期' : '外部打开日期'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                label="项目日期"
                description="点击输入或图标打开；向下键进入日期网格。"
                control={
                  <DatePicker
                    label="项目日期"
                    value={value}
                    onChange={setValue}
                    disabled={disabled}
                    placement={placement}
                    inputReadOnly
                    defaultPanelMonth="2024-02"
                  />
                }
              />
              <FormField
                label="日期之后的输入"
                control={<Input aria-label="日期之后的输入" />}
              />
              <FormField
                label="确认日期"
                control={
                  <DatePicker
                    label="确认日期"
                    value={confirmed}
                    onChange={setConfirmed}
                    needConfirm
                    inputReadOnly
                    min="2024-02-01"
                    max="2024-02-29"
                    disabledDate={(date) => date === '2024-02-12'}
                    disabled={disabled}
                    presets={[
                      { key: 'leap', label: '本月闰日', value: '2024-02-29' },
                      {
                        key: 'disabled',
                        label: '不可选预设',
                        value: '2024-02-12',
                      },
                    ]}
                  />
                }
              />
              <FormField
                label="输入日期"
                description="输入 YYYY-MM-DD，Enter 或失焦提交；限定二月，12 日不可选。"
                control={
                  <DatePicker
                    label="输入日期"
                    defaultValue="2024-02-10"
                    min="2024-02-01"
                    max="2024-02-29"
                    disabledDate={(date) => date === '2024-02-12'}
                    disabled={disabled}
                  />
                }
              />
              <FormField
                label="外部控制日期"
                control={
                  <DatePicker
                    label="外部控制日期"
                    open={open}
                    onOpenChange={setOpen}
                    defaultValue="2024-02-15"
                    disabled={disabled}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <div className="min-w-0 space-y-2">
                <label htmlFor="date-popup-placement" className="text-sm">
                  日期弹出位置
                </label>
                <select
                  id="date-popup-placement"
                  className="min-h-11 w-full rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-base"
                  value={placement}
                  onChange={(event) =>
                    setPlacement(event.target.value as DatePickerPlacement)
                  }
                >
                  <option value="bottomStart">下方起点</option>
                  <option value="bottomEnd">下方终点</option>
                  <option value="topStart">上方起点</option>
                  <option value="topEnd">上方终点</option>
                </select>
              </div>
              <div className="min-w-0 space-y-2 md:col-span-2">
                <h4 className="text-lg font-semibold">内嵌日期面板</h4>
                <div className="w-full max-w-[22rem]">
                  <DatePicker
                    mode="panel"
                    label="内嵌日期"
                    defaultValue="2024-02-10"
                    min="2024-02-01"
                    max="2024-03-31"
                    needConfirm
                    disabled={disabled}
                    renderDate={(date) =>
                      date === '2024-02-29' ? (
                        <span
                          className="size-1 rounded-full bg-current"
                          aria-hidden="true"
                        />
                      ) : null
                    }
                    getDateDescription={(date) =>
                      date === '2024-02-29' ? '发布日' : undefined
                    }
                  />
                </div>
              </div>
              <FormField
                label="警告日期面板"
                control={
                  <DatePicker
                    label="警告日期面板"
                    variant="underlined"
                    status="warning"
                    size="small"
                    defaultValue="2024-02-10"
                    inputReadOnly
                  />
                }
              />
              <FormField
                label="错误日期面板"
                error="请选择预约日期"
                control={<DatePicker label="错误日期面板" inputReadOnly />}
              />
            </div>
          </ConfigProvider>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p role="status" aria-label="项目日期值">
              {value || '未选择'}
            </p>
            <p role="status" aria-label="确认日期值">
              {confirmed}
            </p>
          </div>
          <Form
            validateOn="blur"
            initialValues={{ appointment: '2024-02-10' }}
            onFinish={(values) =>
              setResult('预约：' + String(values.appointment))
            }
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormItem
                name="appointment"
                label="表单预约日期"
                rules={[{ required: true, message: '请选择表单预约日期' }]}
                control={
                  <DatePicker
                    label="表单预约日期"
                    inputReadOnly
                    defaultPanelMonth="2024-02"
                  />
                }
              />
              <div className="flex flex-wrap items-end gap-2">
                <Button type="submit">提交日期预约</Button>
                <Button type="reset" variant="outline">
                  重置日期预约
                </Button>
              </div>
            </div>
          </Form>
          <p
            role="status"
            aria-label="日期表单结果"
            className="text-sm text-muted-foreground"
          >
            {result}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
