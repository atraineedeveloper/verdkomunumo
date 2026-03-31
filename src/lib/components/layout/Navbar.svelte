<script lang="ts">
  import { Bell, MessageCircle, Palette, Settings, LogOut, Search, User } from 'lucide-svelte'
  import { themeStore } from '$lib/stores/theme'
  import { currentProfile } from '$lib/stores/auth'
  import { t, locale, LOCALE_LABELS, LOCALE_COUNTRY, type Locale } from '$lib/i18n'
  import { APP_NAME } from '$lib/constants'
  import type { Theme } from '$lib/types'

  interface Props {
    unreadNotificationsCount?: number
    unreadMessagesCount?: number
  }

  let {
    unreadNotificationsCount = 0,
    unreadMessagesCount = 0
  }: Props = $props()

  const themes: Theme[] = ['green', 'dark', 'vivid', 'minimal']
  const locales = Object.keys(LOCALE_LABELS) as Locale[]

  let showLangMenu = $state(false)
  let showUserMenu = $state(false)

  function cycleTheme() {
    const idx = themes.indexOf(
      document.documentElement.className.replace('theme-', '') as Theme
    )
    themeStore.setTheme(themes[(idx + 1) % themes.length])
  }

  function selectLocale(l: Locale) {
    locale.setLocale(l)
    showLangMenu = false
  }
</script>

