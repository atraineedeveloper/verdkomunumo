<script lang="ts">
  import { t, type TranslationKey } from '$lib/i18n'
  import { mockPosts, mockCategories, mockProfile } from '$lib/mock'
  import { Users, Layers, Flag, Heart, MessageSquare } from 'lucide-svelte'
  import { CATEGORY_ICONS, CATEGORY_COLORS, LEVEL_ICONS, LEVEL_COLORS } from '$lib/icons'

  const stats = $derived([
    { label: $t('admin_users'), value: '1,284', Icon: Users, trend: '+12 ĉi-semajne' },
    { label: $t('nav_categories'), value: mockCategories.length.toString(), Icon: Layers, trend: '' },
    { label: $t('admin_nav_reports'), value: '3', Icon: Flag, trend: 'Traktendaj' },
  ])

  const recentUsers = [
    { name: 'Lucas Oliveira', username: 'lucas_br', joined: 'antaŭ 2 tagoj', level: 'komencanto' },
    { name: 'Kenji Yamamoto', username: 'kenji_eo', joined: 'antaŭ 3 tagoj', level: 'progresanto' },
    { name: 'María Fernández', username: 'maria_es', joined: 'antaŭ 5 tagoj', level: 'komencanto' },
  ]
</script>

<svelte:head>
  <title>{$t('admin_panel')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_panel')}</h1>
<p class="page-subtitle">{$t('admin_welcome')} {mockProfile.display_name}</p>

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
        {#each mockPosts as post}
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
              <button class="action-btn-danger">{$t('admin_delete')}</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<!-- Recent users -->
<section class="section">
  <h2 class="section-title">{$t('admin_new_users')}</h2>
  <div class="user-list">
    {#each recentUsers as user}
      {@const LevelIcon = LEVEL_ICONS[user.level]}
      <div class="user-row">
        <span class="user-level" style="color: {LEVEL_COLORS[user.level]}">{#if LevelIcon}<LevelIcon size={18} strokeWidth={1.75} />{/if}</span>
        <div class="user-info">
          <a href="/profile/{user.username}" class="table-link">{user.name}</a>
          <span class="user-meta">@{user.username} · {user.joined}</span>
        </div>
        <button class="action-btn-danger">{$t('admin_block')}</button>
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
</style>
