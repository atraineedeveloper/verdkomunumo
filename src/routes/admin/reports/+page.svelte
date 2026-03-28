<script lang="ts">
  import { t } from '$lib/i18n'
  import { formatDate, truncate } from '$lib/utils'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>{$t('admin_nav_reports')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_nav_reports')}</h1>
<p class="subtitle">Ĉi tie ni traktas la moderigan vicon ĝis ekzistos vera raporta sistemo.</p>

<section class="section">
  <h2 class="section-title">Afiŝoj por revizio</h2>
  {#if data.flaggedPosts.length === 0}
    <p class="empty">Neniuj afiŝoj por revizio.</p>
  {:else}
    <div class="list">
      {#each data.flaggedPosts as post}
        <article class="row">
          <div class="body">
            <a class="title" href="/post/{post.id}">{truncate(post.content, 180)}</a>
            <p class="meta">@{post.author?.username ?? 'nekonata'} · {formatDate(post.created_at)}</p>
          </div>
          <form method="POST" action="?/hidePost">
            <input type="hidden" name="post_id" value={post.id} />
            <button type="submit" class="btn-danger">Kaŝi</button>
          </form>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="section">
  <h2 class="section-title">Lastaj komentoj</h2>
  {#if data.recentComments.length === 0}
    <p class="empty">Neniuj komentoj.</p>
  {:else}
    <div class="list">
      {#each data.recentComments as comment}
        <article class="row">
          <div class="body">
            <p class="title">{truncate(comment.content, 180)}</p>
            <p class="meta">@{comment.author?.username ?? 'nekonata'} · {formatDate(comment.created_at)}</p>
          </div>
          <form method="POST" action="?/hideComment">
            <input type="hidden" name="comment_id" value={comment.id} />
            <button type="submit" class="btn-danger">Kaŝi</button>
          </form>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .page-title { font-size: 1.5rem; margin: 0 0 0.25rem; }
  .subtitle { color: var(--color-text-muted); margin: 0 0 1.5rem; }
  .section { margin-bottom: 2rem; }
  .section-title { font-size: 1rem; margin: 0 0 0.75rem; }
  .list { display: grid; gap: 0.75rem; }
  .row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1rem;
  }
  .body { min-width: 0; }
  .title { margin: 0 0 0.25rem; color: var(--color-text); text-decoration: none; white-space: pre-wrap; }
  .meta, .empty { color: var(--color-text-muted); margin: 0; }
  .btn-danger {
    border-radius: 0.5rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid #dc2626;
    background: transparent;
    color: #dc2626;
    cursor: pointer;
  }
</style>
