<script lang="ts">
  import { APP_NAME, APP_TAGLINE } from '$lib/constants'

  let { children }: { children: any } = $props()
</script>

<div class="auth-shell">
  <div class="auth-brand">
    <div class="auth-logo">★</div>
    <h1>{APP_NAME}</h1>
    <p>{APP_TAGLINE}</p>
  </div>
  <div class="auth-card">
    {@render children()}
  </div>
</div>

<style>
  .auth-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
    background-color: var(--color-bg);
  }

  .auth-brand {
    text-align: center;
  }

  .auth-logo {
    font-size: 3rem;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .auth-brand h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
  }

  .auth-brand p {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0.25rem 0 0;
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 24px var(--color-shadow);
  }
</style>
