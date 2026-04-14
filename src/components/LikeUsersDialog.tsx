import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchCommentLikeUsers, fetchPostLikeUsers } from '@/lib/likes'
import { queryKeys } from '@/lib/query/keys'
import { routes } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import { PresenceAvatar } from '@/components/ui/PresenceAvatar'
import { InlineSpinner } from '@/components/ui/InlineSpinner'

type LikeUsersDialogProps = {
  open: boolean
  onClose: () => void
  targetType: 'post' | 'comment'
  targetId: string
}

type LikeUsersSummaryProps = {
  targetType: 'post' | 'comment'
  targetId: string
  likesCount: number
  onOpen: () => void
}

function likeQueryOptions(targetType: 'post' | 'comment', targetId: string, enabled = true) {
  return {
    queryKey: targetType === 'post' ? queryKeys.postLikes(targetId) : queryKeys.commentLikes(targetId),
    queryFn: () => targetType === 'post' ? fetchPostLikeUsers(targetId) : fetchCommentLikeUsers(targetId),
    enabled,
  } as const
}

export function LikeUsersSummary({ targetType, targetId, likesCount, onOpen }: LikeUsersSummaryProps) {
  const { t } = useTranslation()
  const likesQuery = useQuery(likeQueryOptions(targetType, targetId, likesCount > 0))
  const previewUsers = (likesQuery.data ?? []).slice(0, 3)
  const primaryUser = previewUsers[0]

  if (likesCount <= 0) return null

  let label = t('likes_summary_many', {
    name: primaryUser?.display_name ?? '',
    count: Math.max(likesCount - 1, 0),
    defaultValue: primaryUser ? `Liked by ${primaryUser.display_name} and {{count}} more` : `{{count}} likes`,
  })

  if (likesCount === 1 && primaryUser) {
    label = t('likes_summary_one', {
      name: primaryUser.display_name,
      defaultValue: `Liked by ${primaryUser.display_name}`,
    })
  } else if (likesCount > 1 && !primaryUser) {
    label = t('likes_summary_fallback', {
      count: likesCount,
      defaultValue: `{{count}} likes`,
    })
  }

  return (
    <>
      <button type="button" className="like-summary" onClick={onOpen}>
        <span className="like-summary-avatars" aria-hidden="true">
          {previewUsers.map((user, index) => (
            <span key={user.id} className="like-summary-avatar-wrap" style={{ zIndex: previewUsers.length - index }}>
              <PresenceAvatar
                userId={user.id}
                avatarUrl={user.avatar_url}
                displayName={user.display_name}
                imageClassName="like-summary-avatar"
              />
            </span>
          ))}
        </span>
        <span className="like-summary-text">{label}</span>
      </button>

      <style>{`
        .like-summary { display: inline-flex; align-items: center; gap: 0.55rem; padding: 0; margin-top: 0.45rem; border: none; background: transparent; color: var(--color-text); font: inherit; cursor: pointer; text-align: left; }
        .like-summary:hover .like-summary-text { text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--color-text) 35%, transparent); }
        .like-summary-avatars { display: inline-flex; align-items: center; min-width: 0; }
        .like-summary-avatar-wrap { margin-right: -0.45rem; display: inline-flex; position: relative; }
        .like-summary-avatar-wrap:last-child { margin-right: 0; }
        .like-summary-avatar { width: 1.35rem; height: 1.35rem; border: 2px solid var(--color-bg); box-shadow: 0 0 0 1px rgba(0,0,0,0.04); }
        .like-summary-text { font-size: 0.82rem; line-height: 1.35; color: var(--color-text); }
      `}</style>
    </>
  )
}

