import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerSwr } from '@kubb/swagger-swr'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({
      output: {
        path: 'models',
      },
    }),
    createSwaggerSwr({
      output: {
        path: './hooks',
      },
    }),
  ],
})
