// Shared utility recipes keep native inputs visually consistent without adding CSS selectors.
export const inputStyles =
  'w-full min-h-[max(44px,var(--ui-control-height))] rounded-[var(--ui-field-radius)] border border-input bg-card px-3 py-2.5 text-base leading-6 text-card-foreground placeholder:text-muted-foreground aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]'

export const inputSizeStyles = {
  default: '',
  small: 'py-2',
} as const

export const spinnerStyles =
  'size-4 shrink-0 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent'
