import { supabase } from '@/lib/supabase/client'

const USERNAME_TAKEN_ERROR = 'Tiu uzantnomo jam estas uzata'

export async function assertUsernameAvailable(username: string, excludeId?: string): Promise<void> {
  const { data: available, error } = await supabase.rpc('is_username_available', {
    check_username: username,
    exclude_id: excludeId ?? null,
  })

  if (error) throw new Error(error.message)
  if (!available) throw new Error(USERNAME_TAKEN_ERROR)
}
