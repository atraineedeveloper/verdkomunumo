import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { LEVEL_COLORS, LEVEL_ICONS } from '@/lib/icons'
import { routes } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import type { Profile, UserRole } from '@/lib/types'

interface ManagedUser extends Profile {
  role: UserRole
  updated_at: string
  created_at: string
}

interface ManagedUserRowProps {
  managedUser: ManagedUser
  isOwner: boolean
  profileId?: string
  saving: boolean
  roleOptions: UserRole[]
  onRoleUpdate: (event: React.FormEvent<HTMLFormElement>) => void
}

export function ManagedUserRow({
  managedUser,
  isOwner,
  profileId,
  saving,
  roleOptions,
  onRoleUpdate,
}: ManagedUserRowProps) {
  const { t } = useTranslation()
  const LevelIcon = LEVEL_ICONS[managedUser.esperanto_level]

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span style={{ color: LEVEL_COLORS[managedUser.esperanto_level] }}>
            {LevelIcon && <LevelIcon size={18} strokeWidth={1.75} />}
          </span>
          <div>
            <Link to={routes.profile(managedUser.username)} className="text-[var(--color-text)] no-underline hover:underline">
              {managedUser.display_name}
            </Link>
            <div className="text-xs text-[var(--color-text-muted)]">
              @{managedUser.username}{managedUser.email ? ` · ${managedUser.email}` : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-dim)] px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
          <Shield size={12} strokeWidth={2} />
          {t(`admin_role_${managedUser.role}` as never)}
        </span>
      </td>
      <td className="px-4 py-3">{formatDate(managedUser.updated_at ?? managedUser.created_at)}</td>
      <td className="px-4 py-3">
        <RoleAction
          managedUser={managedUser}
          isOwner={isOwner}
          profileId={profileId}
          saving={saving}
          roleOptions={roleOptions}
          onRoleUpdate={onRoleUpdate}
          t={t}
        />
      </td>
    </tr>
  )
}

interface RoleActionProps {
  managedUser: ManagedUser
  isOwner: boolean
  profileId?: string
  saving: boolean
  roleOptions: UserRole[]
  onRoleUpdate: (event: React.FormEvent<HTMLFormElement>) => void
  t: (key: string) => string
}

function RoleAction({ managedUser, isOwner, profileId, saving, roleOptions, onRoleUpdate, t }: RoleActionProps) {
  if (!isOwner || managedUser.id === profileId) {
    return <span className="text-[var(--color-text-muted)]">{t(`admin_role_${managedUser.role}` as never)}</span>
  }

  return (
    <form className="flex items-center gap-2" onSubmit={onRoleUpdate}>
      <input type="hidden" name="user_id" value={managedUser.id} />
      <select
        name="role"
        defaultValue={managedUser.role}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
      >
        {roleOptions.map((role: UserRole) => (
          <option key={role} value={role}>{t(`admin_role_${role}` as never)}</option>
        ))}
      </select>
      <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-white" disabled={saving}>
        {saving ? <InlineSpinner size={12} /> : null}
        {t('settings_save')}
      </button>
    </form>
  )
}
