import { useState } from 'react'
import { CascaderMultiplePreview } from './CascaderMultiplePreview'
import {
  Button,
  Card,
  CardContent,
  Cascader,
  ConfigProvider,
  FormField,
  Icon,
  Input,
  Typography,
  type CascaderOption,
} from '@/shared/ui'

const regions: CascaderOption[] = [
  {
    value: 'cn',
    label: '中国',
    children: [
      {
        value: 'sh',
        label: '上海',
        children: [
          { value: 'center', label: '中心城区' },
          {
            value: 'long',
            label: '覆盖长名称和多行展示的上海浦东新区街道服务区域',
          },
        ],
      },
      { value: 'blocked', label: '禁用城市', disabled: true },
      {
        value: 'bj',
        label: '北京',
        children: [{ value: 'center', label: '中心城区' }],
      },
    ],
  },
  {
    value: 'other',
    label: '其他地区',
    children: [{ value: 'center', label: '中心城区' }],
  },
  {
    value: 'disabled',
    label: '禁用地区',
    disabled: true,
    children: [{ value: 'child', label: '禁用地区后代' }],
  },
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'bravo', label: 'Bravo' },
]
const departments: CascaderOption[] = [
  {
    value: 'departments',
    label: '全部部门',
    children: Array.from({ length: 60 }, (_, index) => ({
      value: 'department-' + index,
      label: '部门 ' + String(index).padStart(2, '0'),
    })),
  },
]

export function CascaderPreview() {
  const [value, setValue] = useState<string[] | undefined>([
    'cn',
    'sh',
    'center',
  ])
  const [panelValue, setPanelValue] = useState<string[]>([])
  const [parentSelection, setParentSelection] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [rtl, setRtl] = useState(false)
  return (
    <Card className="col-span-full">
      <CardContent>
        <section aria-label="级联选择完整预览" className="space-y-4">
          <Typography as="h3" variant="title">
            级联选择的列式浏览与路径搜索
          </Typography>
          <p className="text-sm text-muted-foreground">
            默认确认完整叶路径。方向键在同列浏览，左右键跨列并随 RTL
            变化；搜索展示完整路径。Escape 返回触发器，Tab
            继续表单；窄屏在面板内横向滚动。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setValue(undefined)}>
              设置受控空路径
            </Button>
            <Button
              variant="outline"
              onClick={() => setParentSelection(!parentSelection)}
            >
              {parentSelection ? '只确认叶节点' : '允许选择父级路径'}
            </Button>
            <Button variant="outline" onClick={() => setDisabled(!disabled)}>
              {disabled ? '启用列式级联选择' : '禁用列式级联选择'}
            </Button>
            <Button variant="outline" onClick={() => setRtl(!rtl)}>
              {rtl ? '使用 LTR 级联选择' : '使用 RTL 级联选择'}
            </Button>
          </div>
          <ConfigProvider
            direction={rtl ? 'rtl' : 'ltr'}
            theme={{ mode: rtl ? 'dark' : 'light' }}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <FormField
                label="地区列式选择"
                description="同名值可以出现在不同分支，路径始终保持完整。"
                control={
                  <Cascader
                    label="地区列式选择"
                    options={regions}
                    value={value}
                    onChange={setValue}
                    changeOnSelect={parentSelection}
                    disabled={disabled}
                    showSearch
                    allowClear
                    prefix={<Icon name="home" size={16} />}
                    classNames={{ popup: 'border-primary' }}
                  />
                }
              />
              <FormField
                label="级联选择后的输入"
                control={<Input aria-label="级联选择后的输入" />}
              />
              <FormField
                label="悬停级联"
                description="桌面移入可浏览子级，H5 点击浏览；确认叶节点后回填。"
                control={
                  <Cascader
                    label="悬停级联"
                    options={regions}
                    expandTrigger="hover"
                    allowClear
                  />
                }
              />
              <FormField
                label="六十个部门"
                description="End 到达最后一项，滚动限制在当前列。"
                control={
                  <Cascader
                    label="六十个部门"
                    options={departments}
                    listHeight={220}
                    columnWidth={180}
                    allowClear
                  />
                }
              />
              <p
                role="status"
                aria-label="级联选择值"
                className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
              >
                {JSON.stringify(value ?? [])}
              </p>
            </div>
            <div className="w-full max-w-xl space-y-2">
              <Typography as="h4" variant="title">
                内嵌列式面板
              </Typography>
              <Cascader
                mode="panel"
                label="内嵌地区选择"
                options={regions}
                value={panelValue}
                onChange={setPanelValue}
                showSearch
                listHeight={220}
              />
              <p
                role="status"
                aria-label="级联面板路径"
                className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
              >
                {JSON.stringify(panelValue)}
              </p>
            </div>
          </ConfigProvider>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <FormField
              label="空级联选择"
              control={
                <Cascader
                  label="空级联选择"
                  options={[]}
                  showSearch
                  emptyText="没有可选地区"
                />
              }
            />
            <FormField
              label="自定义回填路径"
              control={
                <Cascader
                  label="自定义回填路径"
                  options={regions}
                  defaultValue={['cn', 'bj', 'center']}
                  displayRender={(path) =>
                    path.map((option) => option.label).join(' · ')
                  }
                  optionRender={(option) => (
                    <span className="font-medium">{option.label}</span>
                  )}
                />
              }
            />
            {(['outlined', 'filled', 'borderless', 'underlined'] as const).map(
              (variant) => (
                <FormField
                  key={variant}
                  label={variant + ' 级联选择'}
                  control={
                    <Cascader
                      label={variant + ' 级联选择'}
                      options={regions}
                      variant={variant}
                      status={
                        variant === 'underlined'
                          ? 'error'
                          : variant === 'filled'
                            ? 'warning'
                            : 'default'
                      }
                      size={variant === 'outlined' ? 'large' : 'default'}
                    />
                  }
                />
              ),
            )}
            <FormField
              label="原生分级地区"
              description="原生模式保留逐级更新和最后一级 required 校验。"
              control={
                <Cascader
                  mode="inline"
                  label="原生分级地区"
                  options={regions}
                  defaultValue={['cn']}
                  required
                  variant="filled"
                />
              }
            />
            {(['topStart', 'topEnd', 'bottomStart', 'bottomEnd'] as const).map(
              (placement) => (
                <FormField
                  key={placement}
                  label={placement + ' 级联位置'}
                  control={
                    <Cascader
                      label={placement + ' 级联位置'}
                      options={regions}
                      placement={placement}
                      popupWidth={280}
                    />
                  }
                />
              ),
            )}
          </div>
          <CascaderMultiplePreview />
        </section>
      </CardContent>
    </Card>
  )
}
