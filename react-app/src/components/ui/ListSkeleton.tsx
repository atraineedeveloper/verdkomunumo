interface ListSkeletonProps {
  items?: number
  avatarSize?: number
}

export function ListSkeleton({ items = 5, avatarSize = 44 }: ListSkeletonProps) {
  return (
    <div className="space-y-0" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-[var(--color-border)] py-4 first:border-t"
        >
          <div
            className="animate-pulse rounded-full bg-[var(--color-surface-alt)]"
            style={{ width: avatarSize, height: avatarSize }}
          />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-alt)]" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-[var(--color-surface-alt)]" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded-full bg-[var(--color-surface-alt)]" />
        </div>
      ))}
    </div>
  )
}
