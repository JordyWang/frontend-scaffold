export type FloatButtonPosition =
  'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export const floatButtonPositionStyles: Record<FloatButtonPosition, string> = {
  'bottom-right':
    'right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] left-auto top-auto',
  'bottom-left':
    'left-[max(1rem,env(safe-area-inset-left))] bottom-[max(1rem,env(safe-area-inset-bottom))] right-auto top-auto',
  'top-right':
    'right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] left-auto bottom-auto',
  'top-left':
    'left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] right-auto bottom-auto',
}

export const floatButtonControlStyles =
  'size-[max(44px,var(--ui-button-height))] border-border shadow-[0_8px_24px_rgb(0_0_0_/_0.18)]'

export const floatButtonShapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-[var(--radius-md)]',
} as const
