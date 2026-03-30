import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig(({ command }) => ({
	plugins: [
		tailwindcss(),
		sveltekit(),
		command === 'serve'
			? devtoolsJson({
					projectRoot: resolve('.')
				})
			: null
	].filter(Boolean)
}));
