import { redirect } from '@sveltejs/kit'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { mockCategories } from '$lib/mock'
import type { LayoutServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (DEMO) return { categories: mockCategories }

  const { session, user } = await locals.safeGetSession()

  if (!session || !user) {
    throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`)
  }

  const { data: categories } = await locals.supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return { categories: categories ?? [] }
}
