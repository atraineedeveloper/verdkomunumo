import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { routes } from '@/lib/routes'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Minimume 8 signoj'),
})

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let active = true

    async function bootstrapRecovery() {
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (active) setServerError('Ne eblis validigi la ligilon por restarigo.')
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (active && data.session) {
        setIsReady(true)
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsReady(true)
      }
    })

    bootstrapRecovery()

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [searchParams])

  const resetMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      await supabase.auth.signOut()
    },
    onSuccess: () => {
      setStatusMessage(t('auth_reset_password_success', { defaultValue: 'Via pasvorto estis ĝisdatigita. Vi nun povas ensaluti denove.' }))
      setServerError(null)
      window.setTimeout(() => navigate(routes.login, { replace: true }), 1200)
    },
    onError: (error: Error) => setServerError(error.message),
  })

  return (
    <>
      <Helmet><title>{t('auth_reset_password', { defaultValue: 'Restarigi pasvorton' })} — Verdkomunumo</title></Helmet>

      <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] m-0 mb-5 text-center">
        {t('auth_reset_password', { defaultValue: 'Restarigi pasvorton' })}
      </h2>

      <p className="text-[0.9rem] text-[var(--color-text-muted)] text-center mt-0 mb-5">
        {t('auth_reset_password_help', { defaultValue: 'Elektu novan pasvorton por via konto.' })}
      </p>

      {statusMessage && (
        <div className="bg-[#f0fdf4] border border-[#86efac] text-[#166534] rounded-lg px-3 py-2.5 text-[0.875rem] mb-4">
          {statusMessage}
        </div>
      )}

      {serverError && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] rounded-lg px-3 py-2.5 text-[0.875rem] mb-4">
          {serverError}
        </div>
      )}

      {!isReady ? (
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg px-3 py-3 text-[0.875rem] text-[var(--color-text-muted)]">
          {t('auth_reset_password_waiting', { defaultValue: 'Kontrolante la restarigan ligilon…' })}
        </div>
      ) : (
        <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="password" className="text-[0.875rem] font-medium text-[var(--color-text)]">
              {t('auth_new_password', { defaultValue: 'Nova pasvorto' })}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={t('auth_password_placeholder')}
              {...register('password')}
              className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            />
            {errors.password && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full py-2.5 mt-1 bg-[var(--color-primary)] text-white border-0 rounded-lg text-[0.9rem] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {resetMutation.isPending ? t('auth_loading') : t('auth_reset_password_submit', { defaultValue: 'Konservi novan pasvorton' })}
          </button>
        </form>
      )}

      <p className="text-center text-[0.875rem] text-[var(--color-text-muted)] mt-5 mb-0">
        <Link to={routes.login} className="text-[var(--color-primary)] font-medium no-underline hover:underline">
          {t('auth_back_to_login', { defaultValue: 'Reen al ensaluto' })}
        </Link>
      </p>
    </>
  )
}
