import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { safeRedirect } from '@/lib/redirect'
import { routes } from '@/lib/routes'

export async function exchangeAuthCallbackCode(code: string | null) {
  if (!code) {
    return { ok: true as const }
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return { ok: false as const }
  }

  return { ok: true as const }
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = safeRedirect(searchParams.get('next'))

    async function handleCallback() {
      const result = await exchangeAuthCallbackCode(code)
      if (!result.ok) {
        navigate(`${routes.login}?error=auth_callback_failed`, { replace: true })
        return
      }

      navigate(next, { replace: true })
    }

    void handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
    </div>
  )
}
