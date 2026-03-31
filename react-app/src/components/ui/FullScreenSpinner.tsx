interface FullScreenSpinnerProps {
  label?: string
}

export function FullScreenSpinner({ label = 'Loading page' }: FullScreenSpinnerProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"
      aria-label={label}
      aria-busy="true"
    >
      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
    </div>
  )
}
