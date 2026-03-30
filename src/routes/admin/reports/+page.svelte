<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { withPendingAction } from '$lib/forms/pending'
  import { t } from '$lib/i18n'
  import { toastStore } from '$lib/stores/toasts'
  import { formatDate, truncate } from '$lib/utils'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const contentReports = $derived(data.contentReports ?? [])
  const hiddenPosts = $derived(data.hiddenPosts ?? [])
  const hiddenComments = $derived(data.hiddenComments ?? [])
  const appSuggestions = $derived(data.appSuggestions ?? [])

  function getResultPayload(data: unknown) {
    return (data ?? {}) as { message?: string }
  }

  const handleAdminAction = withPendingAction(() => {
    return async ({ result, update }) => {
      await update()

      if (result.type === 'success') {
        toastStore.success(getResultPayload(result.data).message ?? 'Saved.')
        await invalidateAll()
        return
      }

      if (result.type === 'failure') {
        toastStore.error(getResultPayload(result.data).message ?? 'Something went wrong.')
        return
      }

      if (result.type === 'error') {
        toastStore.error('Something went wrong.')
      }
    }
  })

  function targetLabel(report: PageData['contentReports'][number]) {
    return report.post_id ? 'Post' : 'Comment'
  }
</script>

<svelte:head>
  <title>{$t('admin_nav_reports')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('admin_nav_reports')}</h1>
<p class="subtitle">Review actual user-submitted reports, resolve them, and restore moderated content when needed.</p>

<section class="section">
  <h2 class="section-title">Open reports</h2>
  {#if contentReports.length === 0}
    <p class="empty">No pending reports right now.</p>
  {:else}
    <div class="list">
      {#each contentReports as report}
        <article class="row report-row">
          <div class="body">
            <div class="report-head">
              <span class="reason-chip">{report.reason}</span>
              <span class="meta">{targetLabel(report)} reported by @{report.author?.username ?? 'unknown'}</span>
              <span class="meta">{formatDate(report.created_at)}</span>
            </div>

            {#if report.post}
              <a class="title" href="/post/{report.post.id}">
                {truncate(report.post.content, 220)}
              </a>
              <p class="meta">@{report.post.author?.username ?? 'unknown'} · {report.post.category?.name ?? 'No category'}</p>
            {:else if report.comment}
              <p class="title">{truncate(report.comment.content, 220)}</p>
              <p class="meta">@{report.comment.author?.username ?? 'unknown'} · on post #{report.comment.post?.id}</p>
            {/if}

            {#if report.details}
              <p class="detail">{report.details}</p>
            {/if}
          </div>

          <div class="report-actions">
            {#if report.post_id}
              <form method="POST" action="?/hidePost" use:enhance={handleAdminAction}>
                <input type="hidden" name="report_id" value={report.id} />
                <input type="hidden" name="post_id" value={report.post_id} />
                <button type="submit" class="btn-danger">Hide post</button>
              </form>
            {:else if report.comment_id}
              <form method="POST" action="?/hideComment" use:enhance={handleAdminAction}>
                <input type="hidden" name="report_id" value={report.id} />
                <input type="hidden" name="comment_id" value={report.comment_id} />
                <button type="submit" class="btn-danger">Hide comment</button>
              </form>
            {/if}

            <form method="POST" action="?/dismissReport" use:enhance={handleAdminAction}>
              <input type="hidden" name="report_id" value={report.id} />
              <button type="submit" class="btn-secondary">Dismiss</button>
            </form>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="section">
  <h2 class="section-title">Product suggestions</h2>
  {#if appSuggestions.length === 0}
    <p class="empty">There are no product suggestions yet.</p>
  {:else}
    <div class="list">
      {#each appSuggestions as suggestion}
        <article class="row suggestion-row">
          <div class="body">
            <p class="title">{suggestion.title}</p>
            <p class="meta">@{suggestion.author?.username ?? 'unknown'} · {formatDate(suggestion.created_at)} · {suggestion.status}</p>
            <p class="detail">{suggestion.description}</p>
            {#if suggestion.context}
              <p class="meta">{suggestion.context}</p>
            {/if}
          </div>
          {#if suggestion.status === 'pending'}
            <div class="report-actions">
              <form method="POST" action="?/planSuggestion" use:enhance={handleAdminAction}>
                <input type="hidden" name="suggestion_id" value={suggestion.id} />
                <button type="submit" class="btn-primary">Plan</button>
              </form>
              <form method="POST" action="?/closeSuggestion" use:enhance={handleAdminAction}>
                <input type="hidden" name="suggestion_id" value={suggestion.id} />
                <button type="submit" class="btn-secondary">Close</button>
              </form>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="section">
  <h2 class="section-title">Hidden posts</h2>
  {#if hiddenPosts.length === 0}
    <p class="empty">No hidden posts.</p>
  {:else}
    <div class="list">
      {#each hiddenPosts as post}
        <article class="row">
          <div class="body">
            <a class="title" href="/post/{post.id}">{truncate(post.content, 180)}</a>
            <p class="meta">@{post.author?.username ?? 'unknown'} · {formatDate(post.updated_at ?? post.created_at)}</p>
          </div>
          <form method="POST" action="?/restorePost" use:enhance={handleAdminAction}>
            <input type="hidden" name="post_id" value={post.id} />
            <button type="submit" class="btn-secondary">Restore</button>
          </form>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="section">
  <h2 class="section-title">Hidden comments</h2>
  {#if hiddenComments.length === 0}
    <p class="empty">No hidden comments.</p>
  {:else}
    <div class="list">
      {#each hiddenComments as comment}
        <article class="row">
          <div class="body">
            <p class="title">{truncate(comment.content, 180)}</p>
            <p class="meta">@{comment.author?.username ?? 'unknown'} · {formatDate(comment.created_at)}</p>
          </div>
          <form method="POST" action="?/restoreComment" use:enhance={handleAdminAction}>
            <input type="hidden" name="comment_id" value={comment.id} />
            <button type="submit" class="btn-secondary">Restore</button>
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
  .list { display: grid; gap: 0.85rem; }
  .row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.9rem;
    padding: 1rem;
  }
  .report-row,
  .suggestion-row {
    align-items: flex-start;
  }
  .body { min-width: 0; flex: 1; }
  .title {
    margin: 0 0 0.25rem;
    color: var(--color-text);
    text-decoration: none;
    white-space: pre-wrap;
    display: block;
  }
  .meta,
  .empty {
    color: var(--color-text-muted);
    margin: 0;
  }
  .detail {
    margin: 0.55rem 0 0;
    color: var(--color-text);
    white-space: pre-wrap;
  }
  .report-head {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    margin-bottom: 0.55rem;
  }
  .reason-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    background: color-mix(in srgb, #dc2626 12%, transparent);
    color: #b91c1c;
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .report-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    border-radius: 0.7rem;
    padding: 0.55rem 0.85rem;
    font: inherit;
    cursor: pointer;
  }
  .btn-primary {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: white;
  }
  .btn-secondary {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
  }
  .btn-danger {
    border: 1px solid #dc2626;
    background: transparent;
    color: #dc2626;
  }
  @media (max-width: 720px) {
    .row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
