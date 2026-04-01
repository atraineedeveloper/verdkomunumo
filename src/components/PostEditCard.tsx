import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { hasPostEditChanges } from '@/lib/editor'
import type { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  content: string
  categoryId: string
  initialContent: string
  initialCategoryId: string
  charLimit?: number
  pending?: boolean
  title?: string
  saveLabel: string
  cancelLabel: string
  onContentChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}

export function PostEditCard({
  categories,
  content,
  categoryId,
  initialContent,
  initialCategoryId,
  charLimit = 5000,
  pending = false,
  title = 'Redakti afiŝon',
  saveLabel,
  cancelLabel,
  onContentChange,
  onCategoryChange,
  onCancel,
  onSubmit,
}: Props) {
  const remaining = charLimit - content.length
  const isDirty = hasPostEditChanges({
    initialContent,
    initialCategoryId,
    nextContent: content,
    nextCategoryId: categoryId,
  })
  const canSubmit = isDirty && content.trim().length > 0 && remaining >= 0 && !pending

  return (
    <form
      className="post-edit-card"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="edit-head">
        <div>
          <p className="edit-title">{title}</p>
          <p className="edit-copy">Reviziu la tekston kaj konservu kiam ĉio aspektas bone.</p>
        </div>
        <span className={`chars-inline${remaining < 200 ? ' warn' : ''}${remaining < 0 ? ' over' : ''}`}>{remaining}</span>
      </div>

      <textarea
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        rows={5}
        maxLength={charLimit}
        autoFocus
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSubmit) {
            event.preventDefault()
            onSubmit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          }
        }}
      />

      <div className="edit-foot">
        <select value={categoryId} onChange={(event) => onCategoryChange(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="edit-actions">
          <button type="button" className="edit-btn ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="submit" className="edit-btn solid" disabled={!canSubmit}>
            {pending ? <InlineSpinner size={13} /> : null}
            {saveLabel}
          </button>
        </div>
      </div>

      <style>{`
        .post-edit-card { display: grid; gap: 0.8rem; margin: 0.2rem 0 0.8rem; padding: 0.9rem 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); background: transparent; }
        .edit-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem; }
        .edit-title { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--color-text); }
        .edit-copy { margin: 0.22rem 0 0; font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45; }
        .post-edit-card textarea, .post-edit-card select { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-surface-alt); color: var(--color-text); padding: 0.8rem 0.9rem; font: inherit; }
        .post-edit-card textarea { min-height: 8.5rem; resize: vertical; line-height: 1.65; }
        .post-edit-card textarea:focus, .post-edit-card select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent); }
        .edit-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; flex-wrap: wrap; }
        .edit-actions { display: flex; gap: 0.5rem; align-items: center; margin-left: auto; }
        .chars-inline { font-size: 0.78rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
        .chars-inline.warn { color: #b45309; }
        .chars-inline.over { color: var(--color-danger); }
        .edit-btn { border-radius: 5px; padding: 0.38rem 0.85rem; font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; transition: opacity 0.12s ease, border-color 0.12s ease, color 0.12s ease; }
        .edit-btn.ghost { background: transparent; color: var(--color-text-muted); border: 1px solid var(--color-border); }
        .edit-btn.ghost:hover { color: var(--color-primary); border-color: var(--color-primary); }
        .edit-btn.solid { background: var(--color-primary); color: #fff; border: none; }
        .edit-btn.solid:disabled { cursor: not-allowed; opacity: 0.4; }
      `}</style>
    </form>
  )
}
