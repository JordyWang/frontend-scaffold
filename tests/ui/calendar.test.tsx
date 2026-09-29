import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '@/shared/ui'

describe('Calendar', () => {
  it('renders leap-year dates, selects a day and advances focus across months', () => {
    const onChange = vi.fn()
    const onMonthChange = vi.fn()
    render(
      <Calendar
        defaultMonth="2024-02"
        defaultValue="2024-02-29"
        onChange={onChange}
        onMonthChange={onMonthChange}
        renderDate={(date) =>
          date === '2024-02-15' ? <span>发布</span> : null
        }
        getDateDescription={(date) =>
          date === '2024-02-15' ? '发布日' : undefined
        }
      />,
    )
    const grid = screen.getByRole('grid', { name: /2024年2月/ })
    const leapDay = screen.getByRole('button', { name: /2024年2月29日/ })
    expect(grid).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /2024年2月15日.*发布日/ }),
    ).toHaveTextContent('发布')
    expect(leapDay.closest('[aria-selected]')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    leapDay.focus()
    fireEvent.keyDown(leapDay, { key: 'ArrowRight' })
    const marchFirst = screen.getByRole('button', { name: /2024年3月1日/ })
    expect(marchFirst).toHaveFocus()
    expect(onMonthChange).toHaveBeenCalledWith('2024-03')
    fireEvent.click(marchFirst)
    expect(onChange).toHaveBeenCalledWith('2024-03-01')
    expect(marchFirst.closest('[aria-selected]')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('skips disabled dates and respects minimum and maximum months', () => {
    const onChange = vi.fn()
    render(
      <Calendar
        defaultMonth="2024-03"
        defaultValue="2024-03-01"
        minDate="2024-03-01"
        maxDate="2024-03-20"
        disabledDate={(date) => {
          const weekday = new Date(`${date}T12:00:00`).getDay()
          return weekday === 0 || weekday === 6
        }}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('button', { name: '上个月' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下个月' })).toBeDisabled()
    const friday = screen.getByRole('button', { name: /2024年3月1日/ })
    friday.focus()
    fireEvent.keyDown(friday, { key: 'ArrowRight' })
    expect(screen.getByRole('button', { name: /2024年3月4日/ })).toHaveFocus()
    expect(screen.getByRole('button', { name: /2024年3月2日/ })).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps a controlled month authoritative and supports a compact month grid', () => {
    const onMonthChange = vi.fn()
    const { rerender } = render(
      <Calendar
        value="2024-02-14"
        month="2024-02"
        onMonthChange={onMonthChange}
        showOutsideDays={false}
        size="small"
      />,
    )
    expect(screen.getByRole('grid', { name: /2024年2月/ })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    expect(
      screen.getAllByRole('button', { name: /2024年2月\d+日/ }),
    ).toHaveLength(29)
    expect(
      screen
        .getAllByRole('button', { name: /2024年2月\d+日/ })
        .filter((button) => button.getAttribute('tabindex') === '0'),
    ).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '下个月' }))
    expect(onMonthChange).toHaveBeenCalledWith('2024-03')
    expect(screen.getByRole('grid', { name: /2024年2月/ })).toBeInTheDocument()

    rerender(
      <Calendar
        value="2024-02-14"
        month="2024-03"
        onMonthChange={onMonthChange}
        showOutsideDays={false}
        size="small"
      />,
    )
    expect(screen.getByRole('grid', { name: /2024年3月/ })).toBeInTheDocument()
  })

  it('waits for a controlled month update before moving focus across the boundary', () => {
    const onMonthChange = vi.fn()
    const { rerender } = render(
      <Calendar
        value="2024-02-29"
        month="2024-02"
        onMonthChange={onMonthChange}
      />,
    )
    const leapDay = screen.getByRole('button', { name: /2024年2月29日/ })
    leapDay.focus()
    fireEvent.keyDown(leapDay, { key: 'ArrowRight' })
    expect(onMonthChange).toHaveBeenCalledWith('2024-03')
    expect(leapDay).toHaveFocus()

    rerender(
      <Calendar
        value="2024-02-29"
        month="2024-03"
        onMonthChange={onMonthChange}
      />,
    )
    expect(screen.getByRole('button', { name: /2024年3月1日/ })).toHaveFocus()
  })

  it('preserves the day when paging months and clamps leap days across years', () => {
    render(<Calendar defaultMonth="2024-03" defaultValue="2024-03-31" />)
    const march = screen.getByRole('button', { name: /2024年3月31日/ })
    march.focus()
    fireEvent.keyDown(march, { key: 'PageUp' })
    const leapDay = screen.getByRole('button', { name: /2024年2月29日/ })
    expect(leapDay).toHaveFocus()
    fireEvent.keyDown(leapDay, { key: 'PageDown', shiftKey: true })
    expect(screen.getByRole('button', { name: /2025年2月28日/ })).toHaveFocus()
  })
})
