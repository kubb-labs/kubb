import react from '@vitejs/plugin-react'
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

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
