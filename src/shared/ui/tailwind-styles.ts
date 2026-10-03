// Shared utility recipes keep native inputs visually consistent without adding CSS selectors.
export const pageShellStyles =
  'mx-auto w-full max-w-[80rem] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)]'

export const skipLinkStyles =
  'absolute top-2 left-2 z-50 -translate-y-[200%] rounded-lg bg-card px-4 py-3 text-card-foreground focus:translate-y-0'

export const textLinkStyles =
  'text-primary underline underline-offset-[0.2em] hover:decoration-[0.13em]'

export const inputStyles =
  'w-full min-h-[max(44px,var(--ui-control-height))] rounded-[var(--ui-field-radius)] border border-input bg-card px-3 py-2.5 text-base leading-6 text-card-foreground placeholder:text-muted-foreground aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]'

/** Ant Design-style field surfaces kept as project-owned variants. */
export const inputVariantStyles = {
  outlined: '',
  filled: 'border-transparent bg-muted',
  borderless: 'border-transparent bg-transparent',
  underlined:
    'rounded-none border-0 border-b border-input bg-transparent focus-visible:border-ring',
} as const

export const inputStatusStyles = {
  default: '',
  error: 'border-destructive focus-visible:border-destructive',
  warning:
    'border-[var(--ui-color-warning)] focus-visible:border-[var(--ui-color-warning)]',
} as const

export const inputSizeStyles = {
  default: '',
  small: 'py-2',
  large: 'min-h-12 px-3.5 py-3',
} as const

export const spinnerIndicatorStyles =
  'shrink-0 animate-[spin_0.7s_linear_infinite] rounded-full border-current border-r-transparent motion-reduce:animate-none'

export const spinnerSizeStyles = {
  small: 'size-4 border-2',
  default: 'size-6 border-[3px]',
  large: 'size-9 border-[3px]',
} as const

export const spinnerStyles = `${spinnerIndicatorStyles} ${spinnerSizeStyles.small}`

export const overlayBackdropStyles = 'fixed inset-0 z-[80] bg-black/50'

export const overlayPanelStyles =
  'fixed z-[81] flex flex-col rounded-[var(--ui-overlay-radius)] border border-border bg-card text-card-foreground shadow-[0_20px_50px_rgb(0_0_0_/_0.2)]'

export const overlayHeaderStyles =
  'flex items-start justify-between gap-[var(--space-md)] p-[var(--space-lg)]'

export const overlayTitleStyles = 'm-0 text-xl font-[650]'

export const overlayDescriptionStyles =
  'mt-[var(--space-xs)] leading-normal text-muted-foreground'

export const overlayBodyStyles =
  'min-h-0 overflow-auto overscroll-contain px-[var(--space-lg)] pb-[var(--space-lg)]'

export const overlayFooterStyles =
  'flex flex-wrap justify-end gap-[var(--space-sm)] border-t border-border px-[var(--space-lg)] pt-[var(--space-md)] pb-[max(var(--space-md),env(safe-area-inset-bottom))]'

export const affixShellStyles =
  'flex w-full min-h-[max(44px,var(--ui-control-height))] items-center rounded-[var(--ui-field-radius)] border border-input bg-card text-card-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 data-[invalid=true]:border-destructive data-[disabled=true]:opacity-[0.55]'

export const affixVariantStyles = {
  outlined: '',
  filled: 'border-transparent bg-muted',
  borderless: 'border-transparent bg-transparent',
  underlined:
    'rounded-none border-0 border-b border-input bg-transparent focus-within:border-ring focus-within:ring-0',
} as const

export const affixStatusStyles = {
  default: '',
  error: 'border-destructive focus-within:border-destructive',
  warning:
    'border-[var(--ui-color-warning)] focus-within:border-[var(--ui-color-warning)]',
} as const

export const affixInputStyles =
  'min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base leading-6 text-card-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed'

export const affixActionStyles =
  'inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-[0.55]'
