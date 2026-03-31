interface TimelineSkeletonProps {
  items?: number
  withComposer?: boolean
}

export function TimelineSkeleton({ items = 3, withComposer = false }: TimelineSkeletonProps) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {withComposer && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--color-surface-alt)]" />
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-[var(--color-surface-alt)]" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 w-28 animate-pulse rounded-lg bg-[var(--color-surface-alt)]" />
            <div className="ml-auto h-8 w-24 animate-pulse rounded-lg bg-[var(--color-surface-alt)]" />
          </div>
        </div>
      )}

      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex gap-3 border-b border-[var(--color-border)] py-4 first:border-t"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-surface-alt)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-surface-alt)]" />
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-surface-alt)]" />
            </div>
            <div className="mt-3 h-4 w-[92%] animate-pulse rounded bg-[var(--color-surface-alt)]" />
            <div className="mt-2 h-4 w-[72%] animate-pulse rounded bg-[var(--color-surface-alt)]" />
            <div className="mt-4 flex gap-3">
              <div className="h-7 w-16 animate-pulse rounded-lg bg-[var(--color-surface-alt)]" />
              <div className="h-7 w-16 animate-pulse rounded-lg bg-[var(--color-surface-alt)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
