import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { optimizeImageFiles, replaceInputFiles } from '@/lib/browser/images'
import { queryKeys } from '@/lib/query/keys'
import { POST_MAX_IMAGES } from '@/lib/constants'
import type { Category } from '@/lib/types'
import { InlineSpinner } from '@/components/ui/InlineSpinner'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
}

export default function PostComposer({ categories, defaultCategoryId = '' }: Props) {
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync default category
  useEffect(() => {
    const next = defaultCategoryId || (categories[0]?.id ?? '')
    if (!categoryId || !categories.some(c => c.id === categoryId)) {
      setCategoryId(next)
    }
  }, [defaultCategoryId, categories])

  // Cleanup previews on unmount
  useEffect(() => {
    return () => { imagePreviews.forEach(URL.revokeObjectURL) }
  }, [])

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

      // Upload images
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

      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        category_id: categoryId,
        content: content.trim(),
        image_urls: imageUrls,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t('toast_post_created'))
      setContent('')
      setFocused(false)
      applyFiles([])
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() })
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t('toast_action_failed'))
    },
  })

  const showBar = focused || content.trim().length > 0 || imagePreviews.length > 0

  return (
    <div
      className="composer"
      onFocus={() => setFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node) && !content.trim() && imagePreviews.length === 0) {
          setFocused(false)
        }
      }}
    >
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t('post_compose_placeholder')}
        maxLength={5000}
        rows={focused ? 4 : 2}
        className="composer-textarea"
      />

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
