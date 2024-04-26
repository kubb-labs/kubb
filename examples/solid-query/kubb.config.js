import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
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
    createSwagger({
      output: false,
    }),
    createSwaggerTS({
      output: { path: 'models' },
    }),
    createSwaggerTanstackQuery({
      output: {
        path: './hooks',
      },
      framework: 'solid',
    }),
  ],
})
