<script lang="ts">
	import '../app.css'
	import { dev } from '$app/environment'
	import { onMount } from 'svelte'
	import { inject } from '@vercel/analytics'
	import { themeStore } from '$lib/stores/theme'
	import { locale } from '$lib/i18n'
	import { currentUser, currentProfile } from '$lib/stores/auth'
	import { networkBusy } from '$lib/stores/network'
	import ToastViewport from '$lib/components/ToastViewport.svelte'
	import type { LayoutData } from './$types'

	let { data, children }: { data: LayoutData; children: any } = $props()

	inject({ mode: dev ? 'development' : 'production', framework: 'sveltekit' })

	$effect(() => {
		currentUser.set(data.user ?? null)
		currentProfile.set(data.profile)
	})

	onMount(() => {
		// Inicializar idioma
		locale.init()
		// Inicializar tema
		const savedTheme = localStorage.getItem('verdkomunumo-theme')
		if (savedTheme) {
			themeStore.setTheme(savedTheme as 'green' | 'dark' | 'vivid' | 'minimal')
		} else if (data.profile?.theme) {
			themeStore.setTheme(data.profile.theme)
		}
	})
</script>

{#if $networkBusy}
	<div class="network-bar"></div>
{/if}

{@render children()}
<ToastViewport />

<style>
	.network-bar {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1200;
		height: 2px;
		width: 100%;
		background: transparent;
		overflow: hidden;
		pointer-events: none;
	}

	.network-bar::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: min(38vw, 320px);
		background: var(--color-primary);
		box-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 30%, transparent);
		animation:
			network-sweep 1s ease-in-out infinite,
			network-fade 0.15s ease-out;
	}

	@keyframes network-fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes network-sweep {
		from {
			transform: translateX(-110%);
		}
		to {
			transform: translateX(calc(100vw + 110%));
		}
	}
</style>
