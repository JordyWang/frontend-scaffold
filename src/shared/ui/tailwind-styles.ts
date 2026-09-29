// Shared utility recipes keep native inputs visually consistent without adding CSS selectors.
export const inputStyles =
  'w-full min-h-[max(44px,var(--ui-control-height))] rounded-[var(--ui-field-radius)] border border-input bg-card px-3 py-2.5 text-base leading-6 text-card-foreground placeholder:text-muted-foreground aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]'

export const inputSizeStyles = {
  default: '',
  small: 'py-2',
  large: 'min-h-12 px-3.5 py-3',
} as const

export const spinnerStyles =
  'size-4 shrink-0 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent'

export const affixShellStyles =
  'flex w-full min-h-[max(44px,var(--ui-control-height))] items-center rounded-[var(--ui-field-radius)] border border-input bg-card text-card-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 data-[invalid=true]:border-destructive data-[disabled=true]:opacity-[0.55]'

export const affixInputStyles =
  'min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base leading-6 text-card-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed'

export const affixActionStyles =
  'inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-[0.55]'
