import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export const E2E_AUTH_OVERRIDE_KEY = 'verdkomunumo:e2e-auth'

type AuthOverridePayload = {
  user: Pick<User, 'id' | 'email'>
  profile: Profile
}

export function readE2EAuthOverride(): AuthOverridePayload | null {
  if (
    typeof window === 'undefined' ||
    !import.meta.env.DEV ||
    !window.navigator.webdriver
  ) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(E2E_AUTH_OVERRIDE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<AuthOverridePayload>
    if (!parsed.user?.id || !parsed.profile?.id || parsed.profile.id !== parsed.user.id) {
      return null
    }

    return parsed as AuthOverridePayload
  } catch {
    return null
  }
}
