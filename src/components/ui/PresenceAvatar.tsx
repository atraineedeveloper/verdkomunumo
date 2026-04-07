import { getAvatarUrl } from '@/lib/utils'
import { usePresenceStore } from '@/stores/presence'

interface PresenceAvatarProps {
  userId?: string | null
  avatarUrl?: string | null
  displayName: string
  wrapperClassName?: string
  imageClassName?: string
  dotClassName?: string
  alt?: string
}

function joinClasses(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function PresenceAvatar({
  userId,
  avatarUrl,
  displayName,
  wrapperClassName,
  imageClassName,
  dotClassName,
  alt,
}: PresenceAvatarProps) {
  const isOnline = usePresenceStore((state) => (userId ? Boolean(state.activeUsers[userId]) : false))

  return (
    <span className={joinClasses('relative inline-flex shrink-0', wrapperClassName)}>
      <img
        src={getAvatarUrl(avatarUrl ?? '', displayName)}
        alt={alt ?? displayName}
        className={joinClasses('block rounded-full object-cover', imageClassName)}
      />
      {isOnline ? (
        <span
          aria-hidden="true"
          className={joinClasses(
            'absolute right-0 bottom-0 block h-3 w-3 rounded-full border-2 border-[var(--color-bg)] bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]',
            dotClassName,
          )}
        />
      ) : null}
    </span>
  )
}
