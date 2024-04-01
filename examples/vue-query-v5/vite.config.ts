import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import vue from '@vitejs/plugin-vue'
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    kubb({
      config: {
        root: '.',
        input: {
          path: './petStore.yaml',
        },
        output: {
          path: './src/gen',
          clean: true,
        },
        plugins: [
          createSwagger({
            output: false,
          }),
          createSwaggerTS({
            output: {
              path: 'models',
            },
          }),
          createSwaggerTanstackQuery({
            output: {
              path: './hooks',
            },
            framework: 'vue',
          }),
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['axios'],
  },
})
