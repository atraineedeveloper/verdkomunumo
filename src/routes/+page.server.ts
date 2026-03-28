import { redirect } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (PUBLIC_DEMO_MODE === 'true') throw redirect(303, '/feed')
  const { session } = await locals.safeGetSession()
  if (session) throw redirect(303, '/feed')
  return {}
}
