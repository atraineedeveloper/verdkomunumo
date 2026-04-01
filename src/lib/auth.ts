import { supabase } from '@/lib/supabase/client'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function looksLikeEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

export async function resolveLoginEmail(identifier: string) {
  const normalized = identifier.trim()

  if (looksLikeEmail(normalized)) {
    return normalized.toLowerCase()
  }

  const { data, error } = await supabase.rpc('resolve_login_email', {
    login_identifier: normalized,
  })

  if (error) {
    throw new Error('Ne eblis kontroli la uzantnomon.')
  }

  if (!data || typeof data !== 'string') {
    throw new Error('Ne trovita konto por tiu retpoŝto aŭ uzantnomo.')
  }

  return data
}
