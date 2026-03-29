<script lang="ts">
	import '../app.css'
	import { dev } from '$app/environment'
	import { onMount } from 'svelte'
	import { inject } from '@vercel/analytics'
	import { themeStore } from '$lib/stores/theme'
	import { locale } from '$lib/i18n'
	import { currentUser, currentProfile } from '$lib/stores/auth'
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

{@render children()}
