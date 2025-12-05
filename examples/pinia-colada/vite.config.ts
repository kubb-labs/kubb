import { pluginOas } from '@kubb/plugin-oas'
import { pluginPiniaColada } from '@kubb/plugin-pinia-colada'
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
          format: 'biome',
          lint: 'biome',
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
          pluginPiniaColada({
            output: {
              path: './hooks',
            },
            pathParamsType: 'object',
          }),
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['axios'],
  },
})
