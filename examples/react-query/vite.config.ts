import react from '@vitejs/plugin-react'
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'
import { config } from './kubb.config.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    kubb({
      config,
    }),
  ],
})
