<script lang="ts">
  import { enhance } from '$app/forms'
  import { ESPERANTO_LEVELS } from '$lib/constants'
  import { t, type TranslationKey } from '$lib/i18n'
  import { Heart, MessageSquare, MapPin, ExternalLink } from 'lucide-svelte'
  import { CATEGORY_ICONS, CATEGORY_COLORS, LEVEL_ICONS, LEVEL_COLORS } from '$lib/icons'
  import type { PageData } from './$types'
  import type { EsperantoLevel } from '$lib/types'

  let { data }: { data: PageData } = $props()

  const levelInfo = $derived(ESPERANTO_LEVELS[data.profile.esperanto_level as EsperantoLevel])
</script>

<svelte:head>
  <title>{data.profile.display_name} (@{data.profile.username}) — Verdkomunumo</title>
</svelte:head>

<!-- Cabecera del perfil -->
<div class="profile-header">
  <img
    class="profile-avatar"
    src={data.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.profile.display_name)}&background=1B7A4A&color=fff&size=128`}
    alt={data.profile.display_name}
  />

  <div class="profile-info">
    <div class="profile-title-row">
      <div>
        <h1 class="profile-name">{data.profile.display_name}</h1>
        <p class="profile-username">@{data.profile.username}</p>
      </div>

      {#if data.isOwn}
        <a href="/settings" class="btn-outline">Redakti profilon</a>
      {:else}
        <form method="POST" action={data.isFollowing ? '?/unfollow' : '?/follow'} use:enhance>
          <button class="btn-follow {data.isFollowing ? 'following' : ''}">
            {data.isFollowing ? 'Malsekvi' : 'Sekvi'}
          </button>
        </form>
      {/if}
    </div>

    <div class="profile-level" style="color: {LEVEL_COLORS[data.profile.esperanto_level] ?? 'var(--color-primary)'}">
      {#if LEVEL_ICONS[data.profile.esperanto_level]}
        {@const LevelIcon = LEVEL_ICONS[data.profile.esperanto_level]}
        <LevelIcon size={14} strokeWidth={1.75} />
      {/if}
      <span>{levelInfo.label}</span>
    </div>

    {#if data.profile.bio}
      <p class="profile-bio">{data.profile.bio}</p>
    {/if}

    <div class="profile-meta">
      {#if data.profile.location}
        <span><MapPin size={13} strokeWidth={1.75} /> {data.profile.location}</span>
      {/if}
      {#if data.profile.website}
        <a href={data.profile.website} target="_blank" rel="noopener"><ExternalLink size={13} strokeWidth={1.75} /> {data.profile.website}</a>
      {/if}
    </div>

    <div class="profile-stats">
      <span><strong>{data.profile.posts_count}</strong> afiŝoj</span>
      <span><strong>{data.profile.followers_count}</strong> sekvantoj</span>
      <span><strong>{data.profile.following_count}</strong> sekvatas</span>
    </div>
  </div>
</div>

<!-- Posts del usuario -->
<div class="profile-posts">
  <h2 class="posts-heading">Afiŝoj</h2>

  {#if data.posts.length === 0}
    <p class="empty">Ankoraŭ neniu afiŝo.</p>
  {:else}
    {#each data.posts as post}
      <article class="post-card">
        <a href="/post/{post.id}" class="post-content">{post.content}</a>
        <div class="post-meta">
          {#if post.category}
            {@const CatIcon = CATEGORY_ICONS[post.category.slug]}
            {@const catColor = CATEGORY_COLORS[post.category.slug]}
            <span class="post-category" style="color: {catColor}; background: {catColor}18">
              {#if CatIcon}<CatIcon size={12} strokeWidth={2} />{/if}
              {$t(('cat_name_' + post.category.slug) as TranslationKey)}
            </span>
          {/if}
          <span class="post-date">{new Date(post.created_at).toLocaleDateString('eo')}</span>
          <form method="POST" action={`/post/${post.id}?/toggleLike`}>
            <button type="submit" class="stat-btn rose"><Heart size={12} strokeWidth={1.75} /> {post.likes_count}</button>
          </form>
          <span class="stat blue"><MessageSquare size={12} strokeWidth={1.75} /> {post.comments_count}</span>
        </div>
      </article>
    {/each}
  {/if}
</div>

<style>
  .profile-header {
    display: flex;
    gap: 1.5rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 9999px;
    object-fit: cover;
    border: 3px solid var(--color-primary);
    flex-shrink: 0;
  }

  @media (min-width: 480px) {
    .profile-avatar { width: 96px; height: 96px; }
  }

  .profile-info { flex: 1; min-width: 0; }

  .profile-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .profile-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .profile-username {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0;
  }

  .profile-level {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
  }

  .profile-bio {
    color: var(--color-text);
    font-size: 0.9rem;
    margin: 0 0 0.75rem;
    white-space: pre-wrap;
  }

  .profile-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
  }

  .profile-meta span,
  .profile-meta a {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .profile-meta a { color: var(--color-primary); text-decoration: none; }

  .profile-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .profile-stats strong { color: var(--color-text); }

  .btn-outline {
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    text-decoration: none;
    white-space: nowrap;
    transition: border-color 0.15s;
  }

  .btn-outline:hover { border-color: var(--color-primary); }

  .btn-follow {
    padding: 0.4rem 1.1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;
  }

  .btn-follow.following {
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .btn-follow:hover { opacity: 0.85; }

  .posts-heading {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .post-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .post-content {
    display: block;
    color: var(--color-text);
    font-size: 0.9rem;
    text-decoration: none;
    margin-bottom: 0.5rem;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .post-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .post-meta form { margin: 0; }

  .post-category {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-primary);
    font-weight: 500;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .stat.blue { color: #60a5fa; }

  .stat-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    color: inherit;
  }
  .stat-btn.rose { color: #f43f5e; }

  .empty {
    color: var(--color-text-muted);
    text-align: center;
    padding: 2rem;
    font-size: 0.9rem;
  }
</style>
