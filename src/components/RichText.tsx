const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

export function RichText({ content, className }: { content: string; className?: string }) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    const url = match[0]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="post-link"
        onClick={e => e.stopPropagation()}
      >
        {url}
      </a>
    )
    lastIndex = match.index + url.length
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }
  return <span className={className}>{parts}</span>
}
