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
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { QuotedPostCard } from '@/components/QuotedPostCard'
import { LinkPreviewCard } from '@/components/LinkPreviewCard'
import { extractFirstUrl, fetchLinkPreview } from '@/lib/linkPreview'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  quotedPost?: Post | null
  onQuoteClear?: () => void
}

export default function PostComposer({ categories, defaultCategoryId = '', quotedPost, onQuoteClear }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useAuthStore(s => s.profile)
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedUrl = useRef<string | null>(null)

  useEffect(() => {
    const next = defaultCategoryId || (categories[0]?.id ?? '')
    if (!categoryId || !categories.some(c => c.id === categoryId)) {
      setCategoryId(next)
    }
  }, [defaultCategoryId, categories])

  useEffect(() => {
    return () => { imagePreviews.forEach(URL.revokeObjectURL) }
  }, [])

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
  const canPost = content.trim().length > 0 && categoryId !== '' && remaining >= 0

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

  function mergeFiles(existing: File[], next: File[]): File[] {
    const merged = [...existing]
    const seen = new Set(existing.map(f => `${f.name}:${f.size}:${f.lastModified}`))
    for (const f of next) {
      const key = `${f.name}:${f.size}:${f.lastModified}`
      if (seen.has(key)) continue
      merged.push(f)
      seen.add(key)
      if (merged.length >= POST_MAX_IMAGES) break
    }
    return merged
  }

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files
    if (!files) return
    setPreparingImages(true)
    const optimized = await optimizeImageFiles(Array.from(files).slice(0, POST_MAX_IMAGES))
    applyFiles(mergeFiles(selectedFiles, optimized).slice(0, POST_MAX_IMAGES))
    setPreparingImages(false)
    setFocused(true)
  }

  function removeImage(index: number) {
    applyFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Not authenticated')

      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from('post-images').upload(path, file)
          if (error) throw error
          const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
          imageUrls.push(publicUrl)
        }
      }

      const payload = {
        user_id: profile.id,
        category_id: categoryId,
        content: content.trim(),
        image_urls: imageUrls,
        quoted_post_id: quotedPost?.id ?? null,
        link_preview: linkPreview ?? null,
      }

      let { error } = await supabase.from('posts').insert(payload as never)

      if (error && isOptionalPostFeaturesError(error)) {
        const fallbackPayload = {
          user_id: profile.id,
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
      setContent('')
      setFocused(false)
      applyFiles([])
      setLinkPreview(null)
      setPreviewDismissed(false)
      lastFetchedUrl.current = null
      onQuoteClear?.()
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('toast_action_failed'))
    },
  })

  const showBar = focused || content.trim().length > 0 || imagePreviews.length > 0 || !!quotedPost

  return (
    <div
      className="composer"
      onFocus={() => setFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node) && !content.trim() && imagePreviews.length === 0 && !quotedPost) {
          setFocused(false)
        }
      }}
    >
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
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={quotedPost ? 'Aldonu vian komenton...' : t('post_compose_placeholder')}
        maxLength={5000}
        rows={focused || !!quotedPost ? 4 : 2}
        className="composer-textarea"
      />

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
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="cat-select"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{t(`cat_name_${cat.slug}` as any)}</option>
            ))}
          </select>

          <button
            type="button"
            className="file-btn"
            title="Adjuntar imágenes"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setFocused(true); fileInputRef.current?.click() }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={onFilesChange}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {selectedFiles.length > 0 && <span className="file-count">{selectedFiles.length}/{POST_MAX_IMAGES}</span>}
          </button>

          <span
            className={`chars${remaining < 200 ? ' warn' : ''}${remaining < 0 ? ' over' : ''}`}
          >{remaining}</span>

          <button
            type="button"
            className="post-btn"
            disabled={!canPost || mutation.isPending || preparingImages}
            onClick={() => mutation.mutate()}
            aria-busy={mutation.isPending || preparingImages}
          >
            {preparingImages || mutation.isPending ? <InlineSpinner size={13} className="mr-1.5" /> : null}
            {preparingImages ? 'Preparando...' : mutation.isPending ? 'Publicando...' : t('post_compose_btn')}
          </button>
        </div>
      )}

      <style>{`
        .composer { position: relative; border-bottom: 1px solid var(--color-border); padding: 0.85rem 0; margin-bottom: 0.25rem; }
        .composer-textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 0.9375rem; line-height: 1.6; color: var(--color-text); font-family: inherit; display: block; box-sizing: border-box; }
        .composer-textarea::placeholder { color: var(--color-text-muted); }
        .quote-wrap { margin-bottom: 0.35rem; }
        .quote-label { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--color-primary); font-weight: 600; margin-bottom: 0.2rem; }
        .quote-clear { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 0.1rem; border-radius: 4px; display: flex; align-items: center; }
        .quote-clear:hover { color: var(--color-danger); }
        .preview-wrap { margin: 0.2rem 0; }
        .preview-loading { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--color-text-muted); padding: 0.5rem 0; }
        .preview-dismiss { background: none; border: none; font-size: 0.73rem; color: var(--color-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.1rem 0; font-family: inherit; margin-top: -0.4rem; }
        .preview-dismiss:hover { color: var(--color-danger); }
        .bar { display: flex; align-items: center; gap: 0.65rem; padding-top: 0.6rem; border-top: 1px solid var(--color-border); margin-top: 0.5rem; animation: fadeIn 0.12s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
        .cat-select { background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 5px; color: var(--color-text); font-size: 0.8rem; font-family: inherit; padding: 0.28rem 0.55rem; cursor: pointer; transition: border-color 0.12s; }
        .cat-select:hover { border-color: var(--color-primary); }
        .file-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 5px; color: var(--color-text-muted); font-size: 0.8rem; padding: 0.28rem 0.55rem; cursor: pointer; transition: border-color 0.12s, color 0.12s; white-space: nowrap; }
        .file-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .file-count { font-size: 0.73rem; font-weight: 600; color: var(--color-primary); }
        .img-previews { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 0 0.25rem; }
        .img-thumb { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border); flex-shrink: 0; }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .img-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 99px; background: rgba(0,0,0,0.65); border: none; color: #fff; font-size: 0.85rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.1s; }
        .img-remove:hover { background: rgba(220,38,38,0.85); }
        .chars { font-size: 0.75rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
        .chars.warn { color: #d97706; }
        .chars.over { color: var(--color-danger); font-weight: 600; }
        .post-btn { margin-left: auto; background: var(--color-primary); color: #fff; border: none; border-radius: 5px; padding: 0.35rem 0.9rem; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: opacity 0.12s; font-family: inherit; }
        .post-btn:not(:disabled):hover { opacity: 0.85; }
        .post-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .post-btn { display: inline-flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  )
}
