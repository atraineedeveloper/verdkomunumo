import { useEffect, useRef, useState } from 'react'
import { useToastStore, type Toast } from '@/stores/toasts'

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const toneClasses = {
    success: 'border-[color-mix(in_srgb,var(--color-primary)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface)_90%)]',
    error: 'border-[rgba(220,38,38,0.28)] bg-[#fff5f5] text-[#7f1d1d]',
    info: 'border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]',
  }[toast.tone]

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 px-[0.95rem] py-[0.85rem] rounded-[1rem] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,white_8%)] text-[var(--color-text)] shadow-[0_18px_40px_rgba(0,0,0,0.14)] pointer-events-auto backdrop-blur-[14px] transition-all duration-200 ${toneClasses} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <p className="m-0 flex-1 text-[0.88rem] leading-[1.45]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="border-0 bg-transparent text-inherit text-base leading-none cursor-pointer p-[0.05rem] opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}

export function ToastViewport() {
  const { toasts, remove } = useToastStore()

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed right-4 bottom-[5.25rem] md:bottom-5 z-[1200] flex flex-col gap-[0.65rem] w-[min(24rem,calc(100vw-1.5rem))] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
    </div>
  )
}
