<script lang="ts">
  import { enhance } from '$app/forms'
  import { withPendingAction } from '$lib/forms/pending'
  import { PUBLIC_GOOGLE_AUTH_ENABLED } from '$env/static/public'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
  const googleEnabled = PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

  // Narrow the errors union — both shapes may have these keys
  const errors = $derived(form && 'errors' in form ? form.errors as Record<string, string[]> : null)
  const values = $derived(form && 'values' in form ? form.values as Record<string, unknown> : null)
</script>

<svelte:head>
  <title>Registriĝi — Verdkomunumo</title>
</svelte:head>

<h2 class="auth-title">Krei konton</h2>

{#if form?.message}
  <div class="error-banner">{form.message}</div>
{/if}

{#if googleEnabled}
  <form method="POST" action="?/google" use:enhance={withPendingAction()}>
    <button class="btn-google" type="submit">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.576c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.288C4.672 5.161 6.656 3.576 9 3.576Z" fill="#EA4335"/>
      </svg>
      Daŭrigi per Google
    </button>
  </form>

  <div class="divider"><span>aŭ</span></div>
{/if}

<form method="POST" action="?/register" use:enhance={withPendingAction(() => {
  loading = true
  return async ({ update }) => { loading = false; await update() }
})}>
  <div class="field">
    <label for="display_name">Via nomo</label>
    <input
      id="display_name"
      name="display_name"
      type="text"
      required
      value={String(values?.display_name ?? '')}
      placeholder="Ekz. Ana García"
    />
    {#if errors?.display_name}
      <span class="field-error">{errors.display_name[0]}</span>
    {/if}
  </div>

  <div class="field">
    <label for="username">Uzantnomo</label>
    <div class="input-prefix">
      <span>@</span>
      <input
        id="username"
        name="username"
        type="text"
        required
        value={String(values?.username ?? '')}
        placeholder="via_nomo"
        pattern="[a-z0-9_]+"
      />
    </div>
    {#if errors?.username}
      <span class="field-error">{errors.username[0]}</span>
    {/if}
  </div>

  <div class="field">
    <label for="email">Retpoŝto</label>
    <input
      id="email"
      name="email"
      type="email"
      required
      value={String(values?.email ?? '')}
      autocomplete="email"
    />
    {#if errors?.email}
      <span class="field-error">{errors.email[0]}</span>
    {/if}
  </div>

  <div class="field">
    <label for="password">Pasvorto</label>
    <input
      id="password"
      name="password"
      type="password"
      required
      autocomplete="new-password"
      placeholder="Minimume 8 signoj"
    />
    {#if errors?.password}
      <span class="field-error">{errors.password[0]}</span>
    {/if}
  </div>

  <button class="btn-primary" type="submit" disabled={loading}>
    {loading ? 'Atendu…' : 'Krei konton'}
  </button>
</form>

<p class="auth-footer">
  Jam havas konton? <a href="/login">Ensaluti</a>
</p>

<style>
  .auth-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 1.25rem;
    text-align: center;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    border-radius: 0.5rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .btn-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-google:hover { background: var(--color-bg); }

  .divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1rem 0;
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-bottom: 1rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.9rem;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus {
    border-color: var(--color-primary);
    outline: none;
  }

  .input-prefix {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-bg);
    overflow: hidden;
  }

  .input-prefix span {
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    background: var(--color-bg);
  }

  .input-prefix input {
    border: none;
    border-radius: 0;
    padding-left: 0;
  }

  .input-prefix:focus-within {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
  }

  .field-error {
    font-size: 0.8rem;
    color: var(--color-danger);
  }

  .btn-primary {
    width: 100%;
    padding: 0.6rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-top: 0.25rem;
  }

  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary:not(:disabled):hover { opacity: 0.9; }

  .auth-footer {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-top: 1.25rem;
  }

  .auth-footer a {
    color: var(--color-primary);
    font-weight: 500;
    text-decoration: none;
  }

  .auth-footer a:hover { text-decoration: underline; }
</style>
