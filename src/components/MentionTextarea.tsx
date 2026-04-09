import React, { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getAvatarUrl } from '@/lib/utils'

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  onValueChange: (value: string) => void
}

export function MentionTextarea({ value, onValueChange, className, ...rest }: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; username: string; display_name: string; avatar_url: string }>>([])
  const [suggestion, setSuggestion] = useState<{ type: '@'; partial: string; start: number; end: number } | null>(null)

  function detectTrigger(text: string, cursor: number): { type: '@'; partial: string; start: number; end: number } | null {
    let i = cursor - 1
    while (i >= 0 && /[\w\u0100-\u024F]/.test(text[i])) i--
    if (i < 0 || text[i] !== '@') return null
    if (i > 0 && /[\w\u0100-\u024F]/.test(text[i - 1])) return null
    const partial = text.slice(i + 1, cursor)
    return { type: '@', partial, start: i, end: cursor }
  }

  async function fetchMentionSuggestions(partial: string) {
    if (partial.length === 0) {
      setMentionResults([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `${partial}%`)
      .order('followers_count', { ascending: false })
      .limit(5)
    setMentionResults(data ?? [])
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    onValueChange(val)
    const cursor = e.target.selectionStart
    const trig = detectTrigger(val, cursor)
    setSuggestion(trig)
    if (trig && trig.type === '@') {
      fetchMentionSuggestions(trig.partial)
    } else {
      setMentionResults([])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (rest.onKeyDown) rest.onKeyDown(e)
    if (e.defaultPrevented) return

    if (suggestion && mentionResults.length > 0) {
      if (e.key === 'Escape') {
        setSuggestion(null)
        setMentionResults([])
        e.preventDefault()
      }
    }
  }

  function applyMention(username: string) {
    if (!suggestion) return
    const before = value.slice(0, suggestion.start)
    const after = value.slice(suggestion.end)
    const newText = `${before}@${username} ${after}`
    onValueChange(newText)
    setSuggestion(null)
    setMentionResults([])
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursor = suggestion.start + username.length + 2
        textareaRef.current.setSelectionRange(newCursor, newCursor)
      }
    }, 0)
  }

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={className}
        {...rest}
      />
      {suggestion && suggestion.type === '@' && mentionResults.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-xl sm:max-w-xs bottom-full mb-2">
          {mentionResults.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--color-bg)] transition-colors"
                onClick={() => applyMention(u.username)}
              >
                <img src={getAvatarUrl(u.avatar_url, u.display_name)} alt="" className="h-7 w-7 rounded-full object-cover" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-[0.9rem] font-bold text-[var(--color-text)]">{u.display_name}</span>
                  <span className="truncate text-[0.75rem] text-[var(--color-text-muted)]">@{u.username}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
