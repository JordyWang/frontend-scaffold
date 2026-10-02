import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'
import { Tooltip, type TooltipProps } from './overlay'
import { Textarea } from './textarea'
import { typographyDocument, typographyHtmlText } from './typography-document'
import {
  typographyRows,
  typographyText,
  useTypographyOverflow,
} from './typography-ellipsis'
import {
  writeTypographyClipboard,
  type TypographyCopyFormat,
} from './typography-clipboard'

const variantStyles = {
  body: '',
  caption: 'text-sm',
  title: 'text-lg font-semibold leading-[1.35]',
  heading: 'text-[clamp(1.5rem,2vw,2rem)] font-bold leading-tight',
} as const
const toneStyles = {
  default: '',
  muted: 'text-muted-foreground',
  danger: 'text-destructive',
  success: 'text-[var(--ui-color-success)]',
  warning: 'text-[var(--ui-color-warning)]',
} as const
const actionStyles =
  'inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-1 rounded-md px-2 text-base font-normal text-[color-mix(in_srgb,var(--primary)_80%,var(--foreground))] hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-50 disabled:text-muted-foreground disabled:cursor-not-allowed'

export type TypographyPart =
  | 'root'
  | 'content'
  | 'actions'
  | 'action'
  | 'textarea'
  | 'suffix'
  | 'feedback'
  | 'table'
  | 'tableWrapper'
