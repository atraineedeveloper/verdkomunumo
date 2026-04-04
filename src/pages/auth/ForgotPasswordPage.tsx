import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { routes } from '@/lib/routes'

const APP_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Retpoŝto ne validas'),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const requestResetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${APP_URL}${routes.resetPassword}`,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setSubmitted(true)
      setServerError(null)
    },
    onError: (error: Error) => setServerError(error.message),
  })

  return (
    <>
      <Helmet><title>{t('auth_forgot_password', { defaultValue: 'Ĉu vi forgesis la pasvorton?' })} — Verdkomunumo</title></Helmet>

      <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] m-0 mb-5 text-center">
        {t('auth_forgot_password', { defaultValue: 'Ĉu vi forgesis la pasvorton?' })}
      </h2>

      <p className="text-[0.9rem] text-[var(--color-text-muted)] text-center mt-0 mb-5">
        {t('auth_forgot_password_help', { defaultValue: 'Enigu vian retpoŝton kaj ni sendos ligilon por elekti novan pasvorton.' })}
      </p>

      {submitted ? (
        <div className="bg-[#f0fdf4] border border-[#86efac] text-[#166534] rounded-lg px-3 py-2.5 text-[0.875rem] mb-4">
          {t('auth_reset_password_sent', { defaultValue: 'Se konto ekzistas por tiu retpoŝto, ni ĵus sendis la restarigan ligilon.' })}
        </div>
      ) : null}

      {serverError && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] rounded-lg px-3 py-2.5 text-[0.875rem] mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit((data) => requestResetMutation.mutate(data))}>
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="email" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            {t('auth_email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vi@ekzemplo.com"
            {...register('email')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.email && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.email.message}</span>}
        </div>

        <button
          type="submit"
          disabled={requestResetMutation.isPending}
          className="w-full py-2.5 mt-1 bg-[var(--color-primary)] text-white border-0 rounded-lg text-[0.9rem] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {requestResetMutation.isPending ? t('auth_loading') : t('auth_send_reset_link', { defaultValue: 'Sendi ligilon por restarigo' })}
        </button>
      </form>

      <p className="text-center text-[0.875rem] text-[var(--color-text-muted)] mt-5 mb-0">
        <Link to={routes.login} className="text-[var(--color-primary)] font-medium no-underline hover:underline">
          {t('auth_back_to_login', { defaultValue: 'Reen al ensaluto' })}
        </Link>
      </p>
    </>
  )
}
