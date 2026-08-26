import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `base: './'` is required: devframe resolves the SPA relative to the executing
// script, so a hardcoded mount path breaks every host but the standalone one.
export default defineConfig({
  base: './',
  plugins: [vue(), ui()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