export type TypographyCopyOptions = {
  text?: string | (() => string | Promise<string>)
  format?: TypographyCopyFormat
  onCopy?: (text: string) => void
  onError?: (error: unknown) => void
  icon?: [ReactNode, ReactNode]
  tooltip?: false | [ReactNode, ReactNode]
  label?: string
  successLabel?: string
  errorLabel?: string
  tabIndex?: number
}
export type TypographyEditOptions = {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  editing?: boolean
  defaultEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  onStart?: () => void
  onCancel?: () => void
  onEnd?: (value: string, reason: 'submit' | 'blur') => void
  trigger?: 'icon' | 'text' | 'both'
  maxLength?: number
  autoSize?: boolean | { minRows?: number; maxRows?: number }
  submitOnBlur?: boolean
  icon?: ReactNode
  submitIcon?: ReactNode
  tooltip?: ReactNode | false
  label?: string
  inputLabel?: string
  tabIndex?: number
}
export type TypographyEllipsisOptions = {
  rows?: number
  expandable?: boolean | 'collapsible'
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onEllipsis?: (overflow: boolean) => void
  suffix?: string
  symbol?: ReactNode | ((expanded: boolean) => ReactNode)
  tooltip?: boolean | ReactNode
}
export type TypographyProps = HTMLAttributes<HTMLElement> & {
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: keyof typeof variantStyles
  tone?: keyof typeof toneStyles
  label?: string
  disabled?: boolean
  strong?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  code?: boolean
  keyboard?: boolean
  mark?: boolean
  copyable?: boolean | TypographyCopyOptions
  editable?: boolean | TypographyEditOptions
  ellipsis?: boolean | TypographyEllipsisOptions
  actions?: { placement?: 'start' | 'end' }
  classNames?: Partial<Record<TypographyPart, string>>
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  function Typography(
    {
      as = 'p',
      variant = 'body',
      tone = 'default',
      label = '文本',
      disabled = false,
      strong = false,
      italic = false,
      underline = false,
      strike = false,
      code = false,
      keyboard = false,
      mark = false,
      copyable = false,
      editable = false,
      ellipsis = false,
      actions,
      classNames,
      className,
      children,
      tabIndex,
      ...props
    },
    forwardedRef,
  ) {
    const copy = typeof copyable === 'object' ? copyable : {}
    const copyEnabled = Boolean(copyable)
    const edit = typeof editable === 'object' ? editable : {}
    const clamp = typeof ellipsis === 'object' ? ellipsis : {}
    const textControlled = Object.prototype.hasOwnProperty.call(edit, 'value')
    const [saved, setSaved] = useState({
      source: children,
      value: edit.defaultValue as string | undefined,
    })
    const displayed = textControlled
      ? (edit.value ?? '')
      : saved.source === children && saved.value !== undefined
        ? saved.value
        : children
    const root = useRef<HTMLElement>(null)
    const content = useRef<HTMLElement>(null)
    const body = useRef<HTMLElement>(null)
    const textarea = useRef<HTMLTextAreaElement>(null)
    const editor = useRef<HTMLSpanElement>(null)
    const editButton = useRef<HTMLButtonElement>(null)
    const textButton = useRef<HTMLSpanElement>(null)
    const copyButton = useRef<HTMLButtonElement>(null)
    const expandButton = useRef<HTMLButtonElement>(null)
    const detached = useRef(false)
    const pendingEditorFocus = useRef(false)
    const blurFrame = useRef(0)
    const lastFocused = useRef<HTMLElement | null>(null)
    const finishLatest = useRef<(reason: 'submit' | 'blur' | 'cancel') => void>(
      () => {},
    )
    const generatedId = useId()
    const contentId = generatedId + '-content'
    const feedbackId = generatedId + '-feedback'
    const [internalEditing, setInternalEditing] = useState(
      edit.defaultEditing ?? false,
    )
    const editing = Boolean(
      editable && !disabled && (edit.editing ?? internalEditing),
    )
    const [draft, setDraft] = useState('')
    const settled = useRef(false)
    const committedText = useRef<string | null>(null)
    const initialText = useRef('')
    const previousEditing = useRef(false)
    const previousDisplay = useRef(displayed)
    const [internalExpanded, setInternalExpanded] = useState(
      clamp.defaultExpanded ?? false,
    )
    const [focusReveal, setFocusReveal] = useState(false)
    const expanded = (clamp.expanded ?? internalExpanded) || focusReveal
    const rows = typographyRows(clamp.rows)
    const overflowLayout = useTypographyOverflow(
      content,
      Boolean(ellipsis) && !editing,
      rows,
      displayed,
      clamp.onEllipsis,
    )
    const overflow = overflowLayout.overflow
    const clipped = Boolean(ellipsis) && overflow && !expanded && !editing
    const [copyState, setCopyState] = useState<
      'idle' | 'pending' | 'done' | 'error'
    >('idle')
    const copyGeneration = useRef(0)
    const copying = useRef(false)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const attachTextarea = useCallback(
      (element: HTMLTextAreaElement | null) => {
        if (!element && document.activeElement === textarea.current)
          detached.current = true
        textarea.current = element
      },
      [],
    )
    const attachEditButton = useCallback(
      (element: HTMLButtonElement | null) => {
        if (!element && document.activeElement === editButton.current)
          detached.current = true
        editButton.current = element
      },
      [],
    )
    const attachTextButton = useCallback((element: HTMLSpanElement | null) => {
      if (!element && textButton.current?.contains(document.activeElement))
        detached.current = true
      textButton.current = element
    }, [])
    const attachEditor = useCallback((element: HTMLSpanElement | null) => {
      if (!element && editor.current?.contains(document.activeElement))
        detached.current = true
      editor.current = element
    }, [])
    const attachCopyButton = useCallback(
      (element: HTMLButtonElement | null) => {
        if (!element && document.activeElement === copyButton.current)
          detached.current = true
        copyButton.current = element
      },
      [],
    )
    const attachExpandButton = useCallback(
      (element: HTMLButtonElement | null) => {
        if (!element && document.activeElement === expandButton.current)
          detached.current = true
        expandButton.current = element
      },
      [],
    )
    function fullText() {
      return typeof displayed === 'string' || typeof displayed === 'number'
        ? String(displayed)
        : (body.current?.textContent ?? typographyText(displayed))
    }
    useLayoutEffect(() => {
      const opened = editing && !previousEditing.current
      const changed = previousDisplay.current !== displayed
      previousDisplay.current = displayed
      previousEditing.current = editing
      if (saved.source !== children)
        setSaved({ source: children, value: undefined })
      const acceptedCommit =
        settled.current && displayed === committedText.current
      if (editing && (opened || (changed && !acceptedCommit))) {
        const text =
          typeof displayed === 'string' || typeof displayed === 'number'
            ? String(displayed)
            : (opened && initialText.current) || typographyText(displayed)
        initialText.current = text
        settled.current = false
        setDraft(text)
        if (opened) pendingEditorFocus.current = true
      }
      if (!editable || disabled) setInternalEditing(false)
      const focusedDisabled =
        disabled &&
        lastFocused.current?.matches(':disabled') &&
        root.current?.contains(lastFocused.current)
      if (!editing && (detached.current || focusedDisabled)) {
        detached.current = false
        const active = document.activeElement
        if (
          !active ||
          active === document.body ||
          !active.isConnected ||
          (focusedDisabled && active === lastFocused.current)
        ) {
          const target = disabled
            ? root.current
            : (editButton.current ?? textButton.current ?? root.current)
          if (
            target === root.current &&
            target &&
            !target.hasAttribute('tabindex')
          )
            target.tabIndex = -1
          target?.focus({ preventScroll: true })
        }
      }
    }, [
      editing,
      editable,
      disabled,
      displayed,
      children,
      saved.source,
      copyEnabled,
      overflow,
      expanded,
      clamp.expandable,
    ])
    useLayoutEffect(() => {
      if (
        !editing ||
        !pendingEditorFocus.current ||
        draft !== initialText.current
      )
        return
      pendingEditorFocus.current = false
      textarea.current?.focus({ preventScroll: true })
      textarea.current?.setSelectionRange(draft.length, draft.length)
    }, [editing, draft])
    const autoSize = edit.autoSize ?? true
    const minRows = typographyRows(
      typeof autoSize === 'object' ? autoSize.minRows : undefined,
    )
    const maxRows =
      typeof autoSize === 'object' && autoSize.maxRows !== undefined
        ? Math.max(minRows, typographyRows(autoSize.maxRows, minRows))
        : Infinity
    useLayoutEffect(() => {
      const field = textarea.current
      if (!editing || !field || !autoSize) return
      const resize = () => {
        const styles = getComputedStyle(field)
        const lineHeight = parseFloat(styles.lineHeight) || 24
        const padding =
          (parseFloat(styles.paddingTop) || 0) +
          (parseFloat(styles.paddingBottom) || 0)
        const border =
          (parseFloat(styles.borderTopWidth) || 0) +
          (parseFloat(styles.borderBottomWidth) || 0)
        field.style.height = '0px'
        field.style.height =
          Math.min(
            Math.max(
              field.scrollHeight + border,
              minRows * lineHeight + padding + border,
              44,
            ),
            maxRows * lineHeight + padding + border,
          ) + 'px'
      }
      resize()
      let previousWidth = field.getBoundingClientRect().width
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(() => {
              const width = field.getBoundingClientRect().width
              if (width !== previousWidth) {
                previousWidth = width
                resize()
              }
            })
      observer?.observe(field)
      return () => observer?.disconnect()
    }, [editing, draft, autoSize, minRows, maxRows])
    const invalidateCopy = useCallback(() => {
      copyGeneration.current++
      copying.current = false
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }, [])
    useLayoutEffect(() => {
      invalidateCopy()
      setCopyState('idle')
      return invalidateCopy
    }, [
      displayed,
      copy.text,
      copy.format,
      copyEnabled,
      disabled,
      clamp.suffix,
      invalidateCopy,
    ])
    useEffect(() => () => cancelAnimationFrame(blurFrame.current), [])

    function requestEditing(next: boolean) {
      if (edit.editing === undefined) setInternalEditing(next)
      edit.onEditingChange?.(next)
    }
    function startEditing() {
      if (disabled || !editable || editing) return
      initialText.current = fullText()
      setDraft(initialText.current)
      settled.current = false
      requestEditing(true)
      edit.onStart?.()
    }
    function finishEditing(reason: 'submit' | 'blur' | 'cancel') {
      if (!editing || settled.current) return
      settled.current = true
      committedText.current = reason === 'cancel' ? null : draft
      cancelAnimationFrame(blurFrame.current)
      requestEditing(false)
      if (reason === 'cancel') {
        setDraft(initialText.current)
        edit.onCancel?.()
        return
      }
      if (!textControlled) setSaved({ source: children, value: draft })
      edit.onChange?.(draft)
      edit.onEnd?.(draft, reason)
    }
    useLayoutEffect(() => {
      finishLatest.current = finishEditing
      if (!editing) cancelAnimationFrame(blurFrame.current)
    })
    async function performCopy() {
      if (disabled || !copyable || copying.current) return
      const generation = copyGeneration.current
      const valid = () => generation === copyGeneration.current
      copying.current = true
      if (copyTimer.current) clearTimeout(copyTimer.current)
      setCopyState('pending')
      let text: string
      try {
        text =
          typeof copy.text === 'function'
            ? await copy.text()
            : (copy.text ??
              (copy.format === 'text/html'
                ? (body.current?.innerHTML ?? '') +
                  typographyHtmlText(clamp.suffix ?? '')
                : fullText() + (clamp.suffix ?? '')))
        if (!valid()) return
        if (typeof text !== 'string') throw new Error('复制内容必须是字符串')
        await writeTypographyClipboard(text, copy.format ?? 'text/plain')
        if (!valid()) return
      } catch (error) {
        if (!valid()) return
        copying.current = false
        setCopyState('error')
        copy.onError?.(error)
        return
      }
      copying.current = false
      setCopyState('done')
      copyTimer.current = setTimeout(() => {
        if (valid()) setCopyState('idle')
      }, 2000)
      copy.onCopy?.(text)
    }
    function setExpanded(next: boolean) {
      if (disabled || !ellipsis) return
      if (clamp.expanded === undefined) setInternalExpanded(next)
      clamp.onExpandedChange?.(next)
    }
    const trigger = edit.trigger ?? 'icon'
    const editableText = Boolean(editable) && trigger !== 'icon'
    const canExpand =
      Boolean(ellipsis) &&
      Boolean(clamp.expandable) &&
      overflow &&
      (!expanded || clamp.expandable === 'collapsible')
    function withTooltip(
      button: TooltipProps['children'],
      title: ReactNode | false,
    ) {
      return title === false || title === null || title === undefined ? (
        button
      ) : (
        <Tooltip title={title}>{button}</Tooltip>
      )
    }
    const actionBar = !editing && (copyable || editable || canExpand) && (
      <span className={cn('flex flex-wrap gap-1', classNames?.actions)}>
        {editable &&
          trigger !== 'text' &&
          withTooltip(
            <button
              ref={attachEditButton}
              type="button"
              disabled={disabled}
              tabIndex={edit.tabIndex}
              aria-label={edit.label ?? '编辑' + label}
              className={cn(actionStyles, classNames?.action)}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                startEditing()
              }}
            >
              {edit.icon ?? <Icon name="edit" />}
            </button>,
            edit.tooltip ?? '编辑',
          )}
        {copyable &&
          withTooltip(
            <button
              ref={attachCopyButton}
              type="button"
              disabled={disabled}
              tabIndex={copy.tabIndex}
              aria-label={copy.label ?? '复制' + label}
              aria-busy={copyState === 'pending' || undefined}
              aria-disabled={copyState === 'pending' || undefined}
              aria-describedby={copyState !== 'idle' ? feedbackId : undefined}
              className={cn(actionStyles, classNames?.action)}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                void performCopy()
              }}
            >
              {copy.icon?.[copyState === 'done' ? 1 : 0] ?? (
                <Icon name={copyState === 'done' ? 'check' : 'copy'} />
              )}
            </button>,
            copy.tooltip === false
              ? false
              : (copy.tooltip?.[copyState === 'done' ? 1 : 0] ??
                  (copyState === 'done' ? '复制成功' : '复制')),
          )}
        {canExpand && (
          <button
            ref={attachExpandButton}
            type="button"
            disabled={disabled}
            aria-controls={contentId}
            aria-expanded={expanded}
            aria-label={(expanded ? '收起' : '展开') + label}
            className={cn(actionStyles, classNames?.action)}
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              setExpanded(!expanded)
            }}
          >
            {typeof clamp.symbol === 'function'
              ? clamp.symbol(expanded)
              : (clamp.symbol ?? (expanded ? '收起' : '展开'))}
          </button>
        )}
      </span>
    )
    const richStyles = cn(
      strong && 'font-semibold',
      italic && 'italic',
      underline && 'underline-offset-2',
      underline && strike
        ? '[text-decoration-line:underline_line-through]'
        : underline
          ? 'underline'
          : strike && 'line-through',
    )
    let styled = typographyDocument(displayed, label, classNames)
    if (strong) styled = <strong>{styled}</strong>
    if (italic) styled = <em>{styled}</em>
    if (mark)
      styled = (
        <mark className="rounded bg-[var(--ui-map-warning-bg)] px-0.5 text-[var(--ui-color-warning)]">
          {styled}
        </mark>
      )
    if (code)
      styled = (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.875em]">
          {styled}
        </code>
      )
    if (keyboard)
      styled = (
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.875em]">
          {styled}
        </kbd>
      )
    const contentElement = createElement(as === 'div' ? 'div' : 'span', {
      ref: (element: HTMLElement | null) => {
        content.current = element
      },
      id: contentId,
      'aria-describedby': props['aria-describedby'],
      'data-typography-content': '',
      className: cn(
        'min-w-0 whitespace-pre-wrap wrap-anywhere',
        (ellipsis || copyable || editable) && 'block',
        richStyles,
        classNames?.content,
      ),
      style: {
        '--typography-rows': rows,
        '--typography-tail-height': overflowLayout.tailHeight
          ? `${overflowLayout.tailHeight}px`
          : undefined,
      } as CSSProperties,
      // Clip inside the content padding so the next line cannot bleed into it.
      children: createElement(as === 'div' ? 'div' : 'span', {
        'data-typography-layout': '',
        className: cn(
          'block min-w-0 max-w-full',
          ellipsis &&
            !expanded &&
            !clamp.suffix &&
            'line-clamp-(--typography-rows) max-h-[calc(var(--typography-rows)*1lh)]',
          ellipsis &&
            !expanded &&
            clamp.suffix &&
            'overflow-hidden max-h-[calc((var(--typography-rows)-1)*1lh+var(--typography-tail-height,1lh))]',
        ),
        children: (
          <>
            {clamp.suffix && (
              <>
                <span
                  key="tail-spacer"
                  aria-hidden="true"
                  data-typography-tail-spacer=""
                  className={cn(
                    'float-end w-0 h-[calc((var(--typography-rows)-1)*1lh)]',
                    !clipped && 'hidden',
                  )}
                />
                <span
                  key="tail"
                  aria-hidden="true"
                  data-typography-tail=""
                  className={cn(
                    'float-end clear-both w-max max-w-full whitespace-pre-wrap wrap-anywhere',
                    !clipped && 'hidden',
                  )}
                >
                  <bdi dir="auto">
                    …<span className={classNames?.suffix}>{clamp.suffix}</span>
                  </bdi>
                </span>
              </>
            )}
            {createElement(as === 'div' ? 'div' : 'span', {
              key: 'body',
              ref: (element: HTMLElement | null) => {
                body.current = element
              },
              'data-typography-body': '',
              className: 'inline',
              children: styled,
            })}
            {clamp.suffix && (
              <span
                key="suffix"
                data-typography-suffix-source=""
                className={cn(
                  'whitespace-pre-wrap wrap-anywhere',
                  clipped && 'sr-only',
                  classNames?.suffix,
                )}
              >
                {clamp.suffix}
              </span>
            )}
          </>
        ),
      }),
      onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
        if (clipped && event.target !== event.currentTarget) {
          setFocusReveal(true)
          setExpanded(true)
        }
      },
      tabIndex: clamp.tooltip && clipped ? 0 : undefined,
    })
    const visibleContent =
      ellipsis && clamp.tooltip ? (
        <Tooltip
          open={clipped ? undefined : false}
          title={
            clamp.tooltip === true
              ? fullText() + (clamp.suffix ?? '')
              : clamp.tooltip
          }
        >
          {contentElement}
        </Tooltip>
      ) : (
        contentElement
      )
    const interactive = Boolean(copyable || editable || ellipsis)
    const rendered = editing ? (
      <span
        ref={attachEditor}
        className="grid min-w-0 gap-1"
        onBlurCapture={() => {
          if (edit.submitOnBlur === false) return
          cancelAnimationFrame(blurFrame.current)
          blurFrame.current = requestAnimationFrame(() => {
            if (!editor.current?.contains(document.activeElement))
              finishLatest.current('blur')
          })
        }}
      >
        <Textarea
          ref={attachTextarea}
          aria-label={edit.inputLabel ?? '编辑' + label + '内容'}
          value={draft}
          rows={minRows}
          maxLength={edit.maxLength}
          className={cn(
            'min-h-11 text-base leading-6',
            autoSize && 'resize-none',
            classNames?.textarea,
          )}
          onValueChange={(value) => {
            settled.current = false
            setDraft(value)
          }}
          onKeyDown={(event) => {
            if (
              event.repeat ||
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229
            )
              return
            if (event.key === 'Escape') {
              event.preventDefault()
              finishEditing('cancel')
            } else if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              finishEditing('submit')
            }
          }}
        />
        <span className={cn('flex flex-wrap gap-1', classNames?.actions)}>
          {edit.submitIcon !== null && (
            <button
              type="button"
              aria-label={'保存' + label}
              className={cn(actionStyles, classNames?.action)}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                finishEditing('submit')
              }}
            >
              {edit.submitIcon ?? <Icon name="check" />}
            </button>
          )}
          <button
            type="button"
            aria-label={'取消编辑' + label}
            className={cn(actionStyles, classNames?.action)}
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              finishEditing('cancel')
            }}
          >
            <Icon name="close" />
          </button>
        </span>
      </span>
    ) : interactive ? (
      <>
        {actions?.placement === 'start' && actionBar}
        {editableText ? (
          <span
            ref={attachTextButton}
            role="button"
            tabIndex={disabled ? -1 : (edit.tabIndex ?? 0)}
            aria-disabled={disabled || undefined}
            aria-label={edit.label ?? '编辑' + label}
            className="block min-h-11 min-w-11 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            onClick={(event) => {
              const target = (event.target as Element).closest(
                'a,button,input,select,textarea,[role="button"]',
              )
              if (!target || target === event.currentTarget) startEditing()
            }}
            onKeyDown={(event) => {
              if (
                event.target !== event.currentTarget ||
                event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229 ||
                event.repeat
              )
                return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                startEditing()
              }
            }}
          >
            {visibleContent}
          </span>
        ) : (
          visibleContent
        )}
        {actions?.placement !== 'start' && actionBar}
        {copyState !== 'idle' && (
          <span
            id={feedbackId}
            role={copyState === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            className={cn(
              'block text-sm font-normal',
              copyState === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground',
              classNames?.feedback,
            )}
          >
            {copyState === 'pending'
              ? '正在复制…'
              : copyState === 'done'
                ? (copy.successLabel ?? '复制成功')
                : (copy.errorLabel ?? '复制失败，请重试')}
          </span>
        )}
      </>
    ) : (
      styled
    )
    return createElement(as, {
      ...props,
      onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
        lastFocused.current = event.target as HTMLElement
        props.onFocusCapture?.(event)
      },
      onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
        props.onBlurCapture?.(event)
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusReveal(false)
      },
      ref: (element: HTMLElement | null) => {
        root.current = element
        if (typeof forwardedRef === 'function') forwardedRef(element)
        else if (forwardedRef) forwardedRef.current = element
      },
      tabIndex: tabIndex ?? (interactive ? -1 : undefined),
      'data-typography': '',
      'data-editing': editing || undefined,
      'data-ellipsis': clipped || undefined,
      className: cn(
        'm-0 leading-normal',
        variantStyles[variant],
        toneStyles[tone],
        disabled && 'text-muted-foreground',
        interactive && 'relative min-w-0 max-w-full',
        interactive && as === 'span' && 'inline-block align-baseline',
        as === 'div' && 'min-w-0 max-w-full',
        !interactive && richStyles,
        classNames?.root,
        className,
      ),
      children: rendered,
    })
  },
)
