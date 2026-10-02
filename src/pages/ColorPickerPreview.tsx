import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ColorPicker,
  ConfigProvider,
  Form,
  FormField,
  FormItem,
  Icon,
  type ColorPickerPreset,
} from '@/shared/ui'

const presets: ColorPickerPreset[] = [
  {
    key: 'common',
    label: '常用颜色',
    colors: [
      { value: '#1677ff', label: 'Ant Design 蓝' },
      { value: '#15803d', label: '绿色' },
      { value: '#b91c1c', label: '红色' },
      { value: '#13c2c2', label: '青色' },
      { value: '#faad14', label: '金色' },
      { value: '#1677ff80', label: '半透明蓝' },
      { value: '#00000000', label: '完全透明' },
    ],
  },
]
export function ColorPickerPreview() {
  const [value, setValue] = useState('#1677ff')
  const [completed, setCompleted] = useState('#1677ff'),
    [count, setCount] = useState(0)
  const [opaque, setOpaque] = useState(false),
    [disabled, setDisabled] = useState(false)
  const [onCompleteValue, setOnCompleteValue] = useState('#00ff00')
  const [formStatus, setFormStatus] = useState('尚未提交颜色')
  const [nativeStatus, setNativeStatus] = useState('尚未提交原生表单')
  const [placement, setPlacement] = useState<
    'bottomStart' | 'bottomEnd' | 'topStart' | 'topEnd'
  >('bottomStart')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>颜色面板、透明度与编码</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="颜色能力预览" className="min-w-0 space-y-6">
          <p className="text-muted-foreground">
            拖动颜色区域，或用下方滑块与编码输入调整颜色。格式切换保留颜色，松开或完成输入后报告完成值。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpaque(!opaque)}>
              {opaque ? '启用颜色透明度' : '禁用颜色透明度'}
            </Button>
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用颜色控件' : '禁用颜色控件'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setValue('#1677ff')
                setCompleted('#1677ff')
                setCount(0)
              }}
            >
              重置颜色预览
            </Button>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <FormField
                label="透明主题色"
                control={
                  <ColorPicker
                    label="透明主题色"
                    value={value}
                    onChange={setValue}
                    onChangeComplete={(next) => {
                      setCompleted(next)
                      setCount((n) => n + 1)
                    }}
                    allowClear
                    showText
                    disabled={disabled}
                    disabledAlpha={opaque}
                    presets={presets}
                  />
                }
              />
              <p role="status" aria-label="颜色实时值">
                {value || '空颜色'}
              </p>
              <p role="status" aria-label="颜色完成值">
                {completed || '空颜色'} · 完成 {count} 次
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              <FormField
                label="仅完成时受控颜色"
                description="触发器在操作完成后才更新。"
                control={
                  <ColorPicker
                    label="仅完成时受控颜色"
                    value={onCompleteValue}
                    onChangeComplete={setOnCompleteValue}
                    showText
                  />
                }
              />
              <FormField
                label="只读颜色"
                control={
                  <ColorPicker
                    label="只读颜色"
                    defaultValue="#1677ff80"
                    readOnly
                    showText
                  />
                }
              />
              <FormField
                label="错误颜色面板"
                error="请选择有效颜色"
                control={
                  <ColorPicker
                    label="错误颜色面板"
                    status="error"
                    defaultValue="#b91c1c"
                    showText
                  />
                }
              />
            </div>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <FormField
              label="常驻颜色面板"
              control={
                <ColorPicker
                  mode="panel"
                  label="常驻颜色面板"
                  defaultValue="#1677ff"
                  defaultFormat="rgb"
                  presets={presets}
                  allowClear
                />
              }
            />
            <ConfigProvider
              direction="rtl"
              theme={{ mode: 'dark' }}
              componentSize="small"
            >
              <div
                role="group"
                aria-label="窄容器 RTL 颜色预览"
                className="w-60 max-w-full space-y-3 rounded-lg border border-border p-3"
              >
                <FormField
                  label="RTL 颜色"
                  control={
                    <ColorPicker
                      label="RTL 颜色"
                      defaultValue="#1677ff80"
                      defaultFormat="hsb"
                      showText
                      presets={presets}
                    />
                  }
                />
                <ColorPicker
                  mode="panel"
                  label="RTL 常驻颜色"
                  defaultValue="#1677ff80"
                  defaultFormat="hsb"
                  presets={presets}
                  allowClear
                  className="p-2"
                />
              </div>
            </ConfigProvider>
          </div>
          <div className="min-w-0 space-y-3">
            <label className="grid max-w-xs gap-1">
              颜色面板位置
              <span className="relative">
                <select
                  aria-label="颜色面板位置"
                  value={placement}
                  className="h-11 min-h-11 w-full appearance-none rounded-md border border-input bg-card px-2 pe-8 text-base!"
                  onChange={(event) =>
                    setPlacement(event.currentTarget.value as typeof placement)
                  }
                >
                  <option value="bottomStart">下方起始</option>
                  <option value="bottomEnd">下方末端</option>
                  <option value="topStart">上方起始</option>
                  <option value="topEnd">上方末端</option>
                </select>
                <Icon
                  name="arrowRight"
                  size={16}
                  className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground"
                />
              </span>
            </label>
            <div
              role="group"
              aria-label="裁切容器颜色选择"
              className="h-24 w-64 max-w-full overflow-hidden rounded-lg border border-border p-3"
            >
              <ColorPicker
                label="裁切颜色"
                defaultValue="#1677ff"
                showText
                placement={placement}
                presets={presets}
              />
            </div>
          </div>
          <Form
            aria-label="颜色组合表单"
            initialValues={{ color: '' }}
            onFinish={(values) =>
              setFormStatus(`已提交 ${JSON.stringify(values)}`)
            }
            onFinishFailed={() => setFormStatus('颜色校验失败')}
          >
            <FormItem
              name="color"
              label="表单颜色"
              rules={[{ required: true, message: '请选择颜色' }]}
              control={
                <ColorPicker
                  label="表单颜色"
                  showText
                  allowClear
                  presets={presets}
                />
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">提交颜色表单</Button>
              <Button type="reset" variant="outline">
                重置颜色表单
              </Button>
            </div>
            <p role="status" aria-label="颜色表单结果">
              {formStatus}
            </p>
          </Form>
          <form
            aria-label="原生颜色表单"
            className="min-w-0 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setNativeStatus(
                JSON.stringify(
                  Object.fromEntries(new FormData(event.currentTarget)),
                ),
              )
            }}
          >
            <FormField
              required
              label="原生必选颜色"
              control={
                <ColorPicker
                  label="原生必选颜色"
                  name="color"
                  defaultValue=""
                  allowClear
                  showText
                  presets={presets}
                />
              }
            />
            <FormField
              label="原生颜色适配"
              control={
                <ColorPicker
                  mode="native"
                  label="原生颜色适配"
                  name="nativeColor"
                  defaultValue="#1677ff"
                  showText
                />
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">提交原生颜色</Button>
              <Button type="reset" variant="outline">
                重置原生颜色
              </Button>
            </div>
            <p role="status" aria-label="原生颜色表单结果">
              {nativeStatus}
            </p>
          </form>
        </section>
      </CardContent>
    </Card>
  )
}
