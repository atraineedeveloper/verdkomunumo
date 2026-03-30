<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { withPendingAction } from '$lib/forms/pending'
  import { t, type TranslationKey } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate } from '$lib/utils'
  import { Users, Layers, Flag, Heart, MessageSquare, Shield } from 'lucide-svelte'
  import { CATEGORY_ICONS, CATEGORY_COLORS, LEVEL_ICONS, LEVEL_COLORS } from '$lib/icons'
  import type { UserRole } from '$lib/types'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const roleOptions: UserRole[] = ['user', 'moderator', 'admin', 'owner']

  const stats = $derived([
    { label: $t('admin_users'), value: data.stats.users.toString(), Icon: Users, trend: '' },
    { label: $t('nav_categories'), value: data.stats.categories.toString(), Icon: Layers, trend: '' },
    { label: $t('admin_nav_reports'), value: data.stats.pendingSuggestions.toString(), Icon: Flag, trend: 'Traktendaj' },
  ])

  function resultPayload(data: unknown) {
    return (data ?? {}) as { message?: string }
  }

  const previousPageHref = $derived.by(() => {
    if (data.pagination.page <= 1) return null
    const params = new URLSearchParams()
    if (data.filters.query) params.set('q', data.filters.query)
    if (data.filters.role !== 'all') params.set('role', data.filters.role)
    params.set('page', String(data.pagination.page - 1))
    return `/admin?${params.toString()}`
  })

  const nextPageHref = $derived.by(() => {
    if (data.pagination.page >= data.pagination.totalPages) return null
    const params = new URLSearchParams()
    if (data.filters.query) params.set('q', data.filters.query)
    if (data.filters.role !== 'all') params.set('role', data.filters.role)
    params.set('page', String(data.pagination.page + 1))
    return `/admin?${params.toString()}`
  })

  const paginationStart = $derived.by(() =>
    data.pagination.total === 0 ? 0 : (data.pagination.page - 1) * data.pagination.pageSize + 1
  )

  const paginationEnd = $derived.by(() =>
    data.pagination.total === 0 ? 0 : Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)
  )
</script>

