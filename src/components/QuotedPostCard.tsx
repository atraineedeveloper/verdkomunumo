import { getAvatarUrl } from '@/lib/utils'
import type { Post } from '@/lib/types'

export function QuotedPostCard({ post }: { post: Post }) {
  return (
    <div className="quoted-post">
      {post.author && (
        <div className="qp-meta">
          <img
            src={getAvatarUrl(post.author.avatar_url, post.author.display_name)}
            alt={post.author.display_name}
            className="qp-ava"
          />
          <span className="qp-name">{post.author.display_name}</span>
          <span className="qp-username">@{post.author.username}</span>
        </div>
      )}
      <p className="qp-content">{post.content}</p>
      {!!post.image_urls?.length && (
        <p className="qp-imgs">📷 {post.image_urls.length} imago{post.image_urls.length > 1 ? 'j' : ''}</p>
      )}
      <style>{`
        .quoted-post { border: 1px solid var(--color-border); border-radius: 10px; padding: 0.65rem 0.85rem; margin: 0.45rem 0 0.65rem; background: var(--color-surface-alt); cursor: pointer; transition: border-color 0.12s; }
        .quoted-post:hover { border-color: var(--color-primary); }
        .qp-meta { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; }
        .qp-ava { width: 18px; height: 18px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
        .qp-name { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
        .qp-username { font-size: 0.78rem; color: var(--color-text-muted); }
        .qp-content { font-size: 0.84rem; color: var(--color-text); line-height: 1.5; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; white-space: pre-wrap; }
        .qp-imgs { font-size: 0.78rem; color: var(--color-text-muted); margin: 0.3rem 0 0; }
      `}</style>
    </div>
  )
}
