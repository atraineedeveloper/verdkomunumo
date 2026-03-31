import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { routes } from '@/lib/routes'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? routes.feed

    async function handleCallback() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          navigate(`${routes.login}?error=auth_callback_failed`, { replace: true })
          return
        }
      }
      navigate(next, { replace: true })
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
    </div>
  )
}
