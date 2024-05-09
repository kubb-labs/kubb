import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    done: [],
  },
  plugins: [
    pluginOas({ output: false }),
    pluginTs({
      output: {
        path: 'models',
        exportType: 'barrelNamed',
      },
    }),
    pluginTanstackQuery({
      transformers: {
        name: (name, type) => {
          if (type === 'file' || type === 'function') {
            return `${name}Hook`
          }
          return name
        },
      },
      output: {
        path: './hooks',
      },
      framework: 'react',
      infinite: {},
    }),
  ],
})
