<script lang="ts">
  import Navbar from '$lib/components/layout/Navbar.svelte'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import MobileNav from '$lib/components/layout/MobileNav.svelte'
  import FloatingSuggestionButton from '$lib/components/FloatingSuggestionButton.svelte'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()
</script>

<Navbar
  unreadNotificationsCount={data.unreadNotificationsCount ?? 0}
  unreadMessagesCount={data.unreadMessagesCount ?? 0}
/>

<div class="app-layout">
  <div class="app-sidebar">
    <Sidebar categories={data.categories} />
  </div>

  <main class="app-main">
    {@render children()}
  </main>
</div>

<MobileNav
  unreadNotificationsCount={data.unreadNotificationsCount ?? 0}
  unreadMessagesCount={data.unreadMessagesCount ?? 0}
/>
<FloatingSuggestionButton />

<style>
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
