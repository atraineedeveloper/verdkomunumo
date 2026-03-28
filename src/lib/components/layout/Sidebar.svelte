<script lang="ts">
  import { CATEGORIES } from '$lib/constants'
  import { t, type TranslationKey } from '$lib/i18n'
  import { CATEGORY_ICONS, CATEGORY_COLORS } from '$lib/icons'
  import { page } from '$app/state'
  import type { Category } from '$lib/types'

  interface Props {
    categories?: Category[]
    activeSlug?: string
  }

  let { categories = [], activeSlug = '' }: Props = $props()

  const path = $derived(page.url?.pathname ?? '')
</script>

<aside class="sidebar">
  <nav>
    <a href="/feed" class="link" class:active={path === '/feed'}>
      {$t('nav_home')}
    </a>
    <a href="/feed?filter=following" class="link" class:active={path.includes('following')}>
      {$t('nav_following')}
    </a>
  </nav>

  <div class="section">
    <p class="label">{$t('nav_categories')}</p>
    <nav>
      {#each CATEGORIES as cat}
        {@const found = categories.find((c) => c.slug === cat.slug)}
        {@const CatIcon = CATEGORY_ICONS[cat.slug]}
        <a
          href="/category/{cat.slug}"
          class="link cat"
          class:active={activeSlug === cat.slug || path.includes(`/category/${cat.slug}`)}
        >
          {#if CatIcon}<span class="icon" style="color: {CATEGORY_COLORS[cat.slug]}"><CatIcon size={15} strokeWidth={1.75} /></span>{/if}
          <span class="cat-name">{$t(('cat_name_' + cat.slug) as TranslationKey)}</span>
        </a>
      {/each}
    </nav>
  </div>
</aside>

<style>
  .sidebar {
    width: 210px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section { display: flex; flex-direction: column; gap: 0.5rem; }

  .label {
    font-size: 0.67rem;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    padding: 0 0.5rem;
    margin: 0;
  }

  nav { display: flex; flex-direction: column; }

  .link {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.42rem 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: 6px;
    transition: color 0.12s, background 0.12s;
  }

  .link:hover { color: var(--color-text); background: var(--color-surface-alt); }
  .link.active { color: var(--color-primary); font-weight: 600; }

  .icon { font-size: 0.9rem; width: 18px; text-align: center; flex-shrink: 0; }

  .cat-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-left: auto;
    flex-shrink: 0;
  }

  .link.active .count { color: var(--color-primary); opacity: 0.7; }
</style>