<nav class="navbar">
  <div class="inner">
    <!-- Logo -->
    <a href="/feed" class="logo">
      <span class="star">★</span>
      <span class="name">{APP_NAME}</span>
      <span class="beta">beta</span>
    </a>

    <!-- Search -->
    <a href="/search" class="search-bar" aria-label={$t('nav_search')}>
      <Search size={13} strokeWidth={2} />
      <span>{$t('nav_search')}…</span>
    </a>

    <!-- Right actions -->
    <div class="actions">
      <!-- Lang -->
      <div class="rel">
        <button class="btn-icon" onclick={() => { showLangMenu = !showLangMenu; showUserMenu = false }}
          title={$t('nav_change_lang')}>
          {#if LOCALE_COUNTRY[$locale]}
            <span class="fi fi-{LOCALE_COUNTRY[$locale]} flag-icon"></span>
          {:else}
            <span class="eo-badge">EO</span>
          {/if}
        </button>
        {#if showLangMenu}
          <button class="veil" onclick={() => (showLangMenu = false)} tabindex="-1" aria-hidden="true"></button>
          <div class="menu" role="menu">
            {#each locales as l}
              <button class="menu-row {$locale === l ? 'on' : ''}" onclick={() => selectLocale(l)} role="menuitem">
                {#if LOCALE_COUNTRY[l]}
                  <span class="fi fi-{LOCALE_COUNTRY[l]} flag-icon"></span>
                {:else}
                  <span class="eo-badge">EO</span>
                {/if}
                <span>{LOCALE_LABELS[l]}</span>
                {#if $locale === l}<span class="tick">✓</span>{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <button class="btn-icon" onclick={cycleTheme} title={$t('nav_change_theme')}>
        <Palette size={16} strokeWidth={1.75} />
      </button>

      <a href="/notifications" class="btn-icon rel" title={$t('nav_notifications')}>
        <Bell size={16} strokeWidth={1.75} />
        {#if unreadNotificationsCount > 0}
          <span class="dot">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
        {/if}
      </a>

      <a href="/messages" class="btn-icon rel" title={$t('nav_messages')}>
        <MessageCircle size={16} strokeWidth={1.75} />
        {#if unreadMessagesCount > 0}
          <span class="dot">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
        {/if}
      </a>

      <!-- Avatar -->
      {#if $currentProfile}
        <div class="rel">
          <button class="avatar-wrap" onclick={() => { showUserMenu = !showUserMenu; showLangMenu = false }}>
            <img
              src={$currentProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent($currentProfile.display_name)}&background=16a34a&color=fff`}
              alt={$currentProfile.display_name}
              class="avatar"
            />
          </button>
          {#if showUserMenu}
            <button class="veil" onclick={() => (showUserMenu = false)} tabindex="-1" aria-hidden="true"></button>
            <div class="menu menu-right" role="menu">
              <div class="menu-profile">
                <span class="mp-name">{$currentProfile.display_name}</span>
                <span class="mp-user">@{$currentProfile.username}</span>
              </div>
              <div class="sep"></div>
              <a href="/profile/{$currentProfile.username}" class="menu-row" onclick={() => showUserMenu = false}>
                <User size={13} strokeWidth={1.75} /> {$t('nav_profile')}
              </a>
              <a href="/settings" class="menu-row" onclick={() => showUserMenu = false}>
                <Settings size={13} strokeWidth={1.75} /> {$t('nav_settings')}
              </a>
              <div class="sep"></div>
              <form method="POST" action="/auth/logout">
                <button class="menu-row menu-danger" type="submit">
                  <LogOut size={13} strokeWidth={1.75} /> {$t('nav_logout')}
                </button>
              </form>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 0.75rem;
    height: 52px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (min-width: 480px) {
    .inner { padding: 0 1.5rem; gap: 1rem; }
  }

  /* Logo */
  .logo {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    text-decoration: none;
    flex-shrink: 0;
  }

  .star {
    font-size: 1.3rem;
    color: var(--color-primary);
    line-height: 1;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text);
    display: none;
  }

  @media (min-width: 520px) { .name { display: block; } }

  .beta {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-primary);
    background: var(--color-primary-dim);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
    padding: 0.1rem 0.35rem;
    border-radius: 99px;
    align-self: flex-start;
    margin-top: 2px;
  }

  /* Search */
  .search-bar {
    display: none;
    flex: 1;
    max-width: 260px;
    align-items: center;
    gap: 0.4rem;
    padding: 0.38rem 0.75rem;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    text-decoration: none;
    transition: border-color 0.15s;
  }

  @media (min-width: 480px) { .search-bar { display: flex; } }

  .search-bar:hover { border-color: var(--color-primary); }

  /* Actions */
  .actions {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    margin-left: auto;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }

  .btn-icon:hover { background: var(--color-surface-alt); color: var(--color-text); }

  .flag-icon {
    width: 20px;
    height: 15px;
    border-radius: 2px;
    display: block;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
  }

  .eo-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 15px;
    border-radius: 2px;
    background: #16a34a;
    color: #fff;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .dot {
    position: absolute;
    top: 4px;
    right: 4px;
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

  /* Avatar */
  .avatar-wrap {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 99px;
    display: flex;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 99px;
    object-fit: cover;
    border: 1.5px solid var(--color-border);
    transition: border-color 0.15s;
  }

  .avatar-wrap:hover .avatar { border-color: var(--color-primary); }

  /* Dropdown */
  .rel { position: relative; }

  .veil {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: transparent;
    border: none;
    cursor: default;
    padding: 0;
  }

  .menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 100;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    min-width: 168px;
    padding: 0.35rem;
    animation: pop 0.12s ease;
  }

  .menu-right { right: 0; }

  @keyframes pop {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .menu-profile {
    padding: 0.5rem 0.6rem 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .mp-name { font-size: 0.825rem; font-weight: 600; color: var(--color-text); }
  .mp-user { font-size: 0.75rem; color: var(--color-text-muted); }

  .sep {
    height: 1px;
    background: var(--color-border);
    margin: 0.3rem 0;
  }

  .menu-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.42rem 0.6rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.825rem;
    font-family: inherit;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.1s, color 0.1s;
    text-decoration: none;
    text-align: left;
  }

  .menu-row:hover { background: var(--color-surface-alt); color: var(--color-text); }
  .menu-row.on    { color: var(--color-primary); font-weight: 600; }
  .menu-danger:hover { color: var(--color-danger); }

  .tick { margin-left: auto; font-size: 0.75rem; }
</style>
