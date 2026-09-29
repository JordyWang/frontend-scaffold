import { Button } from '@/shared/ui'

export type PromptSuggestionsProps = {
  items: readonly string[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function PromptSuggestions({
  items,
  onSelect,
  disabled,
}: PromptSuggestionsProps) {
  if (items.length === 0) return null
  return (
    <div className="grid gap-[var(--space-xs)]" aria-label="快捷提示">
      <span className="text-[0.8125rem] text-muted-foreground">试试这样问</span>
      <div className="flex flex-wrap gap-[var(--space-xs)]">
        {items.map((item) => (
          <Button
            key={item}
            type="button"
            size="small"
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  )
}
