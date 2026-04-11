import { useTranslation } from 'react-i18next'
import type { Profile, UserRole } from '@/lib/types'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { ManagedUserRow } from './ManagedUserRow'

interface ManagedUser extends Profile {
  role: UserRole
  updated_at: string
  created_at: string
}

interface RoleManagerSectionProps {
  managedUsers: ManagedUser[]
  isLoading: boolean
  isOwner: boolean
  profileId?: string
  query: string
  roleFilter: string
  roleOptions: UserRole[]
  pagination: { start: number; end: number; totalPages: number }
  page: number
  totalManagedUsers: number
  updateRoleMutationVariables?: { userId: string }
  isUpdatingRole: boolean
  onFilterSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onRoleUpdate: (event: React.FormEvent<HTMLFormElement>) => void
  onPageChange: (page: number) => void
}

export function RoleManagerSection({
  managedUsers,
  isLoading,
  isOwner,
  profileId,
  query,
  roleFilter,
  roleOptions,
  pagination,
  page,
  totalManagedUsers,
  updateRoleMutationVariables,
  isUpdatingRole,
  onFilterSubmit,
  onRoleUpdate,
  onPageChange,
}: RoleManagerSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-[var(--color-text)]">{t('admin_role_manager_title')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isOwner ? t('admin_roles_hint_owner') : t('admin_roles_hint_staff')}
          </p>
        </div>
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={onFilterSubmit}
        >
          <input
            name="q"
            defaultValue={query}
            placeholder={t('admin_role_manager_search_placeholder')}
            className="min-h-[42px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          />
          <select
            name="role"
            defaultValue={roleFilter}
            className="min-h-[42px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          >
            <option value="all">{t('admin_role_filter_all')}</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>{t(`admin_role_${role}` as never)}</option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-white">
            {t('admin_role_filter_apply')}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {isLoading ? (
          <div className="p-4"><ListSkeleton items={5} avatarSize={28} /></div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">{t('search_users')}</th>
                <th className="px-4 py-3">{t('admin_role_current')}</th>
                <th className="px-4 py-3">{t('admin_role_updated')}</th>
                <th className="px-4 py-3">{t('admin_role_action')}</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.length ? (
                managedUsers.map((managedUser) => {
                  const saving = isUpdatingRole && updateRoleMutationVariables?.userId === managedUser.id
                  return (
                    <ManagedUserRow
                      key={managedUser.id}
                      managedUser={managedUser}
                      isOwner={isOwner}
                      profileId={profileId}
                      saving={saving}
                      roleOptions={roleOptions}
                      onRoleUpdate={onRoleUpdate}
                    />
                  )
                })
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[var(--color-text-muted)]" colSpan={4}>
                    {t('admin_role_manager_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--color-text-muted)] md:flex-row md:items-center md:justify-between">
        <span>{t('admin_users')} {pagination.start} – {pagination.end} / {totalManagedUsers}</span>
        <div className="flex items-center gap-3">
          {page > 1 && (
            <button
              type="button"
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5"
              onClick={() => onPageChange(page - 1)}
            >
              {t('admin_pagination_previous')}
            </button>
          )}
          <span>{t('admin_pagination_page')} {page} / {pagination.totalPages}</span>
          {page < pagination.totalPages && (
            <button
              type="button"
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5"
              onClick={() => onPageChange(page + 1)}
            >
              {t('admin_pagination_next')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
