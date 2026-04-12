export type ComposerSuggestion = {
  type: '@' | '#'
  partial: string
  start: number
  end: number
}

export type MentionSuggestion = {
  id: string
  username: string
  display_name: string
  avatar_url: string
}

export function detectSuggestionTrigger(text: string, cursor: number): ComposerSuggestion | null {
  let index = cursor - 1
  while (index >= 0 && /[\w\u0100-\u024F]/.test(text[index])) index -= 1
  if (index < 0) return null

  const marker = text[index]
  if (marker !== '@' && marker !== '#') return null
  if (index > 0 && /[\w\u0100-\u024F]/.test(text[index - 1])) return null

  return {
    type: marker,
    partial: text.slice(index + 1, cursor),
    start: index,
    end: cursor,
  }
}

export function buildSuggestionContent(
  content: string,
  suggestion: ComposerSuggestion,
  value: string,
) {
  const before = content.slice(0, suggestion.start)
  const after = content.slice(suggestion.end)
  const insertion = suggestion.type === '@' ? `@${value} ` : `#${value} `

  return {
    nextContent: before + insertion + after,
    cursorPosition: before.length + insertion.length,
  }
}