export function LikeUsersDialog({ open, onClose, targetType, targetId }: LikeUsersDialogProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const likesQuery = useQuery(likeQueryOptions(targetType, targetId, open))

  if (!open) return null

  return (
    <>
      <div className="likes-sheet-backdrop" onClick={onClose} />
      <div className="likes-sheet" role="dialog" aria-modal="true" aria-label={t(targetType === 'post' ? 'likes_dialog_title_post' : 'likes_dialog_title_comment', { defaultValue: targetType === 'post' ? 'Likes' : 'Comment likes' })}>
        <div className="likes-sheet-grabber" aria-hidden="true" />
        <div className="likes-sheet-head">
          <span>{t(targetType === 'post' ? 'likes_dialog_title_post' : 'likes_dialog_title_comment', { defaultValue: targetType === 'post' ? 'Likes' : 'Comment likes' })}</span>
          <button type="button" className="likes-sheet-close" onClick={onClose} aria-label={t('beta_banner_close', { defaultValue: 'Close' })}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="likes-sheet-body">
          {likesQuery.isLoading ? (
            <div className="likes-sheet-state">
              <InlineSpinner size={16} />
              <span>{t('likes_dialog_loading', { defaultValue: 'Loading likes...' })}</span>
            </div>
          ) : likesQuery.error ? (
            <div className="likes-sheet-state error">
              <span>{t('likes_dialog_error', { defaultValue: 'Could not load likes.' })}</span>
            </div>
          ) : likesQuery.data && likesQuery.data.length > 0 ? (
            <div className="likes-sheet-list">
              {likesQuery.data.map((user) => (
                <Link key={`${user.id}-${user.created_at ?? 'liked'}`} to={routes.profile(user.username)} className="likes-sheet-row" onClick={onClose}>
                  <PresenceAvatar
                    userId={user.id}
                    avatarUrl={user.avatar_url}
                    displayName={user.display_name}
                    imageClassName="likes-sheet-avatar"
                  />
                  <div className="likes-sheet-copy">
                    <strong>{user.display_name}</strong>
                    <span>@{user.username}</span>
                  </div>
                  <span className="likes-sheet-time">{user.created_at ? formatDate(user.created_at) : ''}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="likes-sheet-state">
              <span>{t('likes_dialog_empty', { defaultValue: 'No likes yet.' })}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .likes-sheet-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.48); z-index: 140; }
        .likes-sheet { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100vw, 34rem); max-height: min(78vh, 36rem); display: grid; grid-template-rows: auto auto 1fr; background: var(--color-bg); border: 1px solid var(--color-border); border-bottom: none; border-radius: 1.25rem 1.25rem 0 0; box-shadow: 0 -18px 48px rgba(0,0,0,0.22); z-index: 141; overflow: hidden; }
        .likes-sheet-grabber { width: 3.2rem; height: 0.3rem; border-radius: 999px; background: color-mix(in srgb, var(--color-text-muted) 35%, transparent); margin: 0.65rem auto 0.35rem; }
        .likes-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 1rem 0.85rem; border-bottom: 1px solid var(--color-border); font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
        .likes-sheet-close { border: none; background: transparent; color: var(--color-text-muted); cursor: pointer; padding: 0.3rem; border-radius: 999px; display: inline-flex; }
        .likes-sheet-close:hover { color: var(--color-text); background: var(--color-surface-alt); }
        .likes-sheet-body { overflow: auto; }
        .likes-sheet-state { min-height: 10rem; display: grid; place-items: center; gap: 0.55rem; padding: 1.25rem; text-align: center; color: var(--color-text-muted); font-size: 0.88rem; }
        .likes-sheet-state.error { color: var(--color-danger, #dc2626); }
        .likes-sheet-list { display: grid; }
        .likes-sheet-row { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1rem; text-decoration: none; color: inherit; border-bottom: 1px solid var(--color-border); }
        .likes-sheet-row:hover { background: var(--color-surface-alt); }
        .likes-sheet-avatar { width: 2.7rem; height: 2.7rem; }
        .likes-sheet-copy { min-width: 0; display: grid; gap: 0.1rem; }
        .likes-sheet-copy strong { color: var(--color-text); font-size: 0.92rem; line-height: 1.25; }
        .likes-sheet-copy span { color: var(--color-text-muted); font-size: 0.82rem; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; }
        .likes-sheet-time { margin-left: auto; color: var(--color-text-muted); font-size: 0.75rem; white-space: nowrap; }
      `}</style>
    </>
  )
}
