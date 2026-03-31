import type { LinkPreview } from '@/lib/types'

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview"
      onClick={e => e.stopPropagation()}
    >
      {preview.image && (
        <img src={preview.image} alt={preview.title ?? ''} className="lp-img" />
      )}
      <div className="lp-text">
        {preview.title && <p className="lp-title">{preview.title}</p>}
        {preview.description && <p className="lp-desc">{preview.description}</p>}
        <p className="lp-url">{preview.url}</p>
      </div>
      <style>{`
        .link-preview { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; margin: 0.45rem 0 0.65rem; text-decoration: none; background: var(--color-surface-alt); transition: border-color 0.12s; }
        .link-preview:hover { border-color: var(--color-primary); }
        .lp-img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
        .lp-text { padding: 0.6rem 0.85rem; }
        .lp-title { font-size: 0.875rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.2rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
        .lp-desc { font-size: 0.8rem; color: var(--color-text-muted); margin: 0 0 0.25rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
        .lp-url { font-size: 0.73rem; color: var(--color-primary); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>
    </a>
  )
}
