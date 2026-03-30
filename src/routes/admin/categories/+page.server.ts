import { PUBLIC_DEMO_MODE } from '$env/static/public'
import { fail } from '@sveltejs/kit'
import { mockCategories, mockProfile } from '$lib/mock'
import { requireAdmin } from '$lib/server/social'
import { categoryAdminSchema } from '$lib/validators'
import type { Actions, PageServerLoad } from './$types'

const DEMO = PUBLIC_DEMO_MODE === 'true'

export const load: PageServerLoad = async ({ locals }) => {
  if (DEMO) {
    return {
      staffProfile: { ...mockProfile, role: 'admin' },
      categories: mockCategories
    }
  }

  await requireAdmin(locals)

  const categoriesRes = await locals.supabase.from('categories').select('*').order('sort_order')

  return {
    categories: categoriesRes.data ?? []
  }
}

export const actions: Actions = {
  createCategory: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireAdmin(locals)
    const formData = await request.formData()
    const parsed = categoryAdminSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      icon: formData.get('icon') || '',
      color: formData.get('color'),
      sort_order: formData.get('sort_order')
    })

    if (!parsed.success) {
      return fail(400, { message: parsed.error.flatten().formErrors[0] ?? 'Invalid category data' })
    }

    const { error } = await locals.supabase.from('categories').insert(parsed.data)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Category created.' }
  },

  updateCategory: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireAdmin(locals)
    const formData = await request.formData()
    const categoryId = formData.get('category_id')?.toString()
    if (!categoryId) return fail(400, { message: 'Missing category_id' })

    const parsed = categoryAdminSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      icon: formData.get('icon') || '',
      color: formData.get('color'),
      sort_order: formData.get('sort_order')
    })

    if (!parsed.success) {
      return fail(400, { message: parsed.error.flatten().formErrors[0] ?? 'Invalid category data' })
    }

    const { error } = await locals.supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', categoryId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Category updated.' }
  },

  toggleCategory: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireAdmin(locals)
    const formData = await request.formData()
    const categoryId = formData.get('category_id')?.toString()
    const isActive = formData.get('is_active')?.toString() === 'true'
    if (!categoryId) return fail(400, { message: 'Missing category_id' })

    const { error } = await locals.supabase
      .from('categories')
      .update({ is_active: !isActive })
      .eq('id', categoryId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: isActive ? 'Kategorio kaŝita.' : 'Kategorio aktivigita.' }
  },

  deleteCategory: async ({ request, locals }) => {
    if (DEMO) return fail(400, { message: 'Demo mode is enabled' })

    await requireAdmin(locals)
    const formData = await request.formData()
    const categoryId = formData.get('category_id')?.toString()
    if (!categoryId) return fail(400, { message: 'Missing category_id' })

    const { data: category, error: selectError } = await locals.supabase
      .from('categories')
      .select('id, post_count')
      .eq('id', categoryId)
      .single()

    if (selectError || !category) return fail(404, { message: 'Category not found' })
    if ((category.post_count ?? 0) > 0) {
      return fail(400, { message: 'Only empty categories can be deleted.' })
    }

    const { error } = await locals.supabase.from('categories').delete().eq('id', categoryId)

    if (error) return fail(500, { message: error.message })
    return { success: true, message: 'Category deleted.' }
  }
}