<svelte:head>
  <title>{$t('admin_panel')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_panel')}</h1>
<p class="page-subtitle">{$t('admin_welcome')} {data.staffProfile?.display_name ?? 'Admin'}</p>

<!-- Stats -->
<div class="stats-grid">
  {#each stats as stat}
    {@const Icon = stat.Icon}
    <div class="stat-card">
      <div class="stat-icon"><Icon size={24} strokeWidth={1.5} /></div>
      <div class="stat-value">{stat.value}</div>
      <div class="stat-label">{stat.label}</div>
      {#if stat.trend}
        <div class="stat-trend">{stat.trend}</div>
      {/if}
    </div>
  {/each}
</div>

<!-- Recent posts -->
<section class="section">
  <h2 class="section-title">{$t('admin_recent_posts')}</h2>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Aŭtoro</th>
          <th>{$t('nav_categories')}</th>
          <th><Heart size={13} strokeWidth={1.75} /></th>
          <th><MessageSquare size={13} strokeWidth={1.75} /></th>
          <th>Agoj</th>
        </tr>
      </thead>
      <tbody>
        {#each data.recentPosts as post}
          <tr>
            <td>
              <a href="/profile/{post.author?.username}" class="table-link">
                {post.author?.display_name}
              </a>
            </td>
            <td>
              {#if post.category}
                {@const CatIcon = CATEGORY_ICONS[post.category.slug]}
                {@const catColor = CATEGORY_COLORS[post.category.slug]}
                <span class="category-badge"
                      style="color: {catColor}; background: {catColor}18; border-color: {catColor}30">
                  {#if CatIcon}<CatIcon size={12} strokeWidth={2} />{/if}
                  {$t(('cat_name_' + post.category.slug) as TranslationKey)}
                </span>
              {/if}
            </td>
            <td>{post.likes_count}</td>
            <td>{post.comments_count}</td>
            <td>
              <a href="/post/{post.id}" class="action-link">{$t('admin_view')}</a>
              <form method="POST" action="?/deletePost" class="inline-form">
                <input type="hidden" name="post_id" value={post.id} />
                <button type="submit" class="action-btn-danger">{$t('admin_delete')}</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="pagination">
    <span class="pagination-copy">
      {$t('admin_users')} {paginationStart} – {paginationEnd} / {data.pagination.total}
    </span>
    <div class="pagination-actions">
      {#if previousPageHref}
        <a href={previousPageHref} class="pagination-link">{$t('admin_pagination_previous')}</a>
      {/if}
      <span class="pagination-page">
        {$t('admin_pagination_page')} {data.pagination.page} / {data.pagination.totalPages}
      </span>
      {#if nextPageHref}
        <a href={nextPageHref} class="pagination-link">{$t('admin_pagination_next')}</a>
      {/if}
    </div>
  </div>
</section>

<!-- Recent users -->
<section class="section">
  <div class="section-head">
    <div>
      <h2 class="section-title">{$t('admin_role_manager_title')}</h2>
      <p class="section-copy">
        {#if data.isOwner}
          {$t('admin_roles_hint_owner')}
        {:else}
          {$t('admin_roles_hint_staff')}
        {/if}
      </p>
    </div>
  </div>

  <form method="GET" class="role-filters">
    <label class="filter-field">
      <span class="filter-label">{$t('search_title')}</span>
      <input
        type="search"
        name="q"
        value={data.filters.query}
        placeholder={$t('admin_role_manager_search_placeholder')}
        class="filter-input"
      />
    </label>

    <label class="filter-field filter-field-compact">
      <span class="filter-label">{$t('admin_role_filter_label')}</span>
      <select name="role" class="filter-input">
        <option value="all" selected={data.filters.role === 'all'}>{$t('admin_role_filter_all')}</option>
        {#each roleOptions as role}
          <option value={role} selected={data.filters.role === role}>
            {$t(('admin_role_' + role) as TranslationKey)}
          </option>
        {/each}
      </select>
    </label>

    <div class="filter-actions">
      <button type="submit" class="filter-submit">{$t('admin_role_filter_apply')}</button>
      {#if data.filters.query || data.filters.role !== 'all'}
        <a href="/admin" class="filter-reset">{$t('admin_role_filter_reset')}</a>
      {/if}
    </div>
  </form>

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>{$t('search_users')}</th>
          <th>{$t('admin_role_current')}</th>
          <th>{$t('admin_role_updated')}</th>
          <th>{$t('admin_role_action')}</th>
        </tr>
      </thead>
      <tbody>
        {#if data.managedUsers.length}
          {#each data.managedUsers as user}
            {@const LevelIcon = LEVEL_ICONS[user.esperanto_level]}
            <tr>
              <td>
                <div class="managed-user">
                  <span class="user-level" style="color: {LEVEL_COLORS[user.esperanto_level]}">
                    {#if LevelIcon}<LevelIcon size={18} strokeWidth={1.75} />{/if}
                  </span>
                  <div class="managed-user-copy">
                    <a href="/profile/{user.username}" class="table-link">{user.display_name}</a>
                    <span class="user-meta">@{user.username} · {user.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-pill role-pill-{user.role}">
                  <Shield size={12} strokeWidth={2} />
                  {$t(('admin_role_' + user.role) as TranslationKey)}
                </span>
              </td>
              <td>{formatDate(user.updated_at ?? user.created_at)}</td>
              <td>
                {#if data.isOwner && user.id !== data.staffProfile?.id}
                  <form
                    method="POST"
                    action="?/updateUserRole"
                    class="role-form"
                    use:enhance={withPendingAction(() => {
                      return async ({ result, update }) => {
                        await update()

                        if (result.type === 'success') {
                          toastStore.success(resultPayload(result.data).message ?? 'Role updated.')
                          await invalidateAll()
                          return
                        }

                        if (result.type === 'failure') {
                          toastStore.error(resultPayload(result.data).message ?? 'Could not update role.')
                          return
                        }

                        if (result.type === 'error') {
                          toastStore.error('Could not update role.')
                        }
                      }
                    })}
                  >
                    <input type="hidden" name="user_id" value={user.id} />
                    <select name="role" class="role-select">
                      {#each roleOptions as role}
                        <option value={role} selected={role === user.role}>
                          {$t(('admin_role_' + role) as TranslationKey)}
                        </option>
                      {/each}
                    </select>
                    <button type="submit" class="role-save">{$t('settings_save')}</button>
                  </form>
                {:else}
                  <span class="role-badge">{$t(('admin_role_' + user.role) as TranslationKey)}</span>
                {/if}
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="4">
              <div class="empty-state">{$t('admin_role_manager_empty')}</div>
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>

<section class="section">
  <h2 class="section-title">{$t('admin_new_users')}</h2>
  <p class="section-copy">
    {#if data.isOwner}
      {$t('admin_roles_hint_owner')}
    {:else}
      {$t('admin_roles_hint_staff')}
    {/if}
  </p>
  <div class="user-list">
    {#each data.recentUsers as user}
      {@const LevelIcon = LEVEL_ICONS[user.esperanto_level]}
      <div class="user-row">
        <span class="user-level" style="color: {LEVEL_COLORS[user.esperanto_level]}">{#if LevelIcon}<LevelIcon size={18} strokeWidth={1.75} />{/if}</span>
        <div class="user-info">
          <a href="/profile/{user.username}" class="table-link">{user.display_name}</a>
          <span class="user-meta">@{user.username} · {formatDate(user.created_at)}</span>
        </div>
        {#if data.isOwner && user.id !== data.staffProfile?.id}
          <form
            method="POST"
            action="?/updateUserRole"
            class="role-form"
            use:enhance={withPendingAction(() => {
              return async ({ result, update }) => {
                await update()

                if (result.type === 'success') {
                  toastStore.success(resultPayload(result.data).message ?? 'Role updated.')
                  await invalidateAll()
                  return
                }

                if (result.type === 'failure') {
                  toastStore.error(resultPayload(result.data).message ?? 'Could not update role.')
                  return
                }

                if (result.type === 'error') {
                  toastStore.error('Could not update role.')
                }
              }
            })}
          >
            <input type="hidden" name="user_id" value={user.id} />
            <select name="role" class="role-select">
              {#each roleOptions as role}
                <option value={role} selected={role === user.role}>
                  {$t(('admin_role_' + role) as TranslationKey)}
                </option>
              {/each}
            </select>
            <button type="submit" class="role-save">{$t('settings_save')}</button>
          </form>
        {:else}
          <span class="role-badge">{user.role}</span>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: 0 0 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1.25rem 1rem;
    text-align: center;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .stat-trend {
    font-size: 0.75rem;
    color: var(--color-primary);
    margin-top: 0.4rem;
    font-weight: 500;
  }

  .section { margin-bottom: 2rem; }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.75rem;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .section-copy {
    font-size: 0.84rem;
    color: var(--color-text-muted);
    margin: -0.2rem 0 0.9rem;
  }

  .role-filters {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(180px, 0.9fr) auto;
    gap: 0.85rem;
    align-items: end;
    margin-bottom: 1rem;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .filter-field-compact {
    max-width: 220px;
  }

  .filter-label {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .filter-input {
    width: 100%;
    min-height: 42px;
    padding: 0.7rem 0.85rem;
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
  }

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .filter-submit,
  .filter-reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0.65rem 0.95rem;
    border-radius: 0.75rem;
    font: inherit;
    text-decoration: none;
  }

  .filter-submit {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: white;
    cursor: pointer;
  }

  .filter-reset {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .table-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .data-table th {
    background: var(--color-bg);
    padding: 0.6rem 1rem;
    text-align: left;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-weight: 600;
    border-bottom: 1px solid var(--color-border);
  }

  .data-table td {
    padding: 0.7rem 1rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
  }

  .data-table tr:last-child td { border-bottom: none; }

  .table-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }
  .table-link:hover { text-decoration: underline; }

  .managed-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 280px;
  }

  .managed-user-copy {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    padding: 0.15rem 0.5rem;
  }

  .action-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }

  .inline-form {
    display: inline;
  }

  .action-btn-danger {
    background: none;
    border: 1px solid #dc2626;
    color: #dc2626;
    border-radius: 0.375rem;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .action-btn-danger:hover { background: #dc2626; color: white; }

  .user-list {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  .user-row:last-child { border-bottom: none; }

  .user-level {
    display: flex;
    align-items: center;
    color: var(--color-primary);
  }

  .user-info { flex: 1; }

  .user-meta {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .role-badge {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }

  .role-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 999px;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--color-border);
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .role-pill-user {
    background: color-mix(in srgb, var(--color-border) 18%, transparent);
    color: var(--color-text);
  }

  .role-pill-moderator {
    background: color-mix(in srgb, #f59e0b 15%, transparent);
    color: #b45309;
    border-color: color-mix(in srgb, #f59e0b 28%, var(--color-border));
  }

  .role-pill-admin {
    background: color-mix(in srgb, #2563eb 14%, transparent);
    color: #1d4ed8;
    border-color: color-mix(in srgb, #2563eb 28%, var(--color-border));
  }

  .role-pill-owner {
    background: color-mix(in srgb, var(--color-primary) 16%, transparent);
    color: var(--color-primary);
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }

  .role-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .role-select {
    min-width: 130px;
    padding: 0.45rem 0.65rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
  }

  .role-save {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: white;
    border-radius: 0.5rem;
    padding: 0.45rem 0.75rem;
    font: inherit;
    cursor: pointer;
  }

  .role-save:hover { opacity: 0.9; }

  .empty-state {
    padding: 1.25rem 0;
    text-align: center;
    color: var(--color-text-muted);
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.9rem;
    flex-wrap: wrap;
  }

  .pagination-copy,
  .pagination-page {
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }

  .pagination-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .pagination-link {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0.5rem 0.8rem;
    border-radius: 0.7rem;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    text-decoration: none;
  }

  @media (max-width: 900px) {
    .role-filters {
      grid-template-columns: 1fr;
    }

    .filter-field-compact {
      max-width: none;
    }
  }
</style>
