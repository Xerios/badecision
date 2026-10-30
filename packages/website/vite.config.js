import { defineConfig } from 'vite'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'

// SvelteKit 3 takes its config here; svelte.config.js is no longer supported.
export default defineConfig({
  plugins: [sveltekit({ adapter: adapter({ pages: 'dist', assets: 'dist', fallback: undefined, strict: true }) })],
  server: { port: 5173 },
})
