import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { isOptionalPostFeaturesError } from '@/lib/postFeatures'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { optimizeImageFiles, replaceInputFiles } from '@/lib/browser/images'
import { queryKeys } from '@/lib/query/keys'
import { POST_MAX_IMAGES } from '@/lib/constants'
import type { Category, LinkPreview, Post } from '@/lib/types'
import { mergeUniqueFiles } from '@/lib/editor'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { QuotedPostCard } from '@/components/QuotedPostCard'
import { LinkPreviewCard } from '@/components/LinkPreviewCard'
import { extractFirstUrl, fetchLinkPreview } from '@/lib/linkPreview'
import { getAvatarUrl } from '@/lib/utils'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  quotedPost?: Post | null
  onQuoteClear?: () => void
}

export default function PostComposer({ categories, defaultCategoryId = '', quotedPost, onQuoteClear }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const initialized = useAuthStore(s => s.initialized)
  const profileLoaded = useAuthStore(s => s.profileLoaded)
  const toast = useToastStore()

  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [focused, setFocused] = useState(false)
  const [preparingImages, setPreparingImages] = useState(false)
  const [selectedFiles, setSelectedFilesState] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [previewDismissed, setPreviewDismissed] = useState(false)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const [filePickerOpen, setFilePickerOpen] = useState(false)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedUrl = useRef<string | null>(null)

  const [suggestion, setSuggestion] = useState<{ type: '@' | '#'; partial: string; start: number; end: number } | null>(null)
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; username: string; display_name: string; avatar_url: string }>>([])
  const [hashtagResults, setHashtagResults] = useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suppressFocusUntilRef = useRef(0)
  const cachedProfileRef = useRef(profile)

  const displayProfile = profile ?? (user ? cachedProfileRef.current : null)
  const authResolved = initialized && (!user || profileLoaded)

  useEffect(() => {
    if (!user) {
      cachedProfileRef.current = null
      return
    }

    if (profile?.id === user.id) {
      cachedProfileRef.current = profile
      return
    }

    if (cachedProfileRef.current && cachedProfileRef.current.id !== user.id) {
      cachedProfileRef.current = null
    }
  }, [user, profile])

  useEffect(() => {
    const next = defaultCategoryId || (categories[0]?.id ?? '')
    if (!categoryId || !categories.some(c => c.id === categoryId)) {
      setCategoryId(next)
    }
  }, [defaultCategoryId, categories])

  useEffect(() => {
    return () => { imagePreviews.forEach(URL.revokeObjectURL) }
  }, [])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (composerRef.current?.contains(target)) return
      if (filePickerOpen) return
      if (!content.trim() && imagePreviews.length === 0 && !quotedPost) {
        setFocused(false)
      }
      setSuggestion(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [content, imagePreviews.length, quotedPost, filePickerOpen])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        suppressFocusUntilRef.current = Date.now() + 400
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!filePickerOpen) return

    const handleWindowFocus = () => {
      window.setTimeout(() => setFilePickerOpen(false), 0)
    }

    window.addEventListener('focus', handleWindowFocus, { once: true })
    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [filePickerOpen])

  // Auto-focus when quotedPost is set
  useEffect(() => {
    if (quotedPost) setFocused(true)
  }, [quotedPost])

  // Link preview detection
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const url = extractFirstUrl(content)

    if (url !== lastFetchedUrl.current) {
      setPreviewDismissed(false)
    }

    if (!url || previewDismissed) {
      if (!url) { setLinkPreview(null); lastFetchedUrl.current = null }
      return
    }
    if (url === lastFetchedUrl.current) return

    debounceRef.current = setTimeout(async () => {
      lastFetchedUrl.current = url
      setFetchingPreview(true)
      const preview = await fetchLinkPreview(url)
      setLinkPreview(preview)
      setFetchingPreview(false)
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [content, previewDismissed])

  const remaining = 5000 - content.length
  const hasContent =
    content.trim().length > 0 ||
    selectedFiles.length > 0 ||
    imagePreviews.length > 0 ||
    Boolean(quotedPost)
  const canPost = hasContent && categoryId !== '' && remaining >= 0

  function revokePreviews(previews: string[]) {
    previews.forEach(URL.revokeObjectURL)
  }

  function applyFiles(files: File[]) {
    revokePreviews(imagePreviews)
    setSelectedFilesState(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(previews)
    replaceInputFiles(fileInputRef.current, files)
  }

  async function handleIncomingFiles(files: File[]) {
    setPreparingImages(true)
    try {
      const optimized = await optimizeImageFiles(files.slice(0, POST_MAX_IMAGES))
      const merged = mergeUniqueFiles(selectedFiles, optimized, POST_MAX_IMAGES)
      if (merged.length < selectedFiles.length + optimized.length) {
        toast.info(`Vi povas aldoni gxis ${POST_MAX_IMAGES} bildojn.`)
      }
      applyFiles(merged)
      setFocused(true)
    } finally {
      setPreparingImages(false)
    }
  }

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files
    if (!files) return
    try {
      await handleIncomingFiles(Array.from(files))
    } finally {
      setFilePickerOpen(false)
      e.currentTarget.value = ''
    }
  }

  function removeImage(index: number) {
    applyFiles(selectedFiles.filter((_, i) => i !== index))
  }

  function resetComposer() {
    setContent('')
    setFocused(false)
    applyFiles([])
    setLinkPreview(null)
    setPreviewDismissed(false)
    lastFetchedUrl.current = null
    setFilePickerOpen(false)
    onQuoteClear?.()
    setSuggestion(null)
    setMentionResults([])
    setHashtagResults([])
  }

  function maybeCancelComposer() {
    if (!content.trim() && imagePreviews.length === 0 && !quotedPost && !linkPreview) return
    resetComposer()
  }

  function extractImageFiles(files: File[]) {
    return files.filter((file) => file.type.startsWith('image/'))
  }

  function detectTrigger(text: string, cursor: number): { type: '@' | '#'; partial: string; start: number; end: number } | null {
    // Walk back from cursor to find @ or # not preceded by word char
    let i = cursor - 1
    while (i >= 0 && /[\w\u0100-\u024F]/.test(text[i])) i--
    if (i < 0) return null
    const ch = text[i]
    if (ch !== '@' && ch !== '#') return null
    // Ensure it's not mid-word (char before @ or # must be space, newline, or start)
    if (i > 0 && /[\w\u0100-\u024F]/.test(text[i - 1])) return null
    const partial = text.slice(i + 1, cursor)
    return { type: ch as '@' | '#', partial, start: i, end: cursor }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setContent(val)
    const cursor = e.target.selectionStart ?? val.length
    const trigger = detectTrigger(val, cursor)
    if (!trigger) {
      setSuggestion(null)
      return
    }
    setSuggestion(trigger)
    setSuggestionIndex(0)
    if (trigger.type === '@') {
      fetchMentionSuggestions(trigger.partial)
    } else {
      fetchHashtagSuggestions(trigger.partial)
    }
  }

  async function fetchMentionSuggestions(partial: string) {
    if (partial.length === 0) { setMentionResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `${partial}%`)
      .neq('id', profile?.id ?? '')
      .limit(6)
    setMentionResults(data ?? [])
  }

  async function fetchHashtagSuggestions(partial: string) {
    if (partial.length < 2) { setHashtagResults([]); return }
    const { data } = await supabase
      .from('posts')
      .select('content')
      .ilike('content', `%#${partial}%`)
      .eq('is_deleted', false)
      .limit(30)

    const tagRegex = new RegExp(`#(${partial}[\\w\\u0100-\\u024F]*)`, 'gi')
    const seen = new Set<string>()
    for (const row of data ?? []) {
      let m
      tagRegex.lastIndex = 0
      while ((m = tagRegex.exec(row.content)) !== null) {
        seen.add(m[1].toLowerCase())
      }
    }
    setHashtagResults([...seen].slice(0, 6))
  }

  function insertSuggestion(value: string) {
    if (!suggestion || !textareaRef.current) return
    const before = content.slice(0, suggestion.start)
    const after = content.slice(suggestion.end)
    const insertion = suggestion.type === '@' ? `@${value} ` : `#${value} `
    const next = before + insertion + after
    setContent(next)
    setSuggestion(null)
    setMentionResults([])
    setHashtagResults([])
    // Restore focus and move cursor after insertion
    setTimeout(() => {
      const pos = before.length + insertion.length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!displayProfile) throw new Error('Not authenticated')

      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `${displayProfile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('post-images').upload(path, file)
          if (error) throw error
          const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
          imageUrls.push(publicUrl)
        }
      }

      const payload = {
        user_id: displayProfile.id,
        category_id: categoryId,
        content: content.trim(),
        image_urls: imageUrls,
        quoted_post_id: quotedPost?.id ?? null,
        link_preview: linkPreview ?? null,
      }

      let { error } = await supabase.from('posts').insert(payload as never)

      if (error && isOptionalPostFeaturesError(error)) {
        const fallbackPayload = {
          user_id: displayProfile.id,
          category_id: categoryId,
          content: content.trim(),
          image_urls: imageUrls,
        }

        const fallback = await supabase.from('posts').insert(fallbackPayload as never)
        error = fallback.error
      }

      if (error) throw error

    },
    onSuccess: () => {
      toast.success(t('toast_post_created'))
      resetComposer()
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('toast_action_failed'))
    },
  })

  const showBar = focused || filePickerOpen || content.trim().length > 0 || imagePreviews.length > 0 || !!quotedPost

  return (
    <div
      ref={composerRef}
      className={`composer${isDraggingFiles ? ' drag-active' : ''}`}
      onFocus={(event) => {
        if (Date.now() < suppressFocusUntilRef.current && !content.trim() && imagePreviews.length === 0 && !quotedPost) {
          const target = event.target as HTMLElement | null
          target?.blur?.()
          return
        }
        setFocused(true)
      }}
      onDragEnter={(event) => {
        if (!extractImageFiles(Array.from(event.dataTransfer.items).map((item) => item.getAsFile()).filter(Boolean) as File[]).length) return
        event.preventDefault()
        setFocused(true)
        setIsDraggingFiles(true)
      }}
      onDragOver={(event) => {
        const hasImages = Array.from(event.dataTransfer.items).some((item) => item.kind === 'file' && item.type.startsWith('image/'))
        if (!hasImages) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        if (!isDraggingFiles) setIsDraggingFiles(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setIsDraggingFiles(false)
      }}
      onDrop={(event) => {
        const droppedFiles = extractImageFiles(Array.from(event.dataTransfer.files))
        if (!droppedFiles.length) return
        event.preventDefault()
        setIsDraggingFiles(false)
        void handleIncomingFiles(droppedFiles)
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onFilesChange}
      />

      {quotedPost && (
        <div className="quote-wrap">
          <div className="quote-label">
            <span>Citante</span>
            <button type="button" className="quote-clear" onClick={onQuoteClear} aria-label="Forigu citaĵon">
              <X size={12} />
            </button>
          </div>
          <QuotedPostCard post={quotedPost} />
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder={quotedPost ? 'Aldonu vian komenton...' : t('post_compose_placeholder')}
        maxLength={5000}
        rows={focused || !!quotedPost ? 4 : 2}
        className="composer-textarea"
        onKeyDown={(event) => {
          if (suggestion) {
            const results = suggestion.type === '@' ? mentionResults : hashtagResults
            const count = results.length
            if (event.key === 'ArrowDown') { event.preventDefault(); setSuggestionIndex(i => (i + 1) % Math.max(count, 1)); return }
            if (event.key === 'ArrowUp') { event.preventDefault(); setSuggestionIndex(i => (i - 1 + Math.max(count, 1)) % Math.max(count, 1)); return }
            if ((event.key === 'Enter' || event.key === 'Tab') && count > 0) {
              event.preventDefault()
              const selected = suggestion.type === '@' ? (mentionResults[suggestionIndex] as any).username : hashtagResults[suggestionIndex]
              insertSuggestion(selected)
              return
            }
            if (event.key === 'Escape') { setSuggestion(null); return }
          }
          // existing handlers:
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canPost && !mutation.isPending && !preparingImages) {
            event.preventDefault()
            mutation.mutate()
          }
          if (event.key === 'Escape' && !suggestion) {
            event.preventDefault()
            maybeCancelComposer()
          }
        }}
        onPaste={(event) => {
          const pastedImages = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'))
          if (!pastedImages.length) return
          event.preventDefault()
          void handleIncomingFiles(pastedImages)
        }}
      />

      {suggestion && (
        <div className="suggest-drop" role="listbox">
          {suggestion.type === '@' && mentionResults.length === 0 && suggestion.partial.length > 0 && (
            <div className="suggest-empty">Neniu trovita</div>
          )}
          {suggestion.type === '@' && mentionResults.map((u, i) => (
            <button
              key={u.id}
              type="button"
              role="option"
              aria-selected={i === suggestionIndex}
              className={`suggest-item${i === suggestionIndex ? ' active' : ''}`}
              onMouseDown={e => { e.preventDefault(); insertSuggestion(u.username) }}
            >
              <img src={getAvatarUrl(u.avatar_url, u.display_name)} alt="" className="suggest-ava" />
              <span className="suggest-name">{u.display_name}</span>
              <span className="suggest-user">@{u.username}</span>
            </button>
          ))}
          {suggestion.type === '#' && hashtagResults.map((tag, i) => (
            <button
              key={tag}
              type="button"
              role="option"
              aria-selected={i === suggestionIndex}
              className={`suggest-item${i === suggestionIndex ? ' active' : ''}`}
              onMouseDown={e => { e.preventDefault(); insertSuggestion(tag) }}
            >
              <span className="suggest-hash">#</span>
              <span className="suggest-name">{tag}</span>
            </button>
          ))}
        </div>
      )}

      {isDraggingFiles && (
        <div className="drop-hint">
          <span>{t('post_compose_drop_images')}</span>
        </div>
      )}

      {(linkPreview || fetchingPreview) && !previewDismissed && (
        <div className="preview-wrap">
          {fetchingPreview ? (
            <div className="preview-loading"><InlineSpinner size={13} /> <span>Serĉante antaŭvidon...</span></div>
          ) : linkPreview ? (
            <>
              <LinkPreviewCard preview={linkPreview} />
              <button type="button" className="preview-dismiss" onClick={() => { setPreviewDismissed(true); setLinkPreview(null) }}>
                <X size={12} /> Forigi antaŭvidon
              </button>
            </>
          ) : null}
        </div>
      )}

      {imagePreviews.length > 0 && (
        <div className="img-previews">
          {imagePreviews.map((src, i) => (
            <div key={i} className="img-thumb">
              <img src={src} alt={`preview ${i + 1}`} />
              <button
                type="button"
                className="img-remove"
                onClick={() => removeImage(i)}
                onMouseDown={e => e.preventDefault()}
                aria-label="Quitar imagen"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {showBar && (
        <div className="bar">
          <div className="bar-main">
            <label className="bar-chip category-chip">
              <span className="chip-label">{t('post_compose_category')}</span>
              <span className="cat-select-wrap">
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="cat-select"
                  disabled={!authResolved || !displayProfile}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{t(`cat_name_${cat.slug}` as any)}</option>
                  ))}
                </select>
                <svg className="cat-chevron" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </label>

            <button
              type="button"
              className="bar-chip file-btn"
              title={t('post_compose_images')}
              disabled={!authResolved || !displayProfile}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                if (!authResolved || !displayProfile) return
                setFocused(true)
                setFilePickerOpen(true)
                if (fileInputRef.current) fileInputRef.current.value = ''
                fileInputRef.current?.click()
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>{selectedFiles.length > 0 ? `${selectedFiles.length}/${POST_MAX_IMAGES} ${t('post_compose_images_count')}` : t('post_compose_images')}</span>
            </button>
          </div>

          <div className="bar-meta">
            <span className="hint">{selectedFiles.length > 0 ? t('post_compose_images_only') : t('post_compose_images_limit', { count: POST_MAX_IMAGES })}</span>
            <span
              className={`chars${remaining < 200 ? ' warn' : ''}${remaining < 0 ? ' over' : ''}`}
            >{remaining}</span>
          </div>

          <button
            type="button"
            className="post-btn"
            disabled={!authResolved || !displayProfile || !canPost || mutation.isPending || preparingImages}
            onClick={() => mutation.mutate()}
            aria-busy={mutation.isPending || preparingImages}
          >
            {preparingImages || mutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
            {preparingImages ? t('post_compose_preparing') : mutation.isPending ? t('post_compose_posting') : t('post_compose_btn')}
          </button>
        </div>
      )}

      <style>{`
        .composer { position: relative; border-bottom: 1px solid var(--color-border); padding: 0.85rem 0; margin-bottom: 0.25rem; transition: background 0.12s ease, box-shadow 0.12s ease; }
        .composer.drag-active { background: color-mix(in srgb, var(--color-primary) 4%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent); border-radius: 1rem; }
        .composer-textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 0.9375rem; line-height: 1.6; color: var(--color-text); font-family: inherit; display: block; box-sizing: border-box; padding: 0.15rem 0; }
        .composer-textarea::placeholder { color: var(--color-text-muted); }
        .drop-hint { display: inline-flex; align-items: center; gap: 0.35rem; margin: 0.35rem 0 0.15rem; padding: 0.4rem 0.75rem; border-radius: 999px; background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-alt)); color: var(--color-primary); font-size: 0.78rem; font-weight: 600; }
        .quote-wrap { margin-bottom: 0.55rem; }
        .quote-label { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--color-primary); font-weight: 600; margin-bottom: 0.2rem; }
        .quote-clear { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 0.1rem; border-radius: 4px; display: flex; align-items: center; }
        .quote-clear:hover { color: var(--color-danger); }
        .preview-wrap { margin: 0.35rem 0 0.2rem; }
        .preview-loading { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--color-text-muted); padding: 0.5rem 0; }
        .preview-dismiss { background: none; border: none; font-size: 0.73rem; color: var(--color-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0; font-family: inherit; margin-top: -0.4rem; }
        .preview-dismiss:hover { color: var(--color-danger); }
        .bar { display: flex; align-items: center; gap: 0.8rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); margin-top: 0.55rem; animation: fadeIn 0.12s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
        .bar-main { display: flex; align-items: center; gap: 0.6rem; min-width: 0; flex: 1; flex-wrap: wrap; }
        .bar-meta { display: flex; align-items: center; gap: 0.55rem; margin-left: auto; }
        .bar-chip { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 2.4rem; padding: 0.35rem 0.75rem; border: 1px solid var(--color-border); border-radius: 999px; background: color-mix(in srgb, var(--color-surface-alt) 78%, white 22%); color: var(--color-text-muted); transition: border-color 0.12s, color 0.12s, background 0.12s, box-shadow 0.12s; }
        .bar-chip:focus-within, .bar-chip:hover { border-color: color-mix(in srgb, var(--color-primary) 44%, var(--color-border)); color: var(--color-text); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-alt)); }
        .chip-label { font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); letter-spacing: 0.02em; text-transform: uppercase; }
        .category-chip { gap: 0.6rem; padding-right: 0.5rem; }
        .cat-select-wrap { position: relative; display: inline-flex; align-items: center; min-width: 9.5rem; max-width: 13rem; padding: 0.2rem 1.8rem 0.2rem 0.2rem; border-radius: 999px; background: color-mix(in srgb, var(--color-surface) 72%, white 28%); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 75%, transparent); }
        .cat-select { appearance: none; -webkit-appearance: none; background: transparent; border: none; color: var(--color-text); font-size: 0.84rem; font-weight: 600; font-family: inherit; padding: 0 0.2rem; cursor: pointer; min-width: 100%; width: 100%; outline: none; text-overflow: ellipsis; }
        .cat-chevron { position: absolute; right: 0.55rem; color: var(--color-text-muted); pointer-events: none; }
        .file-btn { cursor: pointer; font-size: 0.82rem; font-family: inherit; white-space: nowrap; }
        .file-btn svg { color: var(--color-primary); flex-shrink: 0; }
        .hint { font-size: 0.74rem; color: var(--color-text-muted); white-space: nowrap; }
        .img-previews { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 0 0.25rem; }
        .img-thumb { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); flex-shrink: 0; }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .img-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 99px; background: rgba(0,0,0,0.65); border: none; color: #fff; font-size: 0.85rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.1s; }
        .img-remove:hover { background: rgba(220,38,38,0.85); }
        .chars { font-size: 0.75rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
        .chars.warn { color: #d97706; }
        .chars.over { color: var(--color-danger); font-weight: 600; }
        .post-btn { background: linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 88%, white 12%), var(--color-primary)); color: #fff; border: none; border-radius: 999px; padding: 0.62rem 1rem; font-size: 0.825rem; font-weight: 700; cursor: pointer; transition: opacity 0.12s, transform 0.12s; font-family: inherit; box-shadow: 0 10px 18px -14px color-mix(in srgb, var(--color-primary) 60%, black 40%); }
        .post-btn:not(:disabled):hover { opacity: 0.85; }
        .post-btn:not(:disabled):active { transform: translateY(1px); }
        .post-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
        .post-btn { display: inline-flex; align-items: center; justify-content: center; }
        .suggest-drop { position: absolute; left: 0; right: 0; z-index: 50; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden; margin-top: 0.2rem; }
        .suggest-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.55rem 0.85rem; background: none; border: none; cursor: pointer; font-family: inherit; text-align: left; transition: background 0.1s; }
        .suggest-item:hover, .suggest-item.active { background: var(--color-primary-dim); }
        .suggest-ava { width: 22px; height: 22px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
        .suggest-name { font-size: 0.84rem; font-weight: 600; color: var(--color-text); }
        .suggest-user { font-size: 0.78rem; color: var(--color-text-muted); }
        .suggest-hash { font-size: 0.9rem; font-weight: 700; color: var(--color-primary); }
        .suggest-empty { padding: 0.55rem 0.85rem; font-size: 0.82rem; color: var(--color-text-muted); }
        @media (max-width: 720px) {
          .bar { flex-wrap: wrap; align-items: stretch; }
          .bar-main { width: 100%; }
          .bar-meta { margin-left: 0; justify-content: space-between; width: 100%; }
          .post-btn { width: 100%; }
          .hint { white-space: normal; }
        }
      `}</style>
    </div>
  )
}
