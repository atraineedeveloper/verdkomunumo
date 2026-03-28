<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)

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

<form method="POST" use:enhance={() => {
  loading = true
  return async ({ update }) => { loading = false; await update() }
}}>
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
