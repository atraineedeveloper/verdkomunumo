<script lang="ts">
  import { enhance } from '$app/forms'
  import { withPendingAction } from '$lib/forms/pending'
  import { themeStore } from '$lib/stores/theme'
  import { t, locale, LOCALE_LABELS, LOCALE_COUNTRY, type Locale } from '$lib/i18n'
  import { ESPERANTO_LEVELS } from '$lib/constants'
  import { optimizeImageFiles, replaceInputFiles } from '$lib/browser/images'
  import { toastStore } from '$lib/stores/toasts'
  import { getAvatarUrl } from '$lib/utils'
  import type { PageData, ActionData } from './$types'
  import type { Theme } from '$lib/types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  let savingProfile = $state(false)
  let avatarPreview = $state<string | null>(null)
  const profileErrors = $derived((form?.errors ?? {}) as Partial<Record<'username' | 'display_name', string[]>>)

  function getResultPayload(data: unknown) {
    return (data ?? {}) as {
      message?: string
      errors?: Record<string, string[] | undefined>
    }
  }

  async function onAvatarChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const [optimized] = await optimizeImageFiles([file], { maxDimension: 1200, quality: 0.84 })
    replaceInputFiles(input, optimized ? [optimized] : [])
    avatarPreview = URL.createObjectURL(optimized ?? file)
  }

  const themeValues: Theme[] = ['green', 'dark', 'vivid', 'minimal']
  const themeKeys = ['theme_green', 'theme_dark', 'theme_vivid', 'theme_minimal'] as const
  const locales = Object.keys(LOCALE_LABELS) as Locale[]

  function applyTheme(theme: Theme) {
    themeStore.setTheme(theme)
  }
</script>

<svelte:head>
  <title>{$t('settings_title')} — Verdkomunumo</title>
</svelte:head>

<h1 class="page-title">{$t('settings_title')}</h1>

