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
  type ColorPickerPreset,
} from '@/shared/ui'

const initial = 'linear-gradient(90deg, #1677ff 0%, #13c2c2 100%)'
const alpha = 'linear-gradient(90deg, #1677ff 0%, #1677ff00 100%)'
const presets: ColorPickerPreset[] = [
  {
    key: 'brand',
    label: '品牌颜色与渐变',
    colors: [
      { value: '#1677ff', label: '品牌单色蓝' },
      { value: initial, label: '品牌蓝青渐变' },
      { value: alpha, label: '透明蓝渐变' },
      {
        value: 'linear-gradient(90deg, #1677ff 0%, #13c2c2 50%, #15803d 100%)',
        label: '蓝青绿渐变',
      },
    ],
  },
]
export function ColorPickerGradientPreview() {
  const [value, setValue] = useState(initial),
    [completed, setCompleted] = useState(initial),
    [count, setCount] = useState(0)
  const [disabled, setDisabled] = useState(false),
    [opaque, setOpaque] = useState(false)
  const [completionOnly, setCompletionOnly] = useState(alpha)
  const [nativeStatus, setNativeStatus] = useState('尚未提交渐变'),
    [formStatus, setFormStatus] = useState('尚未提交项目渐变')
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>渐变颜色与色标编辑</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="渐变颜色能力预览" className="min-w-0 space-y-6">
          <p className="text-muted-foreground">
            选择色标后编辑颜色与透明度，点击轨道或用按钮添加色标。可用键盘或数值输入调整位置；渐变值保持
            CSS 字符串。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用渐变控件' : '禁用渐变控件'}
            </Button>
            <Button variant="outline" onClick={() => setOpaque(!opaque)}>
              {opaque ? '启用渐变透明度' : '禁用渐变透明度'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setValue(initial)
                setCompleted(initial)
                setCount(0)
              }}
            >
              恢复渐变预览
            </Button>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <FormField
                label="渐变主题色"
                control={
                  <ColorPicker
                    label="渐变主题色"
                    colorMode={['single', 'gradient']}
                    value={value}
                    onChange={setValue}
                    onChangeComplete={(next) => {
                      setCompleted(next)
                      setCount((n) => n + 1)
                    }}
                    presets={presets}
                    disabled={disabled}
                    disabledAlpha={opaque}
                    allowClear
                    showText
                  />
                }
              />
              <p
                role="status"
                aria-label="渐变实时值"
                className="wrap-anywhere"
              >
                {value || '空渐变'}
              </p>
              <p
                role="status"
                aria-label="渐变完成值"
                className="wrap-anywhere"
              >
                {completed || '空渐变'} · 完成 {count} 次
              </p>
              <div
                aria-label="渐变色效果"
                role="img"
                className="h-16 rounded-md border border-border"
                style={{ background: value || 'transparent' }}
              />
            </div>
            <div className="min-w-0 space-y-3">
              <FormField
                label="仅完成时渐变"
                description="操作完成后才接受新值。"
                control={
                  <ColorPicker
                    label="仅完成时渐变"
                    colorMode="gradient"
                    value={completionOnly}
                    onChangeComplete={setCompletionOnly}
                    showText
                  />
                }
              />
              <FormField
                label="只读渐变"
                control={
                  <ColorPicker
                    label="只读渐变"
                    colorMode="gradient"
                    defaultValue={alpha}
                    readOnly
                    showText
                  />
                }
              />
              <FormField
                label="错误渐变"
                error="请选择有效渐变"
                control={
                  <ColorPicker
                    label="错误渐变"
                    colorMode="gradient"
                    defaultValue={initial}
                    showText
                  />
                }
              />
            </div>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <form
              aria-label="渐变原生表单"
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
              <ColorPicker
                mode="panel"
                colorMode="gradient"
                label="常驻渐变"
                name="paint"
                defaultValue={initial}
                defaultFormat="rgb"
                allowClear
                required
                presets={presets}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit">提交原生渐变</Button>
                <Button type="reset" variant="outline">
                  重置原生渐变
                </Button>
              </div>
              <p role="status" className="wrap-anywhere">
                {nativeStatus}
              </p>
            </form>
            <ConfigProvider
              direction="rtl"
              componentSize="small"
              theme={{ mode: 'dark' }}
            >
              <div
                role="group"
                aria-label="窄容器 RTL 渐变预览"
                className="w-60 max-w-full rounded-lg border border-border p-3"
              >
                <ColorPicker
                  label="RTL 渐变"
                  mode="panel"
                  colorMode={['single', 'gradient']}
                  defaultValue={alpha}
                  defaultFormat="hsb"
                  allowClear
                  presets={presets}
                  className="p-2"
                />
              </div>
            </ConfigProvider>
          </div>
          <Form
            aria-label="项目渐变表单"
            initialValues={{ paint: '' }}
            onFinish={(values) => setFormStatus(JSON.stringify(values))}
            onFinishFailed={() => setFormStatus('渐变校验失败')}
          >
            <FormItem
              name="paint"
              label="表单渐变"
              rules={[{ required: true, message: '请选择渐变颜色' }]}
              control={
                <ColorPicker
                  label="表单渐变"
                  colorMode="gradient"
                  presets={presets}
                  allowClear
                  showText
                />
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit">提交项目渐变</Button>
              <Button type="reset" variant="outline">
                重置项目渐变
              </Button>
            </div>
            <p role="status" className="wrap-anywhere">
              {formStatus}
            </p>
          </Form>
        </section>
      </CardContent>
    </Card>
  )
}
