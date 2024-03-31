import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod'

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
      validate: true,
    }),
    createSwaggerTS({
      output: { path: 'models.ts' },
    }),
    createSwaggerTanstackQuery({
      output: {
        path: './hooks.ts',
      },
    }),
    createSwaggerZod({
      output: {
        path: './zod.ts',
      },
      templates: {
        operations: false,
      },
    }),
  ],
})
