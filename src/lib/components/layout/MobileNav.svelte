<script lang="ts">
  import { Home, Search, Bell, MessageCircle, User } from 'lucide-svelte'
  import { unreadCount } from '$lib/stores/notifications'
  import { page } from '$app/state'

  const path = $derived(page.url?.pathname ?? '')
</script>

<nav class="mobile-nav">
  <a href="/feed"          class="item" class:on={path === '/feed'}>
    <Home size={21} strokeWidth={path === '/feed' ? 2.5 : 1.75} />
  </a>
  <a href="/search"        class="item" class:on={path === '/search'}>
    <Search size={21} strokeWidth={path === '/search' ? 2.5 : 1.75} />
  </a>
  <a href="/notifications" class="item notif" class:on={path === '/notifications'}>
    <Bell size={21} strokeWidth={path === '/notifications' ? 2.5 : 1.75} />
    {#if $unreadCount > 0}
      <span class="badge">{$unreadCount > 9 ? '9+' : $unreadCount}</span>
    {/if}
  </a>
  <a href="/messages"      class="item" class:on={path === '/messages'}>
    <MessageCircle size={21} strokeWidth={path === '/messages' ? 2.5 : 1.75} />
  </a>
  <a href="/profile/me"    class="item" class:on={path.startsWith('/profile')}>
    <User size={21} strokeWidth={path.startsWith('/profile') ? 2.5 : 1.75} />
  </a>
</nav>

<style>
  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 90;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border);
    padding: 0 0.5rem calc(env(safe-area-inset-bottom, 0px) + 0.35rem);
  }

  @media (min-width: 768px) { .mobile-nav { display: none; } }

  .item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 0.25rem;
    text-decoration: none;
    color: var(--color-text-muted);
    position: relative;
    transition: color 0.15s;
  }

  .item.on { color: var(--color-primary); }

  .notif { position: relative; }

  .badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 18px);
    background: var(--color-danger);
    color: #fff;
    font-size: 0.58rem;
    font-weight: 700;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--color-bg);
  }
</style>
