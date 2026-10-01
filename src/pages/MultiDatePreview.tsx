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
  MultiDatePicker,
  Typography,
  type DatePickerPlacement,
} from '@/shared/ui'

export function MultiDatePreview() {
  const [dates, setDates] = useState(['2024-02-28'])
  const [confirmed, setConfirmed] = useState(['2024-02-10', '2024-02-14'])
  const [pending, setPending] = useState('尚未选择')
  const [disabled, setDisabled] = useState(false),
    [rtl, setRtl] = useState(false)
  const [open, setOpen] = useState(false),
    [order, setOrder] = useState(true)
  const [placement, setPlacement] = useState<DatePickerPlacement>('bottomStart')
  const [result, setResult] = useState('尚未提交')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>日期多选</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="日期多选预览" className="min-w-0 space-y-4">
          <Typography tone="muted">
            多次选择或移除日期后，用“完成”或离开整个控件提交。确认模式需要“确定”；Escape
            取消。默认去重排序，标签可展开与逐项删除，空输入的 Backspace
            移除最后一项。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用日期多选' : '禁用日期多选'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 多选日期' : '使用 RTL 多选日期'}
            </Button>
            <Button variant="outline" onClick={() => setDates([])}>
              清空受控多日期
            </Button>
            <Button variant="outline" onClick={() => setDates(['2024-02-28'])}>
              回填多选日程
            </Button>
            <Button variant="outline" onClick={() => setOpen(!open)}>
              {open ? '外部关闭多日期' : '外部打开多日期'}
            </Button>
            <Button variant="outline" onClick={() => setOrder(!order)}>
              {order ? '保留选择顺序' : '自动排序日期'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                label="多选日程"
                control={
                  <DatePicker
                    multiple
                    label="多选日程"
                    value={dates}
                    onChange={setDates}
                    onCalendarChange={(value) =>
                      setPending(value.join('、') || '空选择')
                    }
                    inputReadOnly
                    disabled={disabled}
                    min="2024-02-01"
                    max="2024-03-31"
                    order={order}
                    placement={placement}
                  />
                }
              />
              <FormField label="多日期之后的输入" control={<Input />} />
              <FormField
                label="确认多日期"
                control={
                  <MultiDatePicker
                    label="确认多日期"
                    value={confirmed}
                    onChange={setConfirmed}
                    inputReadOnly
                    needConfirm
                    disabled={disabled}
                    min="2024-02-01"
                    max="2024-03-31"
                    disabledDate={(date) => date === '2024-02-12'}
                    presets={[
                      {
                        key: 'leap',
                        label: '闰月多个日期',
                        value: ['2024-03-02', '2024-02-29', '2024-02-29'],
                      },
                      {
                        key: 'bad',
                        label: '禁选日期集合',
                        value: ['2024-02-12'],
                      },
                    ]}
                  />
                }
              />
              <FormField
                label="输入多个日期"
                description="二月至三月；12 日不可选，Enter 添加日期。"
                control={
                  <DatePicker
                    multiple
                    label="输入多个日期"
                    defaultValue={['2024-02-10']}
                    min="2024-02-01"
                    max="2024-03-31"
                    disabledDate={(date) => date === '2024-02-12'}
                    disabled={disabled}
                  />
                }
              />
              <FormField
                label="折叠日期标签"
                control={
                  <MultiDatePicker
                    label="折叠日期标签"
                    defaultValue={[
                      '2024-02-10',
                      '2024-02-14',
                      '2024-02-20',
                      '2024-02-28',
                      '2024-02-29',
                    ]}
                    maxTagCount={1}
                    renderTag={(date) => '日程日期：' + date}
                    disabled={disabled}
                    inputReadOnly
                  />
                }
              />
              <FormField
                label="最多两个日期"
                control={
                  <MultiDatePicker
                    label="最多两个日期"
                    defaultPanelMonth="2024-02"
                    maxCount={2}
                    disabled={disabled}
                    inputReadOnly
                  />
                }
              />
              <FormField
                label="外部开合多日期"
                control={
                  <MultiDatePicker
                    label="外部开合多日期"
                    defaultValue={['2024-02-14']}
                    open={open}
                    onOpenChange={setOpen}
                    disabled={disabled}
                    inputReadOnly
                    placement={placement}
                  />
                }
              />
              <div className="space-y-2">
                <label htmlFor="multi-date-placement" className="text-sm">
                  多日期弹出位置
                </label>
                <select
                  id="multi-date-placement"
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
              <div className="min-w-0 md:col-span-2">
                <h4 className="mb-2 text-lg font-semibold">常驻多日期面板</h4>
                <div className="max-w-[22rem]">
                  <MultiDatePicker
                    mode="panel"
                    label="内嵌多日期"
                    defaultValue={['2024-02-10', '2024-02-14']}
                    needConfirm
                    inputReadOnly
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
                label="警告多日期"
                control={
                  <MultiDatePicker
                    label="警告多日期"
                    defaultValue={['2024-02-10']}
                    variant="underlined"
                    status="warning"
                    size="small"
                    inputReadOnly
                  />
                }
              />
              <FormField
                label="错误多日期"
                error="请选择有效日程"
                control={<MultiDatePicker label="错误多日期" inputReadOnly />}
              />
              <FormField
                label="只读多日期"
                control={
                  <MultiDatePicker
                    label="只读多日期"
                    defaultValue={['2024-02-10', '2024-02-14']}
                    readOnly
                  />
                }
              />
            </div>
          </ConfigProvider>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p role="status" aria-label="多日期提交值">
              {dates.join('、') || '空选择'}
            </p>
            <p role="status" aria-label="确认多日期值">
              {confirmed.join('、') || '空选择'}
            </p>
            <p role="status" aria-label="多日期临时选择">
              {pending}
            </p>
          </div>
          <Form
            initialValues={{ dates: ['2024-02-10'] }}
            validateOn="blur"
            onFinish={(values) =>
              setResult('日程：' + (values.dates as string[]).join('、'))
            }
          >
            <FormItem
              name="dates"
              label="多日期表单"
              emptyValue={[]}
              rules={[{ required: true, message: '请选择至少一个日程日期' }]}
              control={
                <DatePicker
                  multiple
                  label="多日期表单"
                  defaultPanelMonth="2024-02"
                  inputReadOnly
                />
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">提交多日期表单</Button>
              <Button type="reset" variant="outline">
                重置多日期表单
              </Button>
            </div>
          </Form>
          <p
            role="status"
            aria-label="多日期表单结果"
            className="text-sm text-muted-foreground"
          >
            {result}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
