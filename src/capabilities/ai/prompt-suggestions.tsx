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
    <div className="ui-ai-prompts" aria-label="快捷提示">
      <span className="ui-ai-prompts__label">试试这样问</span>
      <div className="ui-ai-prompts__list">
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
