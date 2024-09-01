import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'
import { pluginTs } from '@kubb/plugin-ts'
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
          pluginOas({
            generators: [],
          }),
          pluginTs({
            output: {
              path: 'models',
            },
          }),
          pluginTanstackQuery({
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
