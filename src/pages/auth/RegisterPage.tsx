import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { supabase } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validators'
import { routes } from '@/lib/routes'
import type { z } from 'zod'

type RegisterInput = z.infer<typeof registerSchema>

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

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      // Check username availability
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username)
        .maybeSingle()

      if (existing) throw new Error('Tiu uzantnomo jam estas uzata')

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.display_name,
            preferred_username: data.username,
          },
        },
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => navigate(routes.feed),
    onError: (err: Error) => setServerError(err.message),
  })

  const googleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${APP_URL}${routes.authCallback}` },
      })
      if (error) throw new Error(error.message)
      if (data.url) window.location.href = data.url
    },
    onError: (err: Error) => setServerError(err.message),
  })

  return (
    <>
      <Helmet><title>Registriĝi — Verdkomunumo</title></Helmet>

      <h2 className="text-[1.25rem] font-bold text-[var(--color-text)] m-0 mb-5 text-center">
        Krei konton
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

      <form onSubmit={handleSubmit((data) => { setServerError(null); registerMutation.mutate(data) })}>
        {/* Display name */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="display_name" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Via nomo
          </label>
          <input
            id="display_name"
            type="text"
            placeholder="Ekz. Ana García"
            {...register('display_name')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.display_name && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.display_name.message}</span>}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="username" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Uzantnomo
          </label>
          <div className="flex items-center border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] overflow-hidden focus-within:outline focus-within:outline-2 focus-within:outline-[var(--color-primary)]">
            <span className="px-3 py-2 text-[var(--color-text-muted)] text-[0.9rem] bg-[var(--color-bg)]">@</span>
            <input
              id="username"
              type="text"
              placeholder="via_nomo"
              pattern="[a-z0-9_]+"
              {...register('username')}
              className="flex-1 px-0 py-2 border-0 bg-transparent text-[var(--color-text)] text-[0.9rem] focus:outline-none"
            />
          </div>
          {errors.username && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.username.message}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="email" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Retpoŝto
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.email && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.email.message}</span>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="password" className="text-[0.875rem] font-medium text-[var(--color-text)]">
            Pasvorto
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimume 8 signoj"
            {...register('password')}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-[0.9rem] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
          {errors.password && <span className="text-[0.8rem] text-[var(--color-danger)]">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full py-2.5 mt-1 bg-[var(--color-primary)] text-white border-0 rounded-lg text-[0.9rem] font-semibold cursor-pointer hover:brightness-[1.05] disabled:opacity-60 disabled:cursor-not-allowed transition-[filter,opacity]"
        >
          {registerMutation.isPending ? 'Atendu…' : 'Krei konton'}
        </button>
      </form>

      <p className="text-center text-[0.875rem] text-[var(--color-text-muted)] mt-5 mb-0">
        Jam havas konton?{' '}
        <Link to={routes.login} className="text-[var(--color-primary)] font-medium no-underline hover:underline">
          Ensaluti
        </Link>
      </p>
    </>
  )
}
