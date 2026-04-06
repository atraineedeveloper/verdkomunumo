import { supabase } from '@/lib/supabase/client'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INVALID_CREDENTIALS_ERROR = 'Nevalidaj ensalutaj datumoj.'

export function looksLikeEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

type LoginWithIdentifierResponse = {
  session?: {
    access_token: string
    refresh_token: string
  }
}

export async function signInWithIdentifier(identifier: string, password: string) {
  const normalized = identifier.trim()

  if (looksLikeEmail(normalized)) {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized.toLowerCase(),
      password,
    })

    if (error) {
      throw new Error(INVALID_CREDENTIALS_ERROR)
    }

    return
  }

  const { data, error } = await supabase.functions.invoke<LoginWithIdentifierResponse>('login-with-identifier', {
    body: {
      identifier: normalized,
      password,
    },
  })

  if (error || !data?.session?.access_token || !data.session.refresh_token) {
    throw new Error(INVALID_CREDENTIALS_ERROR)
  }

  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  if (setSessionError) {
    throw new Error(INVALID_CREDENTIALS_ERROR)
  }
}
