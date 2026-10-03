import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Grid, GridCol, GridRow } from '@/shared/ui'

describe('Grid layout', () => {
  it('preserves the auto-fit Grid entry and exposes 24-column composition', () => {
    render(
      <>
        <Grid data-testid="auto" minItemWidth="20rem">
          <span>自动换列</span>
        </Grid>
        <Grid.Row data-testid="row" gutter={{ xs: [8, 12], md: 24 }}>
          <Grid.Col
            data-testid="column"
            span={{ xs: 24, md: 12 }}
            offset={{ sm: 4 }}
          >
            <button type="button">操作</button>
          </Grid.Col>
        </Grid.Row>
      </>,
    )
    const auto = screen.getByTestId('auto')
    const row = screen.getByTestId('row')
    const column = screen.getByTestId('column')
    expect(auto).toHaveClass('grid')
    expect(auto.style.getPropertyValue('--ui-grid-min')).toBe('20rem')
    expect(row).toHaveAttribute('data-grid-row')
    expect(row.style.getPropertyValue('--grid-gap-x-sm')).toBe('8px')
    expect(row.style.getPropertyValue('--grid-gap-y-md')).toBe('0px')
    expect(column.style.getPropertyValue('--grid-col-width-sm')).toBe('100%')
    expect(column.style.getPropertyValue('--grid-col-width-md')).toBe('50%')
    expect(column.style.getPropertyValue('--grid-col-offset-sm')).toBe('0%')
    expect(column.style.getPropertyValue('--grid-col-offset-md')).toContain(
      '16.666',
    )
    expect(screen.getByRole('button', { name: '操作' })).toBeInTheDocument()
  })

  it('clamps invalid spans and offsets and keeps breakpoint visibility explicit', () => {
    render(
      <GridRow gutter={[-8, Number.POSITIVE_INFINITY]}>
        <GridCol
          data-testid="column"
          span={{ xs: 0, sm: 12, md: 40 }}
          offset={{ xs: 10, sm: 20, md: 5 }}
        >
          隐藏后恢复
        </GridCol>
      </GridRow>,
    )
    const column = screen.getByTestId('column')
    expect(column).toHaveClass('hidden', '@min-[640px]/grid-row:block')
    expect(column.style.getPropertyValue('--grid-col-width-xs')).toBe('0%')
    expect(column.style.getPropertyValue('--grid-col-width-md')).toBe('100%')
    expect(column.style.getPropertyValue('--grid-col-offset-sm')).toBe('50%')
    expect(column.style.getPropertyValue('--grid-col-offset-md')).toBe('0%')
    expect(screen.getByText('隐藏后恢复')).toBeInTheDocument()
  })

  it('inherits responsive alignment and forwards row and column refs', () => {
    const rowRef = createRef<HTMLDivElement>()
    const colRef = createRef<HTMLDivElement>()
    render(
      <Grid.Row
        ref={rowRef}
        align={{ sm: 'center', md: 'end' }}
        justify={{ xs: 'start', md: 'evenly' }}
      >
        <Grid.Col ref={colRef} span={6}>
          内容
        </Grid.Col>
      </Grid.Row>,
    )
    expect(rowRef.current).toHaveAttribute('data-grid-row')
    expect(colRef.current).toHaveAttribute('data-grid-col')
    expect(rowRef.current?.style.getPropertyValue('--grid-align-xs')).toBe(
      'stretch',
    )
    expect(rowRef.current?.style.getPropertyValue('--grid-align-sm')).toBe(
      'center',
    )
    expect(rowRef.current?.style.getPropertyValue('--grid-align-md')).toBe(
      'flex-end',
    )
    expect(rowRef.current?.style.getPropertyValue('--grid-justify-sm')).toBe(
      'flex-start',
    )
    expect(rowRef.current?.style.getPropertyValue('--grid-justify-md')).toBe(
      'space-evenly',
    )
  })
})
