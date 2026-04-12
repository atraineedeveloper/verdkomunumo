import { Link } from 'react-router-dom'
import { routes } from '@/lib/routes'
import { getAvatarUrl } from '@/lib/utils'
import type { Post } from '@/lib/types'

type Props = {
  post: Post
  clickable?: boolean
  unavailable?: boolean
}

export function QuotedPostCard({ post, clickable = true, unavailable = false }: Props) {
  if (unavailable) {
    return (
      <>
        <div className="quoted-post quoted-post-static quoted-post-unavailable" aria-label="Citita afiŝo ne plu disponeblas">
          <div className="qp-meta">
            <span className="qp-name">Citita afiŝo</span>
          </div>
          <p className="qp-content">Ĉi tiu citita afiŝo ne plu disponeblas.</p>
        </div>
        <style>{`
          .quoted-post { border: 1px solid var(--color-border); border-radius: 10px; padding: 0.65rem 0.85rem; margin: 0.45rem 0 0.65rem; background: var(--color-surface-alt); cursor: pointer; transition: border-color 0.12s; display: block; text-decoration: none; }
          .quoted-post:hover { border-color: var(--color-primary); }
          .quoted-post-static { cursor: default; }
          .quoted-post-unavailable { border-style: dashed; opacity: 0.82; }
          .qp-meta { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; }
          .qp-name { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
          .qp-content { font-size: 0.84rem; color: var(--color-text-muted); line-height: 1.5; margin: 0; white-space: pre-wrap; }
        `}</style>
      </>
    )
  }

  const content = (
    <>
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
    </>
  )

  return (
    <>
      {clickable ? (
        <Link
          to={routes.post(post.id)}
          className="quoted-post"
          aria-label={`Malfermi cititan afiŝon de ${post.author?.display_name ?? 'nekonata aŭtoro'}`}
        >
          {content}
        </Link>
      ) : (
        <div className="quoted-post quoted-post-static">
          {content}
        </div>
      )}
      <style>{`
        .quoted-post { border: 1px solid var(--color-border); border-radius: 10px; padding: 0.65rem 0.85rem; margin: 0.45rem 0 0.65rem; background: var(--color-surface-alt); cursor: pointer; transition: border-color 0.12s; display: block; text-decoration: none; }
        .quoted-post:hover { border-color: var(--color-primary); }
        .quoted-post-static { cursor: default; }
        .qp-meta { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; }
        .qp-ava { width: 18px; height: 18px; border-radius: 99px; object-fit: cover; flex-shrink: 0; }
        .qp-name { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
        .qp-username { font-size: 0.78rem; color: var(--color-text-muted); }
        .qp-content { font-size: 0.84rem; color: var(--color-text); line-height: 1.5; margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; white-space: pre-wrap; }
        .qp-imgs { font-size: 0.78rem; color: var(--color-text-muted); margin: 0.3rem 0 0; }
      `}</style>
    </>
  )
}
