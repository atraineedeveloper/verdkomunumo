import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockProfile, mockSession } from '$lib/mock'
import type { LayoutServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (DEMO) {
    return { session: mockSession as any, profile: mockProfile }
  }

  const { session, user } = await locals.safeGetSession()

  let profile = null
  if (user) {
    const { data } = await locals.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return { session, profile }
}
