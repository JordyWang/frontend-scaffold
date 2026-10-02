import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Result } from '@/shared/ui'

describe('Result status presentation', () => {
  it.each([
    ['403', '无权访问', '当前账号没有访问该页面的权限。'],
    ['404', '页面不存在', '请检查页面地址，或返回工作台。'],
    ['500', '服务暂时不可用', '服务暂时无法处理请求，请稍后重试。'],
  ] as const)(
    'provides a complete %s state without caller copy',
    (status, title, description) => {
      render(<Result status={status} />)
      const result = screen.getByRole('region', { name: title })
      expect(result).toHaveAttribute('data-ui-result-status', status)
      expect(result).toHaveTextContent(description)
      expect(result.querySelector('[aria-hidden="true"]')).toHaveTextContent(
        status,
      )
      expect(
        screen.getByRole('heading', { level: 2, name: title }),
      ).toBeVisible()
    },
  )

  it('uses caller content, heading level and compact size', () => {
    render(
      <Result
        status="404"
        title="文件已移动"
        subTitle="请使用新链接。"
        icon={<span>自定义图标</span>}
        headingLevel={4}
        size="small"
        extra={<button type="button">打开新链接</button>}
      >
        <p>原地址已经失效。</p>
      </Result>,
    )
    const result = screen.getByRole('region', { name: '文件已移动' })
    expect(result).toHaveAttribute('data-ui-result-size', 'small')
    expect(result).toHaveTextContent('请使用新链接。')
    expect(result).not.toHaveTextContent('请检查页面地址，或返回工作台。')
    expect(
      screen.getByRole('heading', { level: 4, name: '文件已移动' }),
    ).toBeVisible()
    expect(result.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      '自定义图标',
    )
    expect(result).toContainElement(
      screen.getByRole('button', { name: '打开新链接' }),
    )
    expect(result).toContainElement(screen.getByText('原地址已经失效。'))
  })

  it('provides sensible defaults for semantic outcomes', () => {
    render(
      <>
        <Result status="success" />
        <Result status="error" />
        <Result status="warning" />
        <Result />
      </>,
    )
    for (const title of ['操作成功', '操作失败', '请注意', '提示']) {
      expect(screen.getByRole('region', { name: title })).toBeVisible()
    }
  })
})
