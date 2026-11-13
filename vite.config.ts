import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/russianmarket.unslop-upstream-inspect*'],
    },
  },
})

