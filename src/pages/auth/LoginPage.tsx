import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { signInWithIdentifier } from '@/lib/auth'
import { safeRedirect } from '@/lib/redirect'
import { loginSchema } from '@/lib/validators'
import { routes } from '@/lib/routes'
import type { z } from 'zod'

type LoginInput = z.infer<typeof loginSchema>

const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true'
const APP_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.576c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.288C4.672 5.161 6.656 3.576 9 3.576Z" fill="#EA4335"/>
  </svg>
)

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeRedirect(searchParams.get('next'))
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      await signInWithIdentifier(data.email, data.password)
    },
    onSuccess: () => navigate(next),
    onError: (err: Error) => setServerError(err.message),
  })

  const googleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${APP_URL}${routes.authCallback}?next=${encodeURIComponent(next)}` },
      })
      if (error) throw new Error(error.message)
      if (data.url) window.location.href = data.url
    },
    onError: (err: Error) => setServerError(err.message),
  })

  return (
    <>
      <Helmet><title>Ensaluti — Verdkomunumo</title></Helmet>

      <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] m-0 mb-5 text-center">
        Ensaluti
      </h2>

      {serverError && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] rounded-lg px-3 py-2.5 text-[0.875rem] mb-4">
          {serverError}
        </div>
      )}

      {GOOGLE_ENABLED && (
        <>
          <button
            type="button"
            onClick={() => googleMutation.mutate()}
            disabled={googleMutation.isPending}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-medium cursor-pointer hover:bg-[var(--color-bg)] transition-colors disabled:opacity-60"
          >
            <GoogleIcon />
            Daŭrigi per Google
          </button>
          <div className="flex items-center gap-3 my-4 text-[var(--color-text-muted)] text-[0.8rem] before:flex-1 before:h-px before:bg-[var(--color-border)] after:flex-1 after:h-px after:bg-[var(--color-border)]">
            <span>aŭ</span>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit((data) => { setServerError(null); loginMutation.mutate(data) })}>
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="email" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Retpoŝto aŭ uzantnomo
          </label>
          <input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="vi@ekzemplo.com aŭ via_nomo"
            {...register('email')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.email && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="password" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Pasvorto
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.password && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.password.message}</span>}
        </div>

        <div className="flex justify-end mb-4">
          <Link to={routes.forgotPassword} className="text-[0.82rem] text-[var(--color-primary)] font-medium no-underline hover:underline">
            {t('auth_forgot_password', { defaultValue: 'Ĉu vi forgesis la pasvorton?' })}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-2.5 mt-1 bg-[var(--color-primary)] text-white border-0 rounded-lg text-[0.9rem] font-semibold cursor-pointer hover:brightness-[1.05] disabled:opacity-60 disabled:cursor-not-allowed transition-[filter,opacity]"
        >
          {loginMutation.isPending ? 'Atendu…' : 'Ensaluti'}
        </button>
      </form>

      <p className="text-center text-[0.875rem] text-[var(--color-text-muted)] mt-5 mb-0">
        Ankoraŭ ne havas konton?{' '}
        <Link to={routes.register} className="text-[var(--color-primary)] font-medium no-underline hover:underline">
          Registriĝi
        </Link>
      </p>
    </>
  )
}
