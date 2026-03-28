<script lang="ts">
  import Navbar from '$lib/components/layout/Navbar.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import MobileNav from '$lib/components/layout/MobileNav.svelte'
  import { navigating } from '$app/state'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()
</script>

{#if navigating}
  <div class="nav-bar"></div>
{/if}

<Navbar />

<div class="app-layout">
  <div class="app-sidebar">
    <Sidebar categories={data.categories} />
  </div>

  <main class="app-main">
    {@render children()}
  </main>
</div>

<MobileNav />

<style>
  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
    height: 2px;
    background: var(--color-primary);
    animation: nav-progress 1.2s ease-out forwards;
    transform-origin: left;
  }

  @keyframes nav-progress {
    from { width: 0%; opacity: 1; }
    80%  { width: 85%; opacity: 1; }
    to   { width: 95%; opacity: 0.8; }
  }

  .app-layout {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.75rem 1.25rem 5.5rem;
    display: flex;
    gap: 2.5rem;
    align-items: flex-start;
  }

  .app-sidebar {
    display: none;
    position: sticky;
    top: 78px;
  }

  @media (min-width: 768px) {
    .app-sidebar { display: block; }
    .app-layout  { padding-bottom: 2rem; }
  }

  .app-main {
    flex: 1;
    min-width: 0;
  }
</style>