{#if form?.success}
  <div class="success-banner">{$t('settings_saved')}</div>
{/if}

<!-- Sección: Editar perfil -->
<section class="section">
  <h2 class="section-title">{$t('settings_profile')}</h2>

  <form method="POST" action="?/updateProfile" enctype="multipart/form-data" use:enhance={withPendingAction(() => {
    savingProfile = true
    return async ({ result, update }) => {
      savingProfile = false
      await update()

      if (result.type === 'success') {
        toastStore.success($t('toast_profile_saved'))
        return
      }

      if (result.type === 'failure') {
        const payload = getResultPayload(result.data)
        toastStore.error(payload.message ?? payload.errors?.username?.[0] ?? $t('toast_action_failed'))
        return
      }

      if (result.type === 'error') {
        toastStore.error($t('toast_action_failed'))
      }
    }
  })}>
    <div class="avatar-field">
      <label class="avatar-wrap" for="avatar" title={$t('settings_change_photo')}>
        <img
          class="avatar-preview"
          src={avatarPreview ?? getAvatarUrl(data.profile?.avatar_url ?? '', data.profile?.display_name ?? 'Verdkomunumo')}
          alt={data.profile?.display_name ?? 'Avatar'}
        />
        <div class="avatar-overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>{$t('settings_change_photo')}</span>
        </div>
        <input id="avatar" name="avatar" type="file" accept="image/*" onchange={onAvatarChange} />
      </label>
      <div class="avatar-hint">
        <span class="avatar-name">{data.profile?.display_name ?? ''}</span>
        <span class="avatar-sub">@{data.profile?.username ?? ''}</span>
      </div>
    </div>

    <div class="field">
      <label for="username">Uzantnomo</label>
      <input
        id="username"
        name="username"
        type="text"
        value={data.profile?.username ?? ''}
        minlength="3"
        maxlength="30"
        pattern="[a-z0-9_]+"
        required
      />
      {#if profileErrors.username}
        <span class="field-error">{profileErrors.username[0]}</span>
      {/if}
    </div>

    <div class="field">
      <label for="display_name">{$t('auth_display_name')}</label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        value={data.profile?.display_name ?? ''}
        required
      />
      {#if profileErrors.display_name}
        <span class="field-error">{profileErrors.display_name[0]}</span>
      {/if}
    </div>

    <div class="field">
      <label for="bio">{$t('settings_bio')}</label>
      <textarea id="bio" name="bio" rows="3" maxlength="500">{data.profile?.bio ?? ''}</textarea>
    </div>

    <div class="field">
      <label for="esperanto_level">{$t('settings_level')}</label>
      <select id="esperanto_level" name="esperanto_level">
        {#each Object.entries(ESPERANTO_LEVELS) as [value, info]}
          <option {value} selected={data.profile?.esperanto_level === value}>
            {info.emoji} {$t(`level_${value}` as any)}
          </option>
        {/each}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="location">{$t('settings_location')}</label>
        <input id="location" name="location" type="text" value={data.profile?.location ?? ''} />
      </div>
      <div class="field">
        <label for="website">{$t('settings_website')}</label>
        <input id="website" name="website" type="url" value={data.profile?.website ?? ''} placeholder="https://" />
      </div>
    </div>

    <button class="btn-primary" type="submit" disabled={savingProfile}>
      {savingProfile ? $t('settings_saving') : $t('settings_save')}
    </button>
  </form>
</section>

<!-- Sección: Tema -->
<section class="section">
  <h2 class="section-title">{$t('settings_theme')}</h2>
  <div class="theme-grid">
    {#each themeValues as themeVal, i}
      <form method="POST" action="?/updateTheme" use:enhance={withPendingAction(() => {
        return async ({ result, update }) => {
          applyTheme(themeVal)
          await update()

          if (result.type === 'success') {
            toastStore.success($t('toast_theme_saved'))
            return
          }

          if (result.type === 'failure') {
            const payload = getResultPayload(result.data)
            toastStore.error(payload.message ?? $t('toast_action_failed'))
            return
          }

          if (result.type === 'error') {
            toastStore.error($t('toast_action_failed'))
          }
        }
      })}>
        <input type="hidden" name="theme" value={themeVal} />
        <button class="theme-btn theme-{themeVal}" type="submit">
          {$t(themeKeys[i])}
        </button>
      </form>
    {/each}
  </div>
</section>

<!-- Sección: Idioma -->
<section class="section">
  <h2 class="section-title">{$t('settings_language')}</h2>
  <div class="theme-grid">
    {#each locales as l}
      <button
        class="lang-btn-big {$locale === l ? 'active' : ''}"
        onclick={() => locale.setLocale(l)}
      >
        {#if LOCALE_COUNTRY[l]}
          <span class="fi fi-{LOCALE_COUNTRY[l]} lang-flag"></span>
        {:else}
          <span class="lang-flag eo-badge">EO</span>
        {/if}
        <span>{LOCALE_LABELS[l]}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .page-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 1.5rem;
  }

  .success-banner {
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #166534;
    border-radius: 0.5rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-bottom: 1rem;
    flex: 1;
  }

  .field-error {
    color: #dc2626;
    font-size: 0.8rem;
  }

  .avatar-field {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .avatar-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 9999px;
    cursor: pointer;
    flex-shrink: 0;
    display: block;
  }

  .avatar-wrap input { display: none; }

  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 9999px;
    object-fit: cover;
    border: 2px solid var(--color-border);
    background: var(--color-surface-alt);
    display: block;
    transition: filter 0.15s;
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .avatar-wrap:hover .avatar-overlay { opacity: 1; }
  .avatar-wrap:hover .avatar-preview { filter: brightness(0.75); }

  .avatar-hint {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .avatar-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .avatar-sub {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .field-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  input,
  textarea,
  select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.9rem;
    font-family: inherit;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--color-primary);
    outline: none;
  }

  .field-error {
    font-size: 0.8rem;
    color: var(--color-danger);
  }

  .btn-primary {
    padding: 0.5rem 1.25rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary:not(:disabled):hover { opacity: 0.9; }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .theme-btn {
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
    width: 100%;
    text-align: left;
  }

  .theme-btn:hover { transform: translateY(-1px); }

  .theme-green { background: #e8f5e9; color: #14532d; border-color: #1b7a4a; }
  .theme-dark { background: #1e293b; color: #4ade80; border-color: #22c55e; }
  .theme-vivid { background: #fdf4ff; color: #1e1b4b; border-color: #7c3aed; }
  .theme-minimal { background: #fafafa; color: #171717; border-color: #e5e5e5; }

  .lang-btn-big {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 0.75rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
    width: 100%;
    text-align: left;
  }

  .lang-btn-big:hover { transform: translateY(-1px); border-color: var(--color-accent); }
  .lang-btn-big.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }

  .lang-flag {
    width: 28px;
    height: 21px;
    border-radius: 3px;
    display: block;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
    flex-shrink: 0;
  }

  .eo-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #16a34a;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
</style>
