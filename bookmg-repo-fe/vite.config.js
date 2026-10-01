import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = new URL(env.BASE_URL)

  return {
    plugins: [vue(), tailwindcss()],
    server: {
      host: baseUrl.hostname,
      port: Number(baseUrl.port),
      strictPort: true,
      proxy: {
        '/api': env.API_BASE_URL,
      },
    },
  }
})
