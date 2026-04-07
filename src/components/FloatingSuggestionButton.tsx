import { useState } from 'react'
import { Lightbulb, Send, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { appSuggestionSchema } from '@/lib/validators'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import { InlineSpinner } from '@/components/ui/InlineSpinner'

export function FloatingSuggestionButton() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const profileLoaded = useAuthStore((s) => s.profileLoaded)
  const toast = useToastStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [context, setContext] = useState('')
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({})

  function resetForm() {
    setTitle('')
    setDescription('')
    setContext('')
    setErrors({})
  }

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Ne ensalutinta')

      const parsed = appSuggestionSchema.safeParse({
        title: title.trim(),
        description: description.trim(),
        context: context.trim() || undefined,
      })

      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors
        setErrors(fieldErrors)
        throw new Error(t('suggestion_error'))
      }

      const { error } = await supabase.from('app_suggestions').insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        context: parsed.data.context ?? '',
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t('suggestion_success'))
      resetForm()
      setOpen(false)
    },
    onError: (error) => {
      if (!Object.keys(errors).length) {
        toast.error(error.message || t('suggestion_error'))
      } else {
        toast.error(t('suggestion_error'))
      }
    },
  })

  const authResolved = initialized && (!user || profileLoaded)

  if (!authResolved || !user) return null

  return (
    <>
      <button
        type="button"
        className="fixed bottom-[5.3rem] right-4 z-[950] inline-flex items-center gap-2 rounded-full border-0 bg-[linear-gradient(135deg,#138548_0%,#0f6a3c_100%)] px-4 py-3 text-[0.92rem] font-bold tracking-[-0.01em] text-white shadow-[0_20px_35px_rgba(11,88,52,0.26)] transition-transform hover:-translate-y-px md:bottom-4"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Lightbulb size={18} strokeWidth={1.9} />
        <span>{t('suggestion_fab')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1050] flex items-end justify-center bg-[rgba(7,19,13,0.42)] p-4 backdrop-blur-[8px]"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-title"
            className="w-full max-w-[34rem] rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--color-primary)_18%,var(--color-border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.96))] p-[1.15rem] shadow-[0_28px_60px_rgba(0,0,0,0.22)]"
          >
            <div className="mb-4 flex justify-between gap-4">
              <div>
                <p className="mb-1 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  Verdkomunumo
                </p>
                <h2 id="suggestion-title" className="m-0 text-[1.15rem] text-[var(--color-text)]">
                  {t('suggestion_title')}
                </h2>
                <p className="mt-[0.35rem] text-[0.88rem] leading-[1.45] text-[var(--color-text-muted)]">
                  {t('suggestion_subtitle')}
                </p>
              </div>
              <button
                type="button"
                className="grid h-[2.2rem] w-[2.2rem] flex-shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
                aria-label="Close suggestion form"
                onClick={() => setOpen(false)}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form
              className="grid gap-[0.95rem]"
              onSubmit={(event) => {
                event.preventDefault()
                setErrors({})
                suggestionMutation.mutate()
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-[0.88rem] font-semibold text-[var(--color-text)]">{t('suggestion_name')}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={80}
                  required
                  className="w-full rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-[0.92rem] py-[0.82rem] text-[var(--color-text)]"
                />
                {errors.title?.[0] && <small className="text-[var(--color-danger)]">{errors.title[0]}</small>}
              </label>

              <label className="grid gap-1.5">
                <span className="text-[0.88rem] font-semibold text-[var(--color-text)]">{t('suggestion_description')}</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  maxLength={500}
                  required
                  className="w-full resize-y rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-[0.92rem] py-[0.82rem] text-[var(--color-text)]"
                />
                {errors.description?.[0] && <small className="text-[var(--color-danger)]">{errors.description[0]}</small>}
              </label>

              <label className="grid gap-1.5">
                <span className="text-[0.88rem] font-semibold text-[var(--color-text)]">{t('suggestion_reason')}</span>
                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full resize-y rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-[0.92rem] py-[0.82rem] text-[var(--color-text)]"
                />
                {errors.context?.[0] && <small className="text-[var(--color-danger)]">{errors.context[0]}</small>}
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)]"
                  onClick={() => setOpen(false)}
                >
                  {t('suggestion_cancel')}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-white"
                  disabled={suggestionMutation.isPending}
                >
                  {suggestionMutation.isPending ? <InlineSpinner size={14} /> : <Send size={16} strokeWidth={1.9} />}
                  <span>{suggestionMutation.isPending ? t('suggestion_submitting') : t('suggestion_submit')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
