<script lang="ts">
  import { t } from '$lib/i18n'
  let { children } = $props()
</script>

<div class="admin-layout">
  <aside class="admin-sidebar">
    <div class="admin-brand">
      <span class="admin-star">★</span>
      <span>Admin</span>
    </div>
    <nav class="admin-nav">
      <a href="/admin" class="admin-link">{$t('admin_nav_panel')}</a>
      <a href="/admin/categories" class="admin-link">{$t('admin_nav_categories')}</a>
      <a href="/admin/reports" class="admin-link">{$t('admin_nav_reports')}</a>
      <a href="/feed" class="admin-link back-link">{$t('admin_nav_back')}</a>
    </nav>
  </aside>

  <main class="admin-main">
    {@render children()}
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--color-bg);
  }

  .admin-sidebar {
    width: 220px;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    padding: 1.5rem 1rem;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .admin-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .admin-star {
    color: var(--color-primary);
    font-size: 1.25rem;
  }

  .admin-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .admin-link {
    display: block;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    transition: background 0.15s, color 0.15s;
  }
  .admin-link:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }

  .back-link {
    margin-top: 1rem;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  .admin-main {
    flex: 1;
    padding: 2rem;
    min-width: 0;
  }
</style>
