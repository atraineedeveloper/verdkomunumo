import { Link } from 'react-router-dom'
import { routes } from '@/lib/routes'

// Token types: url, mention (@username), hashtag (#tag)
type Token =
  | { kind: 'text'; value: string }
  | { kind: 'url'; value: string }
  | { kind: 'mention'; username: string }
  | { kind: 'hashtag'; tag: string }

const COMBINED_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+|(?<![&\w#@])@([\w]+)|(?<![&\w#@])#([\w\u0100-\u024F]+)/g

function tokenize(content: string): Token[] {
  const tokens: Token[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  COMBINED_REGEX.lastIndex = 0
  while ((match = COMBINED_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', value: content.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('http')) {
      tokens.push({ kind: 'url', value: raw })
    } else if (raw.startsWith('@')) {
      tokens.push({ kind: 'mention', username: match[1] })
    } else {
      tokens.push({ kind: 'hashtag', tag: match[2] })
    }
    lastIndex = match.index + raw.length
  }
  if (lastIndex < content.length) {
    tokens.push({ kind: 'text', value: content.slice(lastIndex) })
  }
  return tokens
}

export function RichText({ content, className }: { content: string; className?: string }) {
  const tokens = tokenize(content)
  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (token.kind === 'text') return token.value
        if (token.kind === 'url') return (
          <a key={i} href={token.value} target="_blank" rel="noopener noreferrer" className="post-link" onClick={e => e.stopPropagation()}>
            {token.value}
          </a>
        )
        if (token.kind === 'mention') return (
          <Link key={i} to={routes.profile(token.username)} className="post-mention" onClick={e => e.stopPropagation()}>
            @{token.username}
          </Link>
        )
        // hashtag
        return (
          <Link key={i} to={`${routes.search}?q=%23${token.tag}`} className="post-hashtag" onClick={e => e.stopPropagation()}>
            #{token.tag}
          </Link>
        )
      })}
    </span>
  )
}
