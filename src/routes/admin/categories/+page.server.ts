import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { mockCategories, mockProfile } from '$lib/mock'
import { requireStaff } from '$lib/server/social'
import { slugify } from '$lib/utils'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) {
    return {
      staffProfile: { ...mockProfile, role: 'admin' },
      categories: mockCategories,
      suggestions: []
    }
  }

  await requireStaff(locals)

  const [categoriesRes, suggestionsRes] = await Promise.all([
    locals.supabase.from('categories').select('*').order('sort_order'),
    locals.supabase
      .from('category_suggestions')
      .select('*, author:profiles!user_id(*)')
      .order('created_at', { ascending: false })
  ])

  return {
    categories: categoriesRes.data ?? [],
    suggestions: suggestionsRes.data ?? []
  }
}

export const actions: Actions = {
  toggleCategory: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireStaff(locals)
    const formData = await request.formData()
    const categoryId = formData.get('category_id')?.toString()
    const isActive = formData.get('is_active')?.toString() === 'true'
    if (!categoryId) return fail(400, { message: 'Missing category_id' })

    const { error } = await locals.supabase
      .from('categories')
      .update({ is_active: !isActive })
      .eq('id', categoryId)

    if (error) return fail(500, { message: error.message })
    return { success: true }
  },

  approveSuggestion: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const suggestionId = formData.get('suggestion_id')?.toString()
    if (!suggestionId) return fail(400, { message: 'Missing suggestion_id' })

    const { data: suggestion, error: suggestionError } = await locals.supabase
      .from('category_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single()

    if (suggestionError || !suggestion) return fail(404, { message: 'Suggestion not found' })

    const { error: categoryError } = await locals.supabase.from('categories').insert({
      name: suggestion.name,
      slug: slugify(suggestion.name),
      description: suggestion.description,
      sort_order: 999
    })

    if (categoryError) return fail(500, { message: categoryError.message })

    const { error: updateError } = await locals.supabase
      .from('category_suggestions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (updateError) return fail(500, { message: updateError.message })
    return { success: true }
  },

  rejectSuggestion: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    const { user } = await requireStaff(locals)
    const formData = await request.formData()
    const suggestionId = formData.get('suggestion_id')?.toString()
    if (!suggestionId) return fail(400, { message: 'Missing suggestion_id' })

    const { error } = await locals.supabase
      .from('category_suggestions')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) return fail(500, { message: error.message })
    return { success: true }
  }
}
