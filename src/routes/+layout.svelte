<script lang="ts">
	import '../app.css'
	import { onMount } from 'svelte'
	import { themeStore } from '$lib/stores/theme'
	import { locale } from '$lib/i18n'
	import { currentUser, currentProfile } from '$lib/stores/auth'
	import type { LayoutData } from './$types'
	import favicon from '$lib/assets/favicon.svg'

	let { data, children }: { data: LayoutData; children: any } = $props()

	$effect(() => {
		currentUser.set(data.session?.user ?? null)
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

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
