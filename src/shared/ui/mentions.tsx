import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'
import { Portal } from './portal'

export type MentionOption = {
  value: string
  label: string
  disabled?: boolean
}

export type MentionsProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange' | 'onSelect'
> & {
  options: MentionOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSelect?: (option: MentionOption) => void
  prefix?: string
  size?: 'default' | 'small' | 'large'
  invalid?: boolean
}

type Match = { start: number; query: string }

function findMatch(
  value: string,
  cursor: number,
  prefix: string,
): Match | null {
  if (!prefix || /\s/u.test(prefix)) return null
  const beforeCursor = value.slice(0, cursor)
  const start = beforeCursor.lastIndexOf(prefix)
  if (start < 0) return null
  if (start > 0 && !/[\s([{“‘]/u.test(beforeCursor[start - 1])) return null
  const query = beforeCursor.slice(start + prefix.length)
  if (/\s/u.test(query)) return null
  return { start, query }
}

/** A textarea with project-owned mention values and an accessible suggestion list. */
export const Mentions = forwardRef<HTMLTextAreaElement, MentionsProps>(
  function Mentions(
    {
      options,
      value,
      defaultValue = '',
      onChange,
      onSelect,
      prefix = '@',
      size,
      invalid = false,
      disabled = false,
      readOnly = false,
      rows = 3,
      className,
      onFocus,
      onBlur,
      onClick,
      onKeyDown,
      onKeyUp,
      onCompositionStart,
      onCompositionEnd,
      'aria-invalid': ariaInvalid,
      ...props
    },
    forwardedRef,
  ) {
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    const [internalValue, setInternalValue] = useState(defaultValue)
    const currentValue = value ?? internalValue
    const [focused, setFocused] = useState(false)
    const [cursor, setCursor] = useState<number | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const [composing, setComposing] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [position, setPosition] = useState<CSSProperties | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)
    const pointerSelectingRef = useRef(false)
    const pendingCaretRef = useRef<{ value: string; position: number } | null>(
      null,
    )
    const generatedId = useId()
    const listId = `${generatedId}-suggestions`
    const match =
      focused &&
      !disabled &&
      !readOnly &&
      !dismissed &&
      !composing &&
      cursor !== null
        ? findMatch(currentValue, cursor, prefix)
        : null
    const filtered = match
      ? options.filter((option) =>
          `${option.label} ${option.value}`
            .toLocaleLowerCase()
            .includes(match.query.toLocaleLowerCase()),
        )
      : []
    const enabledIndexes = filtered.flatMap((option, index) =>
      option.disabled ? [] : [index],
    )
    const selectedIndex = enabledIndexes.includes(activeIndex)
      ? activeIndex
      : enabledIndexes[0]
    const open = match !== null

    useLayoutEffect(() => {
      const pending = pendingCaretRef.current
      if (!pending || pending.value !== currentValue) return
      pendingCaretRef.current = null
      textareaRef.current?.setSelectionRange(pending.position, pending.position)
      setCursor(pending.position)
    }, [currentValue])

    useLayoutEffect(() => {
      if (!open) return
      const updatePosition = () => {
        const textarea = textareaRef.current
        if (!textarea) return
        const rect = textarea.getBoundingClientRect()
        const viewport = window.visualViewport
        const leftEdge = viewport?.offsetLeft ?? 0
        const topEdge = viewport?.offsetTop ?? 0
        const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth)
        const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight)
        const width = Math.min(
          Math.max(rect.width, 240),
          rightEdge - leftEdge - 16,
        )
        const left = Math.max(
          leftEdge + 8,
          Math.min(rect.left, rightEdge - width - 8),
        )
        const below = Math.max(0, bottomEdge - rect.bottom - 12)
        const above = Math.max(0, rect.top - topEdge - 12)
        const listHeight = Math.min(listRef.current?.scrollHeight ?? 240, 240)
        const placeAbove = below < Math.min(listHeight, 176) && above > below
        const maxHeight = Math.min(240, placeAbove ? above : below)
        setPosition({
          position: 'fixed',
          left,
          top: placeAbove
            ? Math.max(topEdge + 8, rect.top - maxHeight - 4)
            : rect.bottom + 4,
          width,
          maxHeight,
        })
      }
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      window.visualViewport?.addEventListener('resize', updatePosition)
      window.visualViewport?.addEventListener('scroll', updatePosition)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
        window.visualViewport?.removeEventListener('resize', updatePosition)
        window.visualViewport?.removeEventListener('scroll', updatePosition)
      }
    }, [open, filtered.length])

    useEffect(() => {
      if (!open) return
      const inside = (target: EventTarget | null) =>
        target instanceof Node &&
        (textareaRef.current?.contains(target) ||
          listRef.current?.contains(target))
      const handlePointerDown = (event: PointerEvent) => {
        if (inside(event.target)) return
        pointerSelectingRef.current = false
        setFocused(false)
      }
      const handlePointerUp = (event: PointerEvent) => {
        if (!pointerSelectingRef.current || inside(event.target)) return
        pointerSelectingRef.current = false
        if (document.activeElement !== textareaRef.current) setFocused(false)
      }
      document.addEventListener('pointerdown', handlePointerDown)
      document.addEventListener('pointerup', handlePointerUp)
      return () => {
        document.removeEventListener('pointerdown', handlePointerDown)
        document.removeEventListener('pointerup', handlePointerUp)
      }
    }, [open])

    function updateValue(next: string) {
      if (value === undefined) setInternalValue(next)
      onChange?.(next)
    }

    function selectOption(option: MentionOption) {
      if (!match || option.disabled || cursor === null) return
      const suffix = /^\s/u.test(currentValue.slice(cursor)) ? '' : ' '
      const inserted = `${prefix}${option.value}${suffix}`
      const next =
        currentValue.slice(0, match.start) +
        inserted +
        currentValue.slice(cursor)
      const nextCursor = match.start + inserted.length
      pendingCaretRef.current = { value: next, position: nextCursor }
      pointerSelectingRef.current = false
      textareaRef.current?.focus()
      setDismissed(true)
      updateValue(next)
      onSelect?.(option)
    }

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
      updateValue(event.currentTarget.value)
      setCursor(event.currentTarget.selectionStart)
      setActiveIndex(0)
      setDismissed(false)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
      onKeyDown?.(event)
      if (
        event.defaultPrevented ||
        event.nativeEvent.isComposing ||
        composing ||
        !open
      )
        return
      if (event.key === 'Escape') {
        event.preventDefault()
        setDismissed(true)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!enabledIndexes.length) return
        event.preventDefault()
        const current = enabledIndexes.indexOf(selectedIndex)
        const delta = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex(
          enabledIndexes[
            (current + delta + enabledIndexes.length) % enabledIndexes.length
          ],
        )
      } else if (event.key === 'Enter' && selectedIndex !== undefined) {
        event.preventDefault()
        selectOption(filtered[selectedIndex])
      }
    }

    return (
      <>
        <textarea
          {...props}
          ref={(node) => {
            textareaRef.current = node
            if (typeof forwardedRef === 'function') forwardedRef(node)
            else if (forwardedRef) forwardedRef.current = node
          }}
          value={currentValue}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && selectedIndex !== undefined
              ? `${listId}-option-${selectedIndex}`
              : undefined
          }
          aria-invalid={invalid || ariaInvalid || undefined}
          className={cn(
            inputStyles,
            inputSizeStyles[resolvedSize],
            'min-h-28 resize-y focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
            className,
          )}
          onChange={handleChange}
          onFocus={(event) => {
            setFocused(true)
            setCursor(event.currentTarget.selectionStart)
            setDismissed(false)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            if (!pointerSelectingRef.current) setFocused(false)
            onBlur?.(event)
          }}
          onClick={(event) => {
            setCursor(event.currentTarget.selectionStart)
            setActiveIndex(0)
            setDismissed(false)
            onClick?.(event)
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => {
            setCursor(event.currentTarget.selectionStart)
            onKeyUp?.(event)
          }}
          onCompositionStart={(event) => {
            setComposing(true)
            onCompositionStart?.(event)
          }}
          onCompositionEnd={(event) => {
            setComposing(false)
            setCursor(event.currentTarget.selectionStart)
            onCompositionEnd?.(event)
          }}
        />
        {open && (
          <Portal>
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="提及建议"
              className="z-50 overflow-y-auto overscroll-contain rounded-[var(--ui-overlay-radius)] border border-border bg-card p-1 text-card-foreground shadow-lg"
              style={position ?? { position: 'fixed', visibility: 'hidden' }}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  无匹配项
                </div>
              ) : (
                filtered.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={selectedIndex === index}
                    aria-disabled={option.disabled || undefined}
                    className={cn(
                      'flex min-h-11 touch-manipulation items-center rounded-[var(--ui-field-radius)] px-3 py-2 text-base',
                      option.disabled
                        ? 'cursor-not-allowed opacity-[0.55]'
                        : 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
                      selectedIndex === index &&
                        !option.disabled &&
                        'bg-accent text-accent-foreground',
                    )}
                    onPointerDown={() => {
                      if (!option.disabled) pointerSelectingRef.current = true
                    }}
                    onPointerCancel={() => {
                      pointerSelectingRef.current = false
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </Portal>
        )}
      </>
    )
  },
)
