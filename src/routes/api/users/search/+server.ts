import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals }) => {
  const q = url.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return json([])

  const { user } = await locals.safeGetSession()

  const { data } = await locals.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, esperanto_level')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('id', user?.id ?? '')
    .limit(10)

  return json(data ?? [])
}
