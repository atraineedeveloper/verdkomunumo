<script lang="ts">
  import { t } from '$lib/i18n'
  import { Bell } from 'lucide-svelte'
  import { formatDate, getAvatarUrl } from '$lib/utils'
  import type { PageData } from './$types'
  import type { NotificationType } from '$lib/types'

  let { data }: { data: PageData } = $props()

  const notifText = $derived<Record<NotificationType, string>>({
    like:               $t('notif_liked_post'),
    comment:            $t('notif_commented'),
    follow:             $t('notif_followed'),
    message:            $t('notif_message'),
    mention:            $t('notif_mention'),
    category_approved:  $t('notif_category_approved'),
    category_rejected:  $t('notif_category_rejected'),
  })

  function notifLink(notif: (typeof data.notifications)[0]): string {
    if (notif.type === 'follow') return `/profile/${notif.actor?.username}`
    if (notif.post_id)           return `/post/${notif.post_id}`
    if (notif.type === 'message') return '/messages'
    return '#'
  }
</script>

<svelte:head>
  <title>{$t('notif_title')} — Verdkomunumo</title>
</svelte:head>

<div class="header">
  <h1>{$t('notif_title')}</h1>
  {#if data.notifications.some((n) => !n.is_read)}
    <form method="POST" action="?/markAll">
      <button class="mark-all">{$t('notif_mark_all')}</button>
    </form>
  {/if}
</div>

{#if data.notifications.length === 0}
  <p class="empty"><Bell size={16} strokeWidth={1.75} /> {$t('notif_empty')}</p>
{:else}
  <div class="list">
    {#each data.notifications as notif}
      <a href={notifLink(notif)} class="row" class:unread={!notif.is_read}>
        {#if notif.actor}
          <img src={getAvatarUrl(notif.actor.avatar_url, notif.actor.display_name)}
               alt={notif.actor.display_name} class="ava" />
        {:else}
          <div class="ava sys"><Bell size={20} strokeWidth={1.75} /></div>
        {/if}

        <div class="body">
          <p class="text">
            {#if notif.actor}<strong>{notif.actor.display_name}</strong>{/if}
            {notifText[notif.type as NotificationType]}
          </p>
          <span class="time">{formatDate(notif.created_at)}</span>
        </div>

        {#if !notif.is_read}<span class="dot"></span>{/if}
      </a>
    {/each}
  </div>
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.25rem;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0;
  }

  .mark-all {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 5px;
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
    transition: color 0.12s, border-color 0.12s;
  }
  .mark-all:hover { color: var(--color-primary); border-color: var(--color-primary); }

  .empty {
    text-align: center;
    padding: 3rem 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .list { display: flex; flex-direction: column; }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--color-border);
    text-decoration: none;
    position: relative;
    transition: background 0.12s;
    border-radius: 0;
  }

  .row:hover { background: var(--color-surface-alt); margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; }
  .row.unread { background: var(--color-primary-dim); margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }

  .ava {
    width: 40px;
    height: 40px;
    border-radius: 99px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .sys {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }

  .body { flex: 1; min-width: 0; }

  .text {
    font-size: 0.875rem;
    color: var(--color-text);
    margin: 0 0 0.15rem;
    line-height: 1.4;
  }

  .time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: var(--color-primary);
    flex-shrink: 0;
  }
</style>
