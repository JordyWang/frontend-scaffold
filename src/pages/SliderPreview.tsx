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
  InputNumber,
  Slider,
  Typography,
  type SliderMark,
} from '@/shared/ui'

const temperatureMarks: SliderMark[] = [
  { value: 0, label: '0°C' },
  { value: 26, label: '26°C' },
  { value: 37, label: '37°C' },
  { value: 100, label: '100°C' },
]
const basicMarks: SliderMark[] = [0, 50, 100].map((value) => ({
  value,
  label: `${value}%`,
}))

export function SliderPreview() {
  const [interval, setInterval] = useState([20, 60])
  const [changes, setChanges] = useState(0),
    [completions, setCompletions] = useState(0)
  const [completed, setCompleted] = useState([20, 60])
  const [temperature, setTemperature] = useState(26)
  const [included, setIncluded] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [points, setPoints] = useState([20, 50, 80])
  const [locked, setLocked] = useState(true)
  const [decimal, setDecimal] = useState(0.3)
  const [formStatus, setFormStatus] = useState('尚未提交滑块')
  const [tipOpen, setTipOpen] = useState(false)
  const [editablePoints, setEditablePoints] = useState([20, 80])
  const [editableCompleted, setEditableCompleted] = useState([20, 80])
  const [editCompletions, setEditCompletions] = useState(0)
  const [minimumNodes, setMinimumNodes] = useState(0)
  const [editLocked, setEditLocked] = useState(false)
  return (
    <Card id="ds-slider" className="col-span-full scroll-mt-6">
      <CardHeader>
        <CardTitle>滑块范围与刻度</CardTitle>
      </CardHeader>
      <CardContent>
        <section aria-label="滑块能力预览" className="min-w-0 space-y-6">
          <Typography tone="muted">
            方向键调整数值，Home / End
            到达当前边界；范围中每个滑块保持顺序。拖动滑块或整段区间时更新实时值，松开后报告操作完成。
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用范围滑块' : '禁用范围滑块'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInterval([20, 60])
                setChanges(0)
                setCompletions(0)
                setCompleted([20, 60])
              }}
            >
              重置范围预览
            </Button>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <FormField
                label="播放区间"
                description="可以拖动两端之间的整段轨道。"
                control={
                  <Slider
                    range
                    draggableTrack
                    label="播放区间"
                    value={interval}
                    step={5}
                    disabled={disabled}
                    marks={basicMarks}
                    tooltip={{ formatter: (value) => `${value}%` }}
                    onChange={(next) => {
                      setInterval(next)
                      setChanges((count) => count + 1)
                    }}
                    onChangeComplete={(next) => {
                      setCompleted(next)
                      setCompletions((count) => count + 1)
                    }}
                  />
                }
              />
              <p role="status" aria-label="播放区间实时值">
                {JSON.stringify(interval)}
              </p>
              <p role="status" aria-label="播放区间完成值">
                {JSON.stringify(completed)} · 完成 {completions} 次 · 变化{' '}
                {changes} 次
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              <Button variant="outline" onClick={() => setIncluded(!included)}>
                {included ? '显示独立刻度' : '显示包含刻度'}
              </Button>
              <FormField
                label="离散温度"
                description="只可选择四个标记值与边界。"
                control={
                  <Slider
                    label="离散温度"
                    step={null}
                    marks={temperatureMarks}
                    included={included}
                    value={temperature}
                    onChange={setTemperature}
                    tooltip={{ formatter: (value) => `${value}°C` }}
                  />
                }
              />
              <p role="status" aria-label="离散温度值">
                {temperature}°C
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              <FormField
                label="小数比例"
                control={
                  <Slider
                    label="小数比例"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={decimal}
                    onChange={setDecimal}
                    dots
                  />
                }
              />
              <InputNumber
                aria-label="小数比例输入"
                min={0.1}
                max={1}
                step={0.1}
                precision={1}
                value={decimal}
                onChange={(next) => setDecimal(next ?? 0.1)}
              />
            </div>
            <div className="min-w-0 space-y-3">
              <Button variant="outline" onClick={() => setLocked(!locked)}>
                {locked ? '解锁中间滑块' : '锁定中间滑块'}
              </Button>
              <FormField
                label="多点区间"
                control={
                  <Slider
                    range
                    draggableTrack
                    label="多点区间"
                    value={points}
                    disabled={[false, locked, false]}
                    onChange={setPoints}
                  />
                }
              />
              <p role="status" aria-label="多点区间值">
                {JSON.stringify(points)}
              </p>
            </div>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-3">
            <FormField
              label="反向比例"
              control={
                <Slider
                  label="反向比例"
                  reverse
                  defaultValue={30}
                  step={5}
                  marks={basicMarks}
                />
              }
            />
            <FormField
              label="垂直比例"
              control={
                <Slider
                  label="垂直比例"
                  orientation="vertical"
                  defaultValue={30}
                  step={5}
                  marks={basicMarks}
                />
              }
            />
            <FormField
              label="反向垂直比例"
              control={
                <Slider
                  label="反向垂直比例"
                  orientation="vertical"
                  reverse
                  defaultValue={30}
                  step={5}
                  marks={basicMarks}
                />
              }
            />
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMinimumNodes(minimumNodes ? 0 : 2)}
                >
                  {minimumNodes ? '允许删除全部节点' : '至少保留两个节点'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditLocked(!editLocked)}
                >
                  {editLocked ? '解锁编辑节点' : '固定编辑节点'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditablePoints([20, 80])
                    setEditableCompleted([20, 80])
                    setEditCompletions(0)
                  }}
                >
                  重置节点编辑
                </Button>
              </div>
              <FormField
                label="可编辑节点"
                control={
                  <Slider
                    range
                    editable={{ minCount: minimumNodes, maxCount: 4 }}
                    label="可编辑节点"
                    value={editablePoints}
                    step={5}
                    disabled={editLocked ? [false, true] : false}
                    onChange={setEditablePoints}
                    onChangeComplete={(next) => {
                      setEditableCompleted(next)
                      setEditCompletions((count) => count + 1)
                    }}
                  />
                }
              />
              <p role="status" aria-label="编辑节点实时值">
                {JSON.stringify(editablePoints)}
              </p>
              <p role="status" aria-label="编辑节点完成值">
                {JSON.stringify(editableCompleted)} · 完成 {editCompletions} 次
              </p>
            </div>
            <FormField
              label="垂直编辑节点"
              control={
                <Slider
                  range
                  editable={{ minCount: 1, maxCount: 3 }}
                  label="垂直编辑节点"
                  orientation="vertical"
                  defaultValue={[20, 80]}
                  marks={basicMarks}
                  step={5}
                />
              }
            />
          </div>
          <form aria-label="可编辑节点原生表单" className="space-y-3">
            <FormField
              label="离散可编辑节点"
              description="空数组起步；只选择刻度与边界，表单重置恢复空值。"
              control={
                <Slider
                  range
                  editable={{ maxCount: 5 }}
                  name="editableNodes"
                  label="离散可编辑节点"
                  defaultValue={[]}
                  step={null}
                  marks={temperatureMarks}
                />
              }
            />
            <Button type="reset" variant="outline">
              重置空节点表单
            </Button>
          </form>
          <div className="grid min-w-0 gap-6 md:grid-cols-3">
            <FormField
              label="只读滑块"
              control={
                <Slider
                  label="只读滑块"
                  defaultValue={40}
                  readOnly
                  marks={basicMarks}
                />
              }
            />
            <FormField
              label="禁用键盘滑块"
              control={
                <Slider
                  label="禁用键盘滑块"
                  defaultValue={40}
                  keyboard={false}
                  tooltip={false}
                />
              }
            />
            <FormField
              label="错误滑块"
              error="请选择合适的比例"
              control={
                <Slider
                  label="错误滑块"
                  defaultValue={40}
                  status="error"
                  tooltip={{ open: tipOpen, formatter: (value) => `${value}%` }}
                />
              }
            />
          </div>
          <Button variant="outline" onClick={() => setTipOpen(!tipOpen)}>
            {tipOpen ? '隐藏固定滑块提示' : '显示固定滑块提示'}
          </Button>
          <ConfigProvider
            direction="rtl"
            theme={{ mode: 'dark' }}
            componentSize="small"
          >
            <div
              role="group"
              aria-label="窄容器 RTL 滑块预览"
              className="w-60 max-w-full space-y-4 rounded-lg border border-border p-3"
            >
              <FormField
                label="RTL 窄范围"
                control={
                  <Slider
                    range
                    label="RTL 窄范围"
                    defaultValue={[20, 60]}
                    marks={basicMarks}
                  />
                }
              />
              <FormField
                label="RTL 反向比例"
                control={
                  <Slider
                    label="RTL 反向比例"
                    reverse
                    defaultValue={30}
                    step={5}
                    tooltip={{ formatter: (value) => `${value}%` }}
                  />
                }
              />
              <FormField
                label="RTL 可编辑节点"
                control={
                  <Slider
                    range
                    editable={{ minCount: 1, maxCount: 3 }}
                    label="RTL 可编辑节点"
                    defaultValue={[25, 75]}
                    step={5}
                  />
                }
              />
            </div>
          </ConfigProvider>
          <Form
            aria-label="滑块组合表单"
            initialValues={{ strength: 30, span: [20, 60] }}
            onFinish={(values) =>
              setFormStatus(`已提交 ${JSON.stringify(values)}`)
            }
            onFinishFailed={() => setFormStatus('滑块范围校验失败')}
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <FormItem
                name="strength"
                label="表单强度"
                control={<Slider label="表单强度" step={5} />}
                rules={[
                  {
                    validator: (value) =>
                      typeof value === 'number' && value >= 10
                        ? undefined
                        : '强度不能低于 10',
                  },
                ]}
              />
              <FormItem
                name="span"
                label="表单区间"
                emptyValue={[]}
                control={<Slider range label="表单区间" step={5} />}
                rules={[
                  {
                    validator: (value) =>
                      Array.isArray(value) && value[1] - value[0] >= 20
                        ? undefined
                        : '区间至少相差 20',
                  },
                ]}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit">提交滑块表单</Button>
              <Button type="reset" variant="outline">
                重置滑块表单
              </Button>
            </div>
            <p role="status" aria-label="滑块表单结果">
              {formStatus}
            </p>
          </Form>
          <form aria-label="原生滑块重置" className="min-w-0 space-y-3">
            <FormField
              label="原生默认比例"
              control={
                <Slider
                  label="原生默认比例"
                  name="nativeRatio"
                  defaultValue={30}
                />
              }
            />
            <FormField
              label="原生默认区间"
              control={
                <Slider
                  range
                  label="原生默认区间"
                  name="nativeSpan"
                  defaultValue={[20, 60]}
                />
              }
            />
            <Button type="reset" variant="outline">
              重置原生滑块
            </Button>
          </form>
        </section>
      </CardContent>
    </Card>
  )
}
