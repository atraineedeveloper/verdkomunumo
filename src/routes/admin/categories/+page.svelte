<script lang="ts">
  import { t } from '$lib/i18n'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>{$t('admin_nav_categories')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_nav_categories')}</h1>

<section class="section">
  <h2 class="section-title">Aktivaj kategorioj</h2>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Nomo</th>
          <th>Slug</th>
          <th>Afiŝoj</th>
          <th>Stato</th>
          <th>Agoj</th>
        </tr>
      </thead>
      <tbody>
        {#each data.categories as category}
          <tr>
            <td>{category.name}</td>
            <td>{category.slug}</td>
            <td>{category.post_count}</td>
            <td>{category.is_active ? 'Aktiva' : 'Kaŝita'}</td>
            <td>
              <form method="POST" action="?/toggleCategory">
                <input type="hidden" name="category_id" value={category.id} />
                <input type="hidden" name="is_active" value={category.is_active ? 'true' : 'false'} />
                <button type="submit" class="btn-secondary">{category.is_active ? 'Malaktivigi' : 'Aktivigi'}</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<section class="section">
  <h2 class="section-title">Sugestoj de kategorioj</h2>
  {#if data.suggestions.length === 0}
    <p class="empty">Neniuj sugestoj ankoraŭ.</p>
  {:else}
    <div class="suggestions">
      {#each data.suggestions as suggestion}
        <article class="card">
          <div class="card-top">
            <div>
              <h3>{suggestion.name}</h3>
              <p class="meta">@{suggestion.author?.username ?? 'nekonata'} · {suggestion.status}</p>
            </div>
          </div>
          <p class="desc">{suggestion.description}</p>
          {#if suggestion.reason}
            <p class="reason">{suggestion.reason}</p>
          {/if}
          {#if suggestion.status === 'pending'}
            <div class="actions">
              <form method="POST" action="?/approveSuggestion">
                <input type="hidden" name="suggestion_id" value={suggestion.id} />
                <button type="submit" class="btn-primary">Aprobi</button>
              </form>
              <form method="POST" action="?/rejectSuggestion">
                <input type="hidden" name="suggestion_id" value={suggestion.id} />
                <button type="submit" class="btn-danger">Malakcepti</button>
              </form>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .page-title { font-size: 1.5rem; margin: 0 0 1.25rem; }
  .section { margin-bottom: 2rem; }
  .section-title { font-size: 1rem; margin: 0 0 0.75rem; }
  .table-wrap, .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
  }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  .table tr:last-child td { border-bottom: none; }
  .suggestions { display: grid; gap: 1rem; }
  .card { padding: 1rem; }
  .card-top h3 { margin: 0 0 0.15rem; }
  .meta, .reason, .empty { color: var(--color-text-muted); }
  .desc { white-space: pre-wrap; }
  .actions { display: flex; gap: 0.75rem; }
  .btn-primary, .btn-secondary, .btn-danger {
    border-radius: 0.5rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
  .btn-primary { background: var(--color-primary); color: white; border-color: var(--color-primary); }
  .btn-danger { border-color: #dc2626; color: #dc2626; }
</style>
