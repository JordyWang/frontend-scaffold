import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  Grid,
  Icon,
  Image,
  RadioGroup,
  Skeleton,
  Spinner,
  Stack,
  Switch,
  Tag,
  ThemeScope,
  Typography,
  toast,
} from '@/shared/ui'

export function DesignSystemPreview() {
  const [checked, setChecked] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [choice, setChoice] = useState('a')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<'default' | 'compact'>('default')

  return (
    <section className="space-y-4" aria-label="设计系统补充组件">
      <div>
        <h2 className="text-xl font-semibold">设计系统补充组件</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          浅色、深色、紧凑和局部主题；原生表单控件支持键盘与触控。
        </p>
      </div>
      <Stack direction="row" wrap gap="sm" align="center">
        <Button
          variant="outline"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          切换预览主题
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setDensity(density === 'default' ? 'compact' : 'default')
          }
        >
          切换预览密度
        </Button>
        <Typography as="span" variant="caption" tone="muted">
          当前：{mode === 'light' ? '浅色' : '深色'} ·{' '}
          {density === 'default' ? '常规' : '紧凑'}
        </Typography>
      </Stack>
      <ThemeScope
        mode={mode}
        density={density}
        className="rounded-xl border border-border p-4 sm:p-6"
      >
        <Grid minItemWidth="17rem" gap="lg">
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  通用与布局
                </Typography>
                <Typography>
                  正文、
                  <Typography as="span" tone="muted">
                    次要文字
                  </Typography>
                  与语义标题。
                </Typography>
                <Stack direction="row" align="center" gap="sm" wrap>
                  <Icon name="info" label="信息" />
                  <Tag>默认</Tag>
                  <Tag tone="success">成功</Tag>
                  <Tag tone="warning">警告</Tag>
                  <Tag tone="error">错误</Tag>
                  <Badge count={3}>
                    <Button size="icon" variant="outline" aria-label="通知">
                      <Icon name="info" />
                    </Button>
                  </Badge>
                </Stack>
                <Divider />
                <Typography variant="caption" tone="muted">
                  Grid 根据可用宽度自动换列。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="sm">
                <Typography as="h3" variant="title">
                  数据录入
                </Typography>
                <Checkbox
                  label="同意更新通知"
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                />
                <Checkbox label="不可用复选框" disabled />
                <RadioGroup
                  label="展示方式"
                  value={choice}
                  onValueChange={setChoice}
                  options={[
                    { value: 'a', label: '列表' },
                    { value: 'b', label: '网格' },
                    { value: 'c', label: '不可用', disabled: true },
                  ]}
                />
                <Switch
                  label="启用提醒"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                <Switch label="不可用开关" disabled />
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="md">
                <Typography as="h3" variant="title">
                  展示与加载
                </Typography>
                <Image
                  src="/mock/media/poster.svg"
                  alt="示例封面"
                  width={240}
                  height={135}
                />
                <Image
                  src="data:image/png;base64,broken"
                  alt="加载失败的示例图片"
                  fallback="图片加载失败"
                  width={240}
                  height={60}
                />
                <Skeleton width="80%" label="标题正在加载" />
                <Skeleton shape="block" height={48} label="内容正在加载" />
                <Stack direction="row" align="center" gap="sm">
                  <Spinner label="正在处理" />
                  <Typography variant="caption">处理中</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Stack gap="sm">
                <Typography as="h3" variant="title">
                  状态反馈
                </Typography>
                <Alert title="信息" description="展示当前状态。" />
                <Alert tone="success" title="已完成" />
                <Alert tone="warning" title="需要检查" />
                <Alert
                  tone="error"
                  title="操作失败"
                  action={
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast({ title: '已重试', variant: 'success' })
                      }
                    >
                      重试
                    </Button>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </ThemeScope>
      <ThemeScope
        mode={mode === 'light' ? 'dark' : 'light'}
        density="compact"
        className="rounded-xl border border-border p-4"
      >
        <Stack direction="row" align="center" wrap gap="sm">
          <Typography as="span" variant="caption">
            局部反色主题
          </Typography>
          <Button size="small">主要操作</Button>
          <Tag tone="success">正常</Tag>
        </Stack>
      </ThemeScope>
    </section>
  )
}
