export function mergeUniqueFiles(existing: File[], next: File[], maxFiles: number): File[] {
  const merged = [...existing]
  const seen = new Set(existing.map((file) => `${file.name}:${file.size}:${file.lastModified}`))

  for (const file of next) {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (seen.has(key)) continue
    merged.push(file)
    seen.add(key)
    if (merged.length >= maxFiles) break
  }

  return merged
}

export function hasPostEditChanges(input: {
  initialContent: string
  initialCategoryId: string
  nextContent: string
  nextCategoryId: string
}) {
  return (
    input.initialContent.trim() !== input.nextContent.trim() ||
    input.initialCategoryId !== input.nextCategoryId
  )
}

export function hasCommentEditChanges(initialContent: string, nextContent: string) {
  return initialContent.trim() !== nextContent.trim()
}
