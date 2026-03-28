import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockProfile } from '$lib/mock'
import { requireStaff } from '$lib/server/social'
import type { LayoutServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (DEMO) {
    return { staffProfile: { ...mockProfile, role: 'admin' } }
  }

  const { profile } = await requireStaff(locals)
  return { staffProfile: profile }
}
