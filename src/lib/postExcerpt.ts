export type PostExcerptOptions = {
  maxLines?: number
  maxChars?: number
}

export function shouldShowReadMore(content: string, options: PostExcerptOptions = {}) {
  const normalized = content.trim()
  if (!normalized) return false

  const maxLines = options.maxLines ?? 6
  const maxChars = options.maxChars ?? maxLines * 80
  const lineCount = normalized.split(/\r?\n/).length

  return lineCount > maxLines || normalized.length > maxChars
}
