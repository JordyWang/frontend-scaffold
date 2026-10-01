import { useState } from 'react'
import {
  Button,
  Cascader,
  ConfigProvider,
  Form,
  FormField,
  FormItem,
  Input,
  Typography,
  type CascaderCheckedStrategy,
  type CascaderOption,
} from '@/shared/ui'

const teams: CascaderOption[] = [
  {
    value: 'team',
    label: '产品团队',
    children: [
      {
        value: 'design',
        label: '设计团队',
        children: [
          { value: 'web', label: '网页设计' },
          {
            value: 'mobile',
            label: '覆盖长名称的移动端设计与跨平台交互体验小组',
          },
          { value: 'archive', label: '归档设计', disabled: true },
        ],
      },
      {
        value: 'engineering',
        label: '研发团队',
        children: [{ value: 'web', label: '网页研发' }],
      },
      {
        value: 'readonly',
        label: '不可勾选目录',
        disableCheckbox: true,
        children: [{ value: 'independent', label: '独立团队' }],
      },
    ],
  },
  {
    value: 'support',
    label: '支持团队',
    children: [{ value: 'web', label: '网页支持' }],
  },
  {
    value: 'disabled',
    label: '停用团队',
    disabled: true,
    children: [{ value: 'child', label: '停用团队后代' }],
  },
]

export function CascaderMultiplePreview() {
  const [value, setValue] = useState<string[][] | undefined>([
    ['team', 'design', 'web'],
  ])
  const [strategy, setStrategy] = useState<CascaderCheckedStrategy>('parent')
  const [autoClear, setAutoClear] = useState(true)
  const [rtl, setRtl] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [removeDesign, setRemoveDesign] = useState(false)
  const [submitted, setSubmitted] = useState('未提交')
  const options = removeDesign
    ? teams.map((team) =>
        team.value === 'team'
          ? {
              ...team,
              children: team.children!.filter(
                (child) => child.value !== 'design',
              ),
            }
          : team,
      )
    : teams
  return (
    <section aria-label="级联多选完整预览" className="space-y-4">
      <Typography as="h4" variant="title">
        级联多选与标签操作
      </Typography>
      <p className="text-sm text-muted-foreground">
        点击父级标题浏览，点击勾选区或按 Space
        勾选；关联关系按完整路径计算，搜索不丢失隐藏勾选。标签可独立移除，Backspace
        删除最后可移除路径。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setStrategy(strategy === 'parent' ? 'leaf' : 'parent')}
        >
          {strategy === 'parent' ? '回填叶路径' : '回填父路径'}
        </Button>
        <Button variant="outline" onClick={() => setAutoClear(!autoClear)}>
          {autoClear ? '保留多选搜索' : '选择后清空多选搜索'}
        </Button>
        <Button variant="outline" onClick={() => setValue(undefined)}>
          设置多选受控空值
        </Button>
        <Button variant="outline" onClick={() => setRtl(!rtl)}>
          {rtl ? '使用 LTR 级联多选' : '使用 RTL 级联多选'}
        </Button>
        <Button variant="outline" onClick={() => setDisabled(!disabled)}>
          {disabled ? '启用级联多选' : '禁用级联多选'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setRemoveDesign(!removeDesign)}
        >
          {removeDesign ? '恢复设计团队' : '移除设计团队'}
        </Button>
        <Button variant="outline" onClick={() => setValue([['team']])}>
          回填全部产品团队
        </Button>
      </div>
      <ConfigProvider
        direction={rtl ? 'rtl' : 'ltr'}
        theme={{ mode: rtl ? 'dark' : 'light' }}
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <FormField
            label="关联级联多选"
            control={
              <Cascader
                multiple
                label="关联级联多选"
                options={options}
                value={value}
                onChange={setValue}
                showSearch
                allowClear
                showCheckedStrategy={strategy}
                autoClearSearchValue={autoClear}
                disabled={disabled}
                maxTagCount={2}
              />
            }
          />
          <FormField
            label="多选后的输入"
            control={<Input aria-label="多选后的输入" />}
          />
          <p
            role="status"
            aria-label="级联多选值"
            className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
          >
            {JSON.stringify(value ?? [])}
          </p>
          <FormField
            label="折叠多选路径"
            control={
              <Cascader
                multiple
                label="折叠多选路径"
                options={teams}
                defaultValue={[
                  ['team', 'design', 'mobile'],
                  ['support'],
                  ['unknown', 'pending'],
                  ['disabled', 'child'],
                ]}
                maxTagCount={1}
                maxTagPlaceholder={(omitted) => `另外 ${omitted.length} 条路径`}
                showCheckedStrategy="leaf"
                tagRender={({ label }) => <strong>{label}</strong>}
                allowClear
                variant="filled"
                status="warning"
              />
            }
          />
          <div className="min-w-0 space-y-2 md:col-span-2">
            <h5 className="text-lg font-semibold">内嵌多选面板</h5>
            <Cascader
              multiple
              mode="panel"
              label="内嵌团队多选"
              options={teams}
              showSearch
              listHeight={220}
            />
          </div>
        </div>
      </ConfigProvider>
      <Form
        aria-label="级联多选表单"
        initialValues={{ teams: [] }}
        onFinish={(values) => setSubmitted(JSON.stringify(values.teams))}
      >
        <FormItem
          name="teams"
          label="表单级联多选"
          emptyValue={[]}
          rules={[{ required: true, message: '请选择团队' }]}
          control={
            <Cascader
              multiple
              label="表单级联多选"
              options={teams}
              allowClear
            />
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">提交多选团队</Button>
          <Button type="reset" variant="outline">
            重置多选团队
          </Button>
        </div>
        <p
          role="status"
          aria-label="多选团队提交结果"
          className="text-sm text-muted-foreground [overflow-wrap:anywhere]"
        >
          {submitted}
        </p>
      </Form>
    </section>
  )
}
