import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: true,
        port: 4200,
        // Forward API and auth calls to `wrangler dev` (default port) during
        // development. `/login` and `/logout` are served by the Worker rather
        // than the SPA, so they must be proxied too.
        proxy: {
            '/api': 'http://localhost:8787',
            '/login': 'http://localhost:8787',
            '/logout': 'http://localhost:8787',
            '/activate': 'http://localhost:8787',
        },
    },
})
