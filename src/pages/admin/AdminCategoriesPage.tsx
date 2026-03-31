import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { categoryAdminSchema } from '@/lib/validators'
import { queryKeys } from '@/lib/query/keys'
import { useToastStore } from '@/stores/toasts'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import type { Category } from '@/lib/types'

async function fetchAdminCategories() {
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  return (data ?? []) as Category[]
}

type CategoryFormState = {
  name: string
  slug: string
  color: string
  sort_order: number
  icon: string
  description: string
}

const initialCategoryForm: CategoryFormState = {
  name: '',
  slug: '',
  color: '#16a34a',
  sort_order: 0,
  icon: '',
  description: '',
}

export default function AdminCategoriesPage() {
  const { t } = useTranslation()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CategoryFormState>(initialCategoryForm)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.adminCategories(),
    queryFn: fetchAdminCategories,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = categoryAdminSchema.parse(form)
      const { error } = await supabase.from('categories').insert(parsed)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success('Category created.')
      setForm(initialCategoryForm)
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories() })
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ categoryId, payload }: { categoryId: string; payload: CategoryFormState }) => {
      const parsed = categoryAdminSchema.parse(payload)
      const { error } = await supabase.from('categories').update(parsed).eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success('Category updated.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories() })
    },
    onError: (error) => toast.error(error.message),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active: !isActive }).eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories() })
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: async () => {
      toast.success('Category deleted.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories() })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <Helmet><title>{t('admin_nav_categories')} — Verdkomunumo</title></Helmet>

      <h1 className="m-0 text-2xl font-bold text-[var(--color-text)]">{t('admin_nav_categories')}</h1>
      <p className="mb-6 mt-1 text-sm text-[var(--color-text-muted)]">
        Create, edit, reorder, hide, and safely delete categories from one place.
      </p>

      <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">New category</h2>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate()
          }}
        >
          <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" placeholder="Name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
          <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" placeholder="Slug" value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} />
          <input className="min-h-[42px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2" type="color" value={form.color} onChange={(e) => setForm((current) => ({ ...current, color: e.target.value }))} />
          <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" type="number" min="0" max="999" value={form.sort_order} onChange={(e) => setForm((current) => ({ ...current, sort_order: Number(e.target.value) }))} />
          <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 md:col-span-1" placeholder="Icon" value={form.icon} onChange={(e) => setForm((current) => ({ ...current, icon: e.target.value }))} />
          <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-white" disabled={createMutation.isPending}>
              {createMutation.isPending ? <InlineSpinner size={13} /> : null}
              Create category
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">Existing categories</h2>
        {isLoading ? (
          <ListSkeleton items={4} avatarSize={12} />
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onSave={(payload) => updateMutation.mutate({ categoryId: category.id, payload })}
                onToggle={() => toggleMutation.mutate({ categoryId: category.id, isActive: category.is_active })}
                onDelete={() => deleteMutation.mutate(category.id)}
                saving={updateMutation.isPending && updateMutation.variables?.categoryId === category.id}
                toggling={toggleMutation.isPending && toggleMutation.variables?.categoryId === category.id}
                deleting={deleteMutation.isPending && deleteMutation.variables === category.id}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function CategoryCard({
  category,
  onSave,
  onToggle,
  onDelete,
  saving,
  toggling,
  deleting,
}: {
  category: Category
  onSave: (payload: CategoryFormState) => void
  onToggle: () => void
  onDelete: () => void
  saving: boolean
  toggling: boolean
  deleting: boolean
}) {
  const [form, setForm] = useState<CategoryFormState>({
    name: category.name,
    slug: category.slug,
    color: category.color,
    sort_order: category.sort_order,
    icon: category.icon,
    description: category.description,
  })

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
            <h3 className="m-0 text-base font-semibold text-[var(--color-text)]">{category.name}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${category.is_active ? 'bg-[var(--color-primary-dim)] text-[var(--color-primary)]' : 'bg-[rgba(220,38,38,0.12)] text-[#b91c1c]'}`}>
              {category.is_active ? 'Active' : 'Hidden'}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">/{category.slug} · {category.post_count} posts · order {category.sort_order}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{category.description}</p>
        </div>
        <button type="button" className="rounded-xl border border-[var(--color-border)] px-3 py-2" onClick={onToggle} disabled={toggling}>
          {toggling ? <InlineSpinner size={12} /> : category.is_active ? 'Hide' : 'Activate'}
        </button>
      </div>

      <form
        className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(form)
        }}
      >
        <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
        <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} />
        <input className="min-h-[42px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2" type="color" value={form.color} onChange={(e) => setForm((current) => ({ ...current, color: e.target.value }))} />
        <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3" type="number" min="0" max="999" value={form.sort_order} onChange={(e) => setForm((current) => ({ ...current, sort_order: Number(e.target.value) }))} />
        <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 md:col-span-1" value={form.icon} onChange={(e) => setForm((current) => ({ ...current, icon: e.target.value }))} />
        <input className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 md:col-span-3" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
        <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="rounded-xl border border-[#dc2626] px-3 py-2 text-[#dc2626]" onClick={onDelete} disabled={category.post_count > 0 || deleting}>
            {deleting ? <InlineSpinner size={12} /> : 'Delete category'}
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-white" disabled={saving}>
            {saving ? <InlineSpinner size={13} /> : null}
            Save changes
          </button>
        </div>
      </form>
    </article>
  )
}
